"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/form";
import {
  changePasswordAction,
  deleteAccountAction,
  type SecurityFormState,
} from "@/lib/actions/account-security";
import { accountSecurityCopy } from "@/lib/copy/account-security";

const initialState: SecurityFormState = { error: null };

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="block text-sm font-medium">
        {accountSecurityCopy.currentPasswordLabel}
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </label>
      <label className="block text-sm font-medium">
        {accountSecurityCopy.newPasswordLabel}
        <input
          name="newPassword"
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
      {state.success && (
        <p role="status" className="text-sm font-medium">
          {state.success}
        </p>
      )}
      <div className="mt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? accountSecurityCopy.changing : accountSecurityCopy.changeCta}
        </Button>
      </div>
    </form>
  );
}

export function DeleteAccountForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, isPending] = useActionState(deleteAccountAction, initialState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(accountSecurityCopy.deleteConfirmPrompt)) event.preventDefault();
      }}
      className="flex max-w-md flex-col gap-4"
    >
      {hasPassword ? (
        <label className="block text-sm font-medium">
          {accountSecurityCopy.deletePasswordLabel}
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </label>
      ) : (
        <label className="block text-sm font-medium">
          {accountSecurityCopy.deleteEmailLabel}
          <input name="confirmEmail" type="email" required className={inputClass} />
        </label>
      )}
      {state.error && (
        <p role="alert" className="text-muted text-sm">
          {state.error}
        </p>
      )}
      <div className="mt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? accountSecurityCopy.deleting : accountSecurityCopy.deleteCta}
        </Button>
      </div>
    </form>
  );
}
