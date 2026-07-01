"use client";

import { Controller } from "react-hook-form";
import { useComplaintSubmit } from "@/app/(dashboard)/complaints/use-complaint-submit";
import { CompanyOption } from "@/app/(dashboard)/companies/actions";
import { ProductOption } from "@/app/(dashboard)/products/actions";
import { Input } from "@/components/shadcn/input";
import { Textarea } from "@/components/shadcn/textarea";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { Select } from "@/components/shadcn/select";

type Props = {
  companies: CompanyOption[];
  products: ProductOption[];
};

export const ComplaintForm = ({ companies, products }: Props) => {
  const {
    form,
    isPending,
    onSubmit,
    state,
    companyOptions,
    contactOptions,
    productOptions,
    complaintTypeOptions,
    complaintReportOptions,
    complaintCategoryOptions,
    isLoadingContacts,
    handleCompanyChange,
    handleCancel,
  } = useComplaintSubmit({ companies, products });

  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormError>{state.error}</FormError>

      {/* Company & Contact */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Company</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="companyUuid" required>
              Company
            </FormLabel>
            <Controller
              control={control}
              name="companyUuid"
              render={({ field }) => (
                <Select
                  id="companyUuid"
                  value={field.value || ""}
                  options={companyOptions}
                  onValueChange={handleCompanyChange}
                  invalid={!!errors.companyUuid}
                />
              )}
            />
            <FormFieldError message={errors.companyUuid?.message} />
          </div>

          <div>
            <FormLabel htmlFor="contactUuid">
              Contact
              {isLoadingContacts && (
                <span className="ml-2 text-xs text-muted-foreground">
                  Loading...
                </span>
              )}
            </FormLabel>
            <FormSelectField
              control={control}
              id="contactUuid"
              name="contactUuid"
              label=""
              options={contactOptions}
              emptyValue=""
              disabled={contactOptions.length <= 1}
            />
          </div>
        </div>

        {/* Read-only display fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Account Manager</FormLabel>
            <div className="flex h-8 items-center rounded-lg border border-input bg-input/50 px-2.5 text-sm text-muted-foreground">
              Hego
            </div>
          </div>
          <div>
            <FormLabel>Representative</FormLabel>
            <div className="flex h-8 items-center rounded-lg border border-input bg-input/50 px-2.5 text-sm text-muted-foreground">
              Hego
            </div>
          </div>
        </div>
      </section>

      {/* Complaint Details */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Complaint Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <FormSelectField
            control={control}
            id="complaintType"
            name="complaintType"
            label="Complaint Type"
            options={complaintTypeOptions}
            emptyValue=""
          />

          <FormSelectField
            control={control}
            id="report"
            name="report"
            label="Report"
            options={complaintReportOptions}
            emptyValue=""
          />

          <div>
            <FormLabel htmlFor="reportDate">Report Date</FormLabel>
            <Input id="reportDate" type="date" {...register("reportDate")} />
          </div>

          <FormSelectField
            control={control}
            id="category"
            name="category"
            label="Category"
            options={complaintCategoryOptions}
            emptyValue=""
          />
        </div>

        <div>
          <FormLabel htmlFor="description">Description</FormLabel>
          <Textarea
            id="description"
            rows={4}
            placeholder="Describe the complaint..."
            {...register("description")}
          />
        </div>
      </section>

      {/* Product & Quantities */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Product</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormSelectField
              control={control}
              id="productUuid"
              name="productUuid"
              label="Product"
              options={productOptions}
              emptyValue=""
            />
          </div>
          <div>
            <FormLabel htmlFor="qty">Qty</FormLabel>
            <Input id="qty" type="number" step="0.001" {...register("qty")} />
          </div>
          <div>
            <FormLabel htmlFor="amount">Amount (€)</FormLabel>
            <Input id="amount" type="number" step="0.01" {...register("amount")} />
          </div>
          <div>
            <FormLabel htmlFor="weight">Weight (kg)</FormLabel>
            <Input id="weight" type="number" step="0.001" {...register("weight")} />
          </div>
        </div>
      </section>

      <FormActions
        submitLabel="Create Complaint"
        pendingLabel="Creating..."
        isPending={isPending}
        onCancel={handleCancel}
      />
    </form>
  );
};
