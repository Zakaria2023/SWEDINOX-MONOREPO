"use client";

import { CompanyFormValues } from "@/app/(dashboard)/companies/validation";
import { CompanyRole } from "@/lib/enums";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { useFormContext } from "react-hook-form";

type Props = {
  isPending: boolean;
  selectedRoles: CompanyRole[];
  debtorCompanyOptions: { value: string; label: string }[];
  purchaseOrgOptions: { value: string; label: string }[];
  paymentTermOptions: { value: string; label: string }[];
  currencyOptions: { value: string; label: string }[];
  currentUserName: string | false | undefined;
};

export const DebtorSection = ({
  isPending,
  selectedRoles,
  debtorCompanyOptions,
  purchaseOrgOptions,
  paymentTermOptions,
  currencyOptions,
  currentUserName,
}: Props) => {
  const {
    control,
    register,
    formState: { errors },
    watch,
    setValue,
    getValues,
  } = useFormContext<CompanyFormValues>();

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
        Debtor
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormSelectField
          control={control}
          name="debtorCompanyUuid"
          id="debtorCompanyUuid"
          label="Debtor number"
          options={debtorCompanyOptions}
          disabled={isPending}
        />

        {(selectedRoles.includes("customer") ||
          selectedRoles.includes("prospect")) && (
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
          <Input
            id="journalCode"
            type="number"
            {...register("journalCode", { valueAsNumber: true })}
            disabled={isPending}
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
            type="number"
            step="0.01"
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
          <Input
            id="insuranceValidUntil"
            type="date"
            {...register("insuranceValidUntil")}
            disabled={isPending}
          />
          <FormFieldError message={errors.insuranceValidUntil?.message} />
        </div>

        <div className="space-y-2">
          <FormLabel htmlFor="creditLimitUninsuredDate">
            Credit limit uninsured date
          </FormLabel>
          <Input
            id="creditLimitUninsuredDate"
            type="date"
            {...register("creditLimitUninsuredDate")}
            disabled={isPending}
          />
          <FormFieldError message={errors.creditLimitUninsuredDate?.message} />
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
          {watch("isBlocked") ? `Blocked by ${currentUserName}` : "Blocked by"}
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
  );
};
