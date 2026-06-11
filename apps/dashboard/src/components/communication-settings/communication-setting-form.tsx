"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import type {
  CompanyOption,
  ContactOption,
} from "@/app/(dashboard)/communication-settings/actions";
import { useCommunicationSettingSubmit } from "@/app/(dashboard)/communication-settings/use-communication-setting-submit";
import {
  communicationSettingDocumentTypes,
  communicationSettingShapes,
  communicationSettingTypes,
} from "@/lib/enums";
import { Input } from "@/components/shadcn/input";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";

type CommunicationSettingFormProps = {
  companies: CompanyOption[];
  contacts: ContactOption[];
};

export const CommunicationSettingForm = ({
  companies,
  contacts,
}: CommunicationSettingFormProps) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { form, isPending, onSubmit, state } = useCommunicationSettingSubmit();
  const {
    control,
    register,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (state.success) {
      router.push("/communication-settings");
    }
  }, [router, state.success]);

  const companyOptions = [
    { value: "", label: t("common.select-option") },
    ...companies.map((company) => ({
      value: company.uuid,
      label: company.companyName,
    })),
  ];

  const contactOptions = [
    { value: "", label: t("common.empty-option") },
    ...contacts.map((contact) => ({
      value: contact.uuid,
      label: contact.description,
    })),
  ];

  const documentTypeOptions = [
    { value: "", label: t("common.select-option") },
    ...communicationSettingDocumentTypes.map((documentType) => ({
      value: documentType,
      label: t(`communication-setting-form.document-type-options.${documentType}`),
    })),
  ];

  const communicationTypeOptions = [
    { value: "", label: t("common.select-option") },
    ...communicationSettingTypes.map((communicationType) => ({
      value: communicationType,
      label: t(
        `communication-setting-form.communication-type-options.${communicationType}`,
      ),
    })),
  ];

  const shapeOptions = [
    { value: "", label: t("common.empty-option") },
    ...communicationSettingShapes.map((shape) => ({
      value: shape,
      label: t(`communication-setting-form.shape-options.${shape}`),
    })),
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          {t("communication-setting-form.sections.setting")}
        </h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
          <FormSelectField
            control={control}
            id="companyUuid"
            name="companyUuid"
            label={t("communication-setting-form.fields.company")}
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
            label={t("communication-setting-form.fields.document-type")}
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
            label={t("communication-setting-form.fields.communication-type")}
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
            label={t("communication-setting-form.fields.shape")}
            options={shapeOptions}
            emptyValue=""
            disabled={isPending}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          {t("communication-setting-form.sections.contact-details")}
        </h2>
        <div className="grid gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
          <FormSelectField
            control={control}
            id="contactUuid"
            name="contactUuid"
            label={t("communication-setting-form.fields.contact")}
            options={contactOptions}
            emptyValue=""
            disabled={isPending}
          />

          <div>
            <FormLabel htmlFor="email">
              {t("communication-setting-form.fields.email")}
            </FormLabel>
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
            <FormLabel htmlFor="fax">
              {t("communication-setting-form.fields.fax")}
            </FormLabel>
            <Input id="fax" {...register("fax")} disabled={isPending} />
          </div>
        </div>
      </section>

      <FormError>{state.error}</FormError>

      <FormActions
        isPending={isPending}
        onCancel={() => router.push("/communication-settings")}
        submitLabel={t("communication-setting-form.submit")}
      />
    </form>
  );
};
