import { CompanyDetail } from "@/app/(dashboard)/companies/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { daysInSystem, formatDateValue } from "@/lib/helpers";
import { SelectInvoices } from "@/db";
import {
  COMMON_TEXT,
  COMPANY_LANGUAGE_LABELS,
  COMPANY_ROLE_LABELS,
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_REPORT_LABELS,
  COMPLAINT_TYPE_LABELS,
  COUNTER_ORDER_STATUS_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  INVOICE_VAT_SCENARIO_LABELS,
  VISIT_REPORT_CONTACT_METHOD_LABELS,
  VISIT_REPORT_REASON_LABELS,
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/lib/labels";
import { Plus } from "lucide-react";
import Link from "next/link";

type Props = {
  company: CompanyDetail;
  invoices?: SelectInvoices[];
};

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </dt>
    <dd className="mt-0.5 text-sm text-gray-900">
      {value || COMMON_TEXT.notAvailable}
    </dd>
  </div>
);

// Number of whole days since the record was created.

export const CompanyDetailView = ({ company, invoices }: Props) => {
  const isCustomer = company.roles?.includes("customer");
  const na = COMMON_TEXT.notAvailable;

  return (
    <div className="space-y-8">
      {/* General info */}
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
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
          {company.remarks && (
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="Remarks" value={company.remarks} />
            </div>
          )}
        </dl>
      </section>

      {/* Addresses */}
      {company.addresses.length > 0 && (
        <section className="space-y-3">
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Addresses{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {company.addresses.length}
            </span>
          </h2>
          <div className="overflow-x-auto rounded-lg border">
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
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Counter Orders{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {company.counterOrders.length}
            </span>
          </h2>
          <div className="overflow-x-auto rounded-lg border">
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
                      {order.status ? COUNTER_ORDER_STATUS_LABELS[order.status] : COMMON_TEXT.notAvailable}
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
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Visit Reports{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {company.visitReports.length}
            </span>
          </h2>
          <div className="overflow-x-auto rounded-lg border">
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
                      {report.visitReason
                        ? VISIT_REPORT_REASON_LABELS[report.visitReason]
                        : na}
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
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Complaints{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {company.complaints.length}
            </span>
          </h2>
          <div className="overflow-x-auto rounded-lg border">
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
                    <TableCell>{formatDateValue(complaint.reportDate, COMMON_TEXT.notAvailable)}</TableCell>
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
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Follow-up{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {company.followUps.length}
            </span>
          </h2>
          <div className="overflow-x-auto rounded-lg border">
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
          <h2 className="border-b pb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">
            Purchase Orders{" "}
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              {company.purchaseOrders.length}
            </span>
          </h2>
          <div className="overflow-x-auto rounded-lg border">
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
                      {PURCHASE_ORDER_STATUS_LABELS[order.status]}
                    </TableCell>
                    <TableCell>{order.orderDate ?? na}</TableCell>
                    <TableCell>{formatDateValue(order.deliveryDate, COMMON_TEXT.notAvailable)}</TableCell>
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

      {/* Invoices — customer role only */}
      {isCustomer && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
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
            <div className="overflow-x-auto rounded-lg border">
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
