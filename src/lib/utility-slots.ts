// Fixed color-slot mapping for utility categories (var(--cat-{slot})), colorblind-validated.
// Unknown utility names fall back to a stable id-derived slot (or 4 without an id).
export const UTILITY_SLOT: Record<string, number> = {
  Gas: 1,
  Electricity: 2,
  Water: 3,
  Garbage: 4,
  Internet: 5,
  'EV Charging A': 6,
  'EV Charging B': 7,
}

export function utilitySlot(name: string, id?: number): number {
  return UTILITY_SLOT[name] ?? (id != null ? ((id - 1) % 7) + 1 : 4)
}
