import Link from "next/link";
import { CounterOrderDetail } from "@/app/(dashboard)/counter-orders/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { DetailField } from "@/components/ui/detail-field";
import { DocumentCell } from "@/components/ui/document-cell";
import {
  formatDateColumn,
  formatDateValue,
  formatMoney,
  formatPercent,
  orDash,
  userName,
  yesNo,
} from "@/lib/helpers";
import {
  COUNTER_ORDER_PRIORITY_LABELS,
  COUNTER_ORDER_STATUS_LABELS,
  DELIVERY_TERM_LABELS,
  INVOICE_PAYMENT_TERM_LABELS,
  ORDER_LINE_STATUS_LABELS,
  ORDER_METHOD_LABELS,
  STOCK_UNIT_LABELS,
  TRANSPORT_MODE_LABELS,
  WAREHOUSE_TRANSPORT_REGION_LABELS,
} from "@/lib/labels";

type Props = {
  /** Clerk id -> name; these columns store the id, not the name. */
  userNames: Record<string, string>;
  order: CounterOrderDetail;
};

export const CounterOrderDetailView = ({ order, userNames }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Header</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Customer
          </p>
          <Link
            href={`/companies/${order.companyUuid}`}
            className="text-sm text-primary hover:underline"
          >
            {order.companyName}
          </Link>
        </div>
        <DetailField label="Customer code" value={order.companyId} />
        <DetailField label="Contact" value={order.contactName} />
        <DetailField label="Customer reference" value={order.customerRef} />
        <DetailField label="Our reference" value={order.ourReference} />
        <DetailField label="Seller" value={userName(order.seller, userNames)} />
        <DetailField
          label="Status"
          value={
            order.status ? COUNTER_ORDER_STATUS_LABELS[order.status] : null
          }
        />
        <DetailField
          label="Priority"
          value={
            order.priority
              ? COUNTER_ORDER_PRIORITY_LABELS[order.priority]
              : null
          }
        />
        <DetailField
          label="Order method"
          value={
            order.orderMethod ? ORDER_METHOD_LABELS[order.orderMethod] : null
          }
        />
        <DetailField
          label="Order date"
          value={formatDateColumn(order.orderDate)}
        />
        <DetailField
          label="Price date"
          value={formatDateColumn(order.priceDate)}
        />
        <DetailField
          label="Leave customer"
          value={yesNo(order.leaveCustomer)}
        />
        <DetailField
          label="Handling blocked"
          value={yesNo(order.handlingBlocked)}
        />
        <DetailField
          label="Print picking slips"
          value={yesNo(order.printPickingSlips)}
        />
        <DetailField label="Created" value={formatDateValue(order.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(order.updatedAt)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Order type</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Pickup" value={yesNo(order.isPickup)} />
        <DetailField label="Incidental" value={yesNo(order.isIncidental)} />
        <DetailField label="Overlength" value={yesNo(order.isOverlength)} />
        <DetailField label="Printed" value={yesNo(order.isPrinted)} />
        <DetailField label="Mailed" value={yesNo(order.isMailed)} />
        <DetailField label="Faxed" value={yesNo(order.isFaxed)} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Delivery and logistics
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Delivery terms"
          value={
            order.deliveryTerms
              ? DELIVERY_TERM_LABELS[order.deliveryTerms]
              : null
          }
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Delivery address
          </p>
          {order.deliveryAddressUuid ? (
            <Link
              href={`/addresses/${order.deliveryAddressUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {[order.deliveryAddressStreet, order.deliveryAddressCity]
                .filter(Boolean)
                .join(", ") || "View address"}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Delivery type" value={order.deliveryType} />
        <DetailField
          label="Delivery date"
          value={formatDateColumn(order.deliveryDate)}
        />
        <DetailField label="Delivery week" value={order.deliveryWeek} />
        <DetailField label="Delivery year" value={order.deliveryYear} />
        <DetailField label="Delivery remark" value={order.deliveryRemark} />
        <DetailField
          label="Complete delivery"
          value={yesNo(order.completeDelivery)}
        />
        <DetailField
          label="Transport blockage"
          value={yesNo(order.transportBlockage)}
        />
        <DetailField
          label="Vehicle with crane"
          value={yesNo(order.vehicleWithCrane)}
        />
        <DetailField
          label="Vehicle with canopy"
          value={yesNo(order.vehicleWithCanopy)}
        />
        <DetailField
          label="Bundling separate"
          value={yesNo(order.bundlingSeparate)}
        />
        <DetailField
          label="Transport region"
          value={
            order.transportRegion
              ? WAREHOUSE_TRANSPORT_REGION_LABELS[order.transportRegion]
              : null
          }
        />
        <DetailField
          label="Transport mode"
          value={
            order.transportMode
              ? TRANSPORT_MODE_LABELS[order.transportMode]
              : null
          }
        />
        <DetailField label="Maximum length (mm)" value={order.maxLengthMm} />
        <DetailField
          label="Maximum bundle weight (kg)"
          value={order.maxBundleWeightKg}
        />
        <DetailField label="Deliver after" value={order.deliveryAfterTime} />
        <DetailField label="Deliver before" value={order.deliverForTime} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Finances</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Payment terms"
          value={
            order.paymentTerms
              ? INVOICE_PAYMENT_TERM_LABELS[order.paymentTerms]
              : null
          }
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Billing address
          </p>
          {order.billingAddressUuid ? (
            <Link
              href={`/addresses/${order.billingAddressUuid}`}
              className="text-sm text-primary hover:underline"
            >
              View address
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField label="Show net price" value={yesNo(order.showNetPrice)} />
        <DetailField
          label="Scrap surcharge separate"
          value={yesNo(order.scrapSurchargeSeparate)}
        />
        <DetailField
          label="Calculate VAT if applicable"
          value={yesNo(order.calculateVatIfApplicable)}
        />
        <DetailField
          label="Financial blockage"
          value={yesNo(order.financialBlockage)}
        />
        <DetailField
          label="Invoice blockage"
          value={yesNo(order.invoiceBlockage)}
        />
        <DetailField
          label="Only total amount on invoice"
          value={yesNo(order.onlyTotalAmountOnInvoice)}
        />
        <DetailField
          label="Option prices in material prices"
          value={yesNo(order.includeOptionPricesInMaterialPrices)}
        />
        <DetailField label="Blocking reason" value={order.blockingReason} />
      </div>

      <h3 className="text-sm font-medium text-muted-foreground">Summary</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DetailField
          label="Amount excluding VAT"
          value={formatMoney(Number(order.amountExVat ?? 0))}
        />
        <DetailField label="Weight (kg)" value={order.weightKg} />
        <DetailField
          label="Gain"
          value={formatPercent(Number(order.gainPercent ?? 0))}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Remarks and documents
      </h2>
      <DetailField label="Remarks" value={order.remarks} />
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Documents
        </p>
        <DocumentCell documents={order.documents} />
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">Lines</h2>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">Line</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Qty planned</TableHead>
              <TableHead className="text-right">Qty actual</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Kg planned</TableHead>
              <TableHead className="text-right">Net price</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead className="text-right">Margin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={12}
                  className="h-24 text-center text-muted-foreground"
                >
                  No lines on this counter order.
                </TableCell>
              </TableRow>
            ) : (
              order.items.map((item) => (
                <TableRow key={item.uuid}>
                  <TableCell className="text-right tabular-nums">
                    {orDash(item.lineNumber)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.productUuid && item.productCode ? (
                      <Link
                        href={`/products/${item.productUuid}`}
                        className="text-primary hover:underline"
                      >
                        {item.productCode}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    {orDash(item.description ?? item.productName)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      value={item.status}
                      label={
                        item.status
                          ? ORDER_LINE_STATUS_LABELS[item.status]
                          : null
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(item.qtyPlanned)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(item.qtyActual)}
                  </TableCell>
                  <TableCell>
                    {item.unit ? STOCK_UNIT_LABELS[item.unit] : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {orDash(item.kgPlanned)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(item.netPrice ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(item.amount ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMoney(Number(item.profitAmount ?? 0))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(Number(item.profitPercent ?? 0))}
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
