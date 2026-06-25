"use client";

import type { CompanyOption } from "@/app/(dashboard)/companies/actions";
import type { ContractGroupOption } from "@/app/(dashboard)/contract-groups/actions";
import type { ContractCompanyEntry } from "@/app/(dashboard)/contracts/actions";
import { useContractSubmit } from "@/app/(dashboard)/contracts/use-contract-submit";
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
  contractableRoles,
  contractDiscountBasedOnTypes,
  contractSurchargePerTypes,
  contractTierUnits,
  contractTypes,
  type ContractableRole,
} from "@/lib/enums";
import { pluralize } from "@/lib/helpers";
import {
  COMMON_TEXT,
  CONTRACT_DISCOUNT_BASED_ON_LABELS,
  CONTRACT_SURCHARGE_PER_TYPE_LABELS,
  CONTRACT_TIER_UNIT_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACTABLE_ROLE_LABELS,
} from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

type ContractFormProps = {
  groups: ContractGroupOption[];
  availableCompanies: CompanyOption[];
};

const companyLinkSchema = z.object({
  companyUuid: z.string().min(1, "Company is required"),
  startingDate: z.string().optional(),
  endDate: z.string().optional(),
});
type CompanyLinkFormValues = z.infer<typeof companyLinkSchema>;

const contractableRoleSet = new Set(contractableRoles as readonly string[]);

const getContractableRole = (company: CompanyOption): ContractableRole | null =>
  (company.roles.find((r) => contractableRoleSet.has(r)) as ContractableRole) ??
  null;

