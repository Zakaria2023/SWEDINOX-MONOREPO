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
import { DocumentUploader } from "@/components/document-uploader";
import { WorkordersSection } from "./sections/workorders-section";
import { COMPLAINT_STATUS_LABELS } from "@/lib/labels";
import { DashboardUserOption } from "@/lib/server/clerk";
import { useUser } from "@clerk/nextjs";
import { X } from "lucide-react";

type Props = {
  companies: CompanyOption[];
  products: ProductOption[];
  responsibleUsers: DashboardUserOption[];
};

export const ComplaintForm = ({
  companies,
  products,
  responsibleUsers,
}: Props) => {
  const { user } = useUser();
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
    statusOptions,
    causeOptions,
    solutionOptions,
    responsibleOptions,
    isLoadingContacts,
    handleCompanyChange,
    handleCancel,
  } = useComplaintSubmit({ companies, products, responsibleUsers });

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const documents = watch("documents");
  const currentStatus = watch("status");
  const totalCosts =
    (Number(watch("costsCustomer")) || 0) +
    (Number(watch("internalCosts")) || 0) +
    (Number(watch("extraCosts")) || 0) +
    (Number(watch("toBeReclaimed")) || 0);

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
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register("amount")}
            />
          </div>
          <div>
            <FormLabel htmlFor="weight">Weight (kg)</FormLabel>
            <Input
              id="weight"
              type="number"
              step="0.001"
              {...register("weight")}
            />
          </div>
        </div>
      </section>

      {/* Handling */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Handling</h2>
        <div className="grid grid-cols-2 gap-4">
          <FormSelectField
            control={control}
            id="status"
            name="status"
            label="Status"
            options={statusOptions}
          />

          <FormSelectField
            control={control}
            id="responsibleUserId"
            name="responsibleUserId"
            label="Responsible"
            options={responsibleOptions}
            emptyValue=""
            required
          />

          <div>
            <FormLabel htmlFor="deadline">Deadline</FormLabel>
            <Input id="deadline" type="date" {...register("deadline")} />
          </div>
          <div />

          <FormSelectField
            control={control}
            id="cause"
            name="cause"
            label="Cause"
            options={causeOptions}
            emptyValue=""
          />

          <FormSelectField
            control={control}
            id="solution"
            name="solution"
            label="Solution"
            options={solutionOptions}
            emptyValue=""
          />

          <div>
            <FormLabel htmlFor="explanationOfCause">
              Explanation of cause
            </FormLabel>
            <Textarea
              id="explanationOfCause"
              rows={4}
              {...register("explanationOfCause")}
            />
          </div>

          <div>
            <FormLabel htmlFor="explanationOfSolution">
              Explanation of solution
            </FormLabel>
            <Textarea
              id="explanationOfSolution"
              rows={4}
              {...register("explanationOfSolution")}
            />
          </div>
        </div>

        {/* Costs */}
        <div className="space-y-3">
          <div className="grid grid-cols-[10rem_8rem_1fr] items-center gap-3">
            <FormLabel htmlFor="costsCustomer">Costs customer</FormLabel>
            <Input
              id="costsCustomer"
              type="number"
              step="0.01"
              {...register("costsCustomer")}
            />
            <Input
              placeholder="Description"
              {...register("costsCustomerNote")}
            />
          </div>
          <div className="grid grid-cols-[10rem_8rem_1fr] items-center gap-3">
            <FormLabel htmlFor="internalCosts">Internal costs</FormLabel>
            <Input
              id="internalCosts"
              type="number"
              step="0.01"
              {...register("internalCosts")}
            />
            <Input
              placeholder="Description"
              {...register("internalCostsNote")}
            />
          </div>
          <div className="grid grid-cols-[10rem_8rem_1fr] items-center gap-3">
            <FormLabel htmlFor="extraCosts">Extra costs</FormLabel>
            <Input
              id="extraCosts"
              type="number"
              step="0.01"
              {...register("extraCosts")}
            />
            <Input placeholder="Description" {...register("extraCostsNote")} />
          </div>
          <div className="grid grid-cols-[10rem_8rem_1fr] items-center gap-3">
            <FormLabel htmlFor="toBeReclaimed">To be reclaimed</FormLabel>
            <Input
              id="toBeReclaimed"
              type="number"
              step="0.01"
              {...register("toBeReclaimed")}
            />
            <Input
              placeholder="Description"
              {...register("toBeReclaimedNote")}
            />
          </div>
          <div className="grid grid-cols-[10rem_8rem_1fr] items-center gap-3">
            <span className="text-sm font-semibold">Total costs</span>
            <span className="text-sm font-semibold">
              € {totalCosts.toFixed(2)}
            </span>
          </div>
        </div>
      </section>

      {/* Status history */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Status history</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Status date</th>
                <th className="px-3 py-2 font-medium">Assigned by</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-3 py-2">
                  {COMPLAINT_STATUS_LABELS[currentStatus]}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {new Date().toLocaleString()}
                </td>
                <td className="px-3 py-2">{user?.fullName ?? ""}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Workorders */}
      <WorkordersSection />

      {/* Documents */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">Documents</h2>
        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-4">
          {documents.map((doc, index) => (
            <div key={doc.id} className="flex items-center gap-3 text-sm">
              <span className="flex-1">{doc.fileName}</span>
              <button
                type="button"
                onClick={async () => {
                  await fetch(`/api/documents/${doc.id}/delete`, {
                    method: "DELETE",
                  });
                  setValue(
                    "documents",
                    documents.filter((_, i) => i !== index),
                  );
                }}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          <DocumentUploader
            onSuccess={(uploads) =>
              setValue("documents", [
                ...documents,
                ...uploads.map((u) => ({
                  id: u.documentId,
                  fileName: u.fileName,
                })),
              ])
            }
          />
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
