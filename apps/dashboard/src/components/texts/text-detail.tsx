import Link from "next/link";
import { TextDetail } from "@/app/(dashboard)/texts/actions";
import { BooleanFlag } from "@/components/ui/boolean-flag";
import { DetailField } from "@/components/ui/detail-field";
import {
  activeTextUsageCategories,
  formatDateValue,
  TEXT_USAGE_CATEGORY_FIELDS,
  yesNo,
} from "@/lib/helpers";
import { TEXT_USAGE_CATEGORY_LABELS } from "@/lib/labels";

type Props = {
  text: TextDetail;
};

type AttachedDocument = {
  label: string;
  href: string;
};

// The one document a text hangs off, if any. A text carries at most one of these
// keys, so the first one set is the answer; a text with none is a library text
// that belongs to the company (or to nothing) rather than to a document.
const attachedDocumentOf = (text: TextDetail): AttachedDocument | null => {
  if (text.orderUuid && text.orderId !== null) {
    return { label: `Order #${text.orderId}`, href: `/orders/${text.orderUuid}` };
  }
  if (text.quoteUuid && text.quoteId !== null) {
    return { label: `Quote #${text.quoteId}`, href: `/quotes/${text.quoteUuid}` };
  }
  if (text.counterOrderUuid && text.counterOrderId !== null) {
    return {
      label: `Counter order #${text.counterOrderId}`,
      href: `/counter-orders/${text.counterOrderUuid}`,
    };
  }
  if (text.returnOrderUuid && text.returnOrderId !== null) {
    return {
      label: `Return order #${text.returnOrderId}`,
      href: `/return-orders/${text.returnOrderUuid}`,
    };
  }
  if (text.purchaseOrderUuid && text.purchaseOrderId !== null) {
    return {
      label: `Purchase order #${text.purchaseOrderId}`,
      href: `/purchase-orders/${text.purchaseOrderUuid}`,
    };
  }
  if (text.purchaseQuoteUuid && text.purchaseQuoteId !== null) {
    return {
      label: `Purchase quote #${text.purchaseQuoteId}`,
      href: `/purchase-quotes/${text.purchaseQuoteUuid}`,
    };
  }
  if (text.purchaseRequestUuid && text.purchaseRequestId !== null) {
    return {
      label: `Purchase request #${text.purchaseRequestId}`,
      href: `/purchase-requests/${text.purchaseRequestUuid}`,
    };
  }
  if (text.purchaseReturnOrderUuid && text.purchaseReturnOrderId !== null) {
    return {
      label: `Purchase return order #${text.purchaseReturnOrderId}`,
      href: `/purchase-return-orders/${text.purchaseReturnOrderUuid}`,
    };
  }
  return null;
};

export const TextDetailView = ({ text }: Props) => {
  const document = attachedDocumentOf(text);
  const usedOn = activeTextUsageCategories(text);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Text</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Title" value={text.title} />
          <DetailField label="Text group" value={text.textCategoryName} />
          <DetailField
            label="Group description"
            value={text.textCategoryDescription}
          />
          <DetailField label="Sequence number" value={text.sequenceNumber} />
          <DetailField label="Active" value={yesNo(text.isActive)} />
          <DetailField label="Created by" value={text.createdByUserId} />
          <DetailField label="Created" value={formatDateValue(text.createdAt)} />
          <DetailField
            label="Last modified"
            value={formatDateValue(text.updatedAt)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Attached to</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Company
            </p>
            {text.companyUuid && text.companyName ? (
              <Link
                href={`/companies/${text.companyUuid}`}
                className="text-sm text-primary hover:underline"
              >
                {text.companyName}
              </Link>
            ) : (
              <p className="text-sm">—</p>
            )}
          </div>
          <DetailField label="Company code" value={text.companyId} />
          <DetailField
            label="Company roles"
            value={text.roles?.join(", ") ?? null}
          />
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Document
            </p>
            {document ? (
              <Link
                href={document.href}
                className="text-sm text-primary hover:underline"
              >
                {document.label}
              </Link>
            ) : (
              <p className="text-sm">—</p>
            )}
          </div>
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Product group
            </p>
            {text.productGroupUuid && text.productGroupName ? (
              <Link
                href={`/product-groups/${text.productGroupUuid}`}
                className="text-sm text-primary hover:underline"
              >
                {text.productGroupName}
              </Link>
            ) : (
              <p className="text-sm">—</p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Printed on</h2>
        <p className="text-sm text-muted-foreground">
          {usedOn.length > 0
            ? usedOn.join(", ")
            : "This text is not switched on for any document."}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
          {TEXT_USAGE_CATEGORY_FIELDS.map(({ key, field }) => (
            <div key={field} className="flex items-center gap-2">
              <BooleanFlag
                on={text[field]}
                label={TEXT_USAGE_CATEGORY_LABELS[key]}
              />
              <span className="text-sm">
                {TEXT_USAGE_CATEGORY_LABELS[key]}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Text block</h2>
        <p className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
          {text.textBlock}
        </p>
      </section>
    </div>
  );
};
