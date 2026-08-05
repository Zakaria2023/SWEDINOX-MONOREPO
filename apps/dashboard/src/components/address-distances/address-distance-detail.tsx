import Link from "next/link";
import { AddressDistanceDetail } from "@/app/(dashboard)/address-distances/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { DetailField } from "@/components/ui/detail-field";
import { formatDateValue, formatNumber, orDash } from "@/lib/helpers";

type Props = {
  distance: AddressDistanceDetail;
};

export const AddressDistanceDetailView = ({ distance }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Distance</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Company
          </p>
          {distance.companyUuid && distance.companyName ? (
            <Link
              href={`/companies/${distance.companyUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {distance.companyName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Company code" value={distance.companyId} />
        <DetailField
          label="Distance"
          value={
            distance.km === null
              ? null
              : `${formatNumber(Number(distance.km))} km`
          }
        />
        <DetailField label="Street" value={distance.street} />
        <DetailField label="Postal code" value={distance.postalCode} />
        <DetailField label="City" value={distance.city} />
        <DetailField label="Country" value={distance.country} />
        <DetailField
          label="Created"
          value={formatDateValue(distance.createdAt)}
        />
        <DetailField
          label="Last modified"
          value={formatDateValue(distance.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">
        Addresses this distance applies to
      </h2>
      <p className="text-sm text-muted-foreground">
        Matched on the company plus the city and postal code recorded above — a
        distance is held against a place rather than against one address row.
      </p>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Street and number</TableHead>
              <TableHead>Alternative name</TableHead>
              <TableHead>Postal code</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Country</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {distance.matchingAddresses.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No address on this company matches the place recorded here.
                </TableCell>
              </TableRow>
            ) : (
              distance.matchingAddresses.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/addresses/${row.uuid}`}
                      className="text-primary hover:underline"
                    >
                      {row.streetAndNo ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>{orDash(row.altName)}</TableCell>
                  <TableCell>{orDash(row.postalCode)}</TableCell>
                  <TableCell>{orDash(row.city)}</TableCell>
                  <TableCell>{orDash(row.country)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  </div>
);
