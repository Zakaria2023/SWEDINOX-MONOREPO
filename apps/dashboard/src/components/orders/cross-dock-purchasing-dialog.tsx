"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  arrangeCrossDockPurchasing,
  CrossDockPurchasingResult,
  CrossDockPurchasingTargets,
  getCrossDockPurchasingTargets,
} from "@/app/(dashboard)/orders/[uuid]/actions";
import {
  crossDockPurchasingSchema,
  CrossDockPurchasingValues,
} from "@/app/(dashboard)/orders/[uuid]/validation";
import { OrderItemDetail } from "@/app/(dashboard)/orders/actions";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { SearchSelect } from "@/components/shadcn/search-select";
import { Select, SelectOption } from "@/components/shadcn/select";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { crossDockPurchasingActions } from "@/lib/enums";
import {
  crossDockActionNeedsSupplier,
  crossDockActionNeedsTarget,
  formatDayMonthYear,
  formatNumber,
} from "@/lib/helpers";
import {
  CROSS_DOCK_PURCHASING_ACTION_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";

const EMPTY_TARGETS: CrossDockPurchasingTargets = {
  purchaseOrders: [],
  purchaseRequests: [],
};

/** The choice `Don't ask this question again` carries to the next lines. */
export type CrossDockPurchasingChoice = Pick<
  CrossDockPurchasingValues,
  "action" | "supplierUuid" | "targetUuid"
>;

/** How the dialog closed: what to tell the user, and what to remember. */
export type CrossDockPurchasingOutcome = {
  message?: string;
  remember?: CrossDockPurchasingChoice;
};

type Props = {
  line: OrderItemDetail;
  /** The order's date, for a line written before lines carried their own. */
  orderDeliveryDate: string | Date | null;
  suppliers: SelectOption[];
  onDone: (outcome: CrossDockPurchasingOutcome) => void;
  onCancel: () => void;
};

/**
 * `Purchasing for Cross-docking order line 10` — what the reference asks the
 * moment a `CD` line is saved (O108307/10, 13-10-2026): buy it through a task,
 * on an existing or a new purchase order, or on an existing or a new purchase
 * request. `Cancel` leaves the line without a purchase.
 */
export const CrossDockPurchasingDialog = ({
  line,
  orderDeliveryDate,
  suppliers,
  onDone,
  onCancel,
}: Props) => {
  const [state, dispatch, isPending] = useActionState(
    arrangeCrossDockPurchasing,
    {},
  );
  const [targets, setTargets] =
    useState<CrossDockPurchasingTargets>(EMPTY_TARGETS);
  // The answer already handed back, so a re-render does not hand it twice.
  const handled = useRef<CrossDockPurchasingResult | null>(null);

  const {
    control,
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CrossDockPurchasingValues>({
    resolver: zodResolver(crossDockPurchasingSchema),
    defaultValues: {
      orderItemUuid: line.uuid,
      supplierUuid: "",
      targetUuid: "",
      dontAskAgain: false,
    },
  });

  const action = watch("action");
  const supplierUuid = watch("supplierUuid");
  const targetUuid = watch("targetUuid");
  const needsSupplier = crossDockActionNeedsSupplier(action);
  const needsTarget = crossDockActionNeedsTarget(action);
  // A request may name its supplier too, and finds its drafts by it.
  const asksSupplier =
    needsSupplier ||
    action === "create_purchase_request" ||
    action === "add_to_purchase_request";

  // What an `Add …` action can put the line on, re-read whenever the
  // supplier changes.
  useEffect(() => {
    if (!needsTarget) {
      return;
    }
    const request = { cancelled: false };
    void getCrossDockPurchasingTargets(supplierUuid).then((next) => {
      if (!request.cancelled) {
        setTargets(next);
      }
    });
    return () => {
      request.cancelled = true;
    };
  }, [needsTarget, supplierUuid]);

  useEffect(() => {
    if (!state.success || handled.current === state) {
      return;
    }
    handled.current = state;
    const values = watch();
    onDone({
      message: state.message,
      remember: values.dontAskAgain
        ? {
            action: values.action,
            supplierUuid: values.supplierUuid,
            targetUuid: values.targetUuid,
          }
        : undefined,
    });
  }, [state, onDone, watch]);

  const targetOptions: SelectOption[] =
    action === "add_to_purchase_order"
      ? targets.purchaseOrders.map((order) => ({
          value: order.uuid,
          label: String(order.id),
          description: [
            order.reference,
            order.deliveryDate ? formatDayMonthYear(order.deliveryDate) : null,
          ]
            .filter(Boolean)
            .join(" · "),
        }))
      : targets.purchaseRequests.map((request) => ({
          value: request.uuid,
          label: String(request.id),
          description: [request.supplierName, request.reference]
            .filter(Boolean)
            .join(" · "),
        }));

  const supplierName =
    suppliers.find((supplier) => supplier.value === supplierUuid)
      ?.description ?? "";

  const canSubmit =
    Boolean(action) &&
    (!needsSupplier || supplierUuid !== "") &&
    (!needsTarget || targetUuid !== "");

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch(values);
    });
  });

  const code = (line.lineNumber ?? 0) * 10;
  const lengthMm = line.lengthMm ?? line.lotLengthMm;
  const widthMm = line.widthMm ?? line.lotWidthMm;
  const size =
    lengthMm || widthMm ? ` (${lengthMm ?? 0}x${widthMm ?? 0} mm)` : "";

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isPending) {
          onCancel();
        }
      }}
    >
      <DialogContent className="max-w-xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>
              Purchasing for Cross-docking order line {code}
            </DialogTitle>
            <DialogDescription>
              delivery on{" "}
              {formatDayMonthYear(line.deliveryDate ?? orderDeliveryDate)},{" "}
              {formatNumber(Number(line.quantity))}{" "}
              {line.unit ? STOCK_UNIT_LABELS[line.unit] : ""}{" "}
              {line.productName ?? line.productCode ?? ""}
              {size}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox {...register("dontAskAgain")} disabled={isPending} />
              Don&apos;t ask this question again: same action for all
              subsequent lines of this sales order
            </label>

            <fieldset className="space-y-2 rounded-lg border p-3">
              <legend className="px-1 text-sm font-medium">
                Select the desired action
              </legend>
              {crossDockPurchasingActions.map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="crossDockPurchasingAction"
                    className="size-4 accent-primary"
                    checked={action === value}
                    onChange={() => {
                      setValue("action", value, { shouldValidate: true });
                      setValue("targetUuid", "");
                    }}
                    disabled={isPending}
                  />
                  {CROSS_DOCK_PURCHASING_ACTION_LABELS[value]}
                </label>
              ))}
              <FormFieldError message={errors.action?.message} />
            </fieldset>

            {asksSupplier && (
              <fieldset className="space-y-2 rounded-lg border p-3">
                <legend className="px-1 text-sm font-medium">
                  Enter the desired supplier
                </legend>
                <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                  <FormLabel htmlFor="crossDockSupplier">Supplier:</FormLabel>
                  <Controller
                    name="supplierUuid"
                    control={control}
                    render={({ field }) => (
                      <SearchSelect
                        id="crossDockSupplier"
                        value={field.value}
                        options={suppliers}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setValue("targetUuid", "");
                        }}
                        disabled={isPending}
                        invalid={Boolean(errors.supplierUuid)}
                      />
                    )}
                  />
                  <span />
                  <span className="text-sm text-muted-foreground">
                    {supplierName}
                  </span>
                </div>
                <FormFieldError message={errors.supplierUuid?.message} />
              </fieldset>
            )}

            {needsTarget && (
              <div className="space-y-1">
                <FormLabel htmlFor="crossDockTarget">
                  {action === "add_to_purchase_order"
                    ? "Purchase order"
                    : "Purchase request"}
                </FormLabel>
                <Controller
                  name="targetUuid"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="crossDockTarget"
                      value={field.value}
                      options={targetOptions}
                      placeholder={
                        targetOptions.length === 0
                          ? action === "add_to_purchase_order"
                            ? "No provisional purchase order for this supplier"
                            : "No purchase request in draft"
                          : "Choose one"
                      }
                      onValueChange={field.onChange}
                      disabled={isPending || targetOptions.length === 0}
                      invalid={Boolean(errors.targetUuid)}
                    />
                  )}
                />
                <FormFieldError message={errors.targetUuid?.message} />
              </div>
            )}

            <FormError>{state.error}</FormError>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              OK
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
