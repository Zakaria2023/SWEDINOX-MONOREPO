"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ContractDetail,
  deleteContract,
} from "@/app/(dashboard)/contracts/actions";
import { Button } from "@/components/shadcn/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormError } from "@/components/ui/form-error";
import { DetailField } from "@/components/ui/detail-field";
import {
  formatDateColumn,
  formatMoney,
  formatNumber,
  formatPercent,
  orDash,
  pluralize,
  yesNo,
} from "@/lib/helpers";
import {
  CONTRACT_DISCOUNT_BASED_ON_LABELS,
  CONTRACT_SURCHARGE_PER_TYPE_LABELS,
  CONTRACT_TIER_UNIT_LABELS,
  CONTRACT_TYPE_LABELS,
  CONTRACTABLE_ROLE_LABELS,
} from "@/lib/labels";

type Props = {
  contract: ContractDetail;
};

type TierListProps = {
  label: string;
  enabled: boolean | null;
  tiers: Array<{ from: number; percentage: number }> | null;
};

// A tier grid reads as "from this threshold, this percentage". Printed inline
// rather than as its own table: a contract holds three of them and they are
// usually two or three rows each.
const TierList = ({ label, enabled, tiers }: TierListProps) => {
  if (!enabled) {
    return <DetailField label={label} value="Not applied" />;
  }

  return (
    <div>
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {!tiers || tiers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tiers set</p>
      ) : (
        <ul className="text-sm tabular-nums">
          {tiers.map((tier, index) => (
            <li key={index}>
              From {formatNumber(tier.from)} → {formatPercent(tier.percentage)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const ContractDetailView = ({ contract }: Props) => {
  const [isPending, startTransition] = useTransition();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteContract(contract.uuid);
      if (result.error) {
        setError(result.error);
      }
      setIsConfirmOpen(false);
    });
  };

  return (
    <div className="space-y-6">
      {error && <FormError>{error}</FormError>}

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Contract</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Code" value={contract.code} />
          <DetailField label="Description" value={contract.description} />
          <DetailField
            label="Type"
            value={
              contract.contractType
                ? CONTRACT_TYPE_LABELS[contract.contractType]
                : null
            }
          />
          <DetailField
            label="Contract group"
            value={contract.contractGroupName}
          />
          <DetailField label="Company" value={contract.companyName} />
          <DetailField
            label="Role"
            value={
              contract.role ? CONTRACTABLE_ROLE_LABELS[contract.role] : null
            }
          />
          <DetailField
            label="Starting date"
            value={formatDateColumn(contract.startingDate)}
          />
          <DetailField
            label="End date"
            value={formatDateColumn(contract.endDate)}
          />
          <DetailField
            label="Price date"
            value={
              contract.hasPriceDate
                ? formatDateColumn(contract.priceDate)
                : "Not used"
            }
          />
          <DetailField
            label="Link to new customer"
            value={yesNo(contract.linkToNewCustomer)}
          />
          <DetailField label="Search code 1" value={contract.searchCode1} />
          <DetailField label="Search code 2" value={contract.searchCode2} />
          <DetailField label="Search code 3" value={contract.searchCode3} />
          <DetailField
            label="Website sorting"
            value={contract.websiteSorting}
          />
          <DetailField
            label="Hidden on website"
            value={yesNo(contract.hideOnWebsite)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Price terms</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField
            label="Gross price"
            value={
              contract.grossPrice
                ? formatMoney(Number(contract.grossPriceValue ?? 0))
                : "Not applied"
            }
          />
          <DetailField
            label="Colour surcharge"
            value={
              contract.colorSurcharge
                ? `${formatMoney(Number(contract.colorSurchargeValue ?? 0))} ${
                    contract.colorSurchargeUnit ?? ""
                  }`.trim()
                : "Not applied"
            }
          />
          <DetailField
            label="Extra discount"
            value={
              contract.extraDiscount
                ? `${contract.extraDiscountValue ?? "0"} ${
                    contract.extraDiscountUnit ?? ""
                  }`.trim()
                : "Not applied"
            }
          />
          <DetailField
            label="Extra discount from"
            value={
              contract.extraDiscount
                ? `${contract.extraDiscountFromValue ?? "0"} ${
                    contract.extraDiscountFromUnit ?? ""
                  }`.trim()
                : "—"
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TierList
            label="Quantity surcharge"
            enabled={contract.quantitySurcharge}
            tiers={contract.quantitySurchargeTiers}
          />
          <TierList
            label="Line discount"
            enabled={contract.lineDiscount}
            tiers={contract.lineDiscountTiers}
          />
          <TierList
            label="Group discount"
            enabled={contract.groupDiscount}
            tiers={contract.groupDiscountTiers}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <DetailField
            label="Quantity surcharge per"
            value={
              contract.quantitySurchargePerType
                ? CONTRACT_SURCHARGE_PER_TYPE_LABELS[
                    contract.quantitySurchargePerType
                  ]
                : null
            }
          />
          <DetailField
            label="Quantity surcharge tier unit"
            value={
              contract.quantitySurchargeTierUnit
                ? CONTRACT_TIER_UNIT_LABELS[contract.quantitySurchargeTierUnit]
                : null
            }
          />
          <DetailField
            label="Group discount based on"
            value={
              contract.groupDiscountBasedOn
                ? CONTRACT_DISCOUNT_BASED_ON_LABELS[
                    contract.groupDiscountBasedOn
                  ]
                : null
            }
          />
        </div>
      </section>

      <div className="space-y-2">
        <CollapsibleSection
          title="Agreed net prices"
          summary={pluralize(contract.netPrices.length, "product")}
        >
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">From qty</TableHead>
                  <TableHead className="text-right">Net price</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Discount %</TableHead>
                  <TableHead>Valid from</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contract.netPrices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No agreed net prices on this contract.
                    </TableCell>
                  </TableRow>
                ) : (
                  contract.netPrices.map((row) => (
                    <TableRow key={row.uuid}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/products/${row.productUuid}`}
                          className="text-primary hover:underline"
                        >
                          {[row.productCode, row.productName]
                            .filter(Boolean)
                            .join(" — ") || row.productUuid}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {orDash(row.fromQty)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(Number(row.netPrice ?? 0))}
                      </TableCell>
                      <TableCell>{orDash(row.netPriceUnit)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPercent(Number(row.discountPercent ?? 0))}
                      </TableCell>
                      <TableCell>{formatDateColumn(row.validFrom)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Quotes priced against this contract"
          summary={pluralize(contract.quotesUsing.length, "quote")}
        >
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contract.quotesUsing.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No quotes priced against this contract.
                    </TableCell>
                  </TableRow>
                ) : (
                  contract.quotesUsing.map((row) => (
                    <TableRow key={row.uuid}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/quotes/${row.uuid}`}
                          className="text-primary hover:underline"
                        >
                          #{row.documentNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{orDash(row.companyName)}</TableCell>
                      <TableCell>{formatDateColumn(row.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Linked order"
          summary={
            contract.linkedOrder
              ? `Order #${contract.linkedOrder.documentNumber}`
              : "Not an order contract"
          }
        >
          {contract.linkedOrder ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Order
                </p>
                <Link
                  href={`/orders/${contract.linkedOrder.uuid}`}
                  className="text-sm text-primary hover:underline"
                >
                  #{contract.linkedOrder.documentNumber}
                </Link>
              </div>
              <DetailField
                label="Customer"
                value={contract.linkedOrder.companyName}
              />
              <DetailField
                label="Created"
                value={formatDateColumn(contract.linkedOrder.createdAt)}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This is a company or project contract — it is not tied to one
              specific order.
            </p>
          )}
        </CollapsibleSection>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          render={<Link href={`/contracts/${contract.uuid}/edit`} />}
        >
          Edit Contract
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setIsConfirmOpen(true)}
          disabled={isPending}
        >
          Delete Contract
        </Button>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleDelete}
        isPending={isPending}
        title="Delete contract"
        description="This removes the contract and its agreed net prices. A contract that quotes have been priced against cannot be deleted."
        confirmLabel="Delete Contract"
      />
    </div>
  );
};
