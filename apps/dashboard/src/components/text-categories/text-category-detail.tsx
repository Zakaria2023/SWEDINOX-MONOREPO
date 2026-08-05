import Link from "next/link";
import { TextCategoryDetail } from "@/app/(dashboard)/text-categories/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { DetailField } from "@/components/ui/detail-field";
import { formatDateValue, orDash, yesNo } from "@/lib/helpers";
import { TEXT_USAGE_CATEGORY_LABELS } from "@/lib/labels";

type Props = {
  category: TextCategoryDetail;
};

export const TextCategoryDetailView = ({ category }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Text group</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Name" value={category.name} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Parent group
          </p>
          {category.parentUuid && category.parentName ? (
            <Link
              href={`/text-categories/${category.parentUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {category.parentName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Sequence number"
          value={category.sequenceNumber}
        />
        <DetailField label="Active" value={yesNo(category.isActive)} />
        <DetailField
          label="Created"
          value={formatDateValue(category.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(category.updatedAt)}
        />
      </div>
      <DetailField label="Description" value={category.description} />
      <DetailField
        label="Usage categories"
        value={
          category.usageCategoriesJson.length > 0
            ? category.usageCategoriesJson
                .map((usage) => TEXT_USAGE_CATEGORY_LABELS[usage])
                .join(", ")
            : null
        }
      />
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">Sub-groups</h2>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Sequence</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {category.children.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  This group has no sub-groups.
                </TableCell>
              </TableRow>
            ) : (
              category.children.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/text-categories/${row.uuid}`}
                      className="text-primary hover:underline"
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.sequenceNumber)}
                  </TableCell>
                  <TableCell>{yesNo(row.isActive)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">
        Texts in this group
      </h2>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Sequence</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {category.texts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  No texts are filed under this group.
                </TableCell>
              </TableRow>
            ) : (
              category.texts.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/texts/${row.uuid}`}
                      className="text-primary hover:underline"
                    >
                      {row.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(row.sequenceNumber)}
                  </TableCell>
                  <TableCell>{yesNo(row.isActive)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  </div>
);
