"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/shadcn/button";

/**
 * Opens the browser's print dialog as soon as the slip is on screen — what
 * `Vrijgeven` does in the reference. The work order is already released by
 * then, so cancelling the print leaves it released (327402, 9-10-2026).
 */
export const AutoPrint = () => {
  useEffect(() => {
    window.print();
  }, []);

  return (
    <Button type="button" onClick={() => window.print()} className="print:hidden">
      <Printer className="size-4" />
      Print
    </Button>
  );
};
