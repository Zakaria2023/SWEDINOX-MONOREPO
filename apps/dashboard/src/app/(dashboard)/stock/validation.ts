import { z } from "zod";
import {
  relocationReasons,
  stockCategories,
  stockCorrectionReasons,
  stockLabelTypes,
  stockOptions,
  stockOptionStatuses,
  transferReasons,
} from "@/lib/enums";

/**
 * The schemas behind the `Voorraad` toolbar — every manual stock act the
 * reference offers on a lot.
 *
 * Captured 5-10-2026 on `PK304L200315` at location `Laad`; the shapes here
 * follow `docs/reference-system/stock-lot-dialogs.md` field for field.
 *
 * 🔑 One rule runs through all of them: **the reference greys `OK` out until the
 * form is legal.** A dialog there never lets you press a button that would
 * fail, so every mandatory field below is mandatory at the schema rather than
 * being caught by the server afterwards.
 */

/** A decimal typed into a box, as a positive number or nothing at all. */
const optionalDecimal = (label: string) =>
  z
    .string()
    .optional()
    .refine(
      (value) =>
        value === undefined ||
        value === "" ||
        (Number.isFinite(Number(value)) && Number(value) >= 0),
      { message: `${label} must be a number, or left blank` },
    );

/**
 * A correction of a lot — the reference's `Correctie…`, titled
 * `Corrigeren voorraad`.
 *
 * Two independent corrections in one window, each behind its own tickbox, and
 * either or both may run. `reason` has no empty option on purpose: `OK` stays
 * greyed until `Reden` is chosen, so an unreasoned correction is not a state
 * either system can be in.
 */
export const stockCorrectionSchema = z
  .object({
    stockUuid: z.string().min(1, "Stock lot is required"),
    reason: z.enum(stockCorrectionReasons, {
      message: "A reason is required",
    }),
    description: z.string().max(255).optional(),

    /**
     * `Zaagopdracht` — the saw order this correction is blamed on.
     *
     * The link between a loss and the cut that caused it. Optional, because
     * most corrections are not sawing losses, and the reference's own list was
     * empty on the captured lot.
     */
    sawOrderUuid: z.string().optional(),

    // ── ☑ `Voorraad hoeveelheid correctie` ──────────────────────────────────
    correctQuantity: z.boolean(),
    quantity: z.string().optional(),
    quantityKg: z.string().optional(),
    quality: z.string().max(100).optional(),
    stockCategory: z.string().optional(),
    lengthMm: z.string().optional(),
    widthMm: z.string().optional(),
    thicknessMm: z.string().optional(),
    // The weighbridge's three, beside the theoretical `quantityKg` above.
    weighedWeightKg: optionalDecimal("The weighed weight"),
    grossWeightKg: optionalDecimal("The gross weight"),
    netWeightKg: optionalDecimal("The net weight"),

    // ── ☐ `Voorraad kenmerk correctie` ──────────────────────────────────────
    correctCharacteristics: z.boolean(),
    remark: z.string().max(255).optional(),
  })
  .refine((values) => values.correctQuantity || values.correctCharacteristics, {
    message:
      "Tick what you are correcting — the quantity, the characteristics, or both",
    path: ["correctQuantity"],
  })
  .refine(
    (values) =>
      !values.correctQuantity ||
      (values.quantity !== undefined &&
        values.quantity !== "" &&
        Number.isFinite(Number(values.quantity)) &&
        Number(values.quantity) >= 0),
    { message: "A corrected quantity is required", path: ["quantity"] },
  )
  .refine(
    (values) =>
      values.stockCategory === undefined ||
      values.stockCategory === "" ||
      (stockCategories as readonly string[]).includes(values.stockCategory),
    { message: "Choose one of the five stock categories", path: ["stockCategory"] },
  )
  .refine(
    (values) => !(values.reason === "stock_remark" && values.correctQuantity),
    {
      message:
        "A stock remark correction cannot change the quantity — it is annotation, not a movement",
      path: ["reason"],
    },
  )
  /**
   * 🔑 `gross − tare = net`, so a net weight above the gross is arithmetic that
   * cannot be true. Caught here rather than in the action because the reference
   * would never have let the form be submitted in that state.
   */
  .refine(
    (values) => {
      const gross = Number(values.grossWeightKg);
      const net = Number(values.netWeightKg);
      if (!values.grossWeightKg || !values.netWeightKg) {
        return true;
      }
      return !Number.isFinite(gross) || !Number.isFinite(net) || net <= gross;
    },
    {
      message:
        "The net weight cannot exceed the gross weight — the difference is the packing",
      path: ["netWeightKg"],
    },
  );

export type StockCorrectionFormValues = z.infer<typeof stockCorrectionSchema>;

/**
 * `Splits` — `Splits voorraad`.
 *
 * No `Reden` and no `Uitvoerdatum`, unlike a relocation, because a split is
 * immediate rather than planned warehouse work. `toLocationUuid` is optional:
 * the two halves may stay on the same shelf and still be two lots.
 */
export const stockSplitSchema = z.object({
  stockUuid: z.string().min(1, "Stock lot is required"),
  quantity: z
    .string()
    .min(1, "Enter how much to split off")
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
      message: "The quantity to split off must be more than zero",
    }),
  /**
   * `Gewogen gewicht` — stated, never apportioned. The pieces coming off get
   * weighed, so what the scale says is what the new lot carries.
   */
  weighedWeightKg: optionalDecimal("The weighed weight"),
  toLocationUuid: z.string().optional(),
  includeReservations: z.boolean(),
});

