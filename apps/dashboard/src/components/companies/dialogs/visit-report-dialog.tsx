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
import { contactOptionLabel } from "@/lib/helpers";
import {
  VISIT_REPORT_CONTACT_METHOD_LABELS,
  VISIT_REPORT_REASON_LABELS,
} from "@/lib/labels";
import { ClipboardList } from "lucide-react";
import { FormEventHandler } from "react";
import { Controller, UseFormReturn } from "react-hook-form";
import { VisitReportDialogValues } from "@/app/(dashboard)/companies/validation";

type ContactSelectOption = {
  value: string;
  label: string;
};

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onSave: FormEventHandler<HTMLFormElement>;
  form: UseFormReturn<VisitReportDialogValues>;
  contacts?: CompanyContactInput[];
  contactOptions?: ContactSelectOption[];
  isEditing?: boolean;
};

export const VisitReportDialog = ({
  isOpen,
  onOpenChange,
  onCancel,
  onSave,
  form,
  contacts = [],
  contactOptions,
  isEditing = false,
}: Props) => {
  // The dialog just renders whatever options it's given: the standalone edit
  // page passes uuid-valued options via `contactOptions`, while the legacy
  // create flow still passes the in-memory `contacts` array, which maps to
  // index-valued options here.
  const options =
    contactOptions ??
    contacts.map((contact, index) => ({
      value: String(index),
      label: contactOptionLabel(contact),
    }));
  const hasContacts = options.length > 0;

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
                      { value: "", label: "Empty" },
                      ...visitReportContactMethods.map((method) => ({
                        value: method,
                        label: VISIT_REPORT_CONTACT_METHOD_LABELS[method],
                      })),
                    ]}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder="Select"
                  />
                )}
              />
            </div>

            <div>
              <FormLabel htmlFor="vr-reasons">Reasons</FormLabel>
              <Controller
                name="visitReasons"
                control={form.control}
                render={({ field }) => (
                  <div id="vr-reasons" className="space-y-1">
                    {visitReportReasons.map((reason) => (
                      <label
                        key={reason}
                        className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2"
                      >
                        <Checkbox
                          checked={(field.value ?? []).includes(reason)}
                          onChange={() =>
                            field.onChange(
                              (field.value ?? []).includes(reason)
                                ? (field.value ?? []).filter(
                                    (held) => held !== reason,
                                  )
                                : [...(field.value ?? []), reason],
                            )
                          }
                        />
                        <span className="text-sm text-foreground">
                          {VISIT_REPORT_REASON_LABELS[reason]}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>

            <div>
              <FormLabel htmlFor="vr-contact">Contact</FormLabel>
              <Controller
                name="contactIndex"
                control={form.control}
                render={({ field }) => (
                  <Select
                    id="vr-contact"
                    options={[{ value: "", label: "Empty" }, ...options]}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    placeholder="Select"
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
                  <span className="text-sm text-foreground">Took place</span>
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
