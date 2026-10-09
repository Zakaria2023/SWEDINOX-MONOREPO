import {
  CompanyDetail,
  CompanyRelatedRecords,
} from "@/app/(dashboard)/companies/actions";
import { CompanyDocumentCell } from "@/components/companies/company-document-cell";
import { CompanyQuoteOrderLinesPanel } from "@/components/companies/company-quote-order-lines-panel";
import {
  CompanyAddressesPanel,
  CompanyCommunicationPanel,
  CompanyContactsPanel,
  CompanyContractsPanel,
  CompanyCustomerStockPanel,
  CompanyInvoicesPanel,
  CompanyOrdersPanel,
  CompanyPurchaseLinesPanel,
  CompanyPurchaseOrdersPanel,
  CompanyPurchaseQuotesPanel,
  CompanyPurchaseRequestsPanel,
  CompanyQuotesPanel,
  CompanyRelatedPanels,
} from "@/components/companies/company-related-panels";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { StatusBadge } from "@/components/ui/status-badge";
import { companyRoles } from "@/lib/enums";
import { MONTHS } from "@/lib/constants";
import {
  daysInSystem,
  formatCurrencyAmount,
  formatDateValue,
  formatRevenue,
  needsCurrencyConversion,
  pluralize,
  userName,
  visitReasonsLabel,
  yesNo,
} from "@/lib/helpers";
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
  DEV_THEOR_WT_LABELS,
  EDI_OPTION_LABELS,
  GROUP_LINES_BY_DESCRIPTION_LABELS,
  INVOICE_FREQUENCY_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
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
} from "@/lib/labels";
import { Square, SquareCheck } from "lucide-react";

type Props = {
  company: CompanyDetail;
  related: CompanyRelatedRecords;
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

export const CompanyDetailView = ({ company, related, userNames }: Props) => {
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
    <div className="space-y-3">
      {/* The reference's header: the nine roles as ticks, the company
          code and its creation date, the names and language, the search
          codes. */}
      <section className="grid gap-6 rounded-lg border border-border p-4 lg:grid-cols-4">
        <ul className="space-y-1">
          {companyRoles.map((role) => (
            <li key={role} className="flex items-center gap-2 text-sm">
              {company.roles?.includes(role) ? (
                <SquareCheck className="size-4 text-primary" />
              ) : (
                <Square className="size-4 text-muted-foreground" />
              )}
              {COMPANY_ROLE_LABELS[role]}
            </li>
          ))}
        </ul>
        <dl className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <div className="text-sm text-muted-foreground sm:col-span-2">
            Company (created on {formatDateValue(company.createdAt, na)})
          </div>
          <Field label="Company code" value={company.id} />
          <Field label="Company Name" value={company.companyName} />
          <Field label="Correspondence Name" value={company.correspName} />
          <Field
            label="Language"
            value={company.lang ? COMPANY_LANGUAGE_LABELS[company.lang] : null}
          />
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
            label="Last updated"
            value={formatDateValue(company.updatedAt, na)}
          />
        </dl>
        <dl className="grid content-start gap-4">
          <Field label="Search Code 1" value={company.searchCode1} />
          <Field label="Search Code 2" value={company.searchCode2} />
          <Field label="Search Code 3" value={company.searchCode3} />
        </dl>
      </section>

      <CompanyAddressesPanel
        companyUuid={company.uuid}
        addresses={company.addresses}
      />
      <CompanyContactsPanel
        companyUuid={company.uuid}
        contacts={related.contacts}
      />
      <CollapsibleSection
        title="Remarks"
        summary={company.remarks ? null : "No remarks"}
      >
        <p className="text-sm whitespace-pre-wrap">{company.remarks}</p>
      </CollapsibleSection>
      <CompanyQuotesPanel quotes={related.quotes} />
      <CompanyOrdersPanel orders={related.orders} />
      <CompanyQuoteOrderLinesPanel lines={related.quoteAndOrderLines} />
      <CompanyPurchaseRequestsPanel requests={related.purchaseRequests} />
      <CompanyPurchaseQuotesPanel quotes={related.purchaseQuotes} />
      <CompanyPurchaseOrdersPanel purchaseOrders={company.purchaseOrders} />
      <CompanyPurchaseLinesPanel lines={related.purchaseLines} />
      <CompanyCustomerStockPanel
        companyUuid={company.uuid}
        companyName={company.companyName}
        stock={company.customerStock}
      />
      <CompanyInvoicesPanel invoices={related.invoices} />
      {/* Counter Orders */}
      <CollapsibleSection
        title="Counter Orders"
        summary={`${company.counterOrders.length} ${pluralize(company.counterOrders.length, "counter order")}`}
      >
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
      </CollapsibleSection>

      {/* Documents */}
      <CollapsibleSection
        title="Documents"
        summary={`${company.documents?.length ?? 0} Documents`}
      >
        <CompanyDocumentCell company={company} />
      </CollapsibleSection>

      {/* Visit Reports */}
      <CollapsibleSection
        title="Visit reports"
        summary={`${company.visitReports.length} ${pluralize(company.visitReports.length, "visit report")}`}
      >
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
      </CollapsibleSection>

      <CompanyCommunicationPanel communications={related.communications} />
      <CompanyContractsPanel contracts={related.contracts} />

      {/* Debtor */}
      <CollapsibleSection
        title="Debtor"
        summary={`Debtor no: ${company.debtorNumber ?? ""}`}
      >
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
      </CollapsibleSection>

      {/* Invoicing */}
      <CollapsibleSection title="Invoicing">
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
      </CollapsibleSection>

      {/* Sales settings */}
      <CollapsibleSection
        title="Sales"
        summary={`Customer group: ${company.customerGroup ? CUSTOMER_GROUP_LABELS[company.customerGroup] : ""}`}
      >
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
      </CollapsibleSection>

      {/* Marketing */}
      <CollapsibleSection title="Marketing">
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
      </CollapsibleSection>

      {/* Complaints */}
      {company.complaints.length > 0 && (
        <CollapsibleSection title="Complaints">
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
        </CollapsibleSection>
      )}

      {/* Follow-up */}
      {company.followUps.length > 0 && (
        <CollapsibleSection title="Follow-up">
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
        </CollapsibleSection>
      )}

      {/* Return Orders */}
      {company.returnOrders.length > 0 && (
        <CollapsibleSection title="Return Orders">
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
        </CollapsibleSection>
      )}

      <CompanyRelatedPanels records={related} />
    </div>
  );
};
