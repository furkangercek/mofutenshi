const formatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

// The only place kuruş integers meet display math (CLAUDE.md hard rule).
export function formatKurus(kurus: number): string {
  return formatter.format(kurus / 100);
}

// Plain editable value for admin money inputs: 14990 → "149,90".
export function kurusToInputValue(kurus: number): string {
  return (kurus / 100).toFixed(2).replace(".", ",");
}

// Parses an admin money input ("149", "149,9", "149.90") into kuruş.
// Thousand separators are rejected rather than guessed at: the decimal part
// is capped at two digits, so "1.500" fails instead of silently becoming
// 1,50 TL. Returns null on anything ambiguous.
export function parseTryToKurus(input: string): number | null {
  const match = /^(\d{1,7})(?:[.,](\d{1,2}))?$/.exec(input.trim());
  if (!match) return null;
  const lira = Number(match[1]);
  const kurus = Number((match[2] ?? "").padEnd(2, "0"));
  return lira * 100 + kurus;
}
