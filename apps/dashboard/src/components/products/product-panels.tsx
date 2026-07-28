"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ProductDetail } from "@/app/(dashboard)/products/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
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
  ORDER_ITEM_STATUS_LABELS,
  ORDER_LINE_STATUS_LABELS,
  PRICE_TIER_BASE_LABELS,
  STOCK_MOVEMENT_REASON_LABELS,
  STOCK_MOVEMENT_TYPE_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  product: ProductDetail;
};

type GridProps = {
  headers: string[];
  emptyMessage: string;
  rowCount: number;
  children: ReactNode;
};

// Every related grid on this screen has the same shape: a scrolling table with
// an explicit empty state, because "nothing here" and "not loaded" have to look
// different to whoever is reading the article's history.
const Grid = ({ headers, emptyMessage, rowCount, children }: GridProps) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header}>{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rowCount === 0 ? (
          <TableRow>
            <TableCell
              colSpan={headers.length}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          children
        )}
      </TableBody>
    </Table>
  </div>
);

export const ProductPanels = ({ product }: Props) => (
  <div className="space-y-2">
    <CollapsibleSection
      title="Alternatives"
      summary={pluralize(product.alternatives.length, "product")}
    >
      <Grid
        headers={["Alternative product", "Description"]}
        emptyMessage="No alternatives recorded."
        rowCount={product.alternatives.length}
      >
        {product.alternatives.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              <Link
                href={`/products/${row.alternativeProductUuid}`}
                className="text-primary hover:underline"
              >
                {[row.alternativeProductCode, row.alternativeProductName]
                  .filter(Boolean)
                  .join(" — ") || row.alternativeProductUuid}
              </Link>
            </TableCell>
            <TableCell>{orDash(row.description)}</TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="Suppliers"
      summary={pluralize(product.suppliers.length, "supplier")}
    >
      <Grid
        headers={[
          "Supplier",
          "Pref.",
          "EAN",
          "External product code",
          "Editing",
          "Delivery time",
          "M.O.Q.",
          "Order series",
        ]}
        emptyMessage="No suppliers linked to this product."
        rowCount={product.suppliers.length}
      >
        {product.suppliers.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              {orDash(row.supplierName)}
            </TableCell>
            <TableCell>{yesNo(row.preferred)}</TableCell>
            <TableCell>{orDash(row.ean)}</TableCell>
            <TableCell>{orDash(row.externalProductCode)}</TableCell>
            <TableCell>{orDash(row.editing)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {orDash(row.deliveryTime)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {orDash(row.minOrderQty)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {orDash(row.orderSeries)}
            </TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="Preferred location(s)"
      summary={pluralize(product.preferredLocations.length, "location")}
    >
      <Grid
        headers={[
          "Preference",
          "Location",
          "Type",
          "Restock level",
          "Restock location",
          "Restock qty",
        ]}
        emptyMessage="No preferred locations set."
        rowCount={product.preferredLocations.length}
      >
        {product.preferredLocations.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="text-right tabular-nums">
              {orDash(row.preference)}
            </TableCell>
            <TableCell className="font-medium">
              {orDash(row.locationName)}
            </TableCell>
            <TableCell>
              {row.locationType
                ? WAREHOUSE_LOCATION_TYPE_LABELS[row.locationType]
                : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {orDash(row.restockLevel)}
            </TableCell>
            <TableCell>{orDash(row.restockLocationName)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {orDash(row.restockQty)}
            </TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="Price structure — material"
      summary={pluralize(product.priceStructures.length, "structure")}
    >
      <Grid
        headers={[
          "Valid from",
          "Valid until",
          "Base price",
          "Markup",
          "Scrap",
          "Quantity surcharge",
          "Group discount",
          "Length surcharge",
          "Quality surcharge",
          "Line discount",
        ]}
        emptyMessage="No price structure recorded."
        rowCount={product.priceStructures.length}
      >
        {product.priceStructures.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              {formatDateColumn(row.validFrom)}
            </TableCell>
            <TableCell>{formatDateColumn(row.validUntil)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.basePrice ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.markup ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.scrap ?? 0))}
            </TableCell>
            <TableCell>
              {row.quantitySurchargeEnabled
                ? `${pluralize(row.quantitySurchargeTiers?.length ?? 0, "tier")}${
                    row.quantitySurchargeBasis
                      ? ` · ${PRICE_TIER_BASE_LABELS[row.quantitySurchargeBasis]}`
                      : ""
                  }`
                : "—"}
            </TableCell>
            <TableCell>
              {row.groupDiscountEnabled
                ? `${pluralize(row.groupDiscountTiers?.length ?? 0, "tier")}${
                    row.groupDiscountBasis
                      ? ` · ${PRICE_TIER_BASE_LABELS[row.groupDiscountBasis]}`
                      : ""
                  }`
                : "—"}
            </TableCell>
            <TableCell>
              {row.lengthSurchargeEnabled
                ? pluralize(row.lengthSurchargeTiers?.length ?? 0, "tier")
                : "—"}
            </TableCell>
            <TableCell>
              {row.qualitySurchargeEnabled
                ? pluralize(row.qualitySurchargeTiers?.length ?? 0, "tier")
                : "—"}
            </TableCell>
            <TableCell>
              {row.lineDiscountEnabled
                ? pluralize(row.lineDiscountTiers?.length ?? 0, "tier")
                : "—"}
            </TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="Price structure — sawing"
      summary={pluralize(product.sawingPrices.length, "structure")}
    >
      <Grid
        headers={[
          "Valid from",
          "Valid until",
          "Base price",
          "Mitre % (even)",
          "Mitre % (uneven)",
          "Quantity discount",
          "Length surcharge",
        ]}
        emptyMessage="No sawing price recorded."
        rowCount={product.sawingPrices.length}
      >
        {product.sawingPrices.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              {formatDateColumn(row.validFrom)}
            </TableCell>
            <TableCell>{formatDateColumn(row.validUntil)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.basePrice ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(Number(row.mitreSurchargeEvenPct ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatPercent(Number(row.mitreSurchargeUnevenPct ?? 0))}
            </TableCell>
            <TableCell>
              {row.quantityDiscountEnabled
                ? pluralize(row.quantityDiscountTiers?.length ?? 0, "tier")
                : "—"}
            </TableCell>
            <TableCell>
              {row.lengthSurchargeEnabled
                ? pluralize(row.lengthSurchargeTiers?.length ?? 0, "tier")
                : "—"}
            </TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="Options"
      summary={pluralize(product.optionPrices.length, "option price")}
    >
      <Grid
        headers={[
          "Option",
          "Base price",
          "Price unit",
          "Cost price",
          "Valid from",
          "Valid until",
        ]}
        emptyMessage="No option prices for this product."
        rowCount={product.optionPrices.length}
      >
        {product.optionPrices.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              {[row.optionCode, row.optionName].filter(Boolean).join(" — ") ||
                "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.basePrice ?? 0))}
            </TableCell>
            <TableCell>{orDash(row.priceUnit)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.costPrice ?? 0))}
            </TableCell>
            <TableCell>{formatDateColumn(row.validFrom)}</TableCell>
            <TableCell>{formatDateColumn(row.validUntil)}</TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="Stock"
      summary={pluralize(product.stock.length, "stock lot")}
    >
      <Grid
        headers={[
          "Location",
          "Quality",
          "Length",
          "Width",
          "Thickness",
          "Technical",
          "Reserved",
          "Available",
          "Charge",
          "Status",
        ]}
        emptyMessage="No stock on hand."
        rowCount={product.stock.length}
      >
        {product.stock.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              {orDash(row.locationName)}
            </TableCell>
            <TableCell>{orDash(row.quality)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {orDash(row.lengthMm)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {orDash(row.widthMm)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {orDash(row.thicknessMm)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.quantity ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.reservedQuantity ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(
                Number(row.quantity ?? 0) - Number(row.reservedQuantity ?? 0),
              )}
            </TableCell>
            <TableCell>{orDash(row.charge)}</TableCell>
            <TableCell>{orDash(row.status)}</TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="Stock mutations"
      summary={pluralize(product.stockMovements.length, "movement")}
    >
      <Grid
        headers={[
          "Mutation date",
          "Type",
          "Reason",
          "Supplier",
          "Qty",
          "Note",
          "User",
        ]}
        emptyMessage="No stock movements recorded."
        rowCount={product.stockMovements.length}
      >
        {product.stockMovements.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell>{formatDateColumn(row.createdAt)}</TableCell>
            <TableCell>{STOCK_MOVEMENT_TYPE_LABELS[row.type]}</TableCell>
            <TableCell>{STOCK_MOVEMENT_REASON_LABELS[row.reason]}</TableCell>
            <TableCell>{orDash(row.companyName)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.quantity ?? 0))}
            </TableCell>
            <TableCell>{orDash(row.note)}</TableCell>
            <TableCell>{orDash(row.createdByUserId)}</TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="Customer stock"
      summary={pluralize(product.customerStock.length, "row")}
    >
      <Grid
        headers={["Customer", "Location", "Quantity", "Description"]}
        emptyMessage="No customer stock held for this product."
        rowCount={product.customerStock.length}
      >
        {product.customerStock.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              {orDash(row.customerName)}
            </TableCell>
            <TableCell>{orDash(row.location)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {orDash(row.quantity)}
            </TableCell>
            <TableCell>{orDash(row.description)}</TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="Quotes"
      summary={pluralize(product.quoteLines.length, "quote line")}
    >
      <Grid
        headers={[
          "Quote",
          "Customer",
          "Status",
          "Qty",
          "Length",
          "Net price",
          "Amount",
          "Quote date",
          "Decision date",
        ]}
        emptyMessage="This product has never been quoted."
        rowCount={product.quoteLines.length}
      >
        {product.quoteLines.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              <Link
                href={`/quotes/${row.quoteUuid}`}
                className="text-primary hover:underline"
              >
                {orDash(row.quoteId)}
              </Link>
            </TableCell>
            <TableCell>{orDash(row.customerName)}</TableCell>
            <TableCell>
              {row.status ? ORDER_LINE_STATUS_LABELS[row.status] : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.quantity ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {orDash(row.lengthMm)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.netPrice ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.amount ?? 0))}
            </TableCell>
            <TableCell>{formatDateColumn(row.quoteDate)}</TableCell>
            <TableCell>{formatDateColumn(row.decisionDate)}</TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="Orders"
      summary={pluralize(product.orderLines.length, "order line")}
    >
      <Grid
        headers={[
          "Order",
          "Customer",
          "Status",
          "Qty",
          "Length",
          "Amount",
          "Delivery date",
        ]}
        emptyMessage="This product has never been ordered."
        rowCount={product.orderLines.length}
      >
        {product.orderLines.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              <Link
                href={`/orders/${row.orderUuid}`}
                className="text-primary hover:underline"
              >
                {orDash(row.orderId)}
              </Link>
            </TableCell>
            <TableCell>{orDash(row.customerName)}</TableCell>
            <TableCell>
              {row.status ? ORDER_ITEM_STATUS_LABELS[row.status] : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.quantity ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {orDash(row.lengthMm)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.amount ?? 0))}
            </TableCell>
            <TableCell>{formatDateColumn(row.deliveryDate)}</TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="Return orders"
      summary={pluralize(product.returnLines.length, "return line")}
    >
      <Grid
        headers={["Return order", "Customer", "Qty", "Length"]}
        emptyMessage="This product has never been returned."
        rowCount={product.returnLines.length}
      >
        {product.returnLines.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              {orDash(row.returnOrderId)}
            </TableCell>
            <TableCell>{orDash(row.customerName)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.quantity ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {orDash(row.lengthMm)}
            </TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="Purchase quotes"
      summary={pluralize(product.purchaseQuoteLines.length, "quote line")}
    >
      <Grid
        headers={["Purchase quote", "Supplier", "Qty", "Net price"]}
        emptyMessage="No purchase quotes for this product."
        rowCount={product.purchaseQuoteLines.length}
      >
        {product.purchaseQuoteLines.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              {orDash(row.purchaseQuoteId)}
            </TableCell>
            <TableCell>{orDash(row.supplierName)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.quantity ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.netPrice ?? 0))}
            </TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="Purchase orders"
      summary={pluralize(product.purchaseOrderLines.length, "order line")}
    >
      <Grid
        headers={[
          "Purchase order",
          "Supplier",
          "Status",
          "Qty ordered",
          "Qty received",
          "Kg",
          "Receipt date",
        ]}
        emptyMessage="This product has never been purchased."
        rowCount={product.purchaseOrderLines.length}
      >
        {product.purchaseOrderLines.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell className="font-medium">
              <Link
                href={`/purchase-orders/${row.purchaseOrderUuid}`}
                className="text-primary hover:underline"
              >
                {orDash(row.purchaseOrderId)}
              </Link>
            </TableCell>
            <TableCell>{orDash(row.supplierName)}</TableCell>
            <TableCell>{orDash(row.purchaseOrderStatus)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.quantity ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.qtyReceived ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.kgPurchased ?? 0))}
            </TableCell>
            <TableCell>{formatDateColumn(row.receiptDate)}</TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="History APP"
      summary={pluralize(product.appHistory.length, "entry")}
    >
      <Grid
        headers={["Start", "End", "APP", "Reference"]}
        emptyMessage="No average purchase price history."
        rowCount={product.appHistory.length}
      >
        {product.appHistory.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell>{formatDateColumn(row.startDate)}</TableCell>
            <TableCell>{formatDateColumn(row.endDate)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.averagePurchasePrice ?? 0))}
            </TableCell>
            <TableCell>{orDash(row.reference)}</TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="History FSP"
      summary={pluralize(product.fspHistory.length, "entry")}
    >
      <Grid
        headers={[
          "Start",
          "End",
          "FSP",
          "Replacement price",
          "Internal surcharge",
          "External surcharge",
          "Stock",
          "Stock (Kg)",
        ]}
        emptyMessage="No fixed settlement price history."
        rowCount={product.fspHistory.length}
      >
        {product.fspHistory.map((row) => (
          <TableRow key={row.uuid}>
            <TableCell>{formatDateColumn(row.startDate)}</TableCell>
            <TableCell>{formatDateColumn(row.endDate)}</TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.fsp ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatMoney(Number(row.replacementPrice ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.internalSurcharge ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.externalSurcharge ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.stockQuantity ?? 0))}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatNumber(Number(row.stockKg ?? 0))}
            </TableCell>
          </TableRow>
        ))}
      </Grid>
    </CollapsibleSection>

    <CollapsibleSection
      title="Purchase requests"
      summary="Not linked to a product"
    >
      <p className="text-sm text-muted-foreground">
        A purchase request records what a buyer asked for at header level; it
        carries no product reference in this system, so it cannot be listed
        against an article.
      </p>
    </CollapsibleSection>
  </div>
);
