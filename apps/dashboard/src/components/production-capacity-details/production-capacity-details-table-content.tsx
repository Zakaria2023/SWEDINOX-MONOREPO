"use client";

import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { ProductionCapacityDetailListItem } from "@/app/(dashboard)/production-capacity-details/actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import {
  DELIVERY_STATUS_LABELS,
  ORDER_LINE_STATUS_LABELS,
  SALES_UNIT_LABELS,
  STOCK_UNIT_LABELS,
} from "@/lib/labels";
import { formatDateValue } from "@/lib/helpers";

type Props = {
  details: ProductionCapacityDetailListItem[];
};

type BooleanCellProps = {
  value: boolean | null;
};

const BooleanCell = ({ value }: BooleanCellProps) =>
  value ? (
    <Check className="size-4 text-green-600" />
  ) : (
    <Minus className="size-4 text-muted-foreground" />
  );

export const ProductionCapacityDetailsTable = ({ details }: Props) => (
  <div className="overflow-x-auto rounded-md border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Order type</TableHead>
          <TableHead className="text-right">Line</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Product code</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="text-right">Length (mm)</TableHead>
          <TableHead className="text-right">Width (mm)</TableHead>
          <TableHead className="text-right">Dikte</TableHead>
          <TableHead>Kwaliteit</TableHead>
          <TableHead>Categorie</TableHead>
          <TableHead className="text-center">Fixed dim.</TableHead>
          <TableHead className="text-right">Sawing speed</TableHead>
          <TableHead className="text-center">Pick-up</TableHead>
          <TableHead className="text-right">To saw</TableHead>
          <TableHead>Sawing WO</TableHead>
          <TableHead>Sawing WO line</TableHead>
          <TableHead>Sawing method</TableHead>
          <TableHead>Sawing type</TableHead>
          <TableHead>Production starting</TableHead>
          <TableHead>Planned delivery</TableHead>
          <TableHead>Transport date</TableHead>
          <TableHead>Delivery status</TableHead>
          <TableHead>Order line deliv. date</TableHead>
          <TableHead className="text-right">Line Qty (p)</TableHead>
          <TableHead className="text-right">Line Qty (a)</TableHead>
          <TableHead>Qty unit</TableHead>
          <TableHead className="text-right">Kg (p)</TableHead>
          <TableHead className="text-right">Kg (a)</TableHead>
          <TableHead className="text-right">Theor. weight</TableHead>
          <TableHead>Theor. weight U.</TableHead>
          <TableHead className="text-right">Option Qty</TableHead>
          <TableHead>Line status</TableHead>
          <TableHead>Line type</TableHead>
          <TableHead className="text-right">Drilling holes</TableHead>
          <TableHead className="text-right">L.Saw angle</TableHead>
          <TableHead className="text-right">R.Saw angle</TableHead>
          <TableHead className="text-right">Bls</TableHead>
          <TableHead className="text-right">Bls+P</TableHead>
          <TableHead className="text-center">Sawing</TableHead>
          <TableHead className="text-center">Drilling</TableHead>
          <TableHead className="text-center">Standing</TableHead>
          <TableHead>Sawing angle(s)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {details.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={43}
              className="h-24 text-center text-muted-foreground"
            >
              No production capacity details found.
            </TableCell>
          </TableRow>
        ) : (
          details.map((row) => (
            <TableRow key={row.uuid}>
              <TableCell>
                {row.orderId ? (
                  <Link
                    href={`/orders/${row.orderUuid}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    #{row.orderId}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {row.orderType}
              </TableCell>
              <TableCell className="text-right">
                <Link
                  href={`/production-capacity-details/${row.uuid}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {row.lineNumber ?? "View"}
                </Link>
              </TableCell>
              <TableCell>{row.companyName ?? "—"}</TableCell>
              <TableCell className="font-medium">
                {row.productCode ?? "—"}
              </TableCell>
              <TableCell>{row.productName ?? "—"}</TableCell>
              <TableCell className="text-right">{row.lengthMm ?? "—"}</TableCell>
              <TableCell className="text-right">{row.widthMm ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.thicknessMm ?? "—"}
              </TableCell>
              <TableCell>{row.quality ?? "—"}</TableCell>
              <TableCell>{row.category ?? "—"}</TableCell>
              <TableCell className="text-center">
                <span className="inline-flex justify-center">
                  <BooleanCell value={row.fixedDimension} />
                </span>
              </TableCell>
              <TableCell className="text-right">
                {row.sawingSpeed ?? "—"}
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex justify-center">
                  <BooleanCell value={row.isPickup} />
                </span>
              </TableCell>
              <TableCell className="text-right">{row.toSaw ?? "—"}</TableCell>
              <TableCell>{row.sawingWorkOrder ?? "—"}</TableCell>
              <TableCell>{row.sawingWorkOrderLine ?? "—"}</TableCell>
              <TableCell>{row.sawingMethod ?? "—"}</TableCell>
              <TableCell>{row.sawingType ?? "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.productionStartingDate)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.plannedDeliveryDate)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.transportDate)}
              </TableCell>
              <TableCell>
                {row.deliveryStatus
                  ? DELIVERY_STATUS_LABELS[row.deliveryStatus]
                  : "—"}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateValue(row.orderLineDeliveryDate)}
              </TableCell>
              <TableCell className="text-right">
                {row.qtyPlanned ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.qtyActual ?? "—"}
              </TableCell>
              <TableCell>
                {row.unit ? STOCK_UNIT_LABELS[row.unit] : "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.kgPlanned ?? "—"}
              </TableCell>
              <TableCell className="text-right">{row.kgActual ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.theoreticalWeight ?? "—"}
              </TableCell>
              <TableCell>
                {row.theoreticalWeightUnit
                  ? SALES_UNIT_LABELS[row.theoreticalWeightUnit]
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.optionQty ?? "—"}
              </TableCell>
              <TableCell>
                {row.lineStatus
                  ? ORDER_LINE_STATUS_LABELS[row.lineStatus]
                  : "—"}
              </TableCell>
              <TableCell>{row.lineType ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.drillingHoles ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.leftSawAngle ?? "—"}
              </TableCell>
              <TableCell className="text-right">
                {row.rightSawAngle ?? "—"}
              </TableCell>
              <TableCell className="text-right">{row.bundles ?? "—"}</TableCell>
              <TableCell className="text-right">
                {row.bundlesPlusRemainder ?? "—"}
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex justify-center">
                  <BooleanCell value={row.sawing} />
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex justify-center">
                  <BooleanCell value={row.drilling} />
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex justify-center">
                  <BooleanCell value={row.standing} />
                </span>
              </TableCell>
              <TableCell>{row.sawingAngles ?? "—"}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </div>
);
