"use client";

import { DebtorCompanyOption } from "@/app/(dashboard)/companies/actions";
import {
  CompanyDebtorData,
  updateCompanyDebtor,
} from "@/app/(dashboard)/companies/[uuid]/edit/debtor/actions";
import {
  companyDebtorSchema,
  CompanyDebtorFormValues,
} from "@/app/(dashboard)/companies/[uuid]/edit/debtor/validation";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { currencies, invoicePaymentTerms } from "@/lib/enums";
import { toDateInput } from "@/lib/helpers";
import { CURRENCY_LABELS, INVOICE_PAYMENT_TERM_LABELS } from "@/lib/labels";
import { useUser } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { startTransition, useActionState } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  company: CompanyDebtorData;
  debtorCompanies: DebtorCompanyOption[];
  purchaseOrgCompanies: DebtorCompanyOption[];
};

export const CompanyDebtorForm = ({
  company,
  debtorCompanies,
  purchaseOrgCompanies,
}: Props) => {
  const { user } = useUser();
  const currentUserName = user?.fullName ?? undefined;
  const [state, dispatch, isPending] = useActionState(updateCompanyDebtor, {});

  const roles = company.roles ?? [];
  const isCustomerOrProspect =
    roles.includes("customer") || roles.includes("prospect");

  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyDebtorFormValues>({
    resolver: zodResolver(companyDebtorSchema),
    defaultValues: {
      debtorNumber: company.debtorNumber ?? "",
      debtorCompanyUuid: company.debtorCompanyUuid ?? "",
      iban: company.iban ?? "",
      bic: company.bic ?? "",
      bankAccount: company.bankAccount ?? "",
      postbankAccount: company.postbankAccount ?? "",
      purchaseOrgCompanyUuid: company.purchaseOrgCompanyUuid ?? "",
      memberNumberPurchaseOrg: company.memberNumberPurchaseOrg ?? "",
      calculateVat: company.calculateVat ?? true,
      reminder: company.reminder ?? true,
      collectInvoicesInMandate: company.collectInvoicesInMandate ?? false,
      insuranceValidUntil: toDateInput(company.insuranceValidUntil),
      creditLimitInsurance: company.creditLimitInsurance ?? "",
      creditLimit: company.creditLimit ?? "",
      creditLimitUninsured: company.creditLimitUninsured ?? "",
      creditLimitUninsuredDate: toDateInput(company.creditLimitUninsuredDate),
      paymentTerms: company.paymentTerms ?? "",
      differentPaymentTermsExWorks: company.differentPaymentTermsExWorks ?? "",
      journalCode: company.journalCode ?? undefined,
      vatNumber: company.vatNumber ?? "",
      cocNumber: company.cocNumber ?? "",
      currency: company.currency ?? "",
      isBlocked: company.blockedByUserId != null,
      blockedByNote: company.blockedByNote ?? "",
    },
  });

  const debtorCompanyOptions = [
    { value: "", label: "Empty" },
    ...debtorCompanies.map((c) => ({ value: c.uuid, label: c.companyName })),
  ];

  const purchaseOrgOptions = [
    { value: "", label: "Empty" },
    ...purchaseOrgCompanies.map((c) => ({
      value: c.uuid,
      label: c.companyName,
    })),
  ];

  const paymentTermOptions = [
    { value: "", label: "Empty" },
    ...invoicePaymentTerms.map((t) => ({
      value: t,
      label: INVOICE_PAYMENT_TERM_LABELS[t],
    })),
  ];

  const currencyOptions = [
    { value: "", label: "Empty" },
    ...currencies.map((c) => ({ value: c, label: CURRENCY_LABELS[c] })),
  ];

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, companyUuid: company.uuid });
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormError>{state.error}</FormError>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
          Debtor
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* The ledger account number — not the company code. */}
          <div className="space-y-2">
            <FormLabel htmlFor="debtorNumber">Debtor number</FormLabel>
            <Input
              id="debtorNumber"
              maxLength={20}
              {...register("debtorNumber")}
              disabled={isPending}
            />
            <FormFieldError message={errors.debtorNumber?.message} />
          </div>

          <FormSelectField
            control={control}
            name="debtorCompanyUuid"
            id="debtorCompanyUuid"
            label="Debtor company"
            options={debtorCompanyOptions}
            disabled={isPending}
          />

          {isCustomerOrProspect && (
            <>
              <FormSelectField
                control={control}
                name="purchaseOrgCompanyUuid"
                id="purchaseOrgCompanyUuid"
                label="Purchase org."
                options={purchaseOrgOptions}
                disabled={isPending}
              />

              <div className="space-y-2">
                <FormLabel htmlFor="memberNumberPurchaseOrg">
                  Mem. no. Pur. Org.
                </FormLabel>
                <Input
                  id="memberNumberPurchaseOrg"
                  {...register("memberNumberPurchaseOrg")}
                  disabled={isPending}
                />
                <FormFieldError
                  message={errors.memberNumberPurchaseOrg?.message}
                />
              </div>
            </>
          )}

          <FormSelectField
            control={control}
            name="paymentTerms"
            id="paymentTerms"
            label="Payment terms"
            options={paymentTermOptions}
            disabled={isPending}
          />

          <FormSelectField
            control={control}
            name="differentPaymentTermsExWorks"
            id="differentPaymentTermsExWorks"
            label="Different payment terms ex works"
            options={paymentTermOptions}
            disabled={isPending}
          />

          <FormSelectField
            control={control}
            name="currency"
            id="currency"
            label="Currency"
            options={currencyOptions}
            disabled={isPending}
          />

          <div className="space-y-2">
            <FormLabel htmlFor="iban">IBAN</FormLabel>
            <Input id="iban" {...register("iban")} disabled={isPending} />
            <FormFieldError message={errors.iban?.message} />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="bic">BIC</FormLabel>
            <Input id="bic" {...register("bic")} disabled={isPending} />
            <FormFieldError message={errors.bic?.message} />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="bankAccount">Bank account</FormLabel>
            <Input
              id="bankAccount"
              {...register("bankAccount")}
              disabled={isPending}
            />
            <FormFieldError message={errors.bankAccount?.message} />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="postbankAccount">Postbank account</FormLabel>
            <Input
              id="postbankAccount"
              {...register("postbankAccount")}
              disabled={isPending}
            />
            <FormFieldError message={errors.postbankAccount?.message} />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="vatNumber">VAT number</FormLabel>
            <Input
              id="vatNumber"
              {...register("vatNumber")}
              disabled={isPending}
            />
            <FormFieldError message={errors.vatNumber?.message} />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="cocNumber">COC number</FormLabel>
            <Input
              id="cocNumber"
              {...register("cocNumber")}
              disabled={isPending}
            />
            <FormFieldError message={errors.cocNumber?.message} />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="journalCode">Journal code</FormLabel>
            {/* Set by the ledger, not typed: greyed on the creditor and debtor
                panels of every company opened in the reference (7-10-2026). */}
            <Input
              id="journalCode"
              type="number"
              readOnly
              className="bg-muted text-muted-foreground"
              {...register("journalCode", { valueAsNumber: true })}
            />
            <FormFieldError message={errors.journalCode?.message} />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="creditLimit">Credit limit</FormLabel>
            <Input
              id="creditLimit"
              type="number"
              step="0.01"
              {...register("creditLimit")}
              disabled={isPending}
            />
            <FormFieldError message={errors.creditLimit?.message} />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="creditLimitInsurance">
              Credit limit insurance
            </FormLabel>
            <Input
              id="creditLimitInsurance"
              maxLength={50}
              placeholder="Policy number"
              {...register("creditLimitInsurance")}
              disabled={isPending}
            />
            <FormFieldError message={errors.creditLimitInsurance?.message} />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="creditLimitUninsured">
              Credit limit uninsured
            </FormLabel>
            <Input
              id="creditLimitUninsured"
              type="number"
              step="0.01"
              {...register("creditLimitUninsured")}
              disabled={isPending}
            />
            <FormFieldError message={errors.creditLimitUninsured?.message} />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="insuranceValidUntil">
              Insurance valid until
            </FormLabel>
            <Controller
              name="insuranceValidUntil"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="insuranceValidUntil"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
            <FormFieldError message={errors.insuranceValidUntil?.message} />
          </div>

          <div className="space-y-2">
            <FormLabel htmlFor="creditLimitUninsuredDate">
              Credit limit uninsured date
            </FormLabel>
            <Controller
              name="creditLimitUninsuredDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  id="creditLimitUninsuredDate"
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              )}
            />
            <FormFieldError
              message={errors.creditLimitUninsuredDate?.message}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={watch("calculateVat")}
              onChange={() =>
                setValue("calculateVat", !getValues("calculateVat"))
              }
              disabled={isPending}
            />
            Calculate VAT
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={watch("reminder")}
              onChange={() => setValue("reminder", !getValues("reminder"))}
              disabled={isPending}
            />
            Reminder
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={watch("collectInvoicesInMandate")}
              onChange={() =>
                setValue(
                  "collectInvoicesInMandate",
                  !getValues("collectInvoicesInMandate"),
                )
              }
              disabled={isPending}
            />
            Collect invoices in mandate
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={watch("isBlocked")}
              onChange={() => setValue("isBlocked", !getValues("isBlocked"))}
              disabled={isPending}
            />
            {watch("isBlocked") && currentUserName
              ? `Blocked by ${currentUserName}`
              : "Blocked by"}
          </label>
        </div>

        {watch("isBlocked") && (
          <div className="space-y-2">
            <FormLabel htmlFor="blockedByNote">Blocked by note</FormLabel>
            <Input
              id="blockedByNote"
              {...register("blockedByNote")}
              disabled={isPending}
            />
            <FormFieldError message={errors.blockedByNote?.message} />
          </div>
        )}
      </section>

      <div className="flex gap-3 pb-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Link
          href={`/companies/${company.uuid}/edit`}
          className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm text-foreground transition-colors hover:bg-muted/40"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
};
