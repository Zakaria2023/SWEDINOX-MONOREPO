import "server-only";

import ExcelJS from "exceljs";

import {
  buildSheet,
  EXPORT_ROW_LIMIT,
  ExportColumn,
  ExportSheet,
  sheetName,
} from "@/lib/excel";

/**
 * The one place a workbook is written.
 *
 * Every overview's export arrives here as the same grid of plain values, so the
 * files all open looking alike: a frozen heading row you can filter on, columns
 * wide enough to read, numbers that are numbers and dates that are dates.
 *
 * The result is base64 rather than bytes because it goes back through a Server
 * Action, whose result is JSON — see downloadWorkbook() in lib/excel.ts for the
 * other end.
 */

// Wide enough for a company name, narrow enough that twenty columns still fit
// on a screen. Anything longer wraps in the cell rather than pushing the rest of
// the sheet off to the right.
const MIN_COLUMN_WIDTH = 10;
const MAX_COLUMN_WIDTH = 48;

// A little air either side of the longest value in the column, since Excel's
// width unit is roughly one character and a column sized to its exact contents
// reads as cramped.
const COLUMN_PADDING = 3;

// ISO, because these workbooks are read in more than one locale and 03/04 is a
// different day depending on who opens it.
const DATE_FORMAT = "yyyy-mm-dd";

const HEADER_FILL = "FFF1F5F9";

const displayLength = (value: ExportSheet["rows"][number][number]): number => {
  if (value === null) {
    return 0;
  }
  if (value instanceof Date) {
    return DATE_FORMAT.length;
  }
  return String(value).length;
};

/**
 * How wide each column is set, from the longest thing in it.
 *
 * Measured over the values rather than guessed per column type: the same column
 * holds a two-letter country on one overview and a loading instruction on
 * another, and only the data knows which.
 */
const columnWidths = (sheet: ExportSheet): number[] =>
  sheet.headers.map((header, index) => {
    const longest = sheet.rows.reduce(
      (widest, row) => Math.max(widest, displayLength(row[index] ?? null)),
      header.length,
    );
    return Math.min(
      MAX_COLUMN_WIDTH,
      Math.max(MIN_COLUMN_WIDTH, longest + COLUMN_PADDING),
    );
  });

export const buildWorkbook = async (sheet: ExportSheet): Promise<string> => {
  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName(sheet.name), {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  worksheet.addRow(sheet.headers);
  for (const row of sheet.rows) {
    worksheet.addRow(row);
  }

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: HEADER_FILL },
    };
  });

  columnWidths(sheet).forEach((width, index) => {
    const column = worksheet.getColumn(index + 1);
    column.width = width;
    // Set on the column rather than per cell so a date added later still
    // formats, and so the header — which is text — is left alone.
    column.numFmt = undefined;
  });

  // Dates are formatted per cell, since a column is only a date column if its
  // values are: an overview may put a date in one row and a dash in the next.
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }
    row.eachCell((cell) => {
      if (cell.value instanceof Date) {
        cell.numFmt = DATE_FORMAT;
      }
    });
  });

  // The filter dropdowns on the heading row. An export is usually the first step
  // of somebody's own sorting, and this saves them setting it up.
  if (sheet.headers.length > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: sheet.headers.length },
    };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer).toString("base64");
};

/**
 * What a paged overview's export action does, once its query is built.
 *
 * The row query is handed in as a function of limit and offset — the same one
 * the paged read uses — and run once with the export ceiling instead of the
 * page window, so the file holds everything the current search and filters
 * match rather than the ten rows on screen.
 */
export const exportRows = async <T, K extends string>(input: {
  /** The sheet's tab name, and what the overview is called. */
  name: string;
  columns: readonly ExportColumn<T, K>[];
  /** The columns the reader has on show, from the table's column selector. */
  columnKeys: readonly string[];
  rows: (limit: number, offset: number) => Promise<T[]>;
}): Promise<string> => {
  const rows = await input.rows(EXPORT_ROW_LIMIT, 0);
  return buildWorkbook(
    buildSheet(input.name, input.columns, rows, input.columnKeys),
  );
};
