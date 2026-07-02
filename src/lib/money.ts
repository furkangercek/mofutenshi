const formatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

// The only place kuruş integers meet display math (CLAUDE.md hard rule).
export function formatKurus(kurus: number): string {
  return formatter.format(kurus / 100);
}
