import Link from "next/link";
import { ProductGroupDetail } from "@/app/(dashboard)/product-groups/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { DetailField } from "@/components/ui/detail-field";
import { DocumentCell } from "@/components/ui/document-cell";
import { formatDateValue, orDash, yesNo } from "@/lib/helpers";
import {
  ARTICLE_GROUP_LABELS,
  CE_STANDARD_LABELS,
  CERTIFICAAT_LABELS,
  CUSTOMER_LABEL_OPTION_LABELS,
  DELIVERY_TIME_UNIT_LABELS,
  FEATURES_QUALITY_LABELS,
  LEAD_TIME_METHOD_LABELS,
  PROCESSED_OPTION_LABELS,
  PRODUCT_QUALITY_STANDARD_LABELS,
  PRODUCT_SHAPE_LABELS,
  PURCHASING_UNIT_LABELS,
  REVENUE_GROUP_LABELS,
  SALES_UNIT_LABELS,
  STOCK_LABEL_PRINTING_LABELS,
  STOCK_LABEL_TYPE_LABELS,
  STOCK_MODE_LABELS,
  VAT_CODE_LABELS,
} from "@/lib/labels";

type Props = {
  group: ProductGroupDetail;
};

// A minimum/maximum stock rule reads either as a fixed quantity or as a
// multiple of average monthly consumption, so which columns matter depends on
// the mode. Printing both would leave the reader to work out which one applies.
type StockRuleProps = {
  label: string;
  mode: ProductGroupDetail["minStockMode"];
  multiplier: string | null;
  fixedValue: string | null;
  unit: string | null;
};

const StockRule = ({
  label,
  mode,
  multiplier,
  fixedValue,
  unit,
}: StockRuleProps) => (
  <DetailField
    label={label}
    value={
      mode === "fixed"
        ? `${fixedValue ?? "0"} ${unit ?? ""}`.trim()
        : `${multiplier ?? "0"} × average monthly consumption`
    }
  />
);

