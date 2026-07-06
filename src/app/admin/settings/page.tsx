import type { Metadata } from "next";
import { SettingsForm } from "@/components/admin/settings-form";
import { requireAdmin } from "@/lib/admin-guard";
import { adminSettingsCopy } from "@/lib/copy/admin";
import { kurusToInputValue } from "@/lib/money";
import { getAdminSettings } from "@/lib/queries/admin";

export const metadata: Metadata = { title: adminSettingsCopy.title };

export default async function AdminSettingsPage() {
  await requireAdmin("/admin/settings");
  const settings = await getAdminSettings();

  return (
    <div>
      <h1 className="font-display text-3xl">{adminSettingsCopy.title}</h1>
      <div className="mt-6">
        <SettingsForm
          defaults={{
            flatShipping: kurusToInputValue(settings.flatShippingCents),
            freeShippingThreshold: kurusToInputValue(settings.freeShippingThresholdCents),
            lowStockThreshold: settings.lowStockThreshold,
            kdvRatePercent: settings.kdvRatePercent,
            manualPaymentEnabled: settings.manualPaymentEnabled,
            manualPaymentInstructions: settings.manualPaymentInstructions ?? "",
          }}
        />
      </div>
    </div>
  );
}
