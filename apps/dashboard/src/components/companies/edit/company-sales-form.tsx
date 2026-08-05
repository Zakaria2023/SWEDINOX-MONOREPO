"use client";

import {
  type CompanySalesData,
  updateCompanySales,
} from "@/app/(dashboard)/companies/[uuid]/edit/sales/actions";
import {
  companySalesSchema,
  type CompanySalesFormValues,
} from "@/app/(dashboard)/companies/[uuid]/edit/sales/validation";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import { FormError } from "@/components/ui/form-error";
import { FormLabel } from "@/components/ui/form-field";
import {
  customerGroups,
  devTheorWtOptions,
  ediOptions,
  groupLinesByDescriptionOptions,
  miscellaneousOptions,
  orderOptions,
  printProductCodesOptions,
  quoteOptions,
  quoteOrderInvoiceOptions,
  quoteOrderOptions,
  salesRepresentatives,
} from "@/lib/enums";
import {
  CUSTOMER_GROUP_LABELS,
  DEV_THEOR_WT_LABELS,
  EDI_OPTION_LABELS,
  GROUP_LINES_BY_DESCRIPTION_LABELS,
  MISCELLANEOUS_OPTION_LABELS,
  ORDER_OPTION_LABELS,
  PRINT_PRODUCT_CODES_LABELS,
  QUOTE_OPTION_LABELS,
  QUOTE_ORDER_INVOICE_OPTION_LABELS,
  QUOTE_ORDER_OPTION_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { startTransition, useActionState } from "react";
import { Controller, useForm } from "react-hook-form";

type Props = {
  company: CompanySalesData;
};

export const CompanySalesForm = ({ company }: Props) => {
  const [state, dispatch, isPending] = useActionState(updateCompanySales, {});

  const { register, control, watch, handleSubmit } =
    useForm<CompanySalesFormValues>({
      resolver: zodResolver(companySalesSchema),
      defaultValues: {
        customerGroup: company.customerGroup ?? "",
        representative: company.representative ?? "",
        accountManager: company.accountManager ?? "",
        region: company.region ?? "",
        memberOf: company.memberOf ?? "",
        miscellaneousSettings: company.miscellaneousSettings ?? [],
        deliveryCondition: company.deliveryCondition ?? "",
        devTheorWt: company.devTheorWt ?? "",
        defTransport: company.defTransport ?? "",
        quoteOrderSettings: company.quoteOrderSettings ?? [],
        groupLinesByLongProductGroupDescription:
          company.groupLinesByLongProductGroupDescription ?? "",
        printProductCodesOnOutgoingDocuments:
          company.printProductCodesOnOutgoingDocuments ?? "",
        quoteOrderInvoiceSettings: company.quoteOrderInvoiceSettings ?? [],
        orderSettings: company.orderSettings ?? [],
        quoteSettings: company.quoteSettings ?? [],
        websiteQuoteMustBeApproved: company.websiteQuoteMustBeApproved ?? false,
        websiteQuoteApprovalAmount: company.websiteQuoteApprovalAmount ?? "",
        releaseActionPrint: company.releaseActionPrint ?? false,
        releaseActionEmailEnabled: company.releaseActionEmailEnabled ?? false,
        releaseActionEmailTo: company.releaseActionEmailTo ?? "",
        releaseActionFaxEnabled: company.releaseActionFaxEnabled ?? false,
        releaseActionFaxTo: company.releaseActionFaxTo ?? "",
        actionPrint: company.actionPrint ?? false,
        actionEmailEnabled: company.actionEmailEnabled ?? false,
        actionEmailTo: company.actionEmailTo ?? "",
        actionFaxEnabled: company.actionFaxEnabled ?? false,
        actionFaxTo: company.actionFaxTo ?? "",
        ediSettings: company.ediSettings ?? [],
      },
    });

  const onSubmit = handleSubmit((values) => {
    startTransition(() => {
      dispatch({ ...values, companyUuid: company.uuid });
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormError>{state.error}</FormError>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-lg font-semibold text-foreground">
          Sales Settings
        </h2>
        <div className="space-y-6 rounded-2xl border border-border bg-muted/20 p-4">
          {/* Commercial layout */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Commercial layout
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FormLabel htmlFor="sl-customerGroup">Customer group</FormLabel>
                <Controller
                  name="customerGroup"
                  control={control}
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
                      disabled={isPending}
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
                  control={control}
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
                      disabled={isPending}
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
                  control={control}
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
                      disabled={isPending}
                    />
                  )}
                />
              </div>
              <div>
                <FormLabel htmlFor="sl-region">Region</FormLabel>
                <Input
                  id="sl-region"
                  {...register("region")}
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* Miscellaneous */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Miscellaneous
            </h3>
            <div>
              <FormLabel htmlFor="sl-memberOf">Member of</FormLabel>
              <Input
                id="sl-memberOf"
                {...register("memberOf")}
                className="mb-3"
                disabled={isPending}
              />
            </div>
            <Controller
              name="miscellaneousSettings"
              control={control}
              render={({ field }) => (
                <div className="grid gap-2 sm:grid-cols-2">
                  {miscellaneousOptions.map((opt) => {
                    const checked = field.value.includes(opt);
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
                            field.onChange(
                              checked
                                ? field.value.filter((v) => v !== opt)
                                : [...field.value, opt],
                            )
                          }
                          disabled={isPending}
                        />
                        {MISCELLANEOUS_OPTION_LABELS[opt]}
                      </label>
                    );
                  })}
                </div>
              )}
            />
          </div>

          {/* Quote/Order */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Quote/Order
            </h3>
            <div className="mb-3 grid gap-3 sm:grid-cols-3">
              <div>
                <FormLabel htmlFor="sl-deliveryCondition">
                  Delivery condition
                </FormLabel>
                <Input
                  id="sl-deliveryCondition"
                  {...register("deliveryCondition")}
                  disabled={isPending}
                />
              </div>
              <div>
                <FormLabel htmlFor="sl-devTheorWt">Dev. Theor. Wt.</FormLabel>
                <Controller
                  name="devTheorWt"
                  control={control}
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
                      disabled={isPending}
                    />
                  )}
                />
              </div>
              <div>
                <FormLabel htmlFor="sl-defTransport">Def. transport</FormLabel>
                <Input
                  id="sl-defTransport"
                  {...register("defTransport")}
                  disabled={isPending}
                />
              </div>
            </div>
            <Controller
              name="quoteOrderSettings"
              control={control}
              render={({ field }) => (
                <div className="grid gap-2 sm:grid-cols-2">
                  {quoteOrderOptions.map((opt) => {
                    const checked = field.value.includes(opt);
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
                            field.onChange(
                              checked
                                ? field.value.filter((v) => v !== opt)
                                : [...field.value, opt],
                            )
                          }
                          disabled={isPending}
                        />
                        {QUOTE_ORDER_OPTION_LABELS[opt]}
                      </label>
                    );
                  })}
                </div>
              )}
            />
          </div>

          {/* Quote/Order/Invoice */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Quote/Order/Invoice
            </h3>
            <div className="mb-3 grid gap-3 sm:grid-cols-2">
              <div>
                <FormLabel htmlFor="sl-groupLines">
                  Group lines by long product group description
                </FormLabel>
                <Controller
                  name="groupLinesByLongProductGroupDescription"
                  control={control}
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
                      disabled={isPending}
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
                  control={control}
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
                      disabled={isPending}
                    />
                  )}
                />
              </div>
            </div>
            <Controller
              name="quoteOrderInvoiceSettings"
              control={control}
              render={({ field }) => (
                <div className="grid gap-2 sm:grid-cols-2">
                  {quoteOrderInvoiceOptions.map((opt) => {
                    const checked = field.value.includes(opt);
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
                            field.onChange(
                              checked
                                ? field.value.filter((v) => v !== opt)
                                : [...field.value, opt],
                            )
                          }
                          disabled={isPending}
                        />
                        {QUOTE_ORDER_INVOICE_OPTION_LABELS[opt]}
                      </label>
                    );
                  })}
                </div>
              )}
            />
          </div>

          {/* Order & Quote */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Order
              </h3>
              <Controller
                name="orderSettings"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {orderOptions.map((opt) => {
                      const checked = field.value.includes(opt);
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
                              field.onChange(
                                checked
                                  ? field.value.filter((v) => v !== opt)
                                  : [...field.value, opt],
                              )
                            }
                            disabled={isPending}
                          />
                          {ORDER_OPTION_LABELS[opt]}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Quote
              </h3>
              <Controller
                name="quoteSettings"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {quoteOptions.map((opt) => {
                      const checked = field.value.includes(opt);
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
                              field.onChange(
                                checked
                                  ? field.value.filter((v) => v !== opt)
                                  : [...field.value, opt],
                              )
                            }
                            disabled={isPending}
                          />
                          {QUOTE_OPTION_LABELS[opt]}
                        </label>
                      );
                    })}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Website-quote */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Website-quote
            </h3>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border-border accent-primary"
                {...register("websiteQuoteMustBeApproved")}
                disabled={isPending}
              />
              Must be approved, but only if the quote amount is greater than:
            </label>
            {watch("websiteQuoteMustBeApproved") && (
              <div className="mt-2">
                <Input
                  placeholder="e.g. 1000"
                  {...register("websiteQuoteApprovalAmount")}
                  disabled={isPending}
                />
              </div>
            )}
          </div>

          {/* Actions upon release / confirmation */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Actions upon release
              </h3>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 rounded border-border accent-primary"
                    {...register("releaseActionPrint")}
                    disabled={isPending}
                  />
                  Print
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 rounded border-border accent-primary"
                    {...register("releaseActionEmailEnabled")}
                    disabled={isPending}
                  />
                  <span className="shrink-0 whitespace-nowrap text-sm">
                    E-mail to:
                  </span>
                  <Input
                    placeholder="Contact person"
                    {...register("releaseActionEmailTo")}
                    className="h-7 min-w-0 text-xs"
                    disabled={isPending}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 rounded border-border accent-primary"
                    {...register("releaseActionFaxEnabled")}
                    disabled={isPending}
                  />
                  <span className="shrink-0 whitespace-nowrap text-sm">
                    Fax to:
                  </span>
                  <Input
                    placeholder="Contact person"
                    {...register("releaseActionFaxTo")}
                    className="h-7 min-w-0 text-xs"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">
                Actions upon (quote/order confirmation)
              </h3>
              <div className="space-y-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 rounded border-border accent-primary"
                    {...register("actionPrint")}
                    disabled={isPending}
                  />
                  Print
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 rounded border-border accent-primary"
                    {...register("actionEmailEnabled")}
                    disabled={isPending}
                  />
                  <span className="shrink-0 whitespace-nowrap text-sm">
                    E-mail to:
                  </span>
                  <Input
                    placeholder="Contact person"
                    {...register("actionEmailTo")}
                    className="h-7 min-w-0 text-xs"
                    disabled={isPending}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 shrink-0 rounded border-border accent-primary"
                    {...register("actionFaxEnabled")}
                    disabled={isPending}
                  />
                  <span className="shrink-0 whitespace-nowrap text-sm">
                    Fax to:
                  </span>
                  <Input
                    placeholder="Contact person"
                    {...register("actionFaxTo")}
                    className="h-7 min-w-0 text-xs"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* EDI */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">EDI</h3>
            <Controller
              name="ediSettings"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  {ediOptions.map((opt) => {
                    const checked = field.value.includes(opt);
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
                            field.onChange(
                              checked
                                ? field.value.filter((v) => v !== opt)
                                : [...field.value, opt],
                            )
                          }
                          disabled={isPending}
                        />
                        {EDI_OPTION_LABELS[opt]}
                      </label>
                    );
                  })}
                </div>
              )}
            />
          </div>
        </div>
      </section>

      <div className="flex gap-3 pb-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
        <Link
          href={`/companies/${company.uuid}/edit`}
          className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm text-foreground transition-colors hover:bg-muted/40"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
};
