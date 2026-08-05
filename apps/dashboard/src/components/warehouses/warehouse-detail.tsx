import Link from "next/link";
import { WarehouseDetail } from "@/app/(dashboard)/warehouses/actions";
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
  orDash,
  yesNo,
} from "@/lib/helpers";
import {
  COUNT_WORKORDER_METHOD_LABELS,
  MACHINE_PRODUCTION_LABELS,
  PRINTER_ENTRY_LABELS,
  PRINTER_NAME_LABELS,
  STICKER_PER_PICK_WORKORDER_LABELS,
  WAREHOUSE_ADDRESS_LABELS,
  WAREHOUSE_BLOCK_REASON_LABELS,
  WAREHOUSE_COUNT_STOCK_TYPE_LABELS,
  WAREHOUSE_LOADING_LOCATION_LABELS,
  WAREHOUSE_LOCATION_TYPE_LABELS,
  WAREHOUSE_TYPE_LABELS,
  WAREHOUSE_WORK_ORDER_STATUS_LABELS,
  WORKORDER_PRINT_METHOD_LABELS,
  WORKORDER_PROCESSING_METHOD_LABELS,
  WORKORDER_RELEASE_METHOD_LABELS,
  WORKORDER_SLIP_TYPE_LABELS,
} from "@/lib/labels";

type Props = {
  warehouse: WarehouseDetail;
};

// The three fetch-workorder blocks (picking, surface treatment, sawing) carry
// the same three settings, so they are printed by one component rather than
// three near-identical grids.
type WorkorderMethodsProps = {
  title: string;
  perSubsection?: boolean | null;
  processingMethod: WarehouseDetail["pickingProcessingMethod"];
  releaseMethod: WarehouseDetail["pickingReleaseMethod"];
  printingMethod: WarehouseDetail["pickingPrintingMethod"];
};

const WorkorderMethods = ({
  title,
  perSubsection,
  processingMethod,
  releaseMethod,
  printingMethod,
}: WorkorderMethodsProps) => (
  <div className="space-y-3">
    <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {perSubsection !== undefined && (
        <DetailField label="Make per subsection" value={yesNo(perSubsection)} />
      )}
      <DetailField
        label="Processing method"
        value={
          processingMethod
            ? WORKORDER_PROCESSING_METHOD_LABELS[processingMethod]
            : null
        }
      />
      <DetailField
        label="Release method"
        value={
          releaseMethod ? WORKORDER_RELEASE_METHOD_LABELS[releaseMethod] : null
        }
      />
      <DetailField
        label="Printing method"
        value={
          printingMethod ? WORKORDER_PRINT_METHOD_LABELS[printingMethod] : null
        }
      />
    </div>
  </div>
);

