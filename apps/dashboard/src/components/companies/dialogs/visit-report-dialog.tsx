"use client";

import { CompanyContactInput } from "@/app/(dashboard)/companies/actions";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Checkbox } from "@/components/shadcn/checkbox";
import { DatePicker } from "@/components/shadcn/date-picker";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { TimePicker } from "@/components/shadcn/time-picker";
import { DialogFormFooter } from "@/components/ui/dialog-form-footer";
import { FormLabel } from "@/components/ui/form-field";
import { visitReportContactMethods, visitReportReasons } from "@/lib/enums";
import {
  COMMON_TEXT,
  VISIT_REPORT_CONTACT_METHOD_LABELS,
  VISIT_REPORT_REASON_LABELS,
} from "@/lib/labels";
import { ClipboardList } from "lucide-react";
import { FormEventHandler } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { VisitReportDialogValues } from "@/app/(dashboard)/companies/validation";

const contactLabel = (contact: CompanyContactInput) =>
  [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
  contact.email ||
  "Contact";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<VisitReportDialogValues>;
  contacts: CompanyContactInput[];
  isEditing?: boolean;
};

export const VisitReportDialog = ({
  isOpen,
  onOpenChange,
  onCancel,
  onSave,
  form,
  contacts,
  isEditing = false,
}: Props) => {
  const hasContacts = contacts.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="size-4" />
            {isEditing ? "Edit Visit Report" : "Add Visit Report"}
          </DialogTitle>
          <DialogDescription>
            Add a visit report for this company.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSave}>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FormLabel htmlFor="vr-date">Visit Date</FormLabel>
                <Controller
                  name="visitDate"
                  control={form.control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
              <div>
                <FormLabel htmlFor="vr-time">Visit Time</FormLabel>
                <Controller
                  name="visitTime"
                  control={form.control}
                  render={({ field }) => (
                    <TimePicker
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            <div>
              <FormLabel htmlFor="vr-sort">Sort</FormLabel>
              <Controller
                name="contactMethod"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="vr-sort"
                    options={[
                      { value: "", label: COMMON_TEXT.emptyOption },
                      ...visitReportContactMethods.map((method) => ({
                        value: method,
                        label: VISIT_REPORT_CONTACT_METHOD_LABELS[method],
                      })),
                    ]}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={COMMON_TEXT.selectOption}
                  />
                )}
              />
            </div>

            <div>
              <FormLabel htmlFor="vr-reason">Reason</FormLabel>
              <Controller
                name="visitReason"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="vr-reason"
                    options={[
                      { value: "", label: COMMON_TEXT.emptyOption },
                      ...visitReportReasons.map((reason) => ({
                        value: reason,
                        label: VISIT_REPORT_REASON_LABELS[reason],
                      })),
                    ]}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={COMMON_TEXT.selectOption}
                  />
                )}
              />
            </div>

            <div>
              <FormLabel htmlFor="vr-contact">Contact</FormLabel>
              <Controller
                name="contactUuid"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="vr-contact"
                    options={[
                      { value: "", label: COMMON_TEXT.emptyOption },
                      ...contacts.map((contact) => ({
                        value: contact.uuid ?? "",
                        label: contactLabel(contact),
                      })),
                    ]}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder={COMMON_TEXT.selectOption}
                    disabled={!hasContacts}
                  />
                )}
              />
              {!hasContacts && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Add a contact to this company first, then pick one here.
                </p>
              )}
            </div>

            <Controller
              name="hasTakenPlace"
              control={form.control}
              render={({ field }) => (
                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox
                    checked={!!field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">Took place</span>
                </label>
              )}
            />

            <div>
              <FormLabel htmlFor="vr-days">Days in system</FormLabel>
              <Input id="vr-days" value="0" readOnly disabled />
            </div>
          </DialogBody>
          <DialogFormFooter
            onCancel={onCancel}
            submitLabel={isEditing ? "Save Visit Report" : "Add Visit Report"}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};
