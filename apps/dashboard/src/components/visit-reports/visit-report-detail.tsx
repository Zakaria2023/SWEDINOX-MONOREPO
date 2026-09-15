import Link from "next/link";
import { VisitReportDetail } from "@/app/(dashboard)/visit-reports/actions";
import { DetailField } from "@/components/ui/detail-field";
import { MONTHS } from "@/lib/constants";
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

export const VisitReportDetailView = ({ report }: Props) => {
  const plannedMonths = MONTHS.flatMap((month, index) => {
    const entry = report.companyVisitPlanning?.[index];
    const planned = [
      entry?.visit ? "visit" : null,
      entry?.call ? "call" : null,
    ].filter(Boolean);
    return planned.length > 0 ? [`${month}: ${planned.join(", ")}`] : [];
  });
  const companyMarketingHref = `/companies/${report.companyUuid}/edit/marketing`;

  return (
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
          Visiting address of the company
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Address" value={report.visitStreetAndNo} />
          <DetailField label="Postal code" value={report.visitPostalCode} />
          <DetailField label="City" value={report.visitCity} />
          <DetailField label="Telephone" value={report.visitTelephone} />
          <DetailField label="Fax" value={report.visitFax} />
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
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-base font-semibold">Company marketing</h2>
          <Link
            href={companyMarketingHref}
            className="text-sm text-primary hover:underline"
          >
            Edit on the company
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Industry (SBI)
            </p>
            {report.companyIndustry ? (
              <Link
                href={`/industries/${encodeURIComponent(report.companyIndustry)}`}
                className="text-sm text-primary hover:underline"
              >
                {report.companyIndustry}
              </Link>
            ) : (
              <p className="text-sm">—</p>
            )}
          </div>
          <DetailField
            label="Classification"
            value={
              report.companyClassification
                ? COMPANY_CLASSIFICATION_LABELS[report.companyClassification]
                : null
            }
          />
          <DetailField
            label="Visit frequency"
            value={report.companyVisitFrequency}
          />
          <DetailField
            label="Call frequency per year"
            value={report.companyCallFrequencyPerYear}
          />
          <DetailField
            label="Target date next visit"
            value={formatDateColumn(report.companyTargetDateNextVisit)}
          />
          <DetailField
            label="Next visit reason"
            value={
              report.companyNextVisitReason
                ? VISIT_REPORT_REASON_LABELS[report.companyNextVisitReason]
                : null
            }
          />
          <DetailField
            label="Number of employees"
            value={report.companyNumberOfEmployees}
          />
          <DetailField
            label="Potential annual revenue"
            value={
              report.companyPotentialAnnualRevenue === null
                ? null
                : formatMoney(Number(report.companyPotentialAnnualRevenue))
            }
          />
          <DetailField
            label="Target annual revenue"
            value={
              report.companyTargetAnnualRevenue === null
                ? null
                : formatMoney(Number(report.companyTargetAnnualRevenue))
            }
          />
          <DetailField
            label="Potential annual sales"
            value={report.companyPotentialAnnualSales}
          />
          <DetailField
            label="Target annual sales"
            value={report.companyTargetAnnualSales}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">
          Company visit planning
        </h2>
        <p className="text-sm text-muted-foreground">
          {plannedMonths.length > 0
            ? plannedMonths.join(" · ")
            : "No visit planning has been recorded on the company."}
        </p>
      </section>
    </div>
  );
};
