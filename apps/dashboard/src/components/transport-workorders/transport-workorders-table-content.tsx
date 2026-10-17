"use client";

import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  completeTransportWorkOrderLine,
  TransportOverviewRow,
} from "@/app/(dashboard)/transport-workorders/actions";
import { Button } from "@/components/shadcn/button";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Select } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { BooleanFlag } from "@/components/ui/boolean-flag";
import { FormError } from "@/components/ui/form-error";
import { FormLabel } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableExportButton } from "@/components/ui/table-export-button";
import { GenerateTransportButton } from "@/components/transport-workorders/generate-transport-button";
import {
  TransportPeriod,
  transportPeriods,
  TripStatus,
  tripStatuses,
} from "@/lib/enums";
import {
  cn,
  formatDateColumn,
  formatNumber,
  orDash,
  todayDateString,
  transportPeriodRange,
} from "@/lib/helpers";
import {
  STOCK_UNIT_LABELS,
  TRANSPORT_PERIOD_LABELS,
  TRIP_STATUS_LABELS,
} from "@/lib/labels";

// The overview's toolbar, in the reference's order. Each is a trip-planning
// or loading step nothing here performs yet, so all are greyed.
const TRIP_TOOLBAR_NOT_BUILT = [
  "Cancel",
  "Release",
  "Loading preparation list",
  "Provisional Trip list",
  "Bill of lading",
  "Show CMR",
];

const LEVELS = [1, 2, 3] as const;

// Trip, destination and line columns share one header row.
const COLUMN_COUNT = 23;

type Level = (typeof LEVELS)[number];

type Props = {
  lines: TransportOverviewRow[];
};

type Destination = {
  key: string;
  label: string;
  rows: TransportOverviewRow[];
};

type Trip = {
  key: string;
  label: string;
  destinations: Destination[];
  rows: TransportOverviewRow[];
};

type TotalsCellsProps = {
  rows: TransportOverviewRow[];
};

type LineCellsProps = {
  row: TransportOverviewRow;
};

type TripFooterProps = {
  trip: Trip | null;
};

const TotalsCells = ({ rows }: TotalsCellsProps) => {
  const total = (pick: (row: TransportOverviewRow) => string | null) =>
    rows.reduce((sum, row) => sum + Number(pick(row) ?? 0), 0);
  return (
    <>
      <TableCell colSpan={11} />
      <TableCell className="text-right tabular-nums">
        {formatNumber(total((row) => row.qtyPlanned))}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatNumber(total((row) => row.qtyActual))}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatNumber(total((row) => row.qtyLoaded))}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatNumber(total((row) => row.kgActual))}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {formatNumber(total((row) => row.kgPlanned))}
      </TableCell>
      <TableCell colSpan={6} />
    </>
  );
};

const LineCells = ({ row }: LineCellsProps) => (
  <>
    <TableCell>
      {row.orderNumber
        ? `${row.orderNumber}${row.orderLineNumber ? `/${row.orderLineNumber * 10}` : ""}`
        : "—"}
    </TableCell>
    <TableCell>{orDash(row.lineOptions)}</TableCell>
    <TableCell className="font-medium">{orDash(row.productCode)}</TableCell>
    <TableCell>{orDash(row.action)}</TableCell>
    <TableCell>{orDash(row.postalCode)}</TableCell>
    <TableCell>{orDash(row.sourceStatus)}</TableCell>
    <TableCell>
      <StatusBadge value={row.status} label={TRIP_STATUS_LABELS[row.status]} />
    </TableCell>
    <TableCell>{orDash(row.fromLocation)}</TableCell>
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
      {formatNumber(Number(row.qtyPlanned ?? 0))}
    </TableCell>
    <TableCell className="text-right tabular-nums">
      {formatNumber(Number(row.qtyActual ?? 0))}
    </TableCell>
    <TableCell className="text-right tabular-nums">
      {formatNumber(Number(row.qtyLoaded ?? 0))}
    </TableCell>
    <TableCell className="text-right tabular-nums">
      {formatNumber(Number(row.kgActual ?? 0))}
    </TableCell>
    <TableCell className="text-right tabular-nums">
      {formatNumber(Number(row.kgPlanned ?? 0))}
    </TableCell>
    <TableCell className="text-right tabular-nums">{orDash(row.colli)}</TableCell>
    <TableCell className="text-right tabular-nums">
      {orDash(row.priority)}
    </TableCell>
    {/* No column holds a line's rush, deviation reason or forklift company. */}
    <TableCell>
      <BooleanFlag on={false} label="Rush" />
    </TableCell>
    <TableCell />
    <TableCell>
      <BooleanFlag on={row.vehicleWithCrane} label="Crane co." />
    </TableCell>
    <TableCell>
      <BooleanFlag on={false} label="Forklift co." />
    </TableCell>
  </>
);

