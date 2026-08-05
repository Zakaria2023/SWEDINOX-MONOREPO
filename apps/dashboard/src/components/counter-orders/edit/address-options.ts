import { AddressOption } from "@/app/(dashboard)/counter-orders/actions";
import { SelectOption } from "@/components/shadcn/select";

/** A company's addresses as a picker shows them — delivery and billing both. */
export const addressSelectOptions = (
  addresses: AddressOption[],
): SelectOption[] => [
  { value: "", label: "Empty" },
  ...addresses.map((address) => ({
    value: address.uuid,
    label:
      [address.streetAndNo, address.postalCode, address.city]
        .filter(Boolean)
        .join(", ") || "Address",
  })),
];
