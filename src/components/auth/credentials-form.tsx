"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { loginAction, registerAction, type AuthFormState } from "@/lib/actions/auth";
import { authCopy } from "@/lib/copy/auth";

const initialState: AuthFormState = { error: null };

const inputClass =
  "border-border bg-surface focus:outline-ring mt-1 h-11 w-full rounded-md border px-3 text-sm focus:outline-2";

export function CredentialsForm({
  mode,
  callbackUrl,
}: {
  mode: "login" | "register";
  callbackUrl?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    mode === "login" ? loginAction : registerAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {callbackUrl && <input type="hidden" name="callbackUrl" value={callbackUrl} />}
      {mode === "register" && (
        <label className="block text-sm font-medium">
          {authCopy.nameLabel}
          <input name="name" autoComplete="name" required className={inputClass} />
        </label>
      )}
      <label className="block text-sm font-medium">
        {authCopy.emailLabel}
        <input name="email" type="email" autoComplete="email" required className={inputClass} />
      </label>
      <label className="block text-sm font-medium">
        {authCopy.passwordLabel}
        <input
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={mode === "register" ? 8 : undefined}
          className={inputClass}
        />
      </label>
      {state.error && (
        <p role="alert" className="text-muted text-sm">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending
          ? authCopy.submitting
          : mode === "login"
            ? authCopy.loginSubmit
            : authCopy.registerSubmit}
      </Button>
    </form>
  );
}