/**
 * The footer the reference prints for the selected trip: its name, then per
 * order line what is `Planned` (Qty. · U. · Kg · Length) beside what is
 * `Ready for transport` (Qty. · U. · Kg) — picked onto `Laad`.
 */
const TripFooter = ({ trip }: TripFooterProps) =>
  trip ? (
    <section className="space-y-2 rounded-lg border p-3">
      <h2 className="text-sm font-semibold">{trip.label}</h2>
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead colSpan={4} className="border-e text-center">
                Planned
              </TableHead>
              <TableHead colSpan={3} className="text-center">
                Ready for transport
              </TableHead>
            </TableRow>
            <TableRow>
              <TableHead>Order line</TableHead>
              <TableHead className="text-right">Qty.</TableHead>
              <TableHead>U.</TableHead>
              <TableHead className="text-right">Kg</TableHead>
              <TableHead className="border-e text-right">Length</TableHead>
              <TableHead className="text-right">Qty.</TableHead>
              <TableHead>U.</TableHead>
              <TableHead className="text-right">Kg</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trip.rows.map((row) => {
              const unit = row.lineUnit ? STOCK_UNIT_LABELS[row.lineUnit] : "—";
              return (
                <TableRow key={row.uuid}>
                  <TableCell>
                    {row.orderNumber
                      ? `${row.orderNumber}${row.orderLineNumber ? `/${row.orderLineNumber * 10}` : ""}`
                      : orDash(row.productCode)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(row.qtyPlanned ?? 0))}
                  </TableCell>
                  <TableCell>{unit}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(row.kgPlanned ?? 0))}
                  </TableCell>
                  <TableCell className="border-e text-right tabular-nums">
                    {orDash(row.lengthMm)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(row.qtyActual ?? 0))}
                  </TableCell>
                  <TableCell>{unit}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(Number(row.kgActual ?? 0))}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  ) : (
    <p className="text-sm text-muted-foreground">
      Select a trip to see what is planned and ready for it.
    </p>
  );

/**
 * `Transport opdrachten` (Logistiek), as the reference lays it out on
 * 16-10-2026: a tree `Rit / Bestemming / Regel` — the trip, the destination
 * company and address, the line — with levels 1 · 2 · 3, a `Periode` and a
 * status filter, and the selected trip's footer.
 *
 * Only what exists is shown: how a line gets onto a trip, loading and
 * delivery are not built, so the trip toolbar is greyed. A transport line
 * raised at Make final waits on its delivery date until it is planned.
 */