export const ProductGroupDetailView = ({ group }: Props) => (
  <div className="space-y-6">
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Basis</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Name" value={group.name} />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Parent group
          </p>
          {group.parentUuid && group.parentName ? (
            <Link
              href={`/product-groups/${group.parentUuid}`}
              className="text-sm text-primary hover:underline"
            >
              {group.parentName}
            </Link>
          ) : (
            <p className="text-sm">—</p>
          )}
        </div>
        <DetailField
          label="Product shape"
          value={
            group.productShape
              ? PRODUCT_SHAPE_LABELS[group.productShape]
              : null
          }
        />
        <DetailField
          label="Article group"
          value={
            group.articleGroup ? ARTICLE_GROUP_LABELS[group.articleGroup] : null
          }
        />
        <DetailField label="Short description" value={group.groupShortDesc} />
        <DetailField
          label="Product shape description"
          value={group.productShapeDesc}
        />
        <DetailField label="Material group" value={group.materialGroup} />
        <DetailField label="Commodity" value={group.commodity} />
        <DetailField label="Industry number" value={group.industryNumber} />
        <DetailField label="Scrap" value={yesNo(group.scrap)} />
        <DetailField label="Packaging" value={yesNo(group.packaging)} />
        <DetailField
          label="Sales/purchase description overridable"
          value={yesNo(group.descSalesPurchaseOverridable)}
        />
        <DetailField label="Search code 1" value={group.searchCode1} />
        <DetailField label="Search code 2" value={group.searchCode2} />
        <DetailField label="Search code 3" value={group.searchCode3} />
        <DetailField label="Created" value={formatDateValue(group.createdAt)} />
        <DetailField
          label="Last modified"
          value={formatDateValue(group.updatedAt)}
        />
      </div>
      <DetailField label="Long description" value={group.groupLongDesc} />
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Dimensions, weights and features
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Length" value={group.length} />
        <DetailField label="Width" value={group.width} />
        <DetailField label="Thickness" value={group.thickness} />
        <DetailField label="Decimal places" value={group.decimalPlaces} />
        <DetailField
          label="Print dimensions"
          value={yesNo(group.printDimensions)}
        />
        <DetailField label="Weight" value={group.weight} />
        <DetailField label="Paint surface" value={group.paintSurface} />
        <DetailField
          label="Features quality"
          value={
            group.featuresQuality
              ? FEATURES_QUALITY_LABELS[group.featuresQuality]
              : null
          }
        />
        <DetailField
          label="Theoretical weight"
          value={group.weightTheoretical}
        />
        <DetailField label="Trade weight" value={group.weightTrade} />
        <DetailField label="German weight" value={group.weightGerman} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Standards and processing
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Standards quality"
          value={
            group.standardsQuality
              ? PRODUCT_QUALITY_STANDARD_LABELS[group.standardsQuality]
              : null
          }
        />
        <DetailField
          label="Tolerance"
          value={
            group.tolerance
              ? PRODUCT_QUALITY_STANDARD_LABELS[group.tolerance]
              : null
          }
        />
        <DetailField
          label="CE"
          value={group.ce ? CE_STANDARD_LABELS[group.ce] : null}
        />
        <DetailField
          label="Processed option"
          value={
            group.processedOption
              ? PROCESSED_OPTION_LABELS[group.processedOption]
              : null
          }
        />
        <DetailField label="Source product" value={group.sourceProduct} />
        <DetailField
          label="Options"
          value={group.options?.join(", ") ?? null}
        />
      </div>
      <div>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Documents
        </p>
        <DocumentCell documents={group.documents} />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Purchase</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Purchasing unit"
          value={
            group.purchasingUnit
              ? PURCHASING_UNIT_LABELS[group.purchasingUnit]
              : null
          }
        />
        <DetailField
          label="Unit price"
          value={
            group.unitPrice ? PURCHASING_UNIT_LABELS[group.unitPrice] : null
          }
        />
        <DetailField
          label="Delivery time"
          value={`${group.deliveryTime ?? 0} ${
            group.deliveryTimeUnit
              ? DELIVERY_TIME_UNIT_LABELS[group.deliveryTimeUnit]
              : ""
          }`.trim()}
        />
        <DetailField label="Order series" value={group.orderSeries} />
        <DetailField
          label="Blocked for purchasing"
          value={yesNo(group.blockedForPurchasing)}
        />
        <DetailField
          label="Making order advices"
          value={yesNo(group.makingOrderAdvices)}
        />
        <DetailField
          label="Product code on purchase"
          value={yesNo(group.productCodeOnPurchase)}
        />
        <DetailField label="Max line quantity" value={group.maxLineQty} />
        <DetailField label="Max net price" value={group.maxNetPrice} />
        <DetailField
          label="PAC classification"
          value={group.pacClassification}
        />
        <DetailField label="Order advice code" value={group.orderAdviceCode} />
      </div>
      <DetailField
        label="Ordering advice notes"
        value={group.orderingAdviceNotes}
      />
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Warehouse control
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Packaging mandatory on completion"
          value={yesNo(group.packagingMandatoryOnCompletion)}
        />
        <DetailField
          label="Receipt in limited-dimension locations"
          value={yesNo(group.receiptInLocationsWithLimitedDimensions)}
        />
        <DetailField
          label="Goods receipt term"
          value={group.goodsReceiptTerm}
        />
        <DetailField
          label="Include in CSV for stock labels"
          value={yesNo(group.includeInCsvForStockLabels)}
        />
        <DetailField
          label="Suggest last used charge in scanner"
          value={yesNo(group.suggestLastUsedChargeInScanner)}
        />
        <DetailField
          label="Stock label type"
          value={
            group.stockLabelType
              ? STOCK_LABEL_TYPE_LABELS[group.stockLabelType]
              : null
          }
        />
        <DetailField
          label="Stock label printing"
          value={
            group.stockLabelPrinting
              ? STOCK_LABEL_PRINTING_LABELS[group.stockLabelPrinting]
              : null
          }
        />
        <DetailField
          label="Customer label — picking slip"
          value={
            group.customerLabelForPickingSlip
              ? CUSTOMER_LABEL_OPTION_LABELS[group.customerLabelForPickingSlip]
              : null
          }
        />
        <DetailField
          label="Customer label — sawing slip"
          value={
            group.customerLabelForSawingSlip
              ? CUSTOMER_LABEL_OPTION_LABELS[group.customerLabelForSawingSlip]
              : null
          }
        />
        <DetailField
          label="Customer label — surface treatment slip"
          value={
            group.customerLabelAtSurfTreatSlip
              ? CUSTOMER_LABEL_OPTION_LABELS[group.customerLabelAtSurfTreatSlip]
              : null
          }
        />
        <DetailField
          label="Always approve warehouse workorder line"
          value={yesNo(group.alwaysApproveManuallyWarehouseWorkorderLine)}
        />
        <DetailField
          label="Always approve production workorder line"
          value={yesNo(group.alwaysApproveManuallyProductionWorkorderLine)}
        />
      </div>

      <h3 className="text-sm font-medium text-muted-foreground">
        Tolerances when reporting as completed (%)
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Unloading quantity"
          value={group.toleranceUnloadingQty}
        />
        <DetailField label="Unloading kg" value={group.toleranceUnloadingKg} />
        <DetailField label="Count quantity" value={group.toleranceCountQty} />
        <DetailField label="Count kg" value={group.toleranceCountKg} />
        <DetailField
          label="Picking quantity"
          value={group.tolerancePickingQty}
        />
        <DetailField label="Picking kg" value={group.tolerancePickingKg} />
        <DetailField
          label="Production quantity"
          value={group.toleranceProductionQty}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">Sales</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField
          label="Revenue group"
          value={
            group.revenueGroup ? REVENUE_GROUP_LABELS[group.revenueGroup] : null
          }
        />
        <DetailField
          label="Sales unit"
          value={group.salesUnit ? SALES_UNIT_LABELS[group.salesUnit] : null}
        />
        <DetailField
          label="Sales unit price"
          value={
            group.salesUnitPrice
              ? PURCHASING_UNIT_LABELS[group.salesUnitPrice]
              : null
          }
        />
        <DetailField
          label="VAT code"
          value={group.vatCode ? VAT_CODE_LABELS[group.vatCode] : null}
        />
        <DetailField
          label="Certificate"
          value={
            group.certificaat ? CERTIFICAAT_LABELS[group.certificaat] : null
          }
        />
        <DetailField
          label="Round weight per piece up"
          value={yesNo(group.roundWeightPerPieceUp)}
        />
        <DetailField label="BENOR product" value={yesNo(group.benorProduct)} />
        <DetailField
          label="Product code on quote/order/invoice"
          value={yesNo(group.productCodeOnQuoteOrderInvoice)}
        />
        <DetailField
          label="Blocked for sales"
          value={yesNo(group.severalBlockedForSales)}
        />
        <DetailField
          label="Vehicle with crane required"
          value={yesNo(group.vehicleWithCraneRequired)}
        />
        <DetailField
          label="Vehicle with canopy required"
          value={yesNo(group.vehicleWithCanopyRequired)}
        />
        <DetailField
          label="Always reserve stock"
          value={yesNo(group.alwaysReserveStock)}
        />
        <DetailField
          label="Max sales line quantity"
          value={group.maxSalesLineQty}
        />
        <DetailField
          label="Max sales net price"
          value={group.maxSalesNetPrice}
        />
        <DetailField label="Handling costs" value={group.handlingCosts} />
      </div>

      <h3 className="text-sm font-medium text-muted-foreground">
        Minimum profit margins (%)
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Stock" value={group.minProfitMarginStock} />
        <DetailField label="Ex works" value={group.minProfitMarginExWorks} />
        <DetailField
          label="Cross docking"
          value={group.minProfitMarginCrossDocking}
        />
      </div>

      <h3 className="text-sm font-medium text-muted-foreground">Website</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Website export" value={yesNo(group.websiteExport)} />
        <DetailField
          label="Blocked for sales on website"
          value={yesNo(group.websiteBlockedForSales)}
        />
        <DetailField
          label="Short product description"
          value={yesNo(group.descriptionProductShort)}
        />
        <DetailField
          label="Show weight per piece"
          value={yesNo(group.showWeightPerPiece)}
        />
        <DetailField
          label="Show packaging per piece"
          value={yesNo(group.showPackagingPerPiece)}
        />
        <DetailField
          label="Mark product group"
          value={yesNo(group.markProductGroup)}
        />
        <DetailField
          label="Price on request"
          value={yesNo(group.priceOnRequest)}
        />
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="border-b pb-2 text-base font-semibold">
        Stock policy and StockOp
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StockRule
          label="Minimum stock"
          mode={group.minStockMode}
          multiplier={group.minStockMultiplier}
          fixedValue={group.minStockFixedValue}
          unit={group.minStockUnit}
        />
        <DetailField
          label="Minimum stock mode"
          value={
            group.minStockMode ? STOCK_MODE_LABELS[group.minStockMode] : null
          }
        />
        <StockRule
          label="Maximum stock"
          mode={group.maxStockMode}
          multiplier={group.maxStockMultiplier}
          fixedValue={group.maxStockFixedValue}
          unit={group.maxStockUnit}
        />
        <DetailField
          label="Maximum stock mode"
          value={
            group.maxStockMode ? STOCK_MODE_LABELS[group.maxStockMode] : null
          }
        />
        <DetailField
          label="Lead time method"
          value={
            group.leadTimeMethod
              ? LEAD_TIME_METHOD_LABELS[group.leadTimeMethod]
              : null
          }
        />
        <DetailField label="Lead time" value={group.leadTime} />
        <DetailField label="Review period" value={group.reviewPeriod} />
        <DetailField
          label="Order costs — purchasing"
          value={group.orderCostsPurchasingSide}
        />
        <DetailField
          label="Order costs — logistics"
          value={group.orderCostsLogistics}
        />
        <DetailField
          label="StockOp order series"
          value={group.stockOpOrderSeries}
        />
        <DetailField label="Minimum order quantity" value={group.minOrderQty} />
        <DetailField
          label="Use StockOp for this product"
          value={yesNo(group.useStockOpForThisProduct)}
        />
        <DetailField label="Capital cost" value={group.capitalCost} />
        <DetailField label="Warehouse cost" value={group.warehouseCost} />
        <DetailField label="B2 stockout % 1" value={group.b2StockoutPct1} />
        <DetailField label="B2 stockout % 2" value={group.b2StockoutPct2} />
        <DetailField label="Handling" value={group.handling} />
        <DetailField label="Transport" value={group.transport} />
      </div>

      <h3 className="text-sm font-medium text-muted-foreground">
        Ordering / evaluation days
      </h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <DetailField label="Monday" value={yesNo(group.orderOnMonday)} />
        <DetailField label="Tuesday" value={yesNo(group.orderOnTuesday)} />
        <DetailField label="Wednesday" value={yesNo(group.orderOnWednesday)} />
        <DetailField label="Thursday" value={yesNo(group.orderOnThursday)} />
        <DetailField label="Friday" value={yesNo(group.orderOnFriday)} />
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">Suppliers</h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Preferred</TableHead>
              <TableHead>External code</TableHead>
              <TableHead>EAN</TableHead>
              <TableHead>Editing</TableHead>
              <TableHead className="text-right">Delivery time</TableHead>
              <TableHead className="text-right">MOQ</TableHead>
              <TableHead className="text-right">Order series</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.suppliers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No suppliers are set up for this group.
                </TableCell>
              </TableRow>
            ) : (
              group.suppliers.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/companies/${row.supplierCompanyUuid}`}
                      className="text-primary hover:underline"
                    >
                      {row.supplierName ?? row.supplierCompanyUuid}
                    </Link>
                  </TableCell>
                  <TableCell>{yesNo(row.preferred)}</TableCell>
                  <TableCell>{orDash(row.externalProductCode)}</TableCell>
                  <TableCell>{orDash(row.ean)}</TableCell>
                  <TableCell>{orDash(row.editing)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {`${row.deliveryTime ?? 0} ${
                      row.deliveryTimeUnit
                        ? DELIVERY_TIME_UNIT_LABELS[row.deliveryTimeUnit]
                        : ""
                    }`.trim()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {`${row.moq ?? "0"} ${
                      row.moqUnit ? PURCHASING_UNIT_LABELS[row.moqUnit] : ""
                    }`.trim()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {`${row.orderSeries ?? 0} ${
                      row.orderSeriesUnit
                        ? PURCHASING_UNIT_LABELS[row.orderSeriesUnit]
                        : ""
                    }`.trim()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">Sub-groups</h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Product shape</TableHead>
              <TableHead>Article group</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.children.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  This group has no sub-groups.
                </TableCell>
              </TableRow>
            ) : (
              group.children.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/product-groups/${row.uuid}`}
                      className="text-primary hover:underline"
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {row.productShape
                      ? PRODUCT_SHAPE_LABELS[row.productShape]
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {row.articleGroup
                      ? ARTICLE_GROUP_LABELS[row.articleGroup]
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="border-b pb-2 text-base font-semibold">
        Products in this group
      </h2>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product code</TableHead>
              <TableHead>Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {group.products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="h-24 text-center text-muted-foreground"
                >
                  No products are filed under this group.
                </TableCell>
              </TableRow>
            ) : (
              group.products.map((row) => (
                <TableRow key={row.uuid}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/products/${row.uuid}`}
                      className="text-primary hover:underline"
                    >
                      {row.productCode}
                    </Link>
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  </div>
);
