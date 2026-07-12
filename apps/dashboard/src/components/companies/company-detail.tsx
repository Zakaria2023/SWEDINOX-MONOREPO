import { CompanyDetail } from "@/app/(dashboard)/companies/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { SelectInvoices } from "@/db";
import {
  COMMON_TEXT,
  COMPANY_LANGUAGE_LABELS,
  COMPANY_ROLE_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  INVOICE_VAT_SCENARIO_LABELS,
  VISIT_REPORT_CONTACT_METHOD_LABELS,
  VISIT_REPORT_REASON_LABELS,
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

// Number of whole days since the visit report was created.
const daysInSystem = (createdAt: Date) =>
  Math.max(
    0,
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000),
  );

export const CompanyDetailView = ({ company, invoices }: Props) => {
  const isCustomer = company.roles.includes("customer");
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
              {company.roles.length > 0 ? (
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
