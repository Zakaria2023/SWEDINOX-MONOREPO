/**
 * What an overview hands the Excel writer, and how the browser turns the result
 * into a file.
 *
 * Every overview exports the same shape — a sheet name, the column headings and
 * a grid of plain values — so there is one workbook writer rather than one per
 * table. Turning that shape into an .xlsx is lib/server/excel.ts, and it happens
 * on the server for two reasons: the paged overviews export rows the browser
 * never had, and the workbook library is large enough that shipping it to every
 * page to serve the occasional click is a poor trade.
 *
 * Nothing here is server-side, because the toolbar button that starts an export
 * and the action that answers it both read these definitions.
 */

/**
 * A single cell. A number stays a number so the sheet can sum a column, and a
 * Date stays a Date so Excel formats and sorts it as one — anything stringified
 * on the way out arrives as text that has to be converted by hand.
 */
export type ExportCellValue = string | number | boolean | Date | null;

/**
 * One exportable column of an overview: how it is headed, and how a row of that
 * overview turns into a cell.
 *
 * This is the same list the table's column selector is built from, which is the
 * point — a column added to an overview is exportable without a second
 * declaration, and cannot fall out of step with the one on screen.
 *
 * `value` returns the plain value, not what the cell renders: a link exports as
 * its text, a badge as the word inside it, a JSON array as its labels joined.
 */
export type ExportColumn<T, K extends string = string> = {
  key: K;
  label: string;
  /** Whether the table shows this column before anyone touches the selector. */
  defaultVisible: boolean;
  value: (row: T) => ExportCellValue;
};

/** A workbook of one sheet, as the writer takes it. */
export type ExportSheet = {
  /** The sheet's tab name. Excel rejects some characters — see sheetName(). */
  name: string;
  headers: string[];
  rows: ExportCellValue[][];
};

/**
 * The ceiling on one export.
 *
 * "Every matching row" is what an export means, but some of these overviews —
 * order lines, stock movements, journal entries — have no upper bound at all,
 * and a request for every row of one of them would build a workbook in memory
 * that the server cannot hold. Past this many rows the file is cut short and
 * says so, which is a worse export than the reader asked for but a better one
 * than a failed request. Anyone who genuinely needs more should narrow the
 * filters and export twice.
 */
export const EXPORT_ROW_LIMIT = 50_000;

// Excel forbids these in a sheet name and caps it at 31 characters. A workbook
// with an illegal name does not open, so the name is corrected rather than
// trusted.
const ILLEGAL_SHEET_CHARACTERS = /[\\/?*[\]:]/g;

const SHEET_NAME_LIMIT = 31;

/** A sheet tab name Excel will accept, from whatever the overview called it. */
export const sheetName = (name: string): string => {
  const cleaned = name.replace(ILLEGAL_SHEET_CHARACTERS, " ").trim();
  return cleaned.slice(0, SHEET_NAME_LIMIT) || "Sheet1";
};

/**
 * The file name an export downloads as, stamped with the day it was taken —
 * "orders-2026-08-09.xlsx". These files land in a downloads folder next to last
 * month's copy of the same overview, and the date is what tells them apart.
 */
export const exportFileName = (base: string): string => {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return `${base}-${stamp}.xlsx`;
};

// ---------------------------------------------------------------------------
// Turning a stored value into a cell
//
// The four shapes every column on every overview reduces to. They exist so that
// a hundred column declarations do not each decide for themselves what an empty
// string, a decimal column or a date means in a spreadsheet — and so that fixing
// one of those decisions fixes it everywhere.
// ---------------------------------------------------------------------------

const MS_PER_MINUTE = 60_000;

/** Text, with nothing at all left as an empty cell rather than "". */
export const textCell = (value: string | null | undefined): ExportCellValue => {
  const text = (value ?? "").trim();
  return text === "" ? null : text;
};

/**
 * A number, from the string a decimal column hands back.
 *
 * Drizzle returns MySQL DECIMAL as a string so the precision survives the trip;
 * exported as text it would arrive in Excel as something that cannot be summed,
 * which is most of what an exported amount is for. A value that is not a number
 * exports as an empty cell rather than as NaN.
 */
export const numberCell = (
  value: string | number | null | undefined,
): ExportCellValue => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

/**
 * A real date cell, so the sheet can sort and filter on it as a date.
 *
 * Both stored shapes land on the same calendar day. A DATE column arrives as
 * "2026-08-09" and is read as UTC midnight, which is the serial number Excel
 * shows as that day. A timestamp arrives as a Date in the server's zone and is
 * shifted by its offset first, because the workbook format counts days from an
 * epoch in UTC with no zone of its own — left unshifted, a timestamp recorded
 * late on the 9th east of Greenwich would open as the 8th.
 */
export const dateCell = (
  value: string | Date | null | undefined,
): ExportCellValue => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }
    return new Date(
      value.getTime() - value.getTimezoneOffset() * MS_PER_MINUTE,
    );
  }
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? textCell(value) : parsed;
};

/**
 * A yes/no column as the words the table shows, not TRUE/FALSE — the reader is
 * scanning the same column in both places and it should read the same way.
 */
export const yesNoCell = (
  value: boolean | null | undefined,
): ExportCellValue => (value ? "Yes" : "No");

/**
 * The sheet for a set of rows, keeping only the columns the reader can see.
 *
 * `visibleKeys` comes from the table's own column selector. Left off — an
 * overview with no selector — every column is exported, since on those tables
 * every column is on screen.
 */
