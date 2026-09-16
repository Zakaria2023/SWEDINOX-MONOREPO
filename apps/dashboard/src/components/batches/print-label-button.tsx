"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/shadcn/button";

export const PrintLabelButton = () => (
  <Button type="button" onClick={() => window.print()} className="print:hidden">
    <Printer className="size-4" />
    Print label
  </Button>
);
