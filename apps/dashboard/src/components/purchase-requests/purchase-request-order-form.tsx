"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import {
  convertPurchaseRequestToOrder,
  PurchaseRequestDetail,
} from "@/app/(dashboard)/purchase-requests/actions";
import {
  PurchaseRequestOrderFormValues,
  purchaseRequestOrderSchema,
} from "@/app/(dashboard)/purchase-requests/validation";
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
import { formatNumber, orDash } from "@/lib/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingCart } from "lucide-react";
import { startTransition, useActionState } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  request: PurchaseRequestDetail;
  supplierOptions: CompanyOption[];
};

/**
 * `Purchase order` on the reference's request toolbar, beside `Purchase
 * quote`: a request can be ordered outright when the price is already known —
 * a contract, a repeat buy, an urgent top-up — instead of going round a quote.
 * The request carries no prices by design, so the agreed price is typed here,
 * per tonne as every purchase line is struck.
 */
export const PurchaseRequestOrderForm = ({
  request,
  supplierOptions,
}: Props) => {
  const [state, dispatch, isPending] = useActionState(
    convertPurchaseRequestToOrder,
    {},
  );

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PurchaseRequestOrderFormValues>({
    resolver: zodResolver(purchaseRequestOrderSchema),
    defaultValues: {
      requestUuid: request.uuid,
      supplierUuid: "",
      prices: request.items.map((item) => ({
        purchaseRequestItemUuid: item.uuid,
        netPrice: "",
      })),
    },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, requestUuid: request.uuid });
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">
        Order directly
      </h2>
      <p className="text-sm text-muted-foreground">
        Skip the quote round when the price is already agreed. The order is
        raised final and sent to the supplier.
      </p>
      {state.error && <FormError>{state.error}</FormError>}

      <div className="max-w-sm space-y-1.5">
        <FormLabel htmlFor="order-supplier">Supplier</FormLabel>
        <Controller
          name="supplierUuid"
          control={control}
          render={({ field }) => (
            <Select
              id="order-supplier"
              value={field.value}
              placeholder="Choose a supplier"
              options={supplierOptions.map((supplier) => ({
                value: supplier.uuid,
                label:
                  supplier.companyName ?? supplier.searchCode1 ?? supplier.uuid,
              }))}
              onValueChange={field.onChange}
            />
          )}
        />
        <FormFieldError message={errors.supplierUuid?.message} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">Line</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Kg</TableHead>
            <TableHead>Net price (€ / TN)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {request.items.map((item, index) => (
            <TableRow key={item.uuid}>
              <TableCell className="text-right tabular-nums">
                {orDash(item.lineNumber)}
              </TableCell>
              <TableCell>{orDash(item.productCode)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(item.quantity ?? 0))}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNumber(Number(item.kg ?? 0))}
              </TableCell>
              <TableCell>
                <Input
                  inputMode="decimal"
                  aria-label={`Net price for line ${item.lineNumber ?? index + 1}`}
                  className="w-32"
                  {...register(`prices.${index}.netPrice`)}
                />
                <FormFieldError
                  message={errors.prices?.[index]?.netPrice?.message}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Button type="submit" disabled={isPending || request.items.length === 0}>
        <ShoppingCart className="mr-1.5 size-4" />
        {isPending ? "Ordering…" : "Purchase order"}
      </Button>
    </form>
  );
};
