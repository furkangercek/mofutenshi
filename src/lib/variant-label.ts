type OptionValueJoin = {
  optionValue: { value: string; optionType: { sortOrder: number } };
};

// "Boyalı / 1:7" — option values ordered by their option type's sort order.
export function variantLabel(optionValues: OptionValueJoin[]): string | null {
  const label = optionValues
    .toSorted((a, b) => a.optionValue.optionType.sortOrder - b.optionValue.optionType.sortOrder)
    .map((v) => v.optionValue.value)
    .join(" / ");
  return label || null;
}
