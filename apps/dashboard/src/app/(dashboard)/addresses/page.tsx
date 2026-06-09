import Link from "next/link";
import { AddressesTable } from "@/components/addresses/addresses-table";

const AddressesPage = () => (
  <div className="space-y-6 p-6">
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Company Addresses</h1>
        <p className="mt-2 text-gray-600">
          Manage company addresses and their details
        </p>
      </div>
      <Link
        href="/addresses/add"
        className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
      >
        New Address
      </Link>
    </div>

    <AddressesTable />
  </div>
);

export default AddressesPage;