export type StockSplitFormValues = z.infer<typeof stockSplitSchema>;

/**
 * `Verplaatsen…` — `Aanmaken verplaatsopdracht`.
 *
 * 🔑 It creates an **order**, not a movement, which is why `executeOn` is here
 * and mandatory. Relocation is planned work for the warehouse floor, and that
 * is also why `Geplande verplaatsingen` is a subtracting line in the ledger at
 * the top of every one of these dialogs.
 */
export const stockRelocateSchema = z.object({
  stockUuid: z.string().min(1, "Stock lot is required"),
  quantity: z
    .string()
    .min(1, "Enter how much to relocate")
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
      message: "The quantity to relocate must be more than zero",
    }),
  toLocationUuid: z.string().min(1, "Choose where it is going"),
  reason: z.enum(relocationReasons, { message: "A reason is required" }),
  /** `Uitvoerdatum`, defaulted to today by the reference. */
  executeOn: z.string().min(1, "An execution date is required"),
  includeReservations: z.boolean(),
});

export type StockRelocateFormValues = z.infer<typeof stockRelocateSchema>;

/**
 * `Overboeken…` — `Aanmaken overboekingsopdracht`.
 *
 * The one field that separates it from a relocation is `Naar Artikel`, and it
 * is mandatory: without it this dialog *is* a relocation.
 *
 * ⚠️ There is no `Uitvoerdatum` here. Unlike a relocation, a transfer takes
 * effect when it is saved — the reference's title says `opdracht` but the
 * dialog offers no date to plan it for.
 */
export const stockTransferSchema = z.object({
  stockUuid: z.string().min(1, "Stock lot is required"),
  quantity: z
    .string()
    .min(1, "Enter how much to transfer")
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
      message: "The quantity to transfer must be more than zero",
    }),
  toProductUuid: z.string().min(1, "Choose the article it is becoming"),
  toLocationUuid: z.string().optional(),
  reason: z.enum(transferReasons, { message: "A reason is required" }),
  description: z.string().max(255).optional(),
});

export type StockTransferFormValues = z.infer<typeof stockTransferSchema>;

/**
 * One row of `Voorraad opties` — the `Toevoegen` block below the grid.
 *
 * 🔴 Options are **rows**, not a column of text. This is the schema behind that
 * change: an option carries a specification and a status of its own, and a
 * `varchar` could hold neither.
 */
export const stockOptionSchema = z.object({
  stockUuid: z.string().min(1, "Stock lot is required"),
  option: z.enum(stockOptions, { message: "Choose an option" }),
  specification: z.string().max(255).optional(),
  // Defaulted rather than chosen: the reference's `Toevoegen` block offers only
  // `Optie` and `Specificatie`, and the status it produces is `Toevoegen` —
  // a pending edit, not something a user picks.
  status: z.enum(stockOptionStatuses, { message: "Choose a status" }),
});

export type StockOptionFormValues = z.infer<typeof stockOptionSchema>;

/**
 * `Voorraadlabel` — `Selecteer type voorraadlabel en aantal`.
 *
 * `Gebruik printers op locatie` implies printers are configured per warehouse
 * location, which is why it is a choice rather than a setting.
 */
export const stockLabelSchema = z.object({
  stockUuid: z.string().min(1, "Stock lot is required"),
  labelType: z.enum(stockLabelTypes, { message: "Choose a label type" }),
  /** `Aantal (per regel)`, defaulting to 1 in the reference. */
  copies: z
    .string()
    .min(1, "Enter how many to print")
    .refine(
      (value) =>
        Number.isInteger(Number(value)) &&
        Number(value) >= 1 &&
        Number(value) <= 99,
      { message: "Print between 1 and 99 labels" },
    ),
  useLocationPrinters: z.boolean(),
});

export type StockLabelFormValues = z.infer<typeof stockLabelSchema>;

/**
 * `Partijregistratie…` — `Voorraad partij correctie`.
 *
 * 🔑 Not data entry: a picker. You choose the supplier delivery this lot
 * arrived on, and **only two fields are yours** — everything else is read off
 * the purchase line and greyed. So the schema is deliberately tiny, and that
 * smallness is the finding.
 *
 * 🔑 `charge` is the **mill's** heat number, stamped on the metal. The internal
 * charge is ours, generated on receipt, and the two are never conflated.
 *
 * 🔴 There is **no certificate field** anywhere on this dialog, which is why
 * every certificate column on the batch screens is empty. A certificate is a
 * stock *option* (`2.1 Certificate`), not a batch field.
 */
export const batchRegistrationSchema = z.object({
  stockUuid: z.string().min(1, "Stock lot is required"),
  /**
   * The `Inkoopleveringen` row that was picked.
   *
   * 🔑 **Per instalment, not per line.** The captured grid showed `403773/10`
   * twice — 23 pieces at 1 610 kg and 25 at 1 754 kg, same day, same heat —
   * because each arrival was weighed separately. So the reception is what is
   * chosen, and its purchase line comes along with it.
   */
  purchaseLineReceivalUuid: z
    .string()
    .min(1, "Choose the delivery this lot arrived on"),
  purchaseOrderItemUuid: z
    .string()
    .min(1, "Choose the delivery this lot arrived on"),
  charge: z.string().min(1, "The charge number is required").max(100),
  factoryNumber: z.string().max(60).optional(),
});

export type BatchRegistrationFormValues = z.infer<
  typeof batchRegistrationSchema
>;