export const WarehouseDetailView = ({ warehouse }: Props) => {
  const isRoot = warehouse.parentUuid === null;

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Identity</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Name" value={warehouse.name} />
          <DetailField
            label="Type"
            value={
              warehouse.type ? WAREHOUSE_TYPE_LABELS[warehouse.type] : null
            }
          />
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Parent
            </p>
            {warehouse.parentUuid && warehouse.parentName ? (
              <Link
                href={`/warehouses/${warehouse.parentUuid}`}
                className="text-sm text-primary hover:underline"
              >
                {warehouse.parentName}
              </Link>
            ) : (
              <p className="text-sm">— (top level)</p>
            )}
          </div>
          <DetailField
            label="Location type"
            value={
              warehouse.locationType
                ? WAREHOUSE_LOCATION_TYPE_LABELS[warehouse.locationType]
                : null
            }
          />
          <DetailField
            label="Loading location"
            value={
              warehouse.loadingLocation
                ? WAREHOUSE_LOADING_LOCATION_LABELS[warehouse.loadingLocation]
                : null
            }
          />
          <DetailField
            label="Address"
            value={
              warehouse.address
                ? WAREHOUSE_ADDRESS_LABELS[warehouse.address]
                : isRoot
                  ? null
                  : "Held on the parent warehouse"
            }
          />
          <DetailField
            label="Picking sequence"
            value={warehouse.pickingSequence}
          />
          <DetailField
            label="Created"
            value={formatDateValue(warehouse.createdAt)}
          />
          <DetailField
            label="Last modified"
            value={formatDateValue(warehouse.updatedAt)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">
          Availability and dimensions
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Blocked" value={yesNo(warehouse.blocked)} />
          <DetailField
            label="Block reason"
            value={
              warehouse.blockReason
                ? WAREHOUSE_BLOCK_REASON_LABELS[warehouse.blockReason]
                : null
            }
          />
          <DetailField
            label="Blocked for optimization"
            value={yesNo(warehouse.blockedForOptimization)}
          />
          <DetailField
            label="Limited dimensions"
            value={yesNo(warehouse.limitedDimensions)}
          />
          <DetailField label="Minimum length" value={warehouse.minLength} />
          <DetailField label="Maximum length" value={warehouse.maxLength} />
          <DetailField label="Maximum width" value={warehouse.maxWidth} />
          <DetailField label="Maximum weight" value={warehouse.maxWeight} />
          <DetailField
            label="Product types"
            value={warehouse.productTypes?.join(", ") ?? null}
          />
          <DetailField
            label="Call-off location"
            value={warehouse.callOffLocation}
          />
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Transport by
            </p>
            {warehouse.transportByCompanyUuid &&
            warehouse.transportByCompanyName ? (
              <Link
                href={`/companies/${warehouse.transportByCompanyUuid}`}
                className="text-sm text-primary hover:underline"
              >
                {warehouse.transportByCompanyName}
              </Link>
            ) : (
              <p className="text-sm">—</p>
            )}
          </div>
        </div>
        <DetailField
          label="Load locations"
          value={
            warehouse.loadLocations && warehouse.loadLocations.length > 0
              ? warehouse.loadLocations
                  .map((entry) =>
                    entry.loadLocation
                      ? `${entry.transportRegion} → ${entry.loadLocation}`
                      : entry.transportRegion,
                  )
                  .join(", ")
              : null
          }
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Documents
          </p>
          <DocumentCell documents={warehouse.documents} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Counting</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField label="Count per" value={warehouse.countPer} />
          <DetailField label="Counted this" value={warehouse.countedThis} />
          <DetailField
            label="Count target date"
            value={formatDateColumn(warehouse.countTargetDate)}
          />
          <DetailField
            label="Last count date"
            value={formatDateColumn(warehouse.lastCountDate)}
          />
          <DetailField
            label="Count as"
            value={
              warehouse.countAs
                ? WAREHOUSE_COUNT_STOCK_TYPE_LABELS[warehouse.countAs]
                : null
            }
          />
          <DetailField
            label="Count under value"
            value={warehouse.countUnderValue}
          />
          <DetailField
            label="Count under unit"
            value={warehouse.countUnderUnit}
          />
          <DetailField
            label="Open count order available"
            value={yesNo(warehouse.openCountOrderAvailable)}
          />
          <DetailField
            label="Count method"
            value={
              warehouse.countMethod
                ? COUNT_WORKORDER_METHOD_LABELS[warehouse.countMethod]
                : null
            }
          />
          <DetailField
            label="Max lines per command"
            value={warehouse.countMaxLinesPerCommand}
          />
          <DetailField
            label="Count release method"
            value={
              warehouse.countReleaseMethod
                ? WORKORDER_RELEASE_METHOD_LABELS[warehouse.countReleaseMethod]
                : null
            }
          />
          <DetailField
            label="Count print method"
            value={
              warehouse.countPrintMethod
                ? WORKORDER_PRINT_METHOD_LABELS[warehouse.countPrintMethod]
                : null
            }
          />
          <DetailField
            label="Print stock on slip"
            value={yesNo(warehouse.countPrintStockOnSlip)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">Workorders</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField
            label="Make workorders per subsection"
            value={yesNo(warehouse.makeWorkordersPerSubsection)}
          />
          <DetailField
            label="Order entry deadline (internal)"
            value={warehouse.orderEntryDeadlineForInternal}
          />
          <DetailField
            label="Capacity per resource"
            value={yesNo(warehouse.capacityPerResource)}
          />
          <DetailField
            label="Sort lines by width/code/length"
            value={yesNo(warehouse.sortLinesByWidthProductCodeLength)}
          />
          <DetailField
            label="Print all locations on slip"
            value={yesNo(warehouse.printAllLocationsOnSlip)}
          />
          <DetailField
            label="Workorder slip"
            value={
              warehouse.workorderSlip
                ? WORKORDER_SLIP_TYPE_LABELS[warehouse.workorderSlip]
                : null
            }
          />
          <DetailField
            label="Add section to CSV file name"
            value={yesNo(warehouse.addSectionToCsvFileName)}
          />
          <DetailField
            label="Add subsection to CSV file name"
            value={yesNo(warehouse.addSubsectionToCsvFileName)}
          />
          <DetailField
            label="Add product type to CSV file name"
            value={yesNo(warehouse.addProductTypeToCsvFileName)}
          />
        </div>

        <WorkorderMethods
          title="Picking workorders"
          processingMethod={warehouse.pickingProcessingMethod}
          releaseMethod={warehouse.pickingReleaseMethod}
          printingMethod={warehouse.pickingPrintingMethod}
        />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DetailField
            label="Packaging mandatory on completion"
            value={yesNo(warehouse.packagingMandatoryOnCompletion)}
          />
          <DetailField
            label="Packaging dialogue on completion"
            value={yesNo(warehouse.packagingDialogueOnCompletion)}
          />
        </div>

        <WorkorderMethods
          title="Surface treatment workorders"
          perSubsection={warehouse.surfaceTreatmentMakePerSubsection}
          processingMethod={warehouse.surfaceTreatmentProcessingMethod}
          releaseMethod={warehouse.surfaceTreatmentReleaseMethod}
          printingMethod={warehouse.surfaceTreatmentPrintingMethod}
        />

        <WorkorderMethods
          title="Sawing workorders"
          perSubsection={warehouse.sawingMakePerSubsection}
          processingMethod={warehouse.sawingProcessingMethod}
          releaseMethod={warehouse.sawingReleaseMethod}
          printingMethod={warehouse.sawingPrintingMethod}
        />

        <h3 className="text-sm font-medium text-muted-foreground">
          Pick-up workorders
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Default location
            </p>
            {warehouse.pickupDefaultLocationUuid &&
            warehouse.pickupDefaultLocationName ? (
              <Link
                href={`/warehouses/${warehouse.pickupDefaultLocationUuid}`}
                className="text-sm text-primary hover:underline"
              >
                {warehouse.pickupDefaultLocationName}
              </Link>
            ) : (
              <p className="text-sm">—</p>
            )}
          </div>
          <DetailField
            label="Slip printer"
            value={
              warehouse.pickupSlipPrinter
                ? PRINTER_NAME_LABELS[warehouse.pickupSlipPrinter]
                : null
            }
          />
          <DetailField
            label="Slip printer entry"
            value={
              warehouse.pickupSlipPrinterEntry
                ? PRINTER_ENTRY_LABELS[warehouse.pickupSlipPrinterEntry]
                : null
            }
          />
          <DetailField
            label="Order printer"
            value={
              warehouse.pickupOrderPrinter
                ? PRINTER_NAME_LABELS[warehouse.pickupOrderPrinter]
                : null
            }
          />
          <DetailField
            label="Order printer entry"
            value={
              warehouse.pickupOrderPrinterEntry
                ? PRINTER_ENTRY_LABELS[warehouse.pickupOrderPrinterEntry]
                : null
            }
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="border-b pb-2 text-base font-semibold">
          Print settings
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <DetailField
            label="A4 printer — original"
            value={
              warehouse.a4PrinterOriginal
                ? PRINTER_NAME_LABELS[warehouse.a4PrinterOriginal]
                : null
            }
          />
          <DetailField
            label="A4 printer — copy 1"
            value={
              warehouse.a4PrinterCopy1
                ? PRINTER_NAME_LABELS[warehouse.a4PrinterCopy1]
                : null
            }
          />
          <DetailField
            label="A4 printer — copy 2"
            value={
              warehouse.a4PrinterCopy2
                ? PRINTER_NAME_LABELS[warehouse.a4PrinterCopy2]
                : null
            }
          />
          <DetailField
            label="Small material threshold (mm)"
            value={warehouse.a4SmallMaterialThresholdMm}
          />
          <DetailField
            label="Small material — original"
            value={
              warehouse.a4SmallPrinterOriginal
                ? PRINTER_NAME_LABELS[warehouse.a4SmallPrinterOriginal]
                : null
            }
          />
          <DetailField
            label="Small material — copy 1"
            value={
              warehouse.a4SmallPrinterCopy1
                ? PRINTER_NAME_LABELS[warehouse.a4SmallPrinterCopy1]
                : null
            }
          />
          <DetailField
            label="Small material — copy 2"
            value={
              warehouse.a4SmallPrinterCopy2
                ? PRINTER_NAME_LABELS[warehouse.a4SmallPrinterCopy2]
                : null
            }
          />
          <DetailField
            label="Sticker per pick workorder"
            value={
              warehouse.stickerPerPickWorkorder
                ? STICKER_PER_PICK_WORKORDER_LABELS[
                    warehouse.stickerPerPickWorkorder
                  ]
                : null
            }
          />
          <DetailField
            label="Label printer"
            value={
              warehouse.labelPrinter
                ? PRINTER_NAME_LABELS[warehouse.labelPrinter]
                : null
            }
          />
          <DetailField
            label="Sticker printer"
            value={
              warehouse.stickerPrinter
                ? PRINTER_NAME_LABELS[warehouse.stickerPrinter]
                : null
            }
          />
          <DetailField
            label="CSV customer label file name"
            value={warehouse.csvCustomerLabelFileName}
          />
          <DetailField
            label="CSV — add section"
            value={yesNo(warehouse.csvCustomerLabelAddSection)}
          />
          <DetailField
            label="CSV — add subsection"
            value={yesNo(warehouse.csvCustomerLabelAddSubsection)}
          />
          <DetailField
            label="CSV — add product type"
            value={yesNo(warehouse.csvCustomerLabelAddProductType)}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">
          Sub-sections and locations
        </h2>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location type</TableHead>
                <TableHead className="text-right">Picking sequence</TableHead>
                <TableHead>Blocked</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouse.children.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Nothing sits under this row.
                  </TableCell>
                </TableRow>
              ) : (
                warehouse.children.map((row) => (
                  <TableRow key={row.uuid}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/warehouses/${row.uuid}`}
                        className="text-primary hover:underline"
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {row.type ? WAREHOUSE_TYPE_LABELS[row.type] : "—"}
                    </TableCell>
                    <TableCell>
                      {row.locationType
                        ? WAREHOUSE_LOCATION_TYPE_LABELS[row.locationType]
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {orDash(row.pickingSequence)}
                    </TableCell>
                    <TableCell>{yesNo(row.blocked)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">
          Machines in this location
        </h2>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Production</TableHead>
                <TableHead>Out of business</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouse.machines.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No machines stand in this location.
                  </TableCell>
                </TableRow>
              ) : (
                warehouse.machines.map((row) => (
                  <TableRow key={row.uuid}>
                    <TableCell className="font-mono font-medium">
                      <Link
                        href={`/machines/${row.uuid}`}
                        className="text-primary hover:underline"
                      >
                        {row.code}
                      </Link>
                    </TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>
                      {MACHINE_PRODUCTION_LABELS[row.production]}
                    </TableCell>
                    <TableCell>{yesNo(row.outOfBusiness)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="border-b pb-2 text-base font-semibold">Work orders</h2>
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Work order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouse.workOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No work orders have been raised for this warehouse.
                  </TableCell>
                </TableRow>
              ) : (
                warehouse.workOrders.map((row) => (
                  <TableRow key={row.uuid}>
                    <TableCell className="font-medium">#{row.id}</TableCell>
                    <TableCell>
                      <StatusBadge
                        value={row.status}
                        label={
                          row.status
                            ? WAREHOUSE_WORK_ORDER_STATUS_LABELS[row.status]
                            : null
                        }
                      />
                    </TableCell>
                    <TableCell>{formatDateValue(row.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
};
