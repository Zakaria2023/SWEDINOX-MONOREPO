"use client";

import { startTransition, useActionState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ShoppingCart } from "lucide-react";
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

type Props = {
  request: PurchaseRequestDetail;
  companies: CompanyOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * `Purchase order` on a saved request: ordered outright when the price is
 * already known — a contract, a repeat buy, an urgent top-up — instead of
 * going round a quote. The request carries no prices by design, so the agreed
 * price is typed here per line, per tonne as every purchase line is struck.
 * The order is raised final and sent, and opens once it is.
 */
export const PurchaseRequestOrderDialog = ({
  request,
  companies,
  open,
  onOpenChange,
}: Props) => {
  const [state, dispatch, isPending] = useActionState(
    convertPurchaseRequestToOrder,
    {},
  );

  const supplierOptions = companies
    .filter((company) => company.roles?.includes("supplier"))
    .map((company) => ({
      value: company.uuid,
      label:
        [company.searchCode1, company.companyName]
          .filter(Boolean)
          .join(" — ") || company.uuid,
    }));

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PurchaseRequestOrderFormValues>({
    resolver: zodResolver(purchaseRequestOrderSchema),
    defaultValues: {
      requestUuid: request.uuid,
      // The request's own supplier, unless it was raised against an agent.
      supplierUuid:
        request.companyType === "agent" ? "" : (request.companyUuid ?? ""),
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Purchase order</DialogTitle>
            <DialogDescription>
              Skip the quote round when the price is already agreed. The order
              is raised final and sent to the supplier.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
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
                    options={supplierOptions}
                    onValueChange={field.onChange}
                  />
                )}
              />
              <FormFieldError message={errors.supplierUuid?.message} />
            </div>

            <div className="max-h-96 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">Code</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty(p)</TableHead>
                    <TableHead className="text-right">Kg(p)</TableHead>
                    <TableHead>Net price (€ / TN)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.items.map((item, index) => (
                    <TableRow key={item.uuid}>
                      <TableCell className="text-right tabular-nums">
                        {orDash(item.lineNumber)}
                      </TableCell>
                      <TableCell>
                        {orDash(item.productCode ?? item.description)}
                      </TableCell>
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
                  {request.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        This request has no saved lines to order.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <FormError>{state.error}</FormError>
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
              disabled={isPending || request.items.length === 0}
            >
              <ShoppingCart className="me-1.5 size-4" />
              {isPending ? "Ordering…" : "Purchase order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
