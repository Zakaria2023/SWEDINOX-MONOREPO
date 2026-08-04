import Link from "next/link";
import { ComplaintLineRow } from "@/app/(dashboard)/complaint-lines/actions";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatDateValue,
  formatMoney,
} from "@/lib/helpers";
import {
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_CAUSE_LABELS,
  COMPLAINT_SOLUTION_LABELS,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_TYPE_LABELS,
  CUSTOMER_GROUP_LABELS,
  SALES_REPRESENTATIVE_LABELS,
} from "@/lib/labels";

type Props = {
  line: ComplaintLineRow;
};

export const ComplaintLineDetailView = ({ line }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Complaint</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Complaint
          </p>
          <Link
            href={`/complaints/${line.complaintUuid}`}
            className="text-sm text-primary hover:underline"
          >
            {line.complaintNumber === null
              ? "View complaint"
              : `#${line.complaintNumber}`}
          </Link>
        </div>
        <DetailField
          label="Report date"
          value={formatDateColumn(line.reportDate)}
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Company
          </p>
          {line.companyUuid && line.companyName ? (
            <Link
              href={`/companies/${line.companyUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {line.companyName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Company code" value={line.companyCode} />
        <DetailField
          label="Customer group"
          value={
            line.customerGroup
              ? CUSTOMER_GROUP_LABELS[line.customerGroup]
              : null
          }
        />
        <DetailField
          label="Representative"
          value={
            line.representative
              ? SALES_REPRESENTATIVE_LABELS[line.representative]
              : null
          }
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        What went wrong
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Line number" value={line.lineNumber} />
        <DetailField
          label="Category"
          value={
            line.category ? COMPLAINT_CATEGORY_LABELS[line.category] : null
          }
        />
        <DetailField
          label="Complaint type"
          value={
            line.complaintType
              ? COMPLAINT_TYPE_LABELS[line.complaintType]
              : null
          }
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Order
          </p>
          {line.orderUuid && line.orderId !== null ? (
            <Link
              href={`/orders/${line.orderUuid}`}
              className="text-sm text-primary hover:underline"
            >
              #{line.orderId}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Order line
          </p>
          {line.orderItemUuid ? (
            <Link
              href={`/order-lines/${line.orderItemUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {line.orderLineNumber === null
                ? "View line"
                : `Line ${line.orderLineNumber}`}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Order seller" value={line.orderSeller} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Product
          </p>
          {line.productUuid && line.productCode ? (
            <Link
              href={`/products/${line.productUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {[line.productCode, line.productName]
                .filter(Boolean)
                .join(" — ")}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Warehouse section
          </p>
          {line.warehouseSectionUuid && line.warehouseSection ? (
            <Link
              href={`/warehouses/${line.warehouseSectionUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {line.warehouseSection}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
      </div>
      <DetailField label="Description" value={line.description} />
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Handling</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Status"
          value={line.status ? COMPLAINT_STATUS_LABELS[line.status] : null}
        />
        <DetailField
          label="Status date"
          value={formatDateColumn(line.statusDate)}
        />
        <DetailField
          label="Deadline"
          value={formatDateColumn(line.deadline)}
        />
        <DetailField
          label="Cause"
          value={line.cause ? COMPLAINT_CAUSE_LABELS[line.cause] : null}
        />
        <DetailField
          label="Solution"
          value={
            line.solution ? COMPLAINT_SOLUTION_LABELS[line.solution] : null
          }
        />
        <DetailField label="Responsible" value={line.responsibleName} />
        <DetailField label="Created by" value={line.createdByName} />
        <DetailField
          label="Purchaser / seller"
          value={line.purchaserSeller}
        />
        <DetailField
          label="Correspondence name"
          value={line.correspondenceName}
        />
        <DetailField label="Created" value={formatDateValue(line.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(line.updatedAt)}
        />
      </div>
      <DetailField
        label="Explanation of cause"
        value={line.explanationOfCause}
      />
      <DetailField
        label="Explanation of solution"
        value={line.explanationOfSolution}
      />
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Quantity complained about
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DetailField label="Quantity" value={line.qty} />
        <DetailField label="Weight (kg)" value={line.weightKg} />
        <DetailField
          label="Amount"
          value={formatMoney(Number(line.amount ?? 0))}
        />
      </div>
    </section>
  </div>
);
