import Link from "next/link";
import { VisitReportDetail } from "@/app/(dashboard)/visit-reports/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatMoney,
  formatDateValue,
  fullName,
  yesNo,
} from "@/lib/helpers";
import {
  COMPANY_CLASSIFICATION_LABELS,
  VISIT_REPORT_CATEGORY_LABELS,
  VISIT_REPORT_CONTACT_METHOD_LABELS,
  VISIT_REPORT_REASON_LABELS,
} from "@/lib/labels";

type Props = {
  report: VisitReportDetail;
};

export const VisitReportDetailView = ({ report }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Visit</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Company
          </p>
          <Link
            href={`/companies/${report.companyUuid}`}
            className="text-sm text-primary hover:underline"
          >
            {report.companyName}
          </Link>
        </div>
        <DetailField label="Company code" value={report.companyId} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Contact
          </p>
          {report.contactUuid ? (
            <Link
              href={`/contacts/${report.contactUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {fullName(report.contactFirstName, report.contactLastName)}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Representative" value={report.representative} />
        <DetailField label="Visited by" value={report.visitedBy} />
        <DetailField
          label="Contact method"
          value={
            report.contactMethod
              ? VISIT_REPORT_CONTACT_METHOD_LABELS[report.contactMethod]
              : null
          }
        />
        <DetailField label="Visit date" value={report.visitDate} />
        <DetailField label="Visit time" value={report.visitTime} />
        <DetailField
          label="Has taken place"
          value={yesNo(report.hasTakenPlace)}
        />
        <DetailField
          label="Visit reason"
          value={
            report.visitReason
              ? VISIT_REPORT_REASON_LABELS[report.visitReason]
              : null
          }
        />
        <DetailField
          label="Categories"
          value={
            report.categories && report.categories.length > 0
              ? report.categories
                  .map((category) => VISIT_REPORT_CATEGORY_LABELS[category])
                  .join(", ")
              : null
          }
        />
        <DetailField
          label="Created"
          value={formatDateValue(report.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(report.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Address visited
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Address" value={report.address} />
        <DetailField label="Postal code" value={report.postalCode} />
        <DetailField label="City" value={report.city} />
        <DetailField label="Telephone" value={report.telephone} />
        <DetailField label="Fax" value={report.fax} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Report</h2>
      <DetailField label="Attention point" value={report.attentionPoint} />
      <DetailField label="Remarks" value={report.remarks} />
      <DetailField
        label="Readers"
        value={
          report.readers && report.readers.length > 0
            ? report.readers.join(", ")
            : null
        }
      />
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Marketing</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Industry (SBI)
          </p>
          {report.industry ? (
            <Link
              href={`/industries/${encodeURIComponent(report.industry)}`}
              className="text-sm text-primary hover:underline"
            >
              {report.industry}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Classification"
          value={
            report.classification
              ? COMPANY_CLASSIFICATION_LABELS[report.classification]
              : null
          }
        />
        <DetailField label="Visit frequency" value={report.visitFrequency} />
        <DetailField
          label="Call frequency per year"
          value={report.callFrequencyPerYear}
        />
        <DetailField
          label="Target date next visit"
          value={formatDateColumn(report.targetDateNextVisit)}
        />
        <DetailField
          label="Next visit reason"
          value={
            report.nextVisitReason
              ? VISIT_REPORT_REASON_LABELS[report.nextVisitReason]
              : null
          }
        />
        <DetailField
          label="Number of employees"
          value={report.numberOfEmployees}
        />
        <DetailField
          label="Potential annual revenue"
          value={
            report.potentialAnnualRevenue === null
              ? null
              : formatMoney(Number(report.potentialAnnualRevenue))
          }
        />
        <DetailField
          label="Target annual revenue"
          value={
            report.targetAnnualRevenue === null
              ? null
              : formatMoney(Number(report.targetAnnualRevenue))
          }
        />
        <DetailField
          label="Potential annual sales"
          value={report.potentialAnnualSales}
        />
        <DetailField
          label="Target annual sales"
          value={report.targetAnnualSales}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Visit planning</h2>
      <p className="text-sm text-muted-foreground">
        {report.visitPlanning && report.visitPlanning.length > 0
          ? "The yearly grid, January through December."
          : "No visit planning has been recorded."}
      </p>
      {report.visitPlanning && report.visitPlanning.length > 0 && (
        <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-4 text-xs">
          {JSON.stringify(report.visitPlanning, null, 2)}
        </pre>
      )}
    </section>
  </div>
);
