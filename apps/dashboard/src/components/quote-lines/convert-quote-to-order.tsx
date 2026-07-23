"use client";

import {
  ConvertibleQuote,
  convertQuoteToOrder,
} from "@/app/(dashboard)/quote-lines/actions";
import { Button } from "@/components/shadcn/button";
import { Select } from "@/components/shadcn/select";
import { FormLabel } from "@/components/ui/form-field";
import { pluralize } from "@/lib/helpers";
import { ArrowRightLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  quotes: ConvertibleQuote[];
};

export const ConvertQuoteToOrder = ({ quotes }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [quoteUuid, setQuoteUuid] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const options = quotes.map((quote) => ({
    value: quote.uuid,
    label: `Quote ${quote.quoteId} — ${quote.customerName ?? "Unknown customer"} (${quote.lineCount} ${pluralize(quote.lineCount, "line")})`,
  }));

  const onClick = () =>
    startTransition(async () => {
      setError(null);
      setMessage(null);
      const result = await convertQuoteToOrder(quoteUuid);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Order created and stock reserved.");
      setQuoteUuid("");
      router.refresh();
    });

  if (quotes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-96">
          <FormLabel htmlFor="convert-quote">Convert quote to order</FormLabel>
          <Select
            id="convert-quote"
            options={options}
            value={quoteUuid}
            onValueChange={setQuoteUuid}
            placeholder="Pick a quote…"
          />
        </div>
        <Button
          type="button"
          onClick={onClick}
          disabled={isPending || !quoteUuid}
        >
          <ArrowRightLeft className="mr-1.5 size-4" />
          {isPending ? "Converting…" : "Convert"}
        </Button>
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
      {message && (
        <span className="text-xs text-muted-foreground">{message}</span>
      )}
    </div>
  );
};
