import Link from "next/link";
import { Pencil } from "lucide-react";
import { getAddresses, type AddressListItem } from "@/app/(dashboard)/addresses/actions";
import { buttonVariants } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { DeleteAddressButton } from "@/components/addresses/delete-address-button";
import { cn } from "@/lib/helpers";
import { unstable_noStore as noStore } from "next/cache";

const formatAddressLabel = (address: AddressListItem) =>
  address.CompanyAddresses.altName ||
  address.CompanyAddresses.streetAndNo ||
  `${address.CompanyAddresses.id}`;

export const AddressesTable = async () => {
  noStore();

  const addresses = await getAddresses();

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Alt Name</TableHead>
            <TableHead>Street & No</TableHead>
            <TableHead>Postal Code</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Country</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {addresses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                No addresses found
              </TableCell>
            </TableRow>
          ) : (
            addresses.map((address) => (
              <TableRow key={address.CompanyAddresses.id}>
                <TableCell className="font-medium">
                  {address.CompanyAddresses.id}
                </TableCell>
                <TableCell>{address.Companies?.companyName || "-"}</TableCell>
                <TableCell>{address.CompanyAddresses.altName || "-"}</TableCell>
                <TableCell>{address.CompanyAddresses.streetAndNo || "-"}</TableCell>
                <TableCell>{address.CompanyAddresses.postalCode || "-"}</TableCell>
                <TableCell>{address.CompanyAddresses.city || "-"}</TableCell>
                <TableCell>{address.CompanyAddresses.country || "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {address.CompanyAddresses.category.map((category) => (
                      <span
                        key={category}
                        className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      address.CompanyAddresses.addressComplete
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {address.CompanyAddresses.addressComplete
                      ? "Complete"
                      : "Incomplete"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link
                      href={`/addresses/${address.CompanyAddresses.id}/edit`}
                      className={cn(
                        buttonVariants({
                          size: "icon-sm",
                          variant: "ghost",
                        }),
                      )}
                    >
                      <Pencil />
                      <span className="sr-only">Edit address</span>
                    </Link>
                    <DeleteAddressButton
                      addressId={address.CompanyAddresses.id}
                      label={formatAddressLabel(address)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