export const buildSheet = <T>(
  name: string,
  columns: readonly ExportColumn<T>[],
  rows: readonly T[],
  visibleKeys?: readonly string[],
): ExportSheet => {
  const wanted = visibleKeys ? new Set(visibleKeys) : null;
  // Filtered in declaration order rather than in the order the keys arrived, so
  // the sheet's columns sit in the same order the table's do.
  const chosen = columns.filter((column) => !wanted || wanted.has(column.key));
  const exported = chosen.length > 0 ? chosen : columns;

  return {
    name: sheetName(name),
    headers: exported.map((column) => column.label),
    rows: rows.map((row) => exported.map((column) => column.value(row))),
  };
};

/**
 * The `key`/`label`/`defaultVisible` triple a column selector needs, so an
 * overview declares its columns once and both the table and the export read the
 * same list.
 */
export const selectorColumns = <T, K extends string>(
  columns: readonly ExportColumn<T, K>[],
): Array<{ key: K; label: string; defaultVisible: boolean }> =>
  columns.map(({ key, label, defaultVisible }) => ({
    key,
    label,
    defaultVisible,
  }));

// A cell holding nothing renders as an em dash. That is punctuation for a
// reader, not a value — it exports as an empty cell, so a column can still be
// counted and filtered on.
const EMPTY_CELL_TEXT = new Set(["—", "-", "–", "n/a", "N/A"]);

// What counts as a number worth exporting as one: an ordinary decimal, or a
// grouped amount as the money columns render it, optionally behind a currency
// symbol. Anything else — a code, a date, a reference with digits in it — stays
// text, because guessing wrong turns an order number into arithmetic.
const NUMERIC_TEXT =
  /^[-+]?(?:[€$£]\s*)?\d{1,3}(?:,\d{3})*(?:\.\d+)?$|^[-+]?(?:[€$£]\s*)?\d+(?:\.\d+)?$/;

/**
 * The readable text of one cell.
 *
 * A cell holding several elements — a row of category badges, a status pill next
 * to a date — has its parts joined with a comma rather than run together, since
 * textContent alone would export "SalesInvoice" for two separate labels.
 */
const cellText = (cell: HTMLTableCellElement): string => {
  const parts =
    cell.childElementCount > 1
      ? Array.from(cell.children).map((child) => child.textContent ?? "")
      : [cell.textContent ?? ""];

  return parts
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((part) => part !== "")
    .join(", ");
};

const cellValue = (text: string): ExportCellValue => {
  if (text === "" || EMPTY_CELL_TEXT.has(text)) {
    return null;
  }
  if (NUMERIC_TEXT.test(text)) {
    const numeric = Number(text.replace(/[€$£,\s+]/g, ""));
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }
  return text;
};

/**
 * The sheet for a table that is already on the screen.
 *
 * The overviews that page on the server export from their own query instead —
 * see the export actions — but the rest render every row they have, and reading
 * those back off the rendered table is what makes an export button possible on
 * all of them without restating a hundred column lists.
 *
 * It exports what the reader is looking at, which is the point: a column hidden
 * by the column selector is not in the DOM and so not in the file, and a filter
 * that narrowed the table narrowed the export with it.
 *
 * Two kinds of column are dropped. One is the row-actions column, which carries
 * no heading and holds buttons; the other is anything marked
 * `data-export-ignore`, for a column that has a heading but nothing worth
 * exporting under it. Rows whose cell count does not match the heading are
 * dropped too — that is the "No orders found" row and any group or spacer row,
 * none of which are data.
 */
export const sheetFromTable = (
  table: HTMLTableElement,
  name: string,
): ExportSheet => {
  // The last heading row, not the first: a table with grouped headings puts the
  // spanning row on top and the one that lines up with the cells beneath it.
  const headRows = table.tHead?.rows;
  const headerRow = headRows?.[headRows.length - 1];
  const headerCells = Array.from(headerRow?.cells ?? []);

  const keptIndexes: number[] = [];
  const headers: string[] = [];

  headerCells.forEach((cell, index) => {
    if (cell.dataset.exportIgnore !== undefined) {
      return;
    }
    const text = cellText(cell);
    if (text === "") {
      return;
    }
    keptIndexes.push(index);
    headers.push(text);
  });

  const bodyRows = Array.from(table.tBodies[0]?.rows ?? []).filter(
    (row) => row.cells.length === headerCells.length,
  );

  return {
    name: sheetName(name),
    headers,
    rows: bodyRows.map((row) =>
      keptIndexes.map((index) => {
        const cell = row.cells[index];
        return cell ? cellValue(cellText(cell)) : null;
      }),
    ),
  };
};

/**
 * Saves a workbook the server built.
 *
 * It arrives base64-encoded because a Server Action's result is JSON: binary
 * cannot cross that boundary as itself. Decoded here into a blob, handed to a
 * link the browser clicks on the reader's behalf, and revoked straight after so
 * a session of exports does not hold every file it has taken.
 */
export const downloadWorkbook = (base64: string, fileName: string): void => {
  // atob gives one character per byte, every one below 256, so mapping the
  // string straight to bytes is exact — no surrogate pair can appear in it.
  const bytes = Uint8Array.from(atob(base64), (character) =>
    character.charCodeAt(0),
  );

  const url = URL.createObjectURL(
    new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
