"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  getPickableLotsForLine,
  getWarehouseWorkOrderPicks,
  PickableLot,
  previewNextInternalCharge,
  reportWarehouseWorkOrderLineCompletion,
  WorkOrderLineListItem,
  WorkOrderPickRow,
} from "@/app/(dashboard)/warehouse-work-orders/actions";
import {
  reportCompletionSchema,
  ReportCompletionFormValues,
} from "@/app/(dashboard)/warehouse-work-orders/validation";
import { LocationOption } from "@/app/(dashboard)/locations/actions";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DatePicker } from "@/components/shadcn/date-picker";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Select, SelectOption } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { TimePicker } from "@/components/shadcn/time-picker";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { ClerkUserOption } from "@/lib/server/clerk";
import { WAREHOUSE_WORK_ORDER_TYPE_LABELS } from "@/lib/labels";
import { WarehouseWorkOrderType } from "@/lib/enums";
import {
  cn,
  formatNumber,
  nowTimeString,
  orDash,
  todayDateString,
  warehouseWorkOrderTypeMetaOf,
} from "@/lib/helpers";

// The reference opens an unloading with one row per piece — ten rows for ten
// plates, the first carrying the whole quantity (327402, 9-10-2026). Past
// this many pieces a coil or a bar bundle is reported as one row.
const ROWS_PER_PIECE_UP_TO = 25;

type Props = {
  line: WorkOrderLineListItem | null;
  workOrderType: WarehouseWorkOrderType;
  /** For the title — `Gereedmelden losopdracht 327402/1`. */
  workOrderNumber?: number | null;
  locations: LocationOption[];
  users: ClerkUserOption[];
  onOpenChange: (open: boolean) => void;
};

const EMPTY_LOT = "none";

/**
 * How a lot reads in the picker: where it is, which parcel it is, and what heat
 * it was rolled from — the reference's `Location` · `Interne partij` · `Charge`,
 * in that order, because the floor finds the shelf first.
 */
const lotLabel = (lot: PickableLot): string =>
  [
    lot.locationName ?? "no location",
    lot.internalBatch ?? "no bundle",
    lot.charge ?? "no charge",
  ].join(" · ");