export const TransportWorkOrdersTable = ({ lines }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [period, setPeriod] = useState<TransportPeriod>("all");
  const [statuses, setStatuses] = useState<TripStatus[]>([]);
  const [level, setLevel] = useState<Level>(3);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selectedTripKey, setSelectedTripKey] = useState<string | null>(null);
  const [selectedLineUuid, setSelectedLineUuid] = useState<string | null>(
    null,
  );

  const range = transportPeriodRange(period, todayDateString());
  const shown = lines.filter((row) => {
    const date = row.workOrderDate ? formatDateColumn(row.workOrderDate) : "";
    if (range && !(date >= range.from && date <= range.to)) {
      return false;
    }
    return statuses.length === 0 || statuses.includes(row.status);
  });

  // Trip → destination → line, in the order the rows arrive.
  const trips = shown.reduce<Trip[]>((all, row) => {
    const tripKey = row.workOrderUuid;
    const found = all.find((candidate) => candidate.key === tripKey);
    // A trip with no number yet reads its date — the delivery date the
    // line was raised for.
    const trip: Trip = found ?? {
      key: tripKey,
      label: row.tripNumber
        ? `Trip ${row.tripNumber}${row.workOrderDate ? `, ${formatDateColumn(row.workOrderDate)}` : ""}`
        : `Trip ${formatDateColumn(row.workOrderDate)}`,
      destinations: [],
      rows: [],
    };
    if (!found) {
      all.push(trip);
    }
    trip.rows.push(row);
    const destinationKey = `${tripKey}:${row.destinationCompanyUuid ?? ""}:${row.postalCode ?? ""}`;
    const destination = trip.destinations.find(
      (candidate) => candidate.key === destinationKey,
    );
    if (destination) {
      destination.rows.push(row);
    } else {
      trip.destinations.push({
        key: destinationKey,
        label: [row.destinationName, row.postalCode].filter(Boolean).join(", "),
        rows: [row],
      });
    }
    return all;
  }, []);

  const selectedTrip =
    trips.find((trip) => trip.key === selectedTripKey) ?? null;
  const selectedLine =
    shown.find((row) => row.uuid === selectedLineUuid) ?? null;

  const isOpen = (key: string, depth: Level) =>
    level > depth && !collapsed.has(key);
  const toggle = (key: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });

  const complete = () => {
    if (!selectedLine) {
      return;
    }
    setError(undefined);
    startTransition(async () => {
      const result = await completeTransportWorkOrderLine(selectedLine.uuid);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
        {TRIP_TOOLBAR_NOT_BUILT.map((label) => (
          <Button
            key={label}
            type="button"
            size="sm"
            variant="outline"
            disabled
            title="Not built: trips are not planned or loaded here yet"
          >
            {label}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={complete}
          disabled={
            !selectedLine || selectedLine.status === "completed" || isPending
          }
        >
          {isPending ? "Completing…" : "Complete"}
        </Button>
        <div className="flex items-center gap-1 border-s ps-2">
          {LEVELS.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={level === value ? "default" : "outline"}
              onClick={() => {
                setLevel(value);
                setCollapsed(new Set());
              }}
              aria-label={`Show level ${value}`}
            >
              {value}
            </Button>
          ))}
        </div>
        <div className="ms-auto flex gap-2">
          <TableExportButton
            tableId="transport-workorders-table"
            fileName="transport-workorders"
            sheetName="Transport workorders"
          />
          <GenerateTransportButton />
        </div>
      </div>
      <FormError>{error}</FormError>

      <div className="flex flex-wrap items-end gap-6">
        <div className="w-56">
          <FormLabel htmlFor="transportPeriod">Period</FormLabel>
          <Select
            id="transportPeriod"
            value={period}
            options={transportPeriods.map((value) => ({
              value,
              label: TRANSPORT_PERIOD_LABELS[value],
            }))}
            onValueChange={(value) => {
              const next = transportPeriods.find((option) => option === value);
              if (next) {
                setPeriod(next);
              }
            }}
          />
        </div>
        <fieldset className="flex flex-wrap items-center gap-3">
          <legend className="mb-1 text-sm font-medium">Status</legend>
          {tripStatuses.map((status) => (
            <label key={status} className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={statuses.includes(status)}
                onChange={(event) =>
                  setStatuses((current) =>
                    event.target.checked
                      ? [...current, status]
                      : current.filter((value) => value !== status),
                  )
                }
              />
              {TRIP_STATUS_LABELS[status]}
            </label>
          ))}
        </fieldset>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table id="transport-workorders-table">
          <TableHeader>
            <TableRow className="whitespace-nowrap">
              <TableHead>Trip / Destination / Line</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Options</TableHead>
              <TableHead>Product code</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Postal Code</TableHead>
              <TableHead>Source Status</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Loading location</TableHead>
              <TableHead className="text-right">Length</TableHead>
              <TableHead className="text-right">Width</TableHead>
              <TableHead className="text-right">Thickness</TableHead>
              <TableHead className="text-right">Qty(p)</TableHead>
              <TableHead className="text-right">Qty(a)</TableHead>
              <TableHead className="text-right">Qty(loaded)</TableHead>
              <TableHead className="text-right">Kg(a)</TableHead>
              <TableHead className="text-right">Kg(p)</TableHead>
              <TableHead className="text-right">Colli</TableHead>
              <TableHead className="text-right">Priority</TableHead>
              <TableHead>Rush</TableHead>
              <TableHead>Deviation reason</TableHead>
              <TableHead>Crane co.</TableHead>
              <TableHead>Forklift co.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMN_COUNT}
                  className="h-24 text-center text-muted-foreground"
                >
                  No transport work orders found.
                </TableCell>
              </TableRow>
            ) : (
              trips.map((trip) => (
                <Fragment key={trip.key}>
                  <TableRow
                    aria-selected={trip.key === selectedTripKey}
                    onClick={() => setSelectedTripKey(trip.key)}
                    className={cn(
                      "cursor-pointer whitespace-nowrap bg-muted/40 font-medium",
                      trip.key === selectedTripKey && "bg-accent",
                    )}
                  >
                    <TableCell>
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={(event) => {
                          event.stopPropagation();
                          toggle(trip.key);
                        }}
                        aria-label={`Expand ${trip.label}`}
                      >
                        {isOpen(trip.key, 1) ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                        {trip.label}
                      </button>
                    </TableCell>
                    <TotalsCells rows={trip.rows} />
                  </TableRow>
                  {isOpen(trip.key, 1) &&
                    trip.destinations.map((destination) => (
                      <Fragment key={destination.key}>
                        <TableRow
                          onClick={() => setSelectedTripKey(trip.key)}
                          className="cursor-pointer whitespace-nowrap"
                        >
                          <TableCell className="ps-8">
                            <button
                              type="button"
                              className="flex items-center gap-1"
                              onClick={(event) => {
                                event.stopPropagation();
                                toggle(destination.key);
                              }}
                              aria-label={`Expand ${destination.label}`}
                            >
                              {isOpen(destination.key, 2) ? (
                                <ChevronDown className="size-4" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                              {orDash(destination.label)}
                            </button>
                          </TableCell>
                          <TotalsCells rows={destination.rows} />
                        </TableRow>
                        {isOpen(destination.key, 2) &&
                          destination.rows.map((row) => (
                            <TableRow
                              key={row.uuid}
                              aria-selected={row.uuid === selectedLineUuid}
                              onClick={() => {
                                setSelectedTripKey(trip.key);
                                setSelectedLineUuid(row.uuid);
                              }}
                              className={cn(
                                "cursor-pointer whitespace-nowrap",
                                row.uuid === selectedLineUuid && "bg-accent",
                              )}
                            >
                              <TableCell className="ps-14">
                                <Link
                                  href={`/transport-workorders/${row.uuid}`}
                                  className="text-primary hover:underline"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  {orDash(row.productName ?? row.productCode)}
                                </Link>
                              </TableCell>
                              <LineCells row={row} />
                            </TableRow>
                          ))}
                      </Fragment>
                    ))}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TripFooter trip={selectedTrip} />
    </div>
  );
};
