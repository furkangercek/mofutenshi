"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import { forgotPasswordAction, resetPasswordAction, type AuthFormState } from "@/lib/actions/auth";
import { authCopy } from "@/lib/copy/auth";

const initialState: AuthFormState = { error: null };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);

  if (state.message) {
    return (
      <p role="status" className="border-border bg-surface rounded-md border p-4 text-sm">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="block text-sm font-medium">
        {authCopy.emailLabel}
        <input name="email" type="email" autoComplete="email" required className={inputClass} />
      </label>
      {state.error && (
        <p role="alert" className="text-muted text-sm">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? authCopy.submitting : authCopy.forgotSubmit}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="block text-sm font-medium">
        {authCopy.newPasswordLabel}
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={inputClass}
        />
      </label>
      {state.error && (
        <p role="alert" className="text-muted text-sm">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? authCopy.submitting : authCopy.resetSubmit}
      </Button>
    </form>
  );
}
