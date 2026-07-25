"use server";

// One SFN statistics product-market combination row.
export type SfnStatisticRow = {
  key: string;
  sfnNo: string | null;
  year: number | null;
  month: number | null;
  cbsStatNr: string | null;
  sbiCode: string | null;
  postalCode: string | null;
  weightKg: number | null;
};

// SFN statistics group invoiced goods by product-market combination keyed on the
// CBS commodity number (cbs_statnr) and SBI industry code. Neither of those
// statistical codes is stored in this system (products carry no commodity code,
// companies carry no SBI code), so the combinations can't be formed yet and
// there is no source to list.
export const getSfnStatistics = async (): Promise<SfnStatisticRow[]> => [];
