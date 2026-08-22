import { WarehouseFields } from "@/app/(dashboard)/warehouses/actions";
import { PrinterName, StickerPerPickWorkorderType } from "@/lib/enums";
import {
  printerAcceptsEntry,
  printerAcceptsSlip,
  printerMetaOf,
  STICKER_PER_PICK_DPI,
  stickerPerPickNeedsPrinter,
  WORKORDER_SLIP_META,
} from "@/lib/helpers";
import {
  PRINTER_ENTRY_LABELS,
  PRINTER_NAME_LABELS,
  STICKER_PER_PICK_WORKORDER_LABELS,
  WORKORDER_SLIP_TYPE_LABELS,
} from "@/lib/labels";

// Which printer fields have to be able to produce the workorder slip, and which
// tray choice belongs to which device. Held as pairs so the check reads the same
// way for the pickup screen and the print-settings screen.
const SLIP_PRINTERS: ReadonlyArray<{
  printer: keyof WarehouseFields;
  label: string;
}> = [
  { printer: "a4PrinterOriginal", label: "A4 printer — original" },
  { printer: "a4PrinterCopy1", label: "A4 printer — copy 1" },
  { printer: "a4PrinterCopy2", label: "A4 printer — copy 2" },
  { printer: "a4SmallPrinterOriginal", label: "Small material — original" },
  { printer: "a4SmallPrinterCopy1", label: "Small material — copy 1" },
  { printer: "a4SmallPrinterCopy2", label: "Small material — copy 2" },
];

const TRAY_PAIRS: ReadonlyArray<{
  printer: keyof WarehouseFields;
  entry: keyof WarehouseFields;
  label: string;
}> = [
  {
    printer: "pickupSlipPrinter",
    entry: "pickupSlipPrinterEntry",
    label: "Pick-up slip printer",
  },
  {
    printer: "pickupOrderPrinter",
    entry: "pickupOrderPrinterEntry",
    label: "Pick-up order printer",
  },
];

/**
 * The first thing wrong with a warehouse's print setup, or null when nothing is.
 *
 * Three things can be wrong, and none of them used to be caught: a slip sent to
 * a device that cannot produce its medium (an A4 pick slip on a label roll, or a
 * label on a sheet printer), a paper tray chosen on a device that has no trays,
 * and a sticker-per-pick setting with no label printer behind it. All three only
 * showed up as a bad print run on the floor.
 *
 * A resolution shortfall is deliberately not one of them: the two
 * sticker-per-pick settings are specified at 600 dpi and every label device in
 * the catalogue prints at 203, so refusing the pair would make the setting
 * unusable. printSetupAdvisory says so instead, on the screen, while the save
 * goes through.
 */
export const checkPrintSetup = (
  fields: Partial<WarehouseFields>,
): string | null => {
  const slip = fields.workorderSlip ?? null;

  // A slip written to a CSV file is not printed at all, so no device has to be
  // able to produce it.
  if (slip && WORKORDER_SLIP_META[slip].medium !== "file") {
    const wrongDevice = SLIP_PRINTERS.find((candidate) => {
      const printer = fields[candidate.printer];
      return (
        typeof printer === "string" &&
        !printerAcceptsSlip(
          printer as Parameters<typeof printerAcceptsSlip>[0],
          slip,
        )
      );
    });
    if (wrongDevice) {
      const printer = fields[wrongDevice.printer] as Parameters<
        typeof printerMetaOf
      >[0];
      return `${wrongDevice.label} (${printer ? PRINTER_NAME_LABELS[printer] : "—"}) cannot print a ${WORKORDER_SLIP_TYPE_LABELS[slip]} workorder slip.`;
    }
  }

  const wrongTray = TRAY_PAIRS.find((pair) => {
    const printer = fields[pair.printer];
    const entry = fields[pair.entry];
    return (
      typeof entry === "string" &&
      !printerAcceptsEntry(
        typeof printer === "string"
          ? (printer as Parameters<typeof printerMetaOf>[0])
          : null,
        entry as Parameters<typeof printerAcceptsEntry>[1],
      )
    );
  });
  if (wrongTray) {
    const printer = fields[wrongTray.printer] as Parameters<
      typeof printerMetaOf
    >[0];
    const entry = fields[wrongTray.entry] as keyof typeof PRINTER_ENTRY_LABELS;
    return `${wrongTray.label} (${printer ? PRINTER_NAME_LABELS[printer] : "—"}) has no paper trays, so "${PRINTER_ENTRY_LABELS[entry]}" cannot be selected.`;
  }

  // The two sticker-per-pick settings are specified at 600 dpi. A 203 dpi label
  // printer will accept the job and produce a sticker nobody can scan.
  const sticker = fields.stickerPerPickWorkorder ?? null;
  if (stickerPerPickNeedsPrinter(sticker) && sticker) {
    const device = printerMetaOf(fields.stickerPrinter ?? null);
    if (!device) {
      return `"${STICKER_PER_PICK_WORKORDER_LABELS[sticker]}" needs a sticker printer to be set.`;
    }
    if (device.medium !== "label") {
      return `The sticker printer (${PRINTER_NAME_LABELS[fields.stickerPrinter as keyof typeof PRINTER_NAME_LABELS]}) is not a label printer, so it cannot print pick stickers.`;
    }
  }

  return null;
};

/**
 * What is worth saying about a print setup that is nonetheless allowed to be
 * saved — today, only that the chosen sticker printer prints coarser than the
 * sticker-per-pick setting is specified at. Null when there is nothing to say.
 */
export const printSetupAdvisory = (
  stickerPerPickWorkorder: StickerPerPickWorkorderType | null | undefined,
  stickerPrinter: PrinterName | null | undefined,
): string | null => {
  if (!stickerPerPickNeedsPrinter(stickerPerPickWorkorder)) {
    return null;
  }
  const device = printerMetaOf(stickerPrinter);
  if (!device || device.medium !== "label") {
    return null;
  }
  if ((device.dpi ?? 0) >= STICKER_PER_PICK_DPI) {
    return null;
  }
  return `This sticker is specified at ${STICKER_PER_PICK_DPI} dpi; ${PRINTER_NAME_LABELS[stickerPrinter as PrinterName]} prints at ${device.dpi} dpi.`;
};
