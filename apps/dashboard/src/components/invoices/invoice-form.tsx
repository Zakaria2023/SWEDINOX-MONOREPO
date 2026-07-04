"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { InvoiceSurchargeInput } from "@/app/(dashboard)/invoices/actions";
import { useInvoiceSubmit } from "@/app/(dashboard)/invoices/use-invoice-submit";
import {
  SurchargeFormValues,
  surchargeSchema,
} from "@/app/(dashboard)/invoices/validation";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { SurchargeDialog } from "./dialogs/surcharge-dialog";
import { InvoiceAmountsSection } from "./sections/invoice-amounts-section";
import { InvoiceHeaderSection } from "./sections/invoice-header-section";
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
