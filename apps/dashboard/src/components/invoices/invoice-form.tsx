"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import {
  getReservedOrderItemsForCompany,
  InvoiceSurchargeInput,
  ReservedOrderItemOption,
} from "@/app/(dashboard)/invoices/actions";
import { useInvoiceSubmit } from "@/app/(dashboard)/invoices/use-invoice-submit";
import {
  SurchargeFormValues,
  surchargeSchema,
} from "@/app/(dashboard)/invoices/validation";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { getPaymentTermDueDate, invoiceChargesVat } from "@/lib/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { SurchargeDialog } from "./dialogs/surcharge-dialog";
import { InvoiceAmountsSection } from "./sections/invoice-amounts-section";
import { InvoiceHeaderSection } from "./sections/invoice-header-section";
import { InvoiceOrderItemsSection } from "./sections/invoice-order-items-section";
import { InvoiceSettingsSection } from "./sections/invoice-settings-section";
import { InvoiceSurchargesSection } from "./sections/invoice-surcharges-section";

type InvoiceFormProps = {
  availableCompanies: CompanyOption[];
};

const DEFAULT_SURCHARGE = {
  order: 0,
  description: undefined,
  surcharge: "",
  unit: "Euro",
  profit: "",
};

export const InvoiceForm = ({ availableCompanies }: InvoiceFormProps) => {
  const router = useRouter();
  const [surcharges, setSurcharges] = useState<InvoiceSurchargeInput[]>([]);
  const [isSurchargeDialogOpen, setIsSurchargeDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [surchargeError, setSurchargeError] = useState<string | null>(null);
  const [reservedItems, setReservedItems] = useState<ReservedOrderItemOption[]>(
    [],
  );
  const [selectedOrderItemUuids, setSelectedOrderItemUuids] = useState<
    string[]
  >([]);
  // What to bill on each selected line. A line the user hasn't touched isn't in
  // here at all, and the action reads that as "bill the whole remainder".
  const [billQuantities, setBillQuantities] = useState<Record<string, string>>(
    {},
  );

  const selections = selectedOrderItemUuids.map((uuid) => ({
    orderItemUuid: uuid,
    quantity: billQuantities[uuid],
  }));

  const {
    form,
    isPending,
    onSubmit: submitForm,
    state,
  } = useInvoiceSubmit(surcharges, selections);

  const companyUuid = form.watch("companyUuid");
  const paymentTerms = form.watch("paymentTerms");
  const invoiceDate = form.watch("invoiceDate");
  const vatScenario = form.watch("vatScenario");

  useEffect(() => {
    setSelectedOrderItemUuids([]);
    setBillQuantities({});
    if (!companyUuid) {
      setReservedItems([]);
      return;
    }
    getReservedOrderItemsForCompany(companyUuid).then(setReservedItems);
  }, [companyUuid]);

  // Auto-fill the due date from the payment term whenever it (or the invoice
  // date) changes and the term implies a determinate due date.
  useEffect(() => {
    const due = getPaymentTermDueDate(paymentTerms ?? null, invoiceDate ?? null);
    if (due) {
      form.setValue("expirationDate", due);
    }
  }, [paymentTerms, invoiceDate, form]);

  // Reflect the VAT scenario in the "calculate VAT" flag: reverse-charge
  // scenarios charge 0% VAT.
  useEffect(() => {
    if (!vatScenario) {
      return;
    }
    form.setValue("calculateVat", invoiceChargesVat(vatScenario));
  }, [vatScenario, form]);

  const toggleOrderItem = (uuid: string) =>
    setSelectedOrderItemUuids((prev) =>
      prev.includes(uuid) ? prev.filter((id) => id !== uuid) : [...prev, uuid],
    );

  const setBillQuantity = (uuid: string, quantity: string) =>
    setBillQuantities((prev) => ({ ...prev, [uuid]: quantity }));

  // An invoice has to bill something, but either goods or surcharges will do —
  // a plain materials invoice carries its value on the lines it bills.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    if (surcharges.length === 0 && selectedOrderItemUuids.length === 0) {
      setSurchargeError(
        "Select at least one delivered line to bill, or add a surcharge.",
      );
      e.preventDefault();
      return;
    }
    setSurchargeError(null);
    submitForm(e);
  };

  useEffect(() => {
    if (state.success) {
      router.push("/invoices");
    }
  }, [router, state.success]);

  const surchargeForm = useForm<SurchargeFormValues>({
    resolver: zodResolver(surchargeSchema),
    defaultValues: DEFAULT_SURCHARGE,
  });

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
      profit: s.profit ?? "",
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
      profit: values.profit || "0.00",
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

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="space-y-8">
        {/* Header fields */}
        <div className="grid gap-6 lg:grid-cols-3">
          <InvoiceHeaderSection
            isPending={isPending}
            availableCompanies={availableCompanies}
          />
          <InvoiceAmountsSection isPending={isPending} />
          <InvoiceSettingsSection isPending={isPending} />
        </div>

        <InvoiceOrderItemsSection
          reservedItems={reservedItems}
          selectedUuids={selectedOrderItemUuids}
          quantities={billQuantities}
          onToggle={toggleOrderItem}
          onQuantityChange={setBillQuantity}
          isPending={isPending}
        />

        <InvoiceSurchargesSection
          isPending={isPending}
          surcharges={surcharges}
          surchargeError={surchargeError}
          onOpenDialog={openSurchargeDialog}
          onEditSurcharge={openEditSurcharge}
          onRemoveSurcharge={removeSurcharge}
        />

        <FormError>{state.error}</FormError>

        <FormActions
          isPending={isPending}
          onCancel={() => router.push("/invoices")}
          submitLabel="Create Invoice"
        />
      </form>

      {/* Surcharge dialog */}
      <SurchargeDialog
        isOpen={isSurchargeDialogOpen}
        onOpenChange={setIsSurchargeDialogOpen}
        surchargeForm={surchargeForm}
        onSave={handleSaveSurcharge}
        editingIndex={editingIndex}
      />
    </FormProvider>
  );
};
