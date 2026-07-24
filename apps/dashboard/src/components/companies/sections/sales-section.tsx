"use client";

import { CustomerSalesInput } from "@/app/(dashboard)/companies/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { DialogFormFooter } from "@/components/ui/dialog-form-footer";
import { FormLabel } from "@/components/ui/form-field";
import {
  CustomerGroup,
  customerGroups,
  DevTheorWt,
  devTheorWtOptions,
  EdiOption,
  ediOptions,
  GroupLinesByDescription,
  groupLinesByDescriptionOptions,
  MiscellaneousOption,
  miscellaneousOptions,
  OrderOption,
  orderOptions,
  PrintProductCodes,
  printProductCodesOptions,
  QuoteOption,
  quoteOptions,
  QuoteOrderInvoiceOption,
  quoteOrderInvoiceOptions,
  QuoteOrderOption,
  quoteOrderOptions,
  SalesRepresentative,
  salesRepresentatives,
} from "@/lib/enums";
import { CUSTOMER_GROUP_LABELS, DEV_THEOR_WT_LABELS, EDI_OPTION_LABELS, GROUP_LINES_BY_DESCRIPTION_LABELS, MISCELLANEOUS_OPTION_LABELS, ORDER_OPTION_LABELS, PRINT_PRODUCT_CODES_LABELS, QUOTE_OPTION_LABELS, QUOTE_ORDER_INVOICE_OPTION_LABELS, QUOTE_ORDER_OPTION_LABELS, SALES_REPRESENTATIVE_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const salesSchema = z.object({
  customerGroup: z.string().optional(),
  representative: z.string().optional(),
  accountManager: z.string().optional(),
  region: z.string().optional(),
  memberOf: z.string().optional(),
  miscellaneousSettings: z.array(z.string()),
  deliveryCondition: z.string().optional(),
  devTheorWt: z.string().optional(),
  defTransport: z.string().optional(),
  quoteOrderSettings: z.array(z.string()),
  groupLinesByLongProductGroupDescription: z.string().optional(),
  printProductCodesOnOutgoingDocuments: z.string().optional(),
  quoteOrderInvoiceSettings: z.array(z.string()),
  orderSettings: z.array(z.string()),
  quoteSettings: z.array(z.string()),
  websiteQuoteMustBeApproved: z.boolean(),
  websiteQuoteApprovalAmount: z.string().optional(),
  releaseActionPrint: z.boolean(),
  releaseActionEmailEnabled: z.boolean(),
  releaseActionEmailTo: z.string().optional(),
  releaseActionFaxEnabled: z.boolean(),
  releaseActionFaxTo: z.string().optional(),
  actionPrint: z.boolean(),
  actionEmailEnabled: z.boolean(),
  actionEmailTo: z.string().optional(),
  actionFaxEnabled: z.boolean(),
  actionFaxTo: z.string().optional(),
  ediSettings: z.array(z.string()),
});

type SalesFormValues = z.infer<typeof salesSchema>;

const DEFAULT_SALES: SalesFormValues = {
  customerGroup: "",
  representative: "",
  accountManager: "",
  region: "",
  memberOf: "",
  miscellaneousSettings: [],
  deliveryCondition: "",
  devTheorWt: "",
  defTransport: "",
  quoteOrderSettings: [],
  groupLinesByLongProductGroupDescription: "",
  printProductCodesOnOutgoingDocuments: "",
  quoteOrderInvoiceSettings: [],
  orderSettings: [],
  quoteSettings: [],
  websiteQuoteMustBeApproved: false,
  websiteQuoteApprovalAmount: "",
  releaseActionPrint: false,
  releaseActionEmailEnabled: false,
  releaseActionEmailTo: "",
  releaseActionFaxEnabled: false,
  releaseActionFaxTo: "",
  actionPrint: false,
  actionEmailEnabled: false,
  actionEmailTo: "",
  actionFaxEnabled: false,
  actionFaxTo: "",
  ediSettings: [],
};

type Props = {
  salesData: CustomerSalesInput | null;
  setSalesData: (data: CustomerSalesInput | null) => void;
  isPending: boolean;
  isCustomerOrProspect: boolean;
};

export const SalesSection = ({
  salesData,
  setSalesData,
  isPending,
  isCustomerOrProspect,
}: Props) => {
  const [isSalesDialogOpen, setIsSalesDialogOpen] = useState(false);

  const salesForm = useForm<SalesFormValues>({
    resolver: zodResolver(salesSchema),
    defaultValues: DEFAULT_SALES,
  });

  const handleSaveSales = salesForm.handleSubmit((values) => {
    setSalesData({
      customerGroup: (values.customerGroup as CustomerGroup) || undefined,
      representative:
        (values.representative as SalesRepresentative) || undefined,
      accountManager:
        (values.accountManager as SalesRepresentative) || undefined,
      region: values.region || undefined,
      memberOf: values.memberOf || undefined,
      miscellaneousSettings:
        values.miscellaneousSettings as MiscellaneousOption[],
      deliveryCondition: values.deliveryCondition || undefined,
      devTheorWt: (values.devTheorWt as DevTheorWt) || undefined,
      defTransport: values.defTransport || undefined,
      quoteOrderSettings: values.quoteOrderSettings as QuoteOrderOption[],
      groupLinesByLongProductGroupDescription:
        (values.groupLinesByLongProductGroupDescription as GroupLinesByDescription) ||
        undefined,
      printProductCodesOnOutgoingDocuments:
        (values.printProductCodesOnOutgoingDocuments as PrintProductCodes) ||
        undefined,
      quoteOrderInvoiceSettings:
        values.quoteOrderInvoiceSettings as QuoteOrderInvoiceOption[],
      orderSettings: values.orderSettings as OrderOption[],
      quoteSettings: values.quoteSettings as QuoteOption[],
      websiteQuoteMustBeApproved: values.websiteQuoteMustBeApproved,
      websiteQuoteApprovalAmount:
        values.websiteQuoteApprovalAmount || undefined,
      releaseActionPrint: values.releaseActionPrint,
      releaseActionEmailEnabled: values.releaseActionEmailEnabled,
      releaseActionEmailTo: values.releaseActionEmailTo || undefined,
      releaseActionFaxEnabled: values.releaseActionFaxEnabled,
      releaseActionFaxTo: values.releaseActionFaxTo || undefined,
      actionPrint: values.actionPrint,
      actionEmailEnabled: values.actionEmailEnabled,
      actionEmailTo: values.actionEmailTo || undefined,
      actionFaxEnabled: values.actionFaxEnabled,
      actionFaxTo: values.actionFaxTo || undefined,
      ediSettings: values.ediSettings as EdiOption[],
    });
    setIsSalesDialogOpen(false);
  });

  const toggleSalesOption = (field: keyof SalesFormValues, value: string) => {
    const current = salesForm.getValues(field) as string[];
    salesForm.setValue(
      field as Parameters<typeof salesForm.setValue>[0],
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
  };

  if (!isCustomerOrProspect) return null;

  return (
    <>
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-gray-800">
          Sales
        </h2>
        <div className="space-y-2 rounded-2xl border border-border bg-muted/20 p-4">
          {salesData ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <ShoppingCart className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-muted-foreground">
                  Sales settings configured
                </span>
                {salesData.representative && (
                  <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    {SALES_REPRESENTATIVE_LABELS[salesData.representative]}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  salesForm.reset(DEFAULT_SALES);
                  setIsSalesDialogOpen(true);
                }}
                className="shrink-0 text-xs text-primary hover:underline"
                disabled={isPending}
              >
                Edit
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                salesForm.reset(DEFAULT_SALES);
                setIsSalesDialogOpen(true);
              }}
              className="inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              disabled={isPending}
            >
              <Plus className="size-4" />
              Configure Sales Settings
            </button>
          )}
        </div>
      </section>

      <Dialog
        open={isSalesDialogOpen}
        onOpenChange={(open) => {
          if (!open) salesForm.reset(DEFAULT_SALES);
          setIsSalesDialogOpen(open);
        }}
      >
        <DialogContent className="flex h-[85dvh] max-w-3xl flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b bg-background px-6 py-5">
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="size-4" />
              Sales Settings
            </DialogTitle>
            <DialogDescription>
              Configure sales settings for this customer / prospect.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSaveSales}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Commercial layout */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Commercial layout
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <FormLabel htmlFor="sl-customerGroup">
                      Customer group
                    </FormLabel>
                    <Controller
                      name="customerGroup"
                      control={salesForm.control}
                      render={({ field }) => (
                        <Select
                          id="sl-customerGroup"
                          options={[
                            { value: "", label: "Empty" },
                            ...customerGroups.map((g) => ({
                              value: g,
                              label: CUSTOMER_GROUP_LABELS[g],
                            })),
                          ]}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder="Empty"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="sl-representative">
                      Representative
                    </FormLabel>
                    <Controller
                      name="representative"
                      control={salesForm.control}
                      render={({ field }) => (
                        <Select
                          id="sl-representative"
                          options={[
                            { value: "", label: "Empty" },
                            ...salesRepresentatives.map((r) => ({
                              value: r,
                              label: SALES_REPRESENTATIVE_LABELS[r],
                            })),
                          ]}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder="Empty"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="sl-accountManager">
                      Account manager
                    </FormLabel>
                    <Controller
                      name="accountManager"
                      control={salesForm.control}
                      render={({ field }) => (
                        <Select
                          id="sl-accountManager"
                          options={[
                            { value: "", label: "Empty" },
                            ...salesRepresentatives.map((r) => ({
                              value: r,
                              label: SALES_REPRESENTATIVE_LABELS[r],
                            })),
                          ]}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder="Empty"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="sl-region">Region</FormLabel>
                    <Input id="sl-region" {...salesForm.register("region")} />
                  </div>
                </div>
              </div>

              {/* Miscellaneous */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Miscellaneous
                </h3>
                <div>
                  <FormLabel htmlFor="sl-memberOf">Member of</FormLabel>
                  <Input
                    id="sl-memberOf"
                    {...salesForm.register("memberOf")}
                    className="mb-3"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {miscellaneousOptions.map((opt) => {
                    const checked = salesForm
                      .watch("miscellaneousSettings")
                      .includes(opt);
                    return (
                      <label
                        key={opt}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border accent-primary"
                          checked={checked}
                          onChange={() =>
                            toggleSalesOption("miscellaneousSettings", opt)
                          }
                        />
                        {MISCELLANEOUS_OPTION_LABELS[opt]}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Quote/Order */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Quote/Order
                </h3>
                <div className="mb-3 grid gap-3 sm:grid-cols-3">
                  <div>
                    <FormLabel htmlFor="sl-deliveryCondition">
                      Delivery condition
                    </FormLabel>
                    <Input
                      id="sl-deliveryCondition"
                      {...salesForm.register("deliveryCondition")}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="sl-devTheorWt">
                      Dev. Theor. Wt.
                    </FormLabel>
                    <Controller
                      name="devTheorWt"
                      control={salesForm.control}
                      render={({ field }) => (
                        <Select
                          id="sl-devTheorWt"
                          options={[
                            { value: "", label: "Empty" },
                            ...devTheorWtOptions.map((o) => ({
                              value: o,
                              label: DEV_THEOR_WT_LABELS[o],
                            })),
                          ]}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder="Empty"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="sl-defTransport">
                      Def. transport
                    </FormLabel>
                    <Input
                      id="sl-defTransport"
                      {...salesForm.register("defTransport")}
                    />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {quoteOrderOptions.map((opt) => {
                    const checked = salesForm
                      .watch("quoteOrderSettings")
                      .includes(opt);
                    return (
                      <label
                        key={opt}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border accent-primary"
                          checked={checked}
                          onChange={() =>
                            toggleSalesOption("quoteOrderSettings", opt)
                          }
                        />
                        {QUOTE_ORDER_OPTION_LABELS[opt]}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Quote/Order/Invoice */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Quote/Order/Invoice
                </h3>
                <div className="mb-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <FormLabel htmlFor="sl-groupLines">
                      Group lines by long product group description
                    </FormLabel>
                    <Controller
                      name="groupLinesByLongProductGroupDescription"
                      control={salesForm.control}
                      render={({ field }) => (
                        <Select
                          id="sl-groupLines"
                          options={[
                            { value: "", label: "Empty" },
                            ...groupLinesByDescriptionOptions.map((o) => ({
                              value: o,
                              label: GROUP_LINES_BY_DESCRIPTION_LABELS[o],
                            })),
                          ]}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder="Empty"
                        />
                      )}
                    />
                  </div>
                  <div>
                    <FormLabel htmlFor="sl-printProductCodes">
                      Print product codes on outgoing documents
                    </FormLabel>
                    <Controller
                      name="printProductCodesOnOutgoingDocuments"
                      control={salesForm.control}
                      render={({ field }) => (
                        <Select
                          id="sl-printProductCodes"
                          options={[
                            { value: "", label: "Empty" },
                            ...printProductCodesOptions.map((o) => ({
                              value: o,
                              label: PRINT_PRODUCT_CODES_LABELS[o],
                            })),
                          ]}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder="Empty"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {quoteOrderInvoiceOptions.map((opt) => {
                    const checked = salesForm
                      .watch("quoteOrderInvoiceSettings")
                      .includes(opt);
                    return (
                      <label
                        key={opt}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border accent-primary"
                          checked={checked}
                          onChange={() =>
                            toggleSalesOption("quoteOrderInvoiceSettings", opt)
                          }
                        />
                        {QUOTE_ORDER_INVOICE_OPTION_LABELS[opt]}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Order & Quote */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">
                    Order
                  </h3>
                  <div className="space-y-2">
                    {orderOptions.map((opt) => {
                      const checked = salesForm
                        .watch("orderSettings")
                        .includes(opt);
                      return (
                        <label
                          key={opt}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="size-4 rounded border-border accent-primary"
                            checked={checked}
                            onChange={() =>
                              toggleSalesOption("orderSettings", opt)
                            }
                          />
                          {ORDER_OPTION_LABELS[opt]}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">
                    Quote
                  </h3>
                  <div className="space-y-2">
                    {quoteOptions.map((opt) => {
                      const checked = salesForm
                        .watch("quoteSettings")
                        .includes(opt);
                      return (
                        <label
                          key={opt}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="size-4 rounded border-border accent-primary"
                            checked={checked}
                            onChange={() =>
                              toggleSalesOption("quoteSettings", opt)
                            }
                          />
                          {QUOTE_OPTION_LABELS[opt]}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Website-quote */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  Website-quote
                </h3>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border accent-primary"
                    {...salesForm.register("websiteQuoteMustBeApproved")}
                  />
                  Must be approved, but only if the quote amount is greater
                  than:
                </label>
                {salesForm.watch("websiteQuoteMustBeApproved") && (
                  <div className="mt-2">
                    <Input
                      placeholder="e.g. 1000"
                      {...salesForm.register("websiteQuoteApprovalAmount")}
                    />
                  </div>
                )}
              </div>

              {/* Actions upon release */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">
                    Actions upon release
                  </h3>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 rounded border-border accent-primary"
                        {...salesForm.register("releaseActionPrint")}
                      />
                      Print
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 rounded border-border accent-primary"
                        {...salesForm.register("releaseActionEmailEnabled")}
                      />
                      <span className="shrink-0 whitespace-nowrap text-sm">
                        E-mail to:
                      </span>
                      <Input
                        placeholder="Contact person"
                        {...salesForm.register("releaseActionEmailTo")}
                        className="h-7 min-w-0 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 rounded border-border accent-primary"
                        {...salesForm.register("releaseActionFaxEnabled")}
                      />
                      <span className="shrink-0 whitespace-nowrap text-sm">
                        Fax to:
                      </span>
                      <Input
                        placeholder="Contact person"
                        {...salesForm.register("releaseActionFaxTo")}
                        className="h-7 min-w-0 text-xs"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-gray-700">
                    Actions upon (quote/order confirmation)
                  </h3>
                  <div className="space-y-2">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 rounded border-border accent-primary"
                        {...salesForm.register("actionPrint")}
                      />
                      Print
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 rounded border-border accent-primary"
                        {...salesForm.register("actionEmailEnabled")}
                      />
                      <span className="shrink-0 whitespace-nowrap text-sm">
                        E-mail to:
                      </span>
                      <Input
                        placeholder="Contact person"
                        {...salesForm.register("actionEmailTo")}
                        className="h-7 min-w-0 text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 rounded border-border accent-primary"
                        {...salesForm.register("actionFaxEnabled")}
                      />
                      <span className="shrink-0 whitespace-nowrap text-sm">
                        Fax to:
                      </span>
                      <Input
                        placeholder="Contact person"
                        {...salesForm.register("actionFaxTo")}
                        className="h-7 min-w-0 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* EDI */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  EDI
                </h3>
                <div className="space-y-2">
                  {ediOptions.map((opt) => {
                    const checked = salesForm
                      .watch("ediSettings")
                      .includes(opt);
                    return (
                      <label
                        key={opt}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded border-border accent-primary"
                          checked={checked}
                          onChange={() => toggleSalesOption("ediSettings", opt)}
                        />
                        {EDI_OPTION_LABELS[opt]}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFormFooter
              onCancel={() => setIsSalesDialogOpen(false)}
              submitLabel="Save Sales Settings"
            />
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
