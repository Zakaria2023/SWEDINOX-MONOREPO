"use client";

import { useCommunicationSettingSubmit } from "@/app/(dashboard)/communication-settings/use-communication-setting-submit";
import type {
  CompanyOption,
  ContactOption,
} from "@/app/(dashboard)/communication-settings/actions";
import {
  communicationSettingDocumentTypes,
  communicationSettingShapes,
  communicationSettingTypes,
} from "@/lib/enums";
import { Input } from "@/components/shadcn/input";
import { FormActions } from "@/components/ui/form-actions";
import { FormFieldError } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { FormError } from "@/components/ui/form-error";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FormLabel } from "@/components/ui/form-field";

const formatEnum = (val: string) =>
  val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const documentTypeOptions = [
  { value: "", label: "— Select —" },
  ...communicationSettingDocumentTypes.map((t) => ({ value: t, label: formatEnum(t) })),
];

const communicationTypeOptions = [
  { value: "", label: "— Select —" },
  ...communicationSettingTypes.map((t) => ({ value: t, label: formatEnum(t) })),
];

const shapeOptions = [
  { value: "", label: "-empty-" },
  ...communicationSettingShapes.map((s) => ({ value: s, label: formatEnum(s) })),
];

type CommunicationSettingFormProps = {
  companies: CompanyOption[];
  contacts: ContactOption[];
};

export const CommunicationSettingForm = ({
  companies,
  contacts,
}: CommunicationSettingFormProps) => {
  const router = useRouter();
  const { form, isPending, onSubmit, state } = useCommunicationSettingSubmit();
  const {
    control,
    register,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (state.success) router.push("/communication-settings");
  }, [state.success, router]);

  const companyOptions = [
    { value: "", label: "— Select —" },
    ...companies.map((c) => ({ value: c.uuid, label: c.companyName })),
  ];

  const contactOptions = [
    { value: "", label: "-empty-" },
    ...contacts.map((c) => ({ value: c.uuid, label: c.code })),
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-8">

      {/* ── Setting ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">Setting</h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
          <FormSelectField
            control={control}
            id="companyUuid"
            name="companyUuid"
            label="Company"
            required
            options={companyOptions}
            emptyValue=""
            errorMessage={errors.companyUuid?.message}
            disabled={isPending}
          />

          <FormSelectField
            control={control}
            id="documentType"
            name="documentType"
            label="Document Type"
            required
            options={documentTypeOptions}
            emptyValue=""
            errorMessage={errors.documentType?.message as string | undefined}
            disabled={isPending}
          />

          <FormSelectField
            control={control}
            id="communicationType"
            name="communicationType"
            label="Communication Type"
            required
            options={communicationTypeOptions}
            emptyValue=""
            errorMessage={errors.communicationType?.message as string | undefined}
            disabled={isPending}
          />

          <FormSelectField
            control={control}
            id="shape"
            name="shape"
            label="Shape"
            options={shapeOptions}
            emptyValue=""
            disabled={isPending}
          />
        </div>
      </section>

      {/* ── Contact & Details ────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">Contact & Details</h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
          <FormSelectField
            control={control}
            id="contactUuid"
            name="contactUuid"
            label="Contact"
            options={contactOptions}
            emptyValue=""
            disabled={isPending}
          />

          <div>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input
              id="email"
              type="email"
              {...register("email")}
              aria-invalid={!!errors.email}
              disabled={isPending}
            />
            <FormFieldError message={errors.email?.message} />
          </div>

          <div>
            <FormLabel htmlFor="fax">Fax</FormLabel>
            <Input id="fax" {...register("fax")} disabled={isPending} />
          </div>
        </div>
      </section>

      <FormError>{state.error}</FormError>

      <FormActions
        isPending={isPending}
        onCancel={() => router.push("/communication-settings")}
        submitLabel="Create Setting"
      />
    </form>
  );
};
