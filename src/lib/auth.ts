import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { mergeGuestCartIntoUserCart } from "@/lib/cart-merge";
import { emailEnabled } from "@/lib/email";
import { prisma } from "@/lib/prisma";

// Social login stays hidden until the owner provisions OAuth credentials.
export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

// R11: distinguishes "valid password, unverified email" from a bad login so
// the login form can offer a resend — but only AFTER the password matched,
// so it reveals nothing to someone probing foreign emails.
export class EmailNotVerifiedError extends CredentialsSignin {
  code = "email-not-verified";
}

const credentialsSchema = z.object({ email: z.email(), password: z.string().min(1) });

// Compared against when the email has no account, so lookup hits and misses
// take similar time (user-enumeration timing). Its plaintext is irrelevant.
const DUMMY_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // JWT sessions: the credentials provider cannot create adapter DB sessions.
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        const passwordMatches = await bcrypt.compare(
          parsed.data.password,
          user?.passwordHash ?? DUMMY_HASH,
        );
        if (!user?.passwordHash || !passwordMatches) return null;
        // Enforced only while the email integration is configured; with it
        // off, verification links could never arrive (R11 env-gating).
        if (emailEnabled && !user.emailVerified) throw new EmailNotVerifiedError();
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
    ...(googleEnabled
      ? [
          Google({
            // Google asserts email ownership (email_verified claim), so its
            // accounts never sit behind the R11 verification gate.
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
                role: "CUSTOMER" as const,
                emailVerified: profile.email_verified ? new Date() : null,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (!user.id) return;
      try {
        await mergeGuestCartIntoUserCart(user.id);
      } catch (error) {
        // A merge failure must not fail the login itself.
        console.error("guest cart merge failed", error);
      }
    },
  },
});
