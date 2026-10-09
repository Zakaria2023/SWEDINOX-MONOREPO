"use client";

import { ProductDetail } from "@/app/(dashboard)/products/actions";
import { ProductField } from "@/components/products/product-field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { describeStockLimit, formatDateColumn, yesNo } from "@/lib/helpers";
import {
  COUNT_STOCK_BASIS_LABELS,
  CUSTOMER_LABEL_OPTION_LABELS,
  DISPATCH_STRATEGY_LABELS,
  LEAD_TIME_METHOD_LABELS,
  SALES_UNIT_LABELS,
  STOCK_LABEL_BREAKDOWN_LABELS,
  STOCK_LABEL_TYPE_LABELS,
  STOCK_MODE_LABELS,
} from "@/lib/labels";

type Props = {
  product: ProductDetail;
};

type ToleranceRow = {
  type: string;
  qty: string | null;
  kg: string | null;
};

const percent = (value: string | null) =>
  value === null ? "—" : `${Number(value)} %`;

const labelOf = <T extends string>(
  labels: Record<T, string>,
  value: T | null | undefined,
) => (value ? labels[value] : null);

/**
 * `Warehouse control`, `Stock control` and `Stock policy` read back on the
 * product screen. The reference's product is one editable form; ours shows it
 * read-only and edits it on the edit page, so these settings — how far a
 * report may stray from its plan, how the lot is registered and counted, and
 * what the order advice runs on — were only visible by opening the editor.
 */
