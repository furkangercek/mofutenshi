import { EmailButton, EmailShell, headingText, mutedText, text } from "@/components/emails/shared";
import { emailCopy } from "@/lib/copy/emails";

export type AuthEmailProps = {
  greetingName: string | null;
  actionUrl: string;
};

function AuthEmail({
  title,
  lead,
  buttonLabel,
  expiryNote,
  data,
}: {
  title: string;
  lead: string;
  buttonLabel: string;
  expiryNote: string;
  data: AuthEmailProps;
}) {
  return (
    <EmailShell title={title}>
      <h1 style={headingText}>{title}</h1>
      {data.greetingName && (
        <p style={{ ...text, marginTop: "12px" }}>{emailCopy.greeting(data.greetingName)}</p>
      )}
      <p style={{ ...mutedText, marginTop: "8px" }}>{lead}</p>
      <EmailButton href={data.actionUrl} label={buttonLabel} />
      <p style={{ ...mutedText, fontSize: "12px", marginTop: "16px" }}>{expiryNote}</p>
      <p style={{ ...mutedText, fontSize: "12px", marginTop: "8px" }}>{emailCopy.notYouNote}</p>
    </EmailShell>
  );
}

export function VerifyEmailEmail(props: AuthEmailProps) {
  return (
    <AuthEmail
      title={emailCopy.verifyTitle}
      lead={emailCopy.verifyLead}
      buttonLabel={emailCopy.verifyButton}
      expiryNote={emailCopy.verifyExpiry}
      data={props}
    />
  );
}

export function PasswordResetEmail(props: AuthEmailProps) {
  return (
    <AuthEmail
      title={emailCopy.resetTitle}
      lead={emailCopy.resetLead}
      buttonLabel={emailCopy.resetButton}
      expiryNote={emailCopy.resetExpiry}
      data={props}
    />
  );
}