export const ReportCompletionDialog = ({
  line,
  workOrderType,
  workOrderNumber = null,
  locations,
  users,
  onOpenChange,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [lots, setLots] = useState<PickableLot[]>([]);
  // The reference opens its picker with a filter chip reading `Location = 2C7`
  // — 2 lots out of the product's 14. The chip can be taken off, so this is a
  // default and not a rule.
  const [onLineLocationOnly, setOnLineLocationOnly] = useState(true);

  const {
    control,
    register,
    getValues,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { dirtyFields, errors },
  } = useForm<ReportCompletionFormValues>({
    resolver: zodResolver(reportCompletionSchema),
    defaultValues: {
      executedAt: todayDateString(),
      executedTime: nowTimeString(),
      executedByUserId: "",
      toLocationUuid: "",
      picks: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "picks" });

  // The dialog opens on the rows the line was prepared with. When nobody
  // prepared it, one row is offered taken from the line itself — which is the
  // ordinary case of a line drawn from a single lot.
  useEffect(() => {
    if (!line) {
      return;
    }

    // Mutated by the cleanup so a reply that arrives after the dialog has moved
    // on cannot overwrite the rows for a different line.
    const request = { cancelled: false };
    setLoading(true);
    setFormError(undefined);
    setOnLineLocationOnly(true);

    const load = async () => {
      // Sequential rather than concurrent: this database caps connections.
      const prepared: WorkOrderPickRow[] = await getWarehouseWorkOrderPicks(
        line.uuid,
      ).catch(() => []);
      const pickable: PickableLot[] = await getPickableLotsForLine(
        line.uuid,
      ).catch(() => []);
      const receiptMeta = warehouseWorkOrderTypeMetaOf(workOrderType);
      const incoming = receiptMeta?.stockEffect === "in";
      // The charge every bundle of this unloading will carry, shown before
      // anything is typed — as the reference shows `26AQWF` on every row.
      const mintedCharge =
        incoming && !line.internalCharge
          ? await previewNextInternalCharge().catch(() => "")
          : (line.internalCharge ?? "");

      if (request.cancelled) {
        return;
      }

      const plannedPieces = Math.round(Number(line.qtyPlanned ?? 0));
      const perPiece =
        incoming && plannedPieces > 1 && plannedPieces <= ROWS_PER_PIECE_UP_TO;

      const rows = prepared.length
        ? prepared.map((pick) => ({
            uuid: pick.uuid,
            stockUuid: pick.stockUuid ?? "",
            qtyPlanned: pick.qtyPlanned ?? "0",
            qtyActual: pick.qtyActual ?? (pick.qtyPlanned ?? ""),
            kgActual: pick.kgActual ?? "",
            charge: pick.stockCharge ?? line.charge ?? "",
            internalCharge:
              pick.stockInternalCharge ?? line.internalCharge ?? "",
            internalBatch: pick.internalBatch ?? line.internalBatch ?? "",
          }))
        : perPiece
          ? Array.from({ length: plannedPieces }, (_, index) => ({
              uuid: undefined,
              stockUuid: "",
              qtyPlanned: index === 0 ? (line.qtyPlanned ?? "0") : "0",
              qtyActual: index === 0 ? (line.qtyPlanned ?? "") : "",
              kgActual: index === 0 ? (line.kgPlanned ?? "") : "",
              charge: line.charge ?? "",
              internalCharge: mintedCharge,
              internalBatch: line.internalBatch ?? "",
            }))
          : [
              {
                uuid: undefined,
                stockUuid: line.stockUuid ?? "",
                qtyPlanned: line.qtyPlanned ?? "0",
                qtyActual: line.qtyPlanned ?? "",
                kgActual: line.kgPlanned ?? "",
                charge: line.charge ?? "",
                internalCharge: mintedCharge,
                internalBatch: line.internalBatch ?? "",
              },
            ];

      setLots(pickable);
      reset({
        executedAt: todayDateString(),
        executedTime: nowTimeString(),
        executedByUserId: "",
        toLocationUuid: line.toLocationUuid ?? "",
        picks: rows,
      });
      setLoading(false);
    };

    void load();

    return () => {
      request.cancelled = true;
    };
  }, [line, reset, workOrderType]);

  const onSubmit = handleSubmit((values) => {
    if (!line) {
      return;
    }
    startTransition(async () => {
      const result = await reportWarehouseWorkOrderLineCompletion({
        lineUuid: line.uuid,
        // One field on the way out, two on the screen: the floor types a day
        // and a time, the record keeps a moment.
        executedAt: `${values.executedAt}T${values.executedTime}`,
        executedByUserId: values.executedByUserId || null,
        picks: values.picks.map((pick) => ({
          uuid: pick.uuid,
          stockUuid: pick.stockUuid || null,
          toLocationUuid: values.toLocationUuid || null,
          qtyPlanned: pick.qtyPlanned,
          qtyActual: pick.qtyActual,
          kgActual: pick.kgActual || null,
          charge: pick.charge || null,
          internalCharge: pick.internalCharge || null,
          internalBatch: pick.internalBatch || null,
        })),
      });

      if (result.success) {
        onOpenChange(false);
        router.refresh();
        return;
      }

      setFormError(result.error);
    });
  });

  const meta = warehouseWorkOrderTypeMetaOf(workOrderType);
  const isCount = meta?.stockEffect === "count";
  // Goods coming in, where every bundle owes a heat number.
  const isReceipt = meta?.stockEffect === "in";
  // Goods coming off a shelf, where every row owes a lot instead — and takes
  // its heat number from it rather than being typed one.
  const isDrawnFromStock =
    meta?.stockEffect === "out" || meta?.stockEffect === "move";

  const lotOptions: SelectOption[] = useMemo(() => {
    const offered =
      onLineLocationOnly && lots.some((lot) => lot.onLineLocation)
        ? lots.filter((lot) => lot.onLineLocation)
        : lots;

    return [
      { label: "No lot chosen", value: EMPTY_LOT },
      ...offered.map((lot) => ({
        label: lotLabel(lot),
        value: lot.uuid,
        // 🔴 Physical stock, reservations ignored — the warehouse rule. The
        // reserved figure is shown, never subtracted: the metal is reserved for
        // the very order this pick is serving.
        description:
          lot.reserved > 0
            ? `${lot.available} on the shelf · ${lot.reserved} reserved`
            : `${lot.available} on the shelf`,
      })),
    ];
  }, [lots, onLineLocationOnly]);

  const lotsByUuid = useMemo(
    () => new Map(lots.map((lot) => [lot.uuid, lot])),
    [lots],
  );

  // Choosing a parcel fills in what that parcel is. The reference pre-fills the
  // same three fields off the allocated lot, and the one place it fails to —
  // `Internal batch` reading `0` on its own dialog — is very likely where the
  // bundle number gets lost between the shelf and the load.
  const chooseLot = (index: number, value: string) => {
    const lot = value === EMPTY_LOT ? undefined : lotsByUuid.get(value);
    setValue(`picks.${index}.stockUuid`, lot ? lot.uuid : "");
    setValue(`picks.${index}.charge`, lot?.charge ?? "");
    setValue(`picks.${index}.internalCharge`, lot?.internalCharge ?? "");
    setValue(`picks.${index}.internalBatch`, lot?.internalBatch ?? "");
  };

  /**
   * ⚠️ A weight pre-filled for 50 pieces is not the weight of 20.
   *
   * The reference opens `Kg(a)` on the work order's planned figure and leaves it
   * there whatever quantity is then typed, so reporting 20 of 50 pieces reports
   * all 50 pieces' worth of metal. Ours clears it instead, and only while
   * nobody has touched it — a weight already typed is a weight off the scale
   * and is never overwritten.
   *
   * Cleared rather than recalculated: `kgActual` is what the parcel weighed,
   * not what it should have weighed. The reference's own two densities disagree
   * by 1,9 % on this very product (**O11**), which is exactly why we do not
   * compute a number here and call it measured.
   */
  const restateWeight = (index: number, typedQuantity: string) => {
    if (dirtyFields.picks?.[index]?.kgActual) {
      return;
    }
    const planned = String(
      getValues(`picks.${index}.qtyPlanned`) ?? "",
    ).replace(",", ".");
    if (Number(typedQuantity.replace(",", ".")) !== Number(planned)) {
      setValue(`picks.${index}.kgActual`, "");
    }
  };

  // 🔴 The rule that stops metal becoming stock without traceability.
  //
  // The reference keeps its own `OK` greyed out until every bundle carrying a
  // quantity has a `Charge` — watched on 21-9-2026 while reporting the
  // unloading of purchase order 401141, where nothing else unlocked it. The
  // server enforces this too; the button is disabled so the floor sees why
  // before it fills the dialog in rather than after.
  const watchedPicks = watch("picks");
  const bundlesMissingCharge = isReceipt
    ? (watchedPicks ?? []).filter(
        (pick) =>
          Number(String(pick?.qtyActual ?? "").replace(",", ".")) > 0 &&
          !String(pick?.charge ?? "").trim(),
      ).length
    : 0;

  // 🔴 And its mirror on the way out: a row with no lot crashed the reference
  // twice on 29-9-2026. The server refuses it; the button says so first.
  const rowsMissingLot = isDrawnFromStock
    ? (watchedPicks ?? []).filter(
        (pick) =>
          Number(String(pick?.qtyActual ?? "").replace(",", ".")) > 0 &&
          !String(pick?.stockUuid ?? "").trim(),
      ).length
    : 0;

  const locationOptions: SelectOption[] = locations.map((location) => ({
    label: location.name,
    value: location.uuid,
  }));

  const userOptions: SelectOption[] = users.map((user) => ({
    label: user.label,
    value: user.value,
  }));

  const columnCount = isReceipt ? 16 : isDrawnFromStock ? 8 : 7;

  return (
    <Dialog open={!!line} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            Report completion{" "}
            {WAREHOUSE_WORK_ORDER_TYPE_LABELS[workOrderType].toLowerCase()}{" "}
            {workOrderNumber ?? ""}/{line?.lineNumber ?? ""},{" "}
            {formatNumber(Number(line?.qtyPlanned ?? 0))} {line?.productName ?? ""}
            {line?.length || line?.width || line?.thickness
              ? ` ${[line?.length, line?.width, line?.thickness]
                  .filter((value) => value !== null && Number(value) > 0)
                  .map((value) => String(Number(value)))
                  .join("x")}mm`
              : ""}
          </DialogTitle>
          <DialogDescription>
            {isCount
              ? "The quantity you report replaces what the lot is recorded as holding."
              : "This is the moment the stock actually moves."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <DialogBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <FormLabel htmlFor="executedAt" required>
                  Executed on
                </FormLabel>
                <Controller
                  control={control}
                  name="executedAt"
                  render={({ field }) => (
                    <DatePicker
                      id="executedAt"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                <FormFieldError message={errors.executedAt?.message} />
              </div>
              <div>
                <FormLabel htmlFor="executedTime" required>
                  At
                </FormLabel>
                <Controller
                  control={control}
                  name="executedTime"
                  render={({ field }) => (
                    <TimePicker
                      id="executedTime"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                <FormFieldError message={errors.executedTime?.message} />
              </div>
              {/* Not mandatory, and blank in the reference too. A report nobody
                  signed is still a report. */}
              <div>
                <FormLabel htmlFor="executedByUserId">By</FormLabel>
                <Controller
                  control={control}
                  name="executedByUserId"
                  render={({ field }) => (
                    <Select
                      id="executedByUserId"
                      value={field.value ?? ""}
                      options={userOptions}
                      placeholder="Whoever is signed in"
                      onValueChange={field.onChange}
                      disabled={isPending}
                    />
                  )}
                />
              </div>
              {/* Where the goods end up. `Laad` in the reference, but not
                  always: work order 318341 sends its line to `Afroep`. */}
              <div>
                <FormLabel htmlFor="toLocationUuid">To location</FormLabel>
                <Controller
                  control={control}
                  name="toLocationUuid"
                  render={({ field }) => (
                    <Select
                      id="toLocationUuid"
                      value={field.value ?? ""}
                      options={locationOptions}
                      placeholder="As planned on the line"
                      onValueChange={field.onChange}
                      disabled={isPending}
                    />
                  )}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {isReceipt ? (
                    /* The reference's Gereedmelden losopdracht, column for
                       column: Voor order · Hvh · Lengte · Breedte · Dikte ·
                       Gewicht · Gewicht bruto · Gewogen gewicht · Meters ·
                       Naar · Interne charge · Interne partij · Charge · Partij
                       · Plaatnummer. */
                    <TableRow>
                      <TableHead>For order</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Length</TableHead>
                      <TableHead className="text-right">Width</TableHead>
                      <TableHead className="text-right">Thickness</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="text-right">Gross weight</TableHead>
                      <TableHead className="text-right">Weighed weight</TableHead>
                      <TableHead className="text-right">Metres</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Internal charge</TableHead>
                      <TableHead>Internal batch</TableHead>
                      <TableHead>Charge</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Plate number</TableHead>
                      <TableHead />
                    </TableRow>
                  ) : (
                  <TableRow>
                    {isDrawnFromStock ? <TableHead>Lot</TableHead> : null}
                    <TableHead className="text-right">Qty planned</TableHead>
                    <TableHead className="text-right">
                      {isCount ? "Counted" : "Qty actual"}
                    </TableHead>
                    <TableHead className="text-right">Kg actual</TableHead>
                    <TableHead>Charge</TableHead>
                    <TableHead>Internal charge</TableHead>
                    <TableHead>Internal batch</TableHead>
                    <TableHead />
                  </TableRow>
                  )}
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={columnCount}
                        className="h-16 text-center text-muted-foreground"
                      >
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : (
                    fields.map((field, index) => (
                      <TableRow key={field.id}>
                        {isReceipt ? (
                          <>
                            <TableCell />
                          </>
                        ) : null}
                        {isDrawnFromStock ? (
                          <TableCell className="min-w-72">
                            <Controller
                              control={control}
                              name={`picks.${index}.stockUuid`}
                              render={({ field: lotField }) => (
                                <Select
                                  value={lotField.value || EMPTY_LOT}
                                  options={lotOptions}
                                  placeholder="Which parcel?"
                                  onValueChange={(value) =>
                                    chooseLot(index, value)
                                  }
                                  disabled={isPending}
                                  invalid={
                                    Number(
                                      String(
                                        watchedPicks?.[index]?.qtyActual ?? "",
                                      ).replace(",", "."),
                                    ) > 0 && !lotField.value
                                  }
                                />
                              )}
                            />
                          </TableCell>
                        ) : null}
                        {!isReceipt ? (
                          <TableCell className="text-right">
                            <Input
                              className="text-right"
                              readOnly
                              {...register(`picks.${index}.qtyPlanned`)}
                            />
                          </TableCell>
                        ) : null}
                        <TableCell className="text-right">
                          <Input
                            type="text"
                            inputMode="decimal"
                            className="w-20 text-right"
                            {...register(`picks.${index}.qtyActual`, {
                              onChange: (event) =>
                                restateWeight(index, event.target.value),
                            })}
                            disabled={isPending}
                          />
                        </TableCell>
                        {isReceipt ? (
                          <>
                            <TableCell className="text-right tabular-nums">
                              {orDash(line?.length ?? null)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {orDash(line?.width ?? null)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {line?.thickness === null ||
                              line?.thickness === undefined
                                ? "—"
                                : formatNumber(Number(line.thickness))}
                            </TableCell>
                            {/* What the plan said this row weighs; the
                                weighed figure beside it is the scale's. */}
                            <TableCell className="text-right tabular-nums">
                              {formatNumber(
                                Number(watchedPicks?.[index]?.qtyPlanned ?? 0) > 0
                                  ? Number(line?.kgPlanned ?? 0)
                                  : 0,
                              )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              0
                            </TableCell>
                          </>
                        ) : null}
                        <TableCell className="text-right">
                          <Input
                            type="text"
                            inputMode="decimal"
                            className="w-24 text-right"
                            {...register(`picks.${index}.kgActual`)}
                            disabled={isPending}
                          />
                        </TableCell>
                        {isReceipt ? (
                          <>
                            <TableCell className="text-right tabular-nums">
                              {formatNumber(
                                (Number(
                                  String(
                                    watchedPicks?.[index]?.qtyActual ?? "0",
                                  ).replace(",", "."),
                                ) *
                                  Number(line?.length ?? 0)) /
                                  1000,
                              )}
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {orDash(line?.toLocationName ?? null)}
                            </TableCell>
                            <TableCell>
                              <Input
                                className="w-24"
                                {...register(`picks.${index}.internalCharge`)}
                                disabled={isPending}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                className="w-24"
                                {...register(`picks.${index}.internalBatch`)}
                                disabled={isPending}
                              />
                            </TableCell>
                          </>
                        ) : null}
                        {/* Off a shelf these three describe the parcel, so they
                            are read off it rather than typed over it. On an
                            unloading there is no parcel yet and they are the
                            only record of what arrived. */}
                        <TableCell>
                          <Input
                            {...register(`picks.${index}.charge`)}
                            disabled={isPending}
                            readOnly={isDrawnFromStock}
                            className={cn(
                              isReceipt && "w-28",
                              isReceipt &&
                                Number(
                                  String(
                                    watchedPicks?.[index]?.qtyActual ?? "",
                                  ).replace(",", "."),
                                ) > 0 &&
                                !String(
                                  watchedPicks?.[index]?.charge ?? "",
                                ).trim() &&
                                "border-destructive",
                            )}
                          />
                        </TableCell>
                        {isReceipt ? (
                          <>
                            {/* Batch and plate number are not taken here yet;
                                the reference's columns are kept in place. */}
                            <TableCell>—</TableCell>
                            <TableCell>—</TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>
                              <Input
                                {...register(`picks.${index}.internalCharge`)}
                                disabled={isPending}
                                readOnly={isDrawnFromStock}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                {...register(`picks.${index}.internalBatch`)}
                                disabled={isPending}
                                readOnly={isDrawnFromStock}
                              />
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            disabled={isPending || fields.length === 1}
                            aria-label="Remove row"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {isReceipt ? (
              <dl className="flex flex-wrap gap-x-10 gap-y-1 text-sm">
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Total qty</dt>
                  <dd className="tabular-nums">
                    {formatNumber(
                      (watchedPicks ?? []).reduce(
                        (sum, pick) =>
                          sum +
                          Number(String(pick?.qtyActual ?? "0").replace(",", ".")),
                        0,
                      ),
                    )}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Total length</dt>
                  <dd className="tabular-nums">
                    {formatNumber(
                      (watchedPicks ?? []).reduce(
                        (sum, pick) =>
                          sum +
                          Number(String(pick?.qtyActual ?? "0").replace(",", ".")) *
                            Number(line?.length ?? 0),
                        0,
                      ),
                    )}
                  </dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-muted-foreground">Total weight</dt>
                  <dd className="tabular-nums">
                    {formatNumber(
                      (watchedPicks ?? []).reduce(
                        (sum, pick) =>
                          sum +
                          Number(String(pick?.kgActual ?? "0").replace(",", ".")),
                        0,
                      ),
                    )}
                  </dd>
                </div>
              </dl>
            ) : null}

            <div className="flex flex-wrap items-center gap-4">
              {/* One planned line is routinely reported as several parcels —
                  50 pieces walked out as 20, 25 and 5 — and each parcel may sit
                  on a shelf of its own. */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    uuid: undefined,
                    stockUuid: "",
                    qtyPlanned: "0",
                    qtyActual: "",
                    kgActual: "",
                    charge: "",
                    internalCharge: "",
                    internalBatch: "",
                  })
                }
                disabled={isPending}
              >
                <Plus className="size-4" />
                New
              </Button>

              {isDrawnFromStock && lots.some((lot) => lot.onLineLocation) ? (
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={onLineLocationOnly}
                    onChange={(event) =>
                      setOnLineLocationOnly(event.target.checked)
                    }
                    disabled={isPending}
                  />
                  Only lots on {orDash(line?.fromLocationName ?? null)}
                </label>
              ) : null}
            </div>

            {bundlesMissingCharge > 0 ? (
              <p className="text-sm text-muted-foreground">
                {bundlesMissingCharge === 1
                  ? "One bundle still has no charge."
                  : `${bundlesMissingCharge} bundles still have no charge.`}{" "}
                Every bundle needs the heat number from its certificate before
                these goods can become stock.
              </p>
            ) : null}

            {rowsMissingLot > 0 ? (
              <p className="text-sm text-muted-foreground">
                {rowsMissingLot === 1
                  ? "One parcel does not say which lot it came off."
                  : `${rowsMissingLot} parcels do not say which lot they came off.`}{" "}
                Choose the lot before reporting, or there is nothing to take the
                goods out of.
              </p>
            ) : null}

            <FormError>{formError}</FormError>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                loading ||
                bundlesMissingCharge > 0 ||
                rowsMissingLot > 0
              }
            >
              {isPending ? "Reporting..." : "OK"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
