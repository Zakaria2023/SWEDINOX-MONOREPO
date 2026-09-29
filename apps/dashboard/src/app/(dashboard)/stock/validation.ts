import { z } from "zod";
import { stockCorrectionReasons } from "@/lib/enums";

/**
 * A correction of a lot — the reference's `Correction…`, which is two
 * corrections in one dialog with a checkbox each.
 *
 * `reason` has no empty option on purpose: the reference greys `OK` out until
 * `Reden` is chosen, so an unreasoned correction is not a state either system
 * can be in.
 */
export const stockCorrectionSchema = z
  .object({
    stockUuid: z.string().min(1, "Stock lot is required"),
    reason: z.enum(stockCorrectionReasons, {
      message: "A reason is required",
    }),
    description: z.string().max(255).optional(),

    // `Voorraad hoeveelheid correctie`
    correctQuantity: z.boolean(),
    quantity: z.string().optional(),
    quantityKg: z.string().optional(),

    // `Voorraad kenmerk correctie`
    correctCharacteristics: z.boolean(),
    stockCategory: z.string().max(100).optional(),
    quality: z.string().max(100).optional(),
    lengthMm: z.string().optional(),
    widthMm: z.string().optional(),
    thicknessMm: z.string().optional(),
    remark: z.string().max(255).optional(),
  })
  .refine((values) => values.correctQuantity || values.correctCharacteristics, {
    message: "Tick what you are correcting — the quantity, the characteristics, or both",
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
    (values) => !(values.reason === "stock_remark" && values.correctQuantity),
    {
      message:
        "A stock remark correction cannot change the quantity — it is annotation, not a movement",
      path: ["reason"],
    },
  );

export type StockCorrectionFormValues = z.infer<typeof stockCorrectionSchema>;
