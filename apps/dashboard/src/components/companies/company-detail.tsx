import { CompanyDetail } from "@/app/(dashboard)/companies/actions";
import { CompanyDocumentCell } from "@/components/companies/company-document-cell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { MONTHS } from "@/lib/constants";
import {
  daysInSystem,
  formatCurrencyAmount,
  formatDateValue,
  formatRevenue,
  needsCurrencyConversion,
  userName,
  visitReasonsLabel,
  yesNo,
} from "@/lib/helpers";
import { SelectInvoices } from "@/db";
import {
  COMPANY_CLASSIFICATION_LABELS,
  COMPANY_LANGUAGE_LABELS,
  COMPANY_ROLE_LABELS,
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_REPORT_LABELS,
  COMPLAINT_TYPE_LABELS,
  COUNTER_ORDER_STATUS_LABELS,
  CURRENCY_LABELS,
  CUSTOMER_GROUP_LABELS,
  CUSTOMER_STOCK_REASON_LABELS,
  DEV_THEOR_WT_LABELS,
  EDI_OPTION_LABELS,
  GROUP_LINES_BY_DESCRIPTION_LABELS,
  INVOICE_FREQUENCY_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  INVOICE_VAT_SCENARIO_LABELS,
  INVOICING_METHOD_LABELS,
  MISCELLANEOUS_OPTION_LABELS,
  ORDER_OPTION_LABELS,
  PRINT_PRODUCT_CODES_LABELS,
  QUOTE_OPTION_LABELS,
  QUOTE_ORDER_INVOICE_OPTION_LABELS,
  QUOTE_ORDER_OPTION_LABELS,
  RETURN_ORDER_REASON_LABELS,
  RETURN_ORDER_STATUS_LABELS,
  SALES_REPRESENTATIVE_LABELS,
  SFN_COUNTERPARTY_ROLE_LABELS,
  VISIT_REPORT_CONTACT_METHOD_LABELS,
  VISIT_REPORT_REASON_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/lib/labels";
import { Plus } from "lucide-react";
import Link from "next/link";

type Props = {
  company: CompanyDetail;
  invoices?: SelectInvoices[];
  userNames: Record<string, string>;
};

type FieldProps = {
  label: string;
  value?: string | number | null;
};

type OptionListProps = {
  label: string;
  values?: readonly string[] | null;
  labels: Record<string, string>;
};

const Field = ({ label, value }: FieldProps) => (
  <div>
    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </dt>
    <dd className="mt-0.5 text-sm text-foreground">
      {value === null || value === undefined || value === "" ? "—" : value}
    </dd>
  </div>
);

// A stored multi-select (the JSON option columns) as the set of options that
// were ticked — an empty set reads as an em dash rather than as nothing at all.
const OptionList = ({ label, values, labels }: OptionListProps) => (
  <div className="sm:col-span-2 lg:col-span-3">
    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </dt>
    <dd className="mt-1 flex flex-wrap gap-1.5">
      {values && values.length > 0 ? (
        values.map((value) => (
          <span
            key={value}
            className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground"
          >
            {labels[value] ?? value}
          </span>
        ))
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      )}
    </dd>
  </div>
);

export const CompanyDetailView = ({ company, invoices, userNames }: Props) => {
  const isCustomer = company.roles?.includes("customer");
  const na = "—";

  const visitPlanning = MONTHS.map((month, index) => {
    const entry = company.visitPlanning?.[index];
    if (!entry) {
      return null;
    }
    const planned = [entry.call ? "call" : null, entry.visit ? "visit" : null]
      .filter((part): part is string => part !== null)
      .join(" + ");
    return planned.length > 0 ? `${month} (${planned})` : null;
  })
    .filter((entry): entry is string => entry !== null)
    .join(", ");

  return (
    <div className="space-y-8">
      {/* General info */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
          General
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Company Name" value={company.companyName} />
          <Field label="Correspondence Name" value={company.correspName} />
          <Field
            label="Language"
            value={company.lang ? COMPANY_LANGUAGE_LABELS[company.lang] : null}
          />
          <Field label="Search Code 1" value={company.searchCode1} />
          <Field label="Search Code 2" value={company.searchCode2} />
          <Field label="Search Code 3" value={company.searchCode3} />
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Roles
            </dt>
            <dd className="mt-1 flex flex-wrap gap-1.5">
              {company.roles && company.roles.length > 0 ? (
                company.roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                  >
                    {COMPANY_ROLE_LABELS[role]}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">{na}</span>
              )}
            </dd>
          </div>
          <Field
            label="Blocked by"
            value={
              company.blockedByUserId
                ? userName(company.blockedByUserId, userNames)
                : "Not blocked"
            }
          />
          <Field label="Blocking note" value={company.blockedByNote} />
          <Field label="Inactive" value={yesNo(company.isInactive)} />
          <Field
            label="Created"
            value={formatDateValue(company.createdAt, na)}
          />
          <Field
            label="Last updated"
            value={formatDateValue(company.updatedAt, na)}
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Remarks" value={company.remarks} />
          </div>
        </dl>
      </section>

      {/* Sales settings */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
          Sales
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Customer group"
            value={
              company.customerGroup
                ? CUSTOMER_GROUP_LABELS[company.customerGroup]
                : null
            }
          />
          <Field
            label="SFN role"
            value={
              company.sfnRole
                ? SFN_COUNTERPARTY_ROLE_LABELS[company.sfnRole]
                : null
            }
          />
          <Field
            label="Representative"
            value={
              company.representative
                ? SALES_REPRESENTATIVE_LABELS[company.representative]
                : null
            }
          />
          <Field
            label="Account manager"
            value={
              company.accountManager
                ? SALES_REPRESENTATIVE_LABELS[company.accountManager]
                : null
            }
          />
          <Field label="Region" value={company.region} />
          <Field label="Member of" value={company.memberOf} />
          <Field label="Delivery condition" value={company.deliveryCondition} />
          <Field
            label="Complete delivery only"
            value={yesNo(company.completeDelivery)}
          />
          <Field
            label="Print consignment"
            value={yesNo(company.printConsignment)}
          />
          <Field
            label="Requires certificate"
            value={yesNo(company.requiresCertificate)}
          />
          <Field label="Customer since" value={company.customerSince} />
          <Field label="Competitors" value={company.competitors} />
          <Field
            label="Dev. theor. wt."
            value={
              company.devTheorWt
                ? DEV_THEOR_WT_LABELS[company.devTheorWt]
                : null
            }
          />
          <Field label="Def. transport" value={company.defTransport} />
          <Field
            label="Group lines by long product group description"
            value={
              company.groupLinesByLongProductGroupDescription
                ? GROUP_LINES_BY_DESCRIPTION_LABELS[
                    company.groupLinesByLongProductGroupDescription
                  ]
                : null
            }
          />
          <Field
            label="Print product codes on outgoing documents"
            value={
              company.printProductCodesOnOutgoingDocuments
                ? PRINT_PRODUCT_CODES_LABELS[
                    company.printProductCodesOnOutgoingDocuments
                  ]
                : null
            }
          />
          <Field
            label="Website quote must be approved"
            value={
              company.websiteQuoteMustBeApproved
                ? `Above ${formatRevenue(company.websiteQuoteApprovalAmount)}`
                : "No"
            }
          />
          <OptionList
            label="Miscellaneous"
            values={company.miscellaneousSettings}
            labels={MISCELLANEOUS_OPTION_LABELS}
          />
          <OptionList
            label="Quote / order"
            values={company.quoteOrderSettings}
            labels={QUOTE_ORDER_OPTION_LABELS}
          />
          <OptionList
            label="Quote / order / invoice"
            values={company.quoteOrderInvoiceSettings}
            labels={QUOTE_ORDER_INVOICE_OPTION_LABELS}
          />
          <OptionList
            label="Order"
            values={company.orderSettings}
            labels={ORDER_OPTION_LABELS}
          />
          <OptionList
            label="Quote"
            values={company.quoteSettings}
            labels={QUOTE_OPTION_LABELS}
          />
          <OptionList
            label="EDI"
            values={company.ediSettings}
            labels={EDI_OPTION_LABELS}
          />
          <Field
            label="On release — print"
            value={yesNo(company.releaseActionPrint)}
          />
          <Field
            label="On release — e-mail to"
            value={
              company.releaseActionEmailEnabled
                ? (company.releaseActionEmailTo ?? "Contact person")
                : "No"
            }
          />
          <Field
            label="On release — fax to"
            value={
              company.releaseActionFaxEnabled
                ? (company.releaseActionFaxTo ?? "Contact person")
                : "No"
            }
          />
          <Field
            label="On confirmation — print"
            value={yesNo(company.actionPrint)}
          />
          <Field
            label="On confirmation — e-mail to"
            value={
              company.actionEmailEnabled
                ? (company.actionEmailTo ?? "Contact person")
                : "No"
            }
          />
          <Field
            label="On confirmation — fax to"
            value={
              company.actionFaxEnabled
                ? (company.actionFaxTo ?? "Contact person")
                : "No"
            }
          />
        </dl>
      </section>

      {/* Marketing */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
          Marketing
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Industry"
            value={
              company.industry
                ? `${company.industry}${company.industryName ? ` — ${company.industryName}` : ""}`
                : null
            }
          />
          <Field
            label="Classification"
            value={
              company.classification
                ? COMPANY_CLASSIFICATION_LABELS[company.classification]
                : null
            }
          />
          <Field label="Visit frequency" value={company.visitFrequency} />
          <Field
            label="Call frequency per year"
            value={company.callFrequencyPerYear}
          />
          <Field
            label="Target date next visit"
            value={formatDateValue(company.targetDateNextVisit, na)}
          />
          <Field
            label="Visit reason"
            value={
              company.visitReason
                ? VISIT_REPORT_REASON_LABELS[company.visitReason]
                : null
            }
          />
          <Field
            label="Potential annual revenue"
            value={
              company.potentialAnnualRevenue
                ? formatRevenue(company.potentialAnnualRevenue)
                : null
            }
          />
          <Field
            label="Target annual revenue"
            value={
              company.targetAnnualRevenue
                ? formatRevenue(company.targetAnnualRevenue)
                : null
            }
          />
          <Field
            label="Potential annual sales"
            value={company.potentialAnnualSales}
          />
          <Field
            label="Target annual sales"
            value={company.targetAnnualSales}
          />
          <Field
            label="Number of employees"
            value={company.numberOfEmployees}
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Visit planning" value={visitPlanning} />
          </div>
        </dl>
      </section>

      {/* Debtor */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
          Debtor
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Debtor number" value={company.debtorNumber} />
          {/* The payables twin the reference's `Creditor` panel leads with. */}
          <Field label="Creditor number" value={company.creditorNumber} />
          <Field label="Debtor company" value={company.debtorCompanyName} />
          {/* The reference panel's summary line: both limits together, and
              the room left against them. Excl. VAT, as the credit rule weighs. */}
          <Field
            label="Total credit limit"
            value={formatCurrencyAmount(
              company.creditStanding.totalCreditLimit,
              company.currency,
            )}
          />
          <Field
            label="Credit space"
            value={formatCurrencyAmount(
              company.creditStanding.creditSpace,
              company.currency,
            )}
          />
          <Field
            label="Open entrees (excl. VAT)"
            value={formatCurrencyAmount(
              company.creditStanding.openReceivables,
              company.currency,
            )}
          />
          <Field
            label="Open orders (excl. VAT)"
            value={formatCurrencyAmount(
              company.creditStanding.committedOrders,
              company.currency,
            )}
          />
          <Field
            label="Oldest invoice date open entrees"
            value={formatDateValue(
              company.creditStanding.oldestOpenInvoiceDate,
              na,
            )}
          />
          <Field
            label="Oldest due date open entrees"
            value={formatDateValue(company.creditStanding.oldestOpenDueDate, na)}
          />
          <Field label="Purchase org." value={company.purchaseOrgCompanyName} />
          <Field
            label="Member number purchase org."
            value={company.memberNumberPurchaseOrg}
          />
          <Field
            label="Payment terms"
            value={
              company.paymentTerms
                ? INVOICE_PAYMENT_TERM_LABELS[company.paymentTerms]
                : null
            }
          />
          <Field
            label="Different payment terms ex works"
            value={
              company.differentPaymentTermsExWorks
                ? INVOICE_PAYMENT_TERM_LABELS[
                    company.differentPaymentTermsExWorks
                  ]
                : null
            }
          />
          <Field
            label="Currency"
            value={company.currency ? CURRENCY_LABELS[company.currency] : null}
          />
          <Field label="IBAN" value={company.iban} />
          <Field label="BIC" value={company.bic} />
          <Field label="Bank account" value={company.bankAccount} />
          <Field label="Postbank account" value={company.postbankAccount} />
          <Field label="VAT number" value={company.vatNumber} />
          <Field label="COC number" value={company.cocNumber} />
          <Field label="Journal code" value={company.journalCode} />
          {/* A blank credit limit is not a limit of zero — nobody set one, and
              the credit check never blocks on it. Left as an em dash.

              The three limits print in the currency the customer agreed them
              in. A limit settled in dollars shown with a euro sign reads as a
              different number entirely. */}
          <Field
            label="Credit limit"
            value={
              company.creditLimit
                ? formatCurrencyAmount(company.creditLimit, company.currency)
                : null
            }
          />
          {/* The insurer's policy number, not an amount. */}
          <Field
            label="Credit limit insurance"
            value={company.creditLimitInsurance || null}
          />
          <Field
            label="Credit limit uninsured"
            value={
              company.creditLimitUninsured
                ? formatCurrencyAmount(
                    company.creditLimitUninsured,
                    company.currency,
                  )
                : null
            }
          />
          {/* The ledger is kept in euro, so a limit agreed in anything else has
              to be converted before it can be compared with a balance. */}
          <Field
            label="Needs conversion"
            value={
              company.currency
                ? yesNo(needsCurrencyConversion(company.currency))
                : null
            }
          />
          <Field
            label="Credit limit uninsured date"
            value={formatDateValue(company.creditLimitUninsuredDate, na)}
          />
          <Field
            label="Insurance valid until"
            value={formatDateValue(company.insuranceValidUntil, na)}
          />
          <Field label="Calculate VAT" value={yesNo(company.calculateVat)} />
          <Field label="Reminder" value={yesNo(company.reminder)} />
          <Field
            label="Collect invoices in mandate"
            value={yesNo(company.collectInvoicesInMandate)}
          />
        </dl>
      </section>

      {/* Invoicing */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
          Invoicing
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Invoicing method"
            value={
              company.invoicingMethod
                ? INVOICING_METHOD_LABELS[company.invoicingMethod]
                : null
            }
          />
          <Field
            label="Frequency of sending invoices"
            value={
              company.invoiceFrequency
                ? INVOICE_FREQUENCY_LABELS[company.invoiceFrequency]
                : null
            }
          />
          <Field
            label="Collective invoicing"
            value={yesNo(company.collectiveInvoicing)}
          />
          <Field
            label="Invoice packaging at zero price"
            value={yesNo(company.invoicePackagingAtZeroPrice)}
          />
          <Field
            label="Print commodity code"
            value={yesNo(company.printCommodityCode)}
          />
          <Field
            label="Print invoice"
            value={
              company.invoicePrintEnabled
                ? `Yes — ${company.invoicePrintCount ?? 1}×`
                : "No"
            }
          />
          <Field
            label="E-mail invoice to"
            value={
              company.invoiceEmailEnabled
                ? (company.invoiceEmailTo ?? "Contact person")
                : "No"
            }
          />
          <Field
            label="Print / e-mail zero value invoices"
            value={yesNo(company.printEmailZeroValueInvoices)}
          />
          <Field
            label="Send XML with invoice"
            value={yesNo(company.sendXmlWithInvoice)}
          />
        </dl>
      </section>

      {/* Documents */}
      <section className="space-y-3">
        <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
          Documents{" "}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {company.documents?.length ?? 0}
          </span>
        </h2>
        <CompanyDocumentCell company={company} />
      </section>

      {/* Addresses */}
      {company.addresses.length > 0 && (
        <section className="space-y-3">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
            Addresses{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {company.addresses.length}
            </span>
          </h2>
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Street</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Postal Code</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Telephone</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.addresses.map((addr) => (
                  <TableRow key={addr.uuid}>
                    <TableCell>{addr.streetAndNo ?? na}</TableCell>
                    <TableCell>{addr.city ?? na}</TableCell>
                    <TableCell>{addr.postalCode ?? na}</TableCell>
                    <TableCell>{addr.country ?? na}</TableCell>
                    <TableCell>{addr.telephone ?? na}</TableCell>
                    <TableCell>{addr.email ?? na}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Counter Orders */}
      {company.counterOrders.length > 0 && (
        <section className="space-y-3">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
            Counter Orders{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {company.counterOrders.length}
            </span>
          </h2>
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order no</TableHead>
                  <TableHead>Blocked</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order date</TableHead>
                  <TableHead>Delivery date</TableHead>
                  <TableHead className="text-right">Amount (ex VAT)</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                  <TableHead>Customer reference</TableHead>
                  <TableHead className="text-right">Gain%</TableHead>
                  <TableHead className="text-right">Days in system</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.counterOrders.map((order) => (
                  <TableRow key={order.uuid}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      {order.handlingBlocked ? "Yes" : "No"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={order.status}
                        label={
                          order.status
                            ? COUNTER_ORDER_STATUS_LABELS[order.status]
                            : null
                        }
                      />
                    </TableCell>
                    <TableCell>{order.orderDate ?? na}</TableCell>
                    <TableCell>{order.deliveryDate ?? na}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      € {order.amountExVat}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {order.weightKg}
                    </TableCell>
                    <TableCell>{order.customerRef ?? na}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {order.gainPercent} %
                    </TableCell>
                    <TableCell className="text-right">
                      {daysInSystem(order.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Visit Reports */}
      {company.visitReports.length > 0 && (
        <section className="space-y-3">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
            Visit Reports{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {company.visitReports.length}
            </span>
          </h2>
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Visit date</TableHead>
                  <TableHead>Visit time</TableHead>
                  <TableHead>Sort</TableHead>
                  <TableHead>Took place</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Days in system</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.visitReports.map((report) => (
                  <TableRow key={report.uuid}>
                    <TableCell>{report.visitDate ?? na}</TableCell>
                    <TableCell>{report.visitTime ?? na}</TableCell>
                    <TableCell>
                      {report.contactMethod
                        ? VISIT_REPORT_CONTACT_METHOD_LABELS[
                            report.contactMethod
                          ]
                        : na}
                    </TableCell>
                    <TableCell>{report.hasTakenPlace ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      {visitReasonsLabel(report.visitReasons) ?? na}
                    </TableCell>
                    <TableCell>{report.representative ?? na}</TableCell>
                    <TableCell className="text-right">
                      {daysInSystem(report.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Complaints */}
      {company.complaints.length > 0 && (
        <section className="space-y-3">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
            Complaints{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {company.complaints.length}
            </span>
          </h2>
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Complaint no</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Report</TableHead>
                  <TableHead>Report date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">Days in system</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.complaints.map((complaint) => (
                  <TableRow key={complaint.uuid}>
                    <TableCell className="font-medium">
                      {complaint.id}
                    </TableCell>
                    <TableCell>
                      {complaint.complaintType
                        ? COMPLAINT_TYPE_LABELS[complaint.complaintType]
                        : na}
                    </TableCell>
                    <TableCell>
                      {complaint.report
                        ? COMPLAINT_REPORT_LABELS[complaint.report]
                        : na}
                    </TableCell>
                    <TableCell>
                      {formatDateValue(complaint.reportDate, "—")}
                    </TableCell>
                    <TableCell>
                      {complaint.category
                        ? COMPLAINT_CATEGORY_LABELS[complaint.category]
                        : na}
                    </TableCell>
                    <TableCell>{complaint.description ?? na}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {complaint.qty}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      € {complaint.amount}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {complaint.weight}
                    </TableCell>
                    <TableCell className="text-right">
                      {daysInSystem(complaint.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Follow-up */}
      {company.followUps.length > 0 && (
        <section className="space-y-3">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
            Follow-up{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {company.followUps.length}
            </span>
          </h2>
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>Contact person</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="text-right">Days in system</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.followUps.map((followUp) => (
                  <TableRow key={followUp.uuid}>
                    <TableCell>{followUp.date ?? na}</TableCell>
                    <TableCell>{followUp.by ?? na}</TableCell>
                    <TableCell>{followUp.contactPerson ?? na}</TableCell>
                    <TableCell>{followUp.text ?? na}</TableCell>
                    <TableCell>{followUp.completed ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      {daysInSystem(followUp.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Purchase Orders */}
      {company.purchaseOrders.length > 0 && (
        <section className="space-y-3">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
            Purchase Orders{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {company.purchaseOrders.length}
            </span>
          </h2>
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order no</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order date</TableHead>
                  <TableHead>Delivery date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Weight (kg)</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Printed</TableHead>
                  <TableHead>Mailed</TableHead>
                  <TableHead className="text-right">Days in system</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.purchaseOrders.map((order) => (
                  <TableRow key={order.uuid}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <StatusBadge
                        value={order.status}
                        label={
                          order.status
                            ? PURCHASE_ORDER_STATUS_LABELS[order.status]
                            : null
                        }
                      />
                    </TableCell>
                    <TableCell>{order.orderDate ?? na}</TableCell>
                    <TableCell>
                      {formatDateValue(order.deliveryDate, "—")}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      € {order.amount}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {order.weightKg}
                    </TableCell>
                    <TableCell>{order.reference ?? na}</TableCell>
                    <TableCell>{order.isPrinted ? "Yes" : "No"}</TableCell>
                    <TableCell>{order.isMailed ? "Yes" : "No"}</TableCell>
                    <TableCell className="text-right">
                      {daysInSystem(order.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Return Orders */}
      {company.returnOrders.length > 0 && (
        <section className="space-y-3">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
            Return Orders{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {company.returnOrders.length}
            </span>
          </h2>
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return no</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order date</TableHead>
                  <TableHead>Return date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Customer reference</TableHead>
                  <TableHead>Our reference</TableHead>
                  <TableHead>Blocked</TableHead>
                  <TableHead className="text-right">Days in system</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.returnOrders.map((returnOrder) => (
                  <TableRow key={returnOrder.uuid}>
                    <TableCell className="font-medium">
                      {returnOrder.id}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        value={returnOrder.status}
                        label={
                          returnOrder.status
                            ? RETURN_ORDER_STATUS_LABELS[returnOrder.status]
                            : null
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {formatDateValue(returnOrder.orderDate, na)}
                    </TableCell>
                    <TableCell>
                      {formatDateValue(returnOrder.returnDate, na)}
                    </TableCell>
                    <TableCell>
                      {returnOrder.returnReason
                        ? RETURN_ORDER_REASON_LABELS[returnOrder.returnReason]
                        : na}
                    </TableCell>
                    <TableCell>{returnOrder.customerRef ?? na}</TableCell>
                    <TableCell>{returnOrder.ourReference ?? na}</TableCell>
                    <TableCell>{yesNo(returnOrder.handlingBlocked)}</TableCell>
                    <TableCell className="text-right">
                      {daysInSystem(returnOrder.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Customer Stock */}
      {company.customerStock.length > 0 && (
        <section className="space-y-3">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
            Customer Stock{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {company.customerStock.length}
            </span>
          </h2>
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Product code</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Days in system</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {company.customerStock.map((stock) => (
                  <TableRow key={stock.uuid}>
                    <TableCell>{stock.location ?? na}</TableCell>
                    <TableCell>{stock.productCode ?? na}</TableCell>
                    <TableCell>{stock.productName ?? na}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {stock.quantity}
                    </TableCell>
                    <TableCell>
                      {stock.reason
                        ? CUSTOMER_STOCK_REASON_LABELS[stock.reason]
                        : na}
                    </TableCell>
                    <TableCell>{stock.description ?? na}</TableCell>
                    <TableCell className="text-right">
                      {daysInSystem(stock.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Invoices — customer role only */}
      {isCustomer && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Invoices{" "}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {invoices?.length ?? 0}
              </span>
            </h2>
            <Link
              href="/invoices/add"
              className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-accent"
            >
              <Plus className="size-3.5" />
              New Invoice
            </Link>
          </div>

          {invoices && invoices.length > 0 ? (
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Expiration Date</TableHead>
                    <TableHead className="text-right">Excl. VAT</TableHead>
                    <TableHead className="text-right">Incl. VAT</TableHead>
                    <TableHead className="text-right">
                      Credit Restriction
                    </TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>VAT Scenario</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.uuid}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {inv.id}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {inv.invoiceDate?.toLocaleDateString() ?? na}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {inv.expirationDate?.toLocaleDateString() ?? na}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        € {inv.invoiceAmountExclVat}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        € {inv.invoiceAmountInclVat}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        € {inv.creditRestriction}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        € {inv.invoiceTotal}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        € {inv.outstanding}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {inv.vatScenario
                          ? INVOICE_VAT_SCENARIO_LABELS[inv.vatScenario]
                          : na}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {inv.paymentTerms
                          ? INVOICE_PAYMENT_TERM_LABELS[inv.paymentTerms]
                          : na}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {inv.calculateVat && (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                              VAT
                            </span>
                          )}
                          {inv.printed && (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              Printed
                            </span>
                          )}
                          {inv.mailed && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              Mailed
                            </span>
                          )}
                          {!inv.calculateVat && !inv.printed && !inv.mailed && (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          )}
        </section>
      )}
    </div>
  );
};
