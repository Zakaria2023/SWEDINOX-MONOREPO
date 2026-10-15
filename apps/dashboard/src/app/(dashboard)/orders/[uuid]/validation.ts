import { z } from "zod";
import { crossDockPurchasingActions } from "@/lib/enums";
import {
  crossDockActionNeedsSupplier,
  crossDockActionNeedsTarget,
} from "@/lib/helpers";

// One call-off on a `Call-off` order — the reference's `Call-offs` panel row:
// a customer reference, the address it goes to, `Rush` and `IsSend`.
export const callOffSchema = z.object({
  customerRef: z.string().max(255),
  deliveryAddressUuid: z.string(),
  isRush: z.boolean(),
  isSent: z.boolean(),
});

export type CallOffValues = z.infer<typeof callOffSchema>;

// `Purchasing for Cross-docking order line` (O108307/10, 13-10-2026): the
// action chosen, and the supplier or document it needs. `Create purchase
// order` and `Add line to a purchase order` need a supplier; adding a line
// needs the document it goes on.
export const crossDockPurchasingSchema = z
  .object({
    orderItemUuid: z.string().min(1),
    action: z.enum(crossDockPurchasingActions, {
      error: "Select the desired action.",
    }),
    supplierUuid: z.string(),
    targetUuid: z.string(),
    dontAskAgain: z.boolean(),
  })
  .refine(
    (values) =>
      !crossDockActionNeedsSupplier(values.action) ||
      values.supplierUuid !== "",
    { message: "Enter the desired supplier.", path: ["supplierUuid"] },
  )
  .refine(
    (values) =>
      !crossDockActionNeedsTarget(values.action) || values.targetUuid !== "",
    { message: "Choose where the line goes.", path: ["targetUuid"] },
  );

export type CrossDockPurchasingValues = z.infer<
  typeof crossDockPurchasingSchema
>;