export const ContractForm = ({
  groups,
  availableCompanies,
}: ContractFormProps) => {
  const router = useRouter();
  const [companies, setCompanies] = useState<ContractCompanyEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { form, isPending, onSubmit, state } = useContractSubmit(companies);
  const {
    register,
    watch,
    setValue,
    control,
    formState: { errors },
  } = form;

  const contractType = watch("contractType");
  const hasPriceDate = watch("hasPriceDate");
  const grossPrice = watch("grossPrice");
  const colorSurcharge = watch("colorSurcharge");
  const extraDiscount = watch("extraDiscount");
  const quantitySurcharge = watch("quantitySurcharge");
  const qsTierUnit = watch("quantitySurchargeTierUnit");
  const qsPerType = watch("quantitySurchargePerType");
  const lineDiscount = watch("lineDiscount");
  const ldTierUnit = watch("lineDiscountTierUnit");
  const groupDiscount = watch("groupDiscount");
  const gdTierUnit = watch("groupDiscountTierUnit");
  const gdBasedOn = watch("groupDiscountBasedOn");

  const { fields: qsTiers, append: appendQsTier, remove: removeQsTier } = useFieldArray({ control, name: "quantitySurchargeTiers" });
  const { fields: ldTiers, append: appendLdTier, remove: removeLdTier } = useFieldArray({ control, name: "lineDiscountTiers" });
  const { fields: gdTiers, append: appendGdTier, remove: removeGdTier } = useFieldArray({ control, name: "groupDiscountTiers" });

  const tierUnitOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...contractTierUnits.map((u) => ({ value: u, label: CONTRACT_TIER_UNIT_LABELS[u] })),
  ];

  useEffect(() => {
    if (state.success) {
      router.push("/contracts");
    }
  }, [router, state.success]);

  // Only companies that carry at least one contractable role
  const contractableCompanies = availableCompanies.filter((c) =>
    c.roles.some((r) => contractableRoleSet.has(r)),
  );

  const groupOptions = [
    { value: "", label: COMMON_TEXT.emptyOption },
    ...groups.map((g) => ({ value: g.uuid, label: g.name })),
  ];

  const companyOptions = [
    { value: "", label: COMMON_TEXT.selectPlaceholder },
    ...contractableCompanies.map((c) => ({
      value: c.uuid,
      label: [c.searchCode1, c.companyName].filter(Boolean).join(" — "),
    })),
  ];

  const linkForm = useForm<CompanyLinkFormValues>({
    resolver: zodResolver(companyLinkSchema),
    defaultValues: {
      companyUuid: "",
      startingDate: "",
      endDate: "",
    },
  });

  const watchedCompanyUuid = linkForm.watch("companyUuid");
  const selectedCompany = contractableCompanies.find(
    (c) => c.uuid === watchedCompanyUuid,
  );
  const autoRole = selectedCompany
    ? getContractableRole(selectedCompany)
    : null;

  const openDialog = () => {
    linkForm.reset();
    setIsDialogOpen(true);
  };

  const handleSaveCompanyLink = linkForm.handleSubmit((values) => {
    const company = contractableCompanies.find(
      (c) => c.uuid === values.companyUuid,
    );
    const role = company ? getContractableRole(company) : null;
    const entry: ContractCompanyEntry = {
      companyUuid: values.companyUuid,
      role,
      startingDate: values.startingDate || null,
      endDate: values.endDate || null,
    };
    setCompanies((prev) => [...prev, entry]);
    setIsDialogOpen(false);
  });

  const removeCompany = (index: number) => {
    setCompanies((prev) => prev.filter((_, i) => i !== index));
  };

  const getCompanyLabel = (uuid: string) => {
    const c = availableCompanies.find((c) => c.uuid === uuid);
    if (!c) return uuid;
    return [c.searchCode1, c.companyName].filter(Boolean).join(" — ");
  };

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-8">
        <div className="grid gap-8 lg:grid-cols-[200px_1fr_200px_200px]">
          <section className="space-y-3">
            <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
              Contract Type
            </h2>
            <div className="space-y-2">
              {contractTypes.map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2.5"
                >
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
                <FormLabel htmlFor="code" required>
                  Code
                </FormLabel>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="code"
                      placeholder="e.g. BB"
                      value={field.value}
                      aria-invalid={!!errors.code}
                      disabled={isPending}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <FormFieldError message={errors.code?.message} />
              </div>

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
                <FormLabel htmlFor="contractGroupUuid" required>
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
                <FormFieldError message={errors.contractGroupUuid?.message} />
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
                <label
                  htmlFor="linkToNewCustomer"
                  className="text-sm font-medium text-gray-700"
                >
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
                <FormLabel htmlFor="searchCode1">Search Code</FormLabel>
                <Input
                  id="searchCode1"
                  {...register("searchCode1")}
                  disabled={isPending}
                />
              </div>
              <div>
                <FormLabel htmlFor="searchCode2">Search Code</FormLabel>
                <Input
                  id="searchCode2"
                  {...register("searchCode2")}
                  disabled={isPending}
                />
              </div>
              <div>
                <FormLabel htmlFor="searchCode3">Search Code</FormLabel>
                <Input
                  id="searchCode3"
                  {...register("searchCode3")}
                  disabled={isPending}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
              Website
            </h2>
            <div className="space-y-3">
              <div>
                <FormLabel htmlFor="websiteSorting">Website Sorting</FormLabel>
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
                <label
                  htmlFor="hideOnWebsite"
                  className="text-sm font-medium text-gray-700"
                >
                  Hide on Website
                </label>
              </div>
            </div>
          </section>
        </div>

        {/* Companies section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
              Companies{" "}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {companies.length}{" "}
                {pluralize(companies.length, "company", "companies")}
              </span>
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openDialog}
              disabled={isPending}
            >
              <Plus className="mr-1.5 size-4" />
              Add Company
            </Button>
          </div>

          {companies.length > 0 && (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Starting Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {getCompanyLabel(entry.companyUuid)}
                      </TableCell>
                      <TableCell>
                        {entry.role ? (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {CONTRACTABLE_ROLE_LABELS[entry.role]}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>{entry.startingDate ?? "N/A"}</TableCell>
                      <TableCell>{entry.endDate ?? "N/A"}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => removeCompany(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {/* Details section */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Details
          </h2>
          <div className="grid gap-6 lg:grid-cols-2">

            {/* Left: Gross prices, Color surcharge, Extra discount */}
            <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-sm font-semibold text-gray-700">Gross Prices</h3>

              {/* Gross price */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="grossPrice"
                    {...register("grossPrice")}
                    className="size-4 accent-primary"
                    disabled={isPending}
                  />
                  <label htmlFor="grossPrice" className="text-sm font-medium text-gray-700">
                    Gross price
                  </label>
                </div>
                {grossPrice && (
                  <div className="ml-6 flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register("grossPriceValue")}
                      className="w-32"
                      disabled={isPending}
                    />
                    <span className="text-sm text-muted-foreground">TN</span>
                  </div>
                )}
              </div>

              {/* Color surcharge */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="colorSurcharge"
                    {...register("colorSurcharge")}
                    className="size-4 accent-primary"
                    disabled={isPending}
                  />
                  <label htmlFor="colorSurcharge" className="text-sm font-medium text-gray-700">
                    Color surcharge
                  </label>
                </div>
                {colorSurcharge && (
                  <div className="ml-6 flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...register("colorSurchargeValue")}
                      className="w-32"
                      disabled={isPending}
                    />
                    <Input
                      placeholder="%"
                      {...register("colorSurchargeUnit")}
                      className="w-16"
                      disabled={isPending}
                    />
                  </div>
                )}
              </div>

              {/* Extra discount */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="extraDiscount"
                    {...register("extraDiscount")}
                    className="size-4 accent-primary"
                    disabled={isPending}
                  />
                  <label htmlFor="extraDiscount" className="text-sm font-medium text-gray-700">
                    Extra discount
                  </label>
                </div>
                {extraDiscount && (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-20 shrink-0 text-sm text-gray-600">Discount</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...register("extraDiscountValue")}
                        className="w-28"
                        disabled={isPending}
                      />
                      <Input
                        placeholder="%"
                        {...register("extraDiscountUnit")}
                        className="w-16"
                        disabled={isPending}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-20 shrink-0 text-sm text-gray-600">From</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        {...register("extraDiscountFromValue")}
                        className="w-28"
                        disabled={isPending}
                      />
                      <Input
                        placeholder="TN"
                        {...register("extraDiscountFromUnit")}
                        className="w-16"
                        disabled={isPending}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Quantity surcharge, Line discount, Group discount */}
            <div className="space-y-4">

              {/* Quantity surcharge */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="quantitySurcharge"
                    {...register("quantitySurcharge")}
                    className="size-4 accent-primary"
                    disabled={isPending}
                  />
                  <label htmlFor="quantitySurcharge" className="text-sm font-semibold text-gray-700">
                    Quantity Surcharge
                  </label>
                </div>
                {quantitySurcharge && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FormLabel>Tier unit</FormLabel>
                        <Controller
                          name="quantitySurchargeTierUnit"
                          control={control}
                          render={({ field }) => (
                            <Select
                              options={tierUnitOptions}
                              value={field.value ?? ""}
                              onValueChange={(v) => field.onChange(v || undefined)}
                              disabled={isPending}
                            />
                          )}
                        />
                      </div>
                      <div>
                        <FormLabel>Discount unit</FormLabel>
                        <Input
                          placeholder="%"
                          {...register("quantitySurchargeDiscountUnit")}
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 grid grid-cols-[1fr_1fr_32px] gap-1 text-xs font-medium text-gray-500">
                        <span>From {qsTierUnit ?? "TN"}</span>
                        <span>%</span>
                        <span />
                      </div>
                      {qsTiers.map((tier, i) => (
                        <div key={tier.id} className="mb-1 grid grid-cols-[1fr_1fr_32px] items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`quantitySurchargeTiers.${i}.from`, { valueAsNumber: true })}
                            className="h-8 text-sm"
                            disabled={isPending}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`quantitySurchargeTiers.${i}.percentage`, { valueAsNumber: true })}
                            className="h-8 text-sm"
                            disabled={isPending}
                          />
                          <button
                            type="button"
                            onClick={() => removeQsTier(i)}
                            className="flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
                            disabled={isPending}
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendQsTier({ from: 0, percentage: 0 })}
                        disabled={isPending}
                        className="mt-1 h-7 text-xs"
                      >
                        <Plus className="mr-1 size-3" /> Add row
                      </Button>
                    </div>

                    <div>
                      <FormLabel>Toeslag per</FormLabel>
                      <div className="mt-1 space-y-1">
                        {contractSurchargePerTypes.map((type) => (
                          <label key={type} className="flex cursor-pointer items-center gap-2">
                            <input
                              type="radio"
                              className="size-4 accent-primary"
                              checked={qsPerType === type}
                              onChange={() => setValue("quantitySurchargePerType", type)}
                              disabled={isPending}
                            />
                            <span className="text-sm text-gray-700">
                              {CONTRACT_SURCHARGE_PER_TYPE_LABELS[type]}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Line discount */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="lineDiscount"
                    {...register("lineDiscount")}
                    className="size-4 accent-primary"
                    disabled={isPending}
                  />
                  <label htmlFor="lineDiscount" className="text-sm font-semibold text-gray-700">
                    Line Discount
                  </label>
                </div>
                {lineDiscount && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FormLabel>Tier unit</FormLabel>
                        <Controller
                          name="lineDiscountTierUnit"
                          control={control}
                          render={({ field }) => (
                            <Select
                              options={tierUnitOptions}
                              value={field.value ?? ""}
                              onValueChange={(v) => field.onChange(v || undefined)}
                              disabled={isPending}
                            />
                          )}
                        />
                      </div>
                      <div>
                        <FormLabel>Discount unit</FormLabel>
                        <Input
                          placeholder="%"
                          {...register("lineDiscountDiscountUnit")}
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 grid grid-cols-[1fr_1fr_32px] gap-1 text-xs font-medium text-gray-500">
                        <span>From {ldTierUnit === "Euro" ? "€" : ldTierUnit ?? "TN"}</span>
                        <span>%</span>
                        <span />
                      </div>
                      {ldTiers.map((tier, i) => (
                        <div key={tier.id} className="mb-1 grid grid-cols-[1fr_1fr_32px] items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`lineDiscountTiers.${i}.from`, { valueAsNumber: true })}
                            className="h-8 text-sm"
                            disabled={isPending}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`lineDiscountTiers.${i}.percentage`, { valueAsNumber: true })}
                            className="h-8 text-sm"
                            disabled={isPending}
                          />
                          <button
                            type="button"
                            onClick={() => removeLdTier(i)}
                            className="flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
                            disabled={isPending}
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendLdTier({ from: 0, percentage: 0 })}
                        disabled={isPending}
                        className="mt-1 h-7 text-xs"
                      >
                        <Plus className="mr-1 size-3" /> Add row
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Group discount */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="groupDiscount"
                    {...register("groupDiscount")}
                    className="size-4 accent-primary"
                    disabled={isPending}
                  />
                  <label htmlFor="groupDiscount" className="text-sm font-semibold text-gray-700">
                    Group Discount
                  </label>
                </div>
                {groupDiscount && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FormLabel>Tier unit</FormLabel>
                        <Controller
                          name="groupDiscountTierUnit"
                          control={control}
                          render={({ field }) => (
                            <Select
                              options={tierUnitOptions}
                              value={field.value ?? ""}
                              onValueChange={(v) => field.onChange(v || undefined)}
                              disabled={isPending}
                            />
                          )}
                        />
                      </div>
                      <div>
                        <FormLabel>Discount unit</FormLabel>
                        <Input
                          placeholder="%"
                          {...register("groupDiscountDiscountUnit")}
                          disabled={isPending}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-1 grid grid-cols-[1fr_1fr_32px] gap-1 text-xs font-medium text-gray-500">
                        <span>From {gdTierUnit === "Euro" ? "€" : gdTierUnit ?? "TN"}</span>
                        <span>%</span>
                        <span />
                      </div>
                      {gdTiers.map((tier, i) => (
                        <div key={tier.id} className="mb-1 grid grid-cols-[1fr_1fr_32px] items-center gap-1">
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`groupDiscountTiers.${i}.from`, { valueAsNumber: true })}
                            className="h-8 text-sm"
                            disabled={isPending}
                          />
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`groupDiscountTiers.${i}.percentage`, { valueAsNumber: true })}
                            className="h-8 text-sm"
                            disabled={isPending}
                          />
                          <button
                            type="button"
                            onClick={() => removeGdTier(i)}
                            className="flex size-8 items-center justify-center text-muted-foreground hover:text-destructive"
                            disabled={isPending}
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendGdTier({ from: 0, percentage: 0 })}
                        disabled={isPending}
                        className="mt-1 h-7 text-xs"
                      >
                        <Plus className="mr-1 size-3" /> Add row
                      </Button>
                    </div>

                    <div>
                      <FormLabel>Korting o.b.v.</FormLabel>
                      <div className="mt-1 space-y-1">
                        {contractDiscountBasedOnTypes.map((type) => (
                          <label key={type} className="flex cursor-pointer items-center gap-2">
                            <input
                              type="radio"
                              className="size-4 accent-primary"
                              checked={gdBasedOn === type}
                              onChange={() => setValue("groupDiscountBasedOn", type)}
                              disabled={isPending}
                            />
                            <span className="text-sm text-gray-700">
                              {CONTRACT_DISCOUNT_BASED_ON_LABELS[type]}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

        <FormError>{state.error}</FormError>

        <FormActions
          isPending={isPending}
          onCancel={() => router.push("/contracts")}
          submitLabel="Create Contract"
        />
      </form>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Company</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCompanyLink}>
            <DialogBody className="space-y-4">
              <div>
                <FormLabel htmlFor="linkCompanyUuid" required>
                  Company
                </FormLabel>
                <Controller
                  name="companyUuid"
                  control={linkForm.control}
                  render={({ field }) => (
                    <Select
                      id="linkCompanyUuid"
                      options={companyOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder={COMMON_TEXT.selectPlaceholder}
                    />
                  )}
                />
                <FormFieldError
                  message={linkForm.formState.errors.companyUuid?.message}
                />
                {autoRole && (
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Role:</span>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {CONTRACTABLE_ROLE_LABELS[autoRole]}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormLabel>Starting Date</FormLabel>
                  <Controller
                    name="startingDate"
                    control={linkForm.control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
                <div>
                  <FormLabel>End Date</FormLabel>
                  <Controller
                    name="endDate"
                    control={linkForm.control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {COMMON_TEXT.cancel}
              </Button>
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
