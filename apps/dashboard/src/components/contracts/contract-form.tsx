"use client";

import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ContractGroupOption } from "@/app/(dashboard)/contract-groups/actions";
import { ContractCompanyEntry } from "@/app/(dashboard)/contracts/actions";
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
  ContractableRole,
  contractableRoles,
  contractTypes,
} from "@/lib/enums";
import { pluralize } from "@/lib/helpers";
import {
  COMMON_TEXT,
  CONTRACT_TYPE_LABELS,
  CONTRACTABLE_ROLE_LABELS,
} from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
