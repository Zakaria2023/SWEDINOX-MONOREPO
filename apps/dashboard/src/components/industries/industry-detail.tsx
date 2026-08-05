import Link from "next/link";
import { IndustryDetail } from "@/app/(dashboard)/industries/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { DetailField } from "@/components/ui/detail-field";
import { formatDateValue, orDash, pluralize } from "@/lib/helpers";
import {
  COMPANY_CLASSIFICATION_LABELS,
  COMPANY_ROLE_LABELS,
} from "@/lib/labels";

type Props = {
  industry: IndustryDetail;
};

export const IndustryDetailView = ({ industry }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Industry</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="SBI code" value={industry.id} />
        <DetailField label="Name" value={industry.name} />
        <DetailField
          label="Created"
          value={formatDateValue(industry.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(industry.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">
        Companies in this industry
      </h2>
      <p className="text-sm text-muted-foreground">
        {industry.companies.length}{" "}
        {pluralize(industry.companies.length, "company", "companies")}
      </p>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Classification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {industry.companies.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No companies are filed under this industry.
                </TableCell>
              </TableRow>
            ) : (
              industry.companies.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell className="tabular-nums">
                    {orDash(row.id)}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/companies/${row.uuid}`}
                      className="text-primary hover:underline"
                    >
                      {row.companyName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {row.roles && row.roles.length > 0
                      ? row.roles
                          .map((role) => COMPANY_ROLE_LABELS[role])
                          .join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {row.classification
                      ? COMPANY_CLASSIFICATION_LABELS[row.classification]
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  </div>
);
