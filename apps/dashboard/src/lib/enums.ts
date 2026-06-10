export const addressCategories = [
  "invoice",
  "visit",
  "correspondence",
  "delivery",
] as const satisfies readonly string[];

export type AddressCategory = (typeof addressCategories)[number];

export const availableAtOptions = [
  "crane_unloading",
  "forklift_unloading",
] as const satisfies readonly string[];

export type AvailableAt = (typeof availableAtOptions)[number];

export const locationTypes = [
  "pick",
  "bulk",
  "production",
  "scrap",
  "loading",
  "inspection",
  "putaway",
  "sorting",
  "processor",
  "pickup",
  "call_off",
] as const satisfies readonly string[];

export type LocationType = (typeof locationTypes)[number];

export const locationAdoptPositions = [
  "next",
  "below",
] as const satisfies readonly string[];

export type LocationAdoptPosition = (typeof locationAdoptPositions)[number];
