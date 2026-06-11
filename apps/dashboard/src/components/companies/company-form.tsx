"use client";

import { useCompanySubmit } from "@/app/(dashboard)/companies/use-company-submit";
import {
  companySchema,
  type AddressFormValues,
  type CompanyFormValues,
} from "@/app/(dashboard)/companies/validation";
import { AddressForm } from "@/components/companies/address-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { FormActions } from "@/components/ui/form-actions";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { FormSelectField } from "@/components/ui/form-select-field";
import { FormError } from "../ui/form-error";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Plus, User, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { companyLangs, companyRoles } from "@/lib/enums";
import type { ContactInput } from "@/app/(dashboard)/companies/actions";
import { ContactDialog } from "./contact-dialog";

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  prospect: "Prospect",
  supplier: "Supplier",
  processor: "Processor",
  transporter: "Transporter",
  agent: "Agent",
  purchasing_org: "Purchasing org.",
  other: "Other",
  internal: "Internal",
};

const langOptions = [
  { value: "", label: "—" },
  ...companyLangs.map((l) => ({
    value: l,
    label: l.charAt(0).toUpperCase() + l.slice(1),
  })),
];

const DEFAULT_ADDRESS: CompanyFormValues["address"] = {
  category: [],
  poBox: false,
  needCrane: false,
  canopyRequired: false,
  bundleSeparately: false,
  addressComplete: false,
  specialTransport: false,
  altName: "",
  streetAndNo: "",
  postalCode: "",
  country: "",
  city: "",
  region: "",
  house: "",
  telephone: "",
  fax: "",
  email: "",
  website: "",
  billingAttention: "",
  billingAttentionAdditional: "",
  gln: "",
  peppolId: "",
  sequenceNumber: "",
  availableAt: "",
  unloadingStartTime: "",
  unloadingEndTime: "",
  maxLength: "",
  maxBundleWeight: "",
  loadingInstructions: "",
};

const addressLabel = (addr: { streetAndNo?: string; city?: string; altName?: string }) =>
  [addr.streetAndNo, addr.city].filter(Boolean).join(", ") || addr.altName || "Address";

