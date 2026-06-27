"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { InvoiceSurchargeInput } from "@/app/(dashboard)/invoices/actions";
import { useInvoiceSubmit } from "@/app/(dashboard)/invoices/use-invoice-submit";
import {
  SurchargeFormValues,
  surchargeSchema,
} from "@/app/(dashboard)/invoices/validation";
import { Button } from "@/components/shadcn/button";
import { DatePicker } from "@/components/shadcn/date-picker";
import {
  Dialog,
  DialogBody,
  DialogContent,
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
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import {
  invoicePaymentTerms,
  invoiceSurchargeDescriptions,
  invoiceVatScenarios,
} from "@/lib/enums";
import {
  COMMON_TEXT,
  INVOICE_PAYMENT_TERM_LABELS,
  INVOICE_SURCHARGE_DESCRIPTION_LABELS,
  INVOICE_VAT_SCENARIO_LABELS,
} from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

type InvoiceFormProps = {
  availableCompanies: CompanyOption[];
};

const DEFAULT_SURCHARGE = {
  order: 0,
  description: undefined,
  surcharge: "",
  unit: "Euro",
};

export const InvoiceForm = ({ availableCompanies }: InvoiceFormProps) => {
  const router = useRouter();
  const [surcharges, setSurcharges] = useState<InvoiceSurchargeInput[]>([]);
  const [isSurchargeDialogOpen, setIsSurchargeDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [surchargeError, setSurchargeError] = useState<string | null>(null);

  const {
    form,
    isPending,
    onSubmit: submitForm,
    state,
  } = useInvoiceSubmit(surcharges);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (surcharges.length === 0) {
      setSurchargeError("At least one surcharge is required.");
      e.preventDefault();
      return;
    }
    setSurchargeError(null);
    submitForm(e);
  };
  const { register, watch, control } = form;

  useEffect(() => {
    if (state.success) {
      router.push("/invoices");
    }
  }, [router, state.success]);

  const surchargeForm = useForm<SurchargeFormValues>({
    resolver: zodResolver(surchargeSchema),
    defaultValues: DEFAULT_SURCHARGE,
  });

  const companyOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...availableCompanies.map((c) => ({
      value: c.uuid,
      label: [c.searchCode1, c.companyName].filter(Boolean).join(" — "),
    })),
  ];

  const vatScenarioOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...invoiceVatScenarios.map((v) => ({
      value: v,
      label: INVOICE_VAT_SCENARIO_LABELS[v],
    })),
  ];

  const paymentTermOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...invoicePaymentTerms.map((t) => ({
      value: t,
      label: INVOICE_PAYMENT_TERM_LABELS[t],
    })),
  ];

  const surchargeDescriptionOptions = [
    { value: "", label: COMMON_TEXT.selectPlaceholder },
    ...invoiceSurchargeDescriptions.map((d) => ({
      value: d,
      label: INVOICE_SURCHARGE_DESCRIPTION_LABELS[d],
    })),
  ];

  const openSurchargeDialog = () => {
    setEditingIndex(null);
    surchargeForm.reset({ ...DEFAULT_SURCHARGE, order: surcharges.length });
    setIsSurchargeDialogOpen(true);
  };

  const openEditSurcharge = (index: number) => {
    setEditingIndex(index);
    const s = surcharges[index];
    surchargeForm.reset({
      order: s.order ?? 0,
      description: s.description ?? undefined,
      surcharge: s.surcharge ?? "",
      unit: s.unit ?? "Euro",
    });
    setIsSurchargeDialogOpen(true);
  };

  const handleSaveSurcharge = surchargeForm.handleSubmit((values) => {
    const surchargeVal = values.surcharge || "0.00";
    const entry: InvoiceSurchargeInput = {
      order: values.order ?? 0,
      description: values.description,
      surcharge: surchargeVal,
      unit: values.unit || undefined,
      surchargePercentage: "0.00",
      amount: surchargeVal,
    };
    if (editingIndex !== null) {
      setSurcharges((prev) =>
        prev.map((s, i) => (i === editingIndex ? entry : s)),
      );
    } else {
      setSurcharges((prev) => [...prev, entry]);
    }
    setSurchargeError(null);
    setIsSurchargeDialogOpen(false);
  });

  const removeSurcharge = (index: number) => {
    setSurcharges((prev) => prev.filter((_, i) => i !== index));
  };

  const na = COMMON_TEXT.notAvailable;

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-8">
        {/* Header fields */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
              Invoice
            </h2>
            <div>
              <FormLabel htmlFor="companyUuid">Customer</FormLabel>
              <Controller
                name="companyUuid"
                control={control}
                render={({ field }) => (
                  <Select
                    id="companyUuid"
                    options={companyOptions}
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v || undefined)}
                    disabled={isPending}
                  />
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FormLabel>Invoice Date</FormLabel>
                <Controller
                  name="invoiceDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={isPending}
                    />
                  )}
                />
              </div>
              <div>
                <FormLabel>Expiration Date</FormLabel>
                <Controller
                  name="expirationDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={isPending}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Amounts + checkboxes */}
          <div className="space-y-4">
            <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
              Amounts
            </h2>
            <div className="space-y-2 pt-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  id="calculateVat"
                  {...register("calculateVat")}
                  className="size-4 accent-primary"
                  disabled={isPending}
                />
                <span className="text-sm font-medium text-gray-700">
                  Calculate VAT
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  id="printed"
                  {...register("printed")}
                  className="size-4 accent-primary"
                  disabled={isPending}
                />
                <span className="text-sm font-medium text-gray-700">
                  Printed
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  id="mailed"
                  {...register("mailed")}
                  className="size-4 accent-primary"
                  disabled={isPending}
                />
                <span className="text-sm font-medium text-gray-700">
                  Mailed
                </span>
              </label>
            </div>
          </div>

          {/* VAT scenario + payment terms */}
          <div className="space-y-4">
            <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
              Settings
            </h2>
            <div>
              <FormLabel>VAT Scenario</FormLabel>
              <Controller
                name="vatScenario"
                control={control}
                render={({ field }) => (
                  <Select
                    options={vatScenarioOptions}
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v || undefined)}
                    disabled={isPending}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel>Payment Terms</FormLabel>
              <Controller
                name="paymentTerms"
                control={control}
                render={({ field }) => (
                  <Select
                    options={paymentTermOptions}
                    value={field.value ?? ""}
                    onValueChange={(v) => field.onChange(v || undefined)}
                    disabled={isPending}
                  />
                )}
              />
            </div>
            <div>
              <FormLabel htmlFor="explanation">Explanation</FormLabel>
              <textarea
                id="explanation"
                {...register("explanation")}
                rows={6}
                disabled={isPending}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Surcharges */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              Surcharges{" "}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {surcharges.length}{" "}
                {surcharges.length === 1 ? "surcharge" : "surcharges"}
              </span>
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openSurchargeDialog}
              disabled={isPending}
            >
              <Plus className="mr-1.5 size-4" />
              Add Surcharge
            </Button>
          </div>

          {surcharges.length > 0 && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Order</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Surcharge</TableHead>
                    <TableHead className="w-24">Unit</TableHead>
                    <TableHead className="text-right">Surcharge %</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surcharges.map((s, index) => (
                    <TableRow key={index}>
                      <TableCell>{s.order}</TableCell>
                      <TableCell>
                        {s.description
                          ? INVOICE_SURCHARGE_DESCRIPTION_LABELS[s.description]
                          : na}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.surcharge}
                      </TableCell>
                      <TableCell>{s.unit ?? na}</TableCell>
                      <TableCell className="text-right">
                        {s.surchargePercentage}
                      </TableCell>
                      <TableCell className="text-right">{s.amount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditSurcharge(index)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSurcharge(index)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {surchargeError && (
            <p className="text-sm font-medium text-destructive">
              {surchargeError}
            </p>
          )}
        </section>

        <FormError>{state.error}</FormError>

        <FormActions
          isPending={isPending}
          onCancel={() => router.push("/invoices")}
          submitLabel="Create Invoice"
        />
      </form>

      {/* Surcharge dialog */}
      <Dialog
        open={isSurchargeDialogOpen}
        onOpenChange={setIsSurchargeDialogOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? "Edit Surcharge" : "Add Surcharge"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSurcharge}>
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel htmlFor="surchargeOrder">Order</FormLabel>
                  <Input
                    id="surchargeOrder"
                    type="number"
                    min={0}
                    {...surchargeForm.register("order", {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <div>
                  <FormLabel required>Description</FormLabel>
                  <Controller
                    name="description"
                    control={surchargeForm.control}
                    render={({ field }) => (
                      <Select
                        options={surchargeDescriptionOptions}
                        value={field.value ?? ""}
                        onValueChange={(v) => field.onChange(v || undefined)}
                      />
                    )}
                  />
                  <FormFieldError
                    message={
                      surchargeForm.formState.errors.description?.message
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel htmlFor="surchargeAmount">Surcharge</FormLabel>
                  <Input
                    id="surchargeAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...surchargeForm.register("surcharge")}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="surchargeUnit">Unit</FormLabel>
                  <Input
                    id="surchargeUnit"
                    placeholder="Euro"
                    {...surchargeForm.register("unit")}
                  />
                </div>
              </div>
            </DialogBody>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSurchargeDialogOpen(false)}
              >
                {COMMON_TEXT.cancel}
              </Button>
              <Button type="submit">
                {editingIndex !== null ? "Save" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
