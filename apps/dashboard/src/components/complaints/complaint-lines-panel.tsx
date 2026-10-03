"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import {
  addComplaintLine,
  ComplaintItemDetail,
  ComplaintOrderLine,
  deleteComplaintLine,
} from "@/app/(dashboard)/complaints/actions";
import {
  ComplaintLineFormValues,
  complaintLineSchema,
  DEFAULT_COMPLAINT_LINE,
} from "@/app/(dashboard)/complaints/validation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { ProductSearchField } from "@/components/ui/product-search-field";
import { RowAction } from "@/components/ui/row-action";
import {
  formatDateColumn,
  formatLengthMm,
  formatNumber,
  orDash,
} from "@/lib/helpers";
import { STOCK_UNIT_LABELS } from "@/lib/labels";

type Props = {
  complaintUuid: string;
  /** Lines exist only on an order complaint that names its order. */
  canAddLines: boolean;
  daysInSystem: number | null;
  items: ComplaintItemDetail[];
  orderLines: ComplaintOrderLine[];
};

export const ComplaintLinesPanel = ({
  complaintUuid,
  canAddLines,
  daysInSystem,
  items,
  orderLines,
}: Props) => {
  const [addState, dispatchAdd, isAdding] = useActionState(
    addComplaintLine,
    {},
  );
  const [deleteState, dispatchDelete, isDeleting] = useActionState(
    deleteComplaintLine,
    {},
  );

  const form = useForm<ComplaintLineFormValues>({
    resolver: zodResolver(complaintLineSchema),
    defaultValues: DEFAULT_COMPLAINT_LINE,
  });
  const {
    control,
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (addState.success) {
      reset(DEFAULT_COMPLAINT_LINE);
    }
  }, [addState, reset]);

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatchAdd({ ...values, complaintUuid });
    });
  });

  const orderLineOptions = [
    { value: "", label: "Choose a delivered line" },
    ...orderLines.map((line) => ({
      value: line.orderItemUuid,
      label: [
        line.lineNumber,
        line.productCode,
        line.productName,
        `${formatNumber(Number(line.quantity))} ${line.unit ? STOCK_UNIT_LABELS[line.unit] : ""}`,
        formatDateColumn(line.deliveryDate),
      ]
        .filter(Boolean)
        .join(" · "),
    })),
  ];


  return (
    <div className="space-y-4">
      <FormError>{addState.error ?? deleteState.error}</FormError>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">Line</TableHead>
            <TableHead>Delivery date</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Dim.</TableHead>
            <TableHead>Options</TableHead>
            <TableHead className="text-right">Qty(a)</TableHead>
            <TableHead>U</TableHead>
            <TableHead>Bill of lading</TableHead>
            <TableHead className="text-right">Qty(shortfall)</TableHead>
            <TableHead>Warehouse section</TableHead>
            <TableHead>Exchange product code</TableHead>
            <TableHead>Exchange product</TableHead>
            <TableHead className="text-right">Days in system</TableHead>
            <TableHead>Completed</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={15}
                className="h-20 text-center text-muted-foreground"
              >
                {canAddLines
                  ? "No lines yet. Add the delivered lines this complaint is about below."
                  : "Only an order complaint has lines. Set the type to Order and choose its order to add them."}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item.uuid}>
                <TableCell className="text-right tabular-nums">
                  <Link
                    href={`/complaint-lines/${item.uuid}`}
                    className="text-primary hover:underline"
                  >
                    {orDash(item.orderLineNumber ?? item.lineNumber)}
                  </Link>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDateColumn(item.deliveryDate)}
                </TableCell>
                <TableCell>
                  {item.productUuid ? (
                    <Link
                      href={`/products/${item.productUuid}`}
                      className="hover:underline"
                    >
                      {item.productName ?? item.productCode ?? "—"}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {item.lengthMm || item.widthMm
                    ? `${formatLengthMm(item.lengthMm)}x${orDash(item.widthMm)}`
                    : "—"}
                </TableCell>
                <TableCell>{orDash(item.options)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(Number(item.qtyDelivered ?? 0))}
                </TableCell>
                <TableCell>
                  {item.unit ? STOCK_UNIT_LABELS[item.unit] : "—"}
                </TableCell>
                <TableCell>{orDash(item.billOfLading)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatNumber(Number(item.qty ?? 0))}
                </TableCell>
                <TableCell>{orDash(item.warehouseSection)}</TableCell>
                <TableCell>{orDash(item.exchangeProductCode)}</TableCell>
                <TableCell>{orDash(item.exchangeProductName)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {orDash(daysInSystem)}
                </TableCell>
                <TableCell>{item.completed ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <RowAction
                    label="Delete line"
                    tone="danger"
                    disabled={isDeleting}
                    onClick={() =>
                      startTransition(() => {
                        dispatchDelete({ lineUuid: item.uuid });
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </RowAction>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {canAddLines && (
        <form
          onSubmit={onSubmit}
          className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="sm:col-span-2">
            <FormLabel htmlFor="orderItemUuid" required>
              Delivered line
            </FormLabel>
            <Controller
              control={control}
              name="orderItemUuid"
              render={({ field }) => (
                <Select
                  id="orderItemUuid"
                  value={field.value}
                  options={orderLineOptions}
                  onValueChange={field.onChange}
                  invalid={!!errors.orderItemUuid}
                />
              )}
            />
            <FormFieldError message={errors.orderItemUuid?.message} />
          </div>
          <div>
            <FormLabel htmlFor="billOfLading">Bill of lading</FormLabel>
            <Input id="billOfLading" {...register("billOfLading")} />
            <FormFieldError message={errors.billOfLading?.message} />
          </div>
          <div>
            <FormLabel htmlFor="qtyShortfall" required>
              Qty(shortfall)
            </FormLabel>
            <Input
              id="qtyShortfall"
              type="number"
              step="0.001"
              min="0"
              {...register("qtyShortfall")}
            />
            <FormFieldError message={errors.qtyShortfall?.message} />
          </div>
          <div className="sm:col-span-2">
            <FormLabel htmlFor="exchangeProductUuid">Exchange product</FormLabel>
            <Controller
              control={control}
              name="exchangeProductUuid"
              render={({ field }) => (
                <ProductSearchField
                  id="exchangeProductUuid"
                  value={field.value}
                  sources={["stock", "catalogue"]}
                  onChange={(choice) => field.onChange(choice.productUuid)}
                />
              )}
            />
          </div>
          <div className="flex items-end sm:col-span-2 lg:col-span-2">
            <Button type="submit" disabled={isAdding}>
              <Plus className="size-4" />
              {isAdding ? "Adding…" : "Add line"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