export const CompanyForm = () => {
  const router = useRouter();
  const [isFirstAddressDialogOpen, setIsFirstAddressDialogOpen] = useState(false);
  const [isAdditionalAddressDialogOpen, setIsAdditionalAddressDialogOpen] = useState(false);
  const [additionalAddresses, setAdditionalAddresses] = useState<AddressFormValues[]>([]);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contacts, setContacts] = useState<ContactInput[]>([]);

  const { form, isPending, onSubmit, state } = useCompanySubmit();
  const { control, register, watch, setValue, trigger, formState: { errors } } = form;

  const additionalForm = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: "",
      correspName: "",
      remarks: "",
      lang: "",
      roles: [],
      searchCode1: "",
      searchCode2: "",
      searchCode3: "",
      address: { ...DEFAULT_ADDRESS, category: ["delivery"] },
    },
  });

  const addressValues = watch("address");
  const selectedRoles = watch("roles") ?? [];

  useEffect(() => {
    if (state.success) router.push("/companies");
  }, [state.success, router]);

  const hasFirstAddress = !!(
    addressValues.streetAndNo ||
    addressValues.city ||
    addressValues.altName ||
    addressValues.postalCode
  );

  const handleSaveFirstAddress = async () => {
    const isValid = await trigger("address");
    if (isValid) setIsFirstAddressDialogOpen(false);
  };

  const handleSaveAdditionalAddress = async () => {
    const isValid = await additionalForm.trigger("address");
    if (!isValid) return;
    const values = additionalForm.getValues("address");
    setAdditionalAddresses((prev) => [...prev, values]);
    additionalForm.reset({
      companyName: "", correspName: "", remarks: "", lang: "", roles: [],
      searchCode1: "", searchCode2: "", searchCode3: "",
      address: { ...DEFAULT_ADDRESS, category: ["delivery"] },
    });
    setIsAdditionalAddressDialogOpen(false);
  };

  const removeAdditionalAddress = (index: number) =>
    setAdditionalAddresses((prev) => prev.filter((_, i) => i !== index));

  const toggleRole = (role: string) => {
    const current = selectedRoles;
    setValue(
      "roles",
      current.includes(role as never)
        ? current.filter((r) => r !== role)
        : [...current, role as never],
    );
  };

  return (
    <>
      <form onSubmit={onSubmit(additionalAddresses, contacts)} className="space-y-8">

        {/* ── Company Details ───────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">Company Details</h2>
          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-4">

            {/* Name / Lang / Corresp — 3 cols on lg */}
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <FormLabel htmlFor="companyName" required>Company Name</FormLabel>
                <Input
                  id="companyName"
                  {...register("companyName")}
                  aria-invalid={!!errors.companyName}
                  placeholder="Enter the company name"
                  disabled={isPending}
                />
                <FormFieldError message={errors.companyName?.message} />
              </div>

              <FormSelectField
                control={control}
                id="lang"
                name="lang"
                label="Language"
                options={langOptions}
                emptyValue=""
                disabled={isPending}
              />

              <div>
                <FormLabel htmlFor="correspName">Corresp. Name</FormLabel>
                <Input id="correspName" {...register("correspName")} disabled={isPending} />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <FormLabel htmlFor="remarks">Remarks</FormLabel>
              <textarea
                id="remarks"
                {...register("remarks")}
                rows={3}
                className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                placeholder="Any additional remarks..."
                disabled={isPending}
              />
            </div>

            {/* ── Addresses ── */}
            <div className="space-y-2">
              {/* First address */}
              {hasFirstAddress ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">{addressLabel(addressValues)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFirstAddressDialogOpen(true)}
                    className="shrink-0 text-xs text-primary hover:underline"
                    disabled={isPending}
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFirstAddressDialogOpen(true)}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  disabled={isPending}
                >
                  <Plus className="size-4" />
                  Add Address
                </button>
              )}

              {/* Additional delivery addresses */}
              {additionalAddresses.map((addr, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">{addressLabel(addr)}</span>
                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      Delivery
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAdditionalAddress(index)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Remove address</span>
                  </button>
                </div>
              ))}

              {/* Add delivery address — only after first address is set */}
              {hasFirstAddress && (
                <button
                  type="button"
                  onClick={() => setIsAdditionalAddressDialogOpen(true)}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  disabled={isPending}
                >
                  <Plus className="size-4" />
                  Add Delivery Address
                </button>
              )}
            </div>

            {/* ── Contacts ── */}
            <div className="space-y-2">
              {contacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <User className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{contact.fullName}</span>
                    {contact.email && (
                      <span className="truncate text-muted-foreground">{contact.email}</span>
                    )}
                    {contact.telephone && (
                      <span className="shrink-0 text-muted-foreground">{contact.telephone}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setContacts((prev) => prev.filter((_, i) => i !== index))}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Remove contact</span>
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setIsContactDialogOpen(true)}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                disabled={isPending}
              >
                <Plus className="size-4" />
                Add Contact
              </button>
            </div>
          </div>
        </section>

        {/* ── Roles ─────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">Roles</h2>
          <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
            {companyRoles.map((role) => (
              <label
                key={role}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <input
                  type="checkbox"
                  className="size-4 rounded border-border accent-primary"
                  checked={selectedRoles.includes(role as never)}
                  onChange={() => toggleRole(role)}
                  disabled={isPending}
                />
                <span className="text-sm font-medium text-gray-700">{ROLE_LABELS[role]}</span>
              </label>
            ))}
          </div>
        </section>

        {/* ── Search Codes ──────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">Search Codes</h2>
          <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4 sm:grid-cols-3">
            <div>
              <FormLabel htmlFor="searchCode1">Search code</FormLabel>
              <Input id="searchCode1" {...register("searchCode1")} disabled={isPending} />
            </div>
            <div>
              <FormLabel htmlFor="searchCode2">Search code</FormLabel>
              <Input id="searchCode2" {...register("searchCode2")} disabled={isPending} />
            </div>
            <div>
              <FormLabel htmlFor="searchCode3">Search code</FormLabel>
              <Input id="searchCode3" {...register("searchCode3")} disabled={isPending} />
            </div>
          </div>
        </section>

        <FormError>{state.error}</FormError>

        <FormActions
          isPending={isPending}
          onCancel={() => router.push("/companies")}
          submitLabel="Create Company"
        />
      </form>

      {/* First address dialog */}
      <Dialog open={isFirstAddressDialogOpen} onOpenChange={setIsFirstAddressDialogOpen}>
        <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-4" />
              Address
            </DialogTitle>
            <DialogDescription>Fill in the address details for this company.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <AddressForm control={control} errors={errors.address} register={register} watch={watch} />
          </div>
          <div className="shrink-0 border-t bg-background px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsFirstAddressDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveFirstAddress}>Save Address</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Additional delivery address dialog */}
      <Dialog
        open={isAdditionalAddressDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            additionalForm.reset({
              companyName: "", correspName: "", remarks: "", lang: "", roles: [],
              searchCode1: "", searchCode2: "", searchCode3: "",
              address: { ...DEFAULT_ADDRESS, category: ["delivery"] },
            });
          }
          setIsAdditionalAddressDialogOpen(open);
        }}
      >
        <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-4" />
              Delivery Address
            </DialogTitle>
            <DialogDescription>
              Additional addresses are restricted to the delivery category.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <AddressForm
              control={additionalForm.control}
              errors={additionalForm.formState.errors.address}
              register={additionalForm.register}
              watch={additionalForm.watch}
              deliveryOnly
            />
          </div>
          <div className="shrink-0 border-t bg-background px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  additionalForm.reset({
                    companyName: "", correspName: "", remarks: "", lang: "", roles: [],
                    searchCode1: "", searchCode2: "", searchCode3: "",
                    address: { ...DEFAULT_ADDRESS, category: ["delivery"] },
                  });
                  setIsAdditionalAddressDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveAdditionalAddress}>Save Address</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Company contact dialog */}
      <ContactDialog
        open={isContactDialogOpen}
        onOpenChange={setIsContactDialogOpen}
        onAdd={(contact) => {
          setContacts((prev) => [...prev, contact]);
          setIsContactDialogOpen(false);
        }}
      />
    </>
  );
};
