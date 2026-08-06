import Link from "next/link";
import { TextDetail } from "@/app/(dashboard)/texts/actions";
import { BooleanFlag } from "@/components/ui/boolean-flag";
import { DetailField } from "@/components/ui/detail-field";
import {
  TEXT_USAGE_CATEGORY_FIELDS,
  activeTextUsageCategories,
  attachedDocumentOf,
  formatDateValue,
  userName,
  yesNo,
} from "@/lib/helpers";
import { TEXT_USAGE_CATEGORY_LABELS } from "@/lib/labels";

type Props = {
  /** Clerk id -> name; these columns store the id, not the name. */
  userNames: Record<string, string>;
  text: TextDetail;
};

export const TextDetailView = ({ text, userNames }: Props) => {
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
          <DetailField
            label="Created by"
            value={userName(text.createdByUserId, userNames)}
          />
          <DetailField
            label="Created"
            value={formatDateValue(text.createdAt)}
          />
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
              <span className="text-sm">{TEXT_USAGE_CATEGORY_LABELS[key]}</span>
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
