"use client";

import { downloadWorkbook, exportFileName } from "@/lib/excel";
import { describeError } from "@/lib/helpers";
import { useCallback, useState } from "react";

/**
 * Runs one export and saves what comes back.
 *
 * The workbook is always built on the server — by the shared action for an
 * overview that renders its rows, by the overview's own action when it pages —
 * so all this side does is wait, hand the bytes to the browser and say so if it
 * failed. An export of every order line is a real query and a real wait, which
 * is why `isExporting` exists: the button has to stop being clickable, or an
 * impatient second click starts the whole thing again.
 *
 * A failure is kept rather than thrown. It is worth showing next to the button
 * that caused it, and it must not take down the table the reader is still using.
 */
export const useExcelExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runExport = useCallback(
    async (fileBase: string, build: () => Promise<string>) => {
      setIsExporting(true);
      setError(null);
      try {
        downloadWorkbook(await build(), exportFileName(fileBase));
      } catch (cause) {
        setError(describeError(cause, "The export could not be built"));
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return { runExport, isExporting, error };
};