export const ProductControlPanels = ({ product }: Props) => {
  // One rule per work-order type: a count and a production run must close
  // exactly, an unloading or a pick may be 5 % out (product-detail.md).
  const tolerances: ToleranceRow[] = [
    {
      type: "Unloading workorder",
      qty: product.toleranceUnloadingQty,
      kg: product.toleranceUnloadingKg,
    },
    {
      type: "Count workorder",
      qty: product.toleranceCountQty,
      kg: product.toleranceCountKg,
    },
    {
      type: "Picking workorder",
      qty: product.tolerancePickingQty,
      kg: product.tolerancePickingKg,
    },
    {
      type: "Production workorder",
      qty: product.toleranceProductionQty,
      kg: product.toleranceProductionKg,
    },
  ];

  return (
    <div className="space-y-3">
      <CollapsibleSection
        title="Warehouse control"
        summary={`Approve manually: warehouse ${yesNo(product.alwaysApproveManuallyWarehouseWorkorderLine)}, production ${yesNo(product.alwaysApproveManuallyProductionWorkorderLine)}`}
      >
        <div className="space-y-4 p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workorder type</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Kg</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tolerances.map((row) => (
                <TableRow key={row.type}>
                  <TableCell>{row.type}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {percent(row.qty)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {percent(row.kg)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <ProductField
              label="Always approve warehouse workorder line manually"
              value={yesNo(product.alwaysApproveManuallyWarehouseWorkorderLine)}
            />
            <ProductField
              label="Always approve production workorder line manually"
              value={yesNo(product.alwaysApproveManuallyProductionWorkorderLine)}
            />
            <ProductField
              label="Packaging mandatory when reporting completion"
              value={yesNo(product.packagingMandatoryOnCompletion)}
            />
            <ProductField
              label="Unloading workorder in stock unit"
              value={yesNo(product.unloadingWorkorderInStockUnit)}
            />
            <ProductField
              label="Receipt in locations with limited dimensions"
              value={yesNo(product.receiptInLocationsWithLimitedDimensions)}
            />
            <ProductField
              label="Goods receipt term (business days)"
              value={product.goodsReceiptTerm}
            />
            <ProductField
              label="Include in CSV file for stock labels"
              value={yesNo(product.includeInCsvForStockLabels)}
            />
            <ProductField
              label="Suggest last used charge in scanner"
              value={yesNo(product.suggestLastUsedChargeInScanner)}
            />
            <ProductField
              label="Stock label type"
              value={labelOf(STOCK_LABEL_TYPE_LABELS, product.stockLabelType)}
            />
            <ProductField
              label="Print labels"
              value={labelOf(
                STOCK_LABEL_BREAKDOWN_LABELS,
                product.stockLabelBreakdown,
              )}
            />
            <ProductField label="Piece(s)" value={product.stockLabelPieces} />
            <ProductField
              label="Customer label for picking workorder slip"
              value={labelOf(
                CUSTOMER_LABEL_OPTION_LABELS,
                product.customerLabelForPickingSlip,
              )}
            />
            <ProductField
              label="Customer label for sawing workorder slip"
              value={labelOf(
                CUSTOMER_LABEL_OPTION_LABELS,
                product.customerLabelForSawingSlip,
              )}
            />
            <ProductField
              label="Customer label at surface treatment slip"
              value={labelOf(
                CUSTOMER_LABEL_OPTION_LABELS,
                product.customerLabelAtSurfTreatSlip,
              )}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Stock control"
        summary={`Dispatch ${labelOf(DISPATCH_STRATEGY_LABELS, product.batchDispatchStrategy) ?? "—"}; last count ${formatDateColumn(product.lastCountDate)}`}
      >
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
          <ProductField
            label="Stock unit"
            value={labelOf(SALES_UNIT_LABELS, product.stockUnit)}
          />
          <ProductField label="Stock product" value={yesNo(product.stockProduct)} />
          <ProductField
            label="Stock product since"
            value={formatDateColumn(product.stockProductSince)}
          />
          <ProductField
            label="Standard product"
            value={yesNo(product.standardProduct)}
          />
          <ProductField label="Group product" value={yesNo(product.groupProduct)} />
          <ProductField
            label="Batch registration"
            value={yesNo(product.batchRegistration)}
          />
          <ProductField
            label="Register length"
            value={yesNo(product.batchRegisterLength)}
          />
          <ProductField
            label="Register width"
            value={yesNo(product.batchRegisterWidth)}
          />
          <ProductField
            label="Dispatch strategy"
            value={labelOf(DISPATCH_STRATEGY_LABELS, product.batchDispatchStrategy)}
          />
          <ProductField
            label="Use optimization"
            value={yesNo(product.batchUseOptimization)}
          />
          <ProductField label="Charge" value={yesNo(product.batchCharge)} />
          <ProductField
            label="Do not split stock per batch"
            value={yesNo(product.batchDoNotSplitPerBatch)}
          />
          <ProductField
            label="Plate number"
            value={yesNo(product.batchPlateNumber)}
          />
          <ProductField label="Per piece" value={yesNo(product.batchPerPiece)} />
          <ProductField label="Batch number" value={yesNo(product.batchNumber)} />
          <ProductField
            label="Length minimum (mm)"
            value={product.batchLengthMinimum}
          />
          <ProductField
            label="Length interval (mm)"
            value={product.batchLengthInterval}
          />
          <ProductField
            label="Neglect remainder under (mm)"
            value={product.batchLengthRemainderTolerance}
          />
          <ProductField
            label="Width minimum (mm)"
            value={product.batchWidthMinimum}
          />
          <ProductField
            label="Width interval (mm)"
            value={product.batchWidthInterval}
          />
          <ProductField label="Count frequency" value={product.countFrequency} />
          <ProductField
            label="Last count"
            value={formatDateColumn(product.lastCountDate)}
          />
          <ProductField
            label="Target date next count"
            value={formatDateColumn(product.nextCountTargetDate)}
          />
          <ProductField
            label="Count as the"
            value={labelOf(COUNT_STOCK_BASIS_LABELS, product.countStockBasis)}
          />
          <ProductField
            label="Count below"
            value={
              product.countBelowQuantity === null
                ? null
                : `${product.countBelowQuantity} ${labelOf(SALES_UNIT_LABELS, product.countBelowUnit) ?? ""}`.trim()
            }
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Stock policy"
        summary={`Min. stock: ${describeStockLimit(product.minStockMode, product.minStockMultiplier, product.minStockFixedValue)}; Max. stock: ${describeStockLimit(product.maxStockMode, product.maxStockMultiplier, product.maxStockFixedValue)}`}
      >
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
          <ProductField
            label="Min. stock method"
            value={labelOf(STOCK_MODE_LABELS, product.minStockMode)}
          />
          <ProductField
            label="Min. stock fixed value"
            value={product.minStockFixedValue}
          />
          <ProductField
            label="Min. stock multiplier"
            value={product.minStockMultiplier}
          />
          <ProductField
            label="Max. stock method"
            value={labelOf(STOCK_MODE_LABELS, product.maxStockMode)}
          />
          <ProductField
            label="Max. stock fixed value"
            value={product.maxStockFixedValue}
          />
          <ProductField
            label="Max. stock multiplier"
            value={product.maxStockMultiplier}
          />
          <ProductField
            label="Order advice code"
            value={product.orderAdviceCode}
          />
          <ProductField
            label="ABC classification code"
            value={product.pacClassification}
          />
          <ProductField
            label="Use StockOp for this product"
            value={yesNo(product.useStockOpForThisProduct)}
          />
          <ProductField
            label="Lead time method"
            value={labelOf(LEAD_TIME_METHOD_LABELS, product.leadTimeMethod)}
          />
          <ProductField label="Lead time (L, days)" value={product.leadTime} />
          <ProductField
            label="Review period (R, days)"
            value={product.reviewPeriod}
          />
          <ProductField
            label="Order costs, purchasing (A1)"
            value={product.orderCostsPurchasingSide}
          />
          <ProductField
            label="Order costs, logistics (A2)"
            value={product.orderCostsLogistics}
          />
          <ProductField
            label="Order series (Kg)"
            value={product.stockOpOrderSeries}
          />
          <ProductField
            label="Minimum order qty (Kg)"
            value={product.minOrderQty}
          />
          <ProductField
            label="Capital cost (r1, €/€/year)"
            value={product.capitalCost}
          />
          <ProductField
            label="Warehouse cost (r2, €/Kg/year)"
            value={product.warehouseCost}
          />
          <ProductField
            label="B2, stockout % (1)"
            value={product.b2StockoutPct1}
          />
          <ProductField
            label="B2, stockout % (2)"
            value={product.b2StockoutPct2}
          />
          <ProductField label="Handling (€/Kg)" value={product.handling} />
          <ProductField label="Transport (€/Kg)" value={product.transport} />
        </div>
      </CollapsibleSection>
    </div>
  );
};
