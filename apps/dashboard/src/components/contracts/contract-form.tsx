"use client";

import { useEffect } from "react";
import { Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { type ContractGroupOption } from "@/app/(dashboard)/contracts/actions";
import { useContractSubmit } from "@/app/(dashboard)/contracts/use-contract-submit";
import { contractTypes } from "@/lib/enums";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { COMMON_TEXT, CONTRACT_TYPE_LABELS } from "@/lib/labels";

type ContractFormProps = {
  groups: ContractGroupOption[];
};

export const ContractForm = ({ groups }: ContractFormProps) => {
  const router = useRouter();
  const { form, isPending, onSubmit, state } = useContractSubmit();
  const { register, watch, setValue, control, formState: { errors } } = form;

  const contractType = watch("contractType");
  const hasPriceDate = watch("hasPriceDate");

  useEffect(() => {
    if (state.success) {
      router.push("/contracts");
    }
  }, [router, state.success]);

  const groupOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...groups.map((group) => ({ value: group.uuid, label: group.name })),
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-[200px_1fr_200px_200px]">
        <section className="space-y-3">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Contract Type
          </h2>
          <div className="space-y-2">
            {contractTypes.map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="radio"
                  className="size-4 accent-primary"
                  checked={contractType === type}
                  onChange={() => setValue("contractType", type)}
                  disabled={isPending}
                />
                <span className="text-sm text-gray-700">
                  {CONTRACT_TYPE_LABELS[type]}
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Contract
          </h2>
          <div className="grid gap-4">
            <div>
              <FormLabel htmlFor="description" required>
                Description
              </FormLabel>
              <Input
                id="description"
                {...register("description")}
                aria-invalid={!!errors.description}
                disabled={isPending}
              />
              <FormFieldError message={errors.description?.message} />
            </div>

            <div>
              <FormLabel htmlFor="contractGroupUuid">
                Contract Group
              </FormLabel>
              <Controller
                name="contractGroupUuid"
                control={control}
                render={({ field }) => (
                  <Select
                    id="contractGroupUuid"
                    options={groupOptions}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={COMMON_TEXT.emptyOption}
                    disabled={isPending}
                  />
                )}
              />
            </div>

            <div className="flex items-center gap-3">
              <label
                htmlFor="quicklyChangeOrder"
                className="shrink-0 text-sm font-medium text-gray-700"
              >
                Quickly Change Order
              </label>
              <Input
                id="quicklyChangeOrder"
                {...register("quicklyChangeOrder")}
                disabled={isPending}
                className="w-24"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hasPriceDate"
                {...register("hasPriceDate")}
                className="size-4 accent-primary"
                disabled={isPending}
              />
              <label
                htmlFor="hasPriceDate"
                className="shrink-0 text-sm font-medium text-gray-700"
              >
                Price Date
              </label>
              {hasPriceDate && (
                <Controller
                  name="priceDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={isPending}
                      className="w-44"
                    />
                  )}
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="linkToNewCustomer"
                {...register("linkToNewCustomer")}
                className="size-4 accent-primary"
                disabled={isPending}
              />
              <label htmlFor="linkToNewCustomer" className="text-sm font-medium text-gray-700">
                Link this contract to a new customer
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Search Codes
          </h2>
          <div className="space-y-3">
            <div>
              <FormLabel htmlFor="searchCode1">
                Search Code
              </FormLabel>
              <Input id="searchCode1" {...register("searchCode1")} disabled={isPending} />
            </div>
            <div>
              <FormLabel htmlFor="searchCode2">
                Search Code
              </FormLabel>
              <Input id="searchCode2" {...register("searchCode2")} disabled={isPending} />
            </div>
            <div>
              <FormLabel htmlFor="searchCode3">
                Search Code
              </FormLabel>
              <Input id="searchCode3" {...register("searchCode3")} disabled={isPending} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Website
          </h2>
          <div className="space-y-3">
            <div>
              <FormLabel htmlFor="websiteSorting">
                Website Sorting
              </FormLabel>
              <Input
                id="websiteSorting"
                type="number"
                min={0}
                {...register("websiteSorting")}
                disabled={isPending}
                className="w-24"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="hideOnWebsite"
                {...register("hideOnWebsite")}
                className="size-4 accent-primary"
                disabled={isPending}
              />
              <label htmlFor="hideOnWebsite" className="text-sm font-medium text-gray-700">
                Hide on Website
              </label>
            </div>
          </div>
        </section>
      </div>

      <FormError>{state.error}</FormError>

      <FormActions
        isPending={isPending}
        onCancel={() => router.push("/contracts")}
        submitLabel="Create Contract"
      />
    </form>
  );
};
