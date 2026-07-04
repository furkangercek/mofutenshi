const turkishMap: Record<string, string> = {
  ş: "s",
  Ş: "s",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ü: "u",
  Ü: "u",
  ç: "c",
  Ç: "c",
};

// Slugs stay ASCII (frontend conventions): transliterate Turkish characters
// before lowercasing so "Çıkartmalar" → "cikartmalar", not "çıkartmalar".
export function slugify(input: string): string {
  return input
    .replace(/[şŞğĞıİöÖüÜçÇ]/g, (ch) => turkishMap[ch])
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
