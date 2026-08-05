"use client";

import {
  SfnCounterpartyRow,
  setSfnRole,
} from "@/app/(dashboard)/freight-flow/actions";
import { Button } from "@/components/shadcn/button";
import { Select } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { SfnCounterpartyRole, sfnCounterpartyRoles } from "@/lib/enums";
import { pluralize } from "@/lib/helpers";
import { SFN_COUNTERPARTY_ROLE_LABELS } from "@/lib/labels";
import { ChevronRight, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = {
  counterparties: SfnCounterpartyRow[];
};

const roleOptions = sfnCounterpartyRoles.map((role) => ({
  value: role,
  label: SFN_COUNTERPARTY_ROLE_LABELS[role],
}));

// Which column of the return a counterparty feeds depends on this
// classification, so it is maintained right where the return is compiled.
export const SfnCounterpartiesPanel = ({ counterparties }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unclassified = counterparties.filter(
    (counterparty) => !counterparty.sfnRole,
  ).length;

  const onRoleChange = (companyUuid: string, role: string) =>
    startTransition(async () => {
      setError(null);
      const result = await setSfnRole(companyUuid, role as SfnCounterpartyRole);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });

  if (counterparties.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <Button
        type="button"
        variant="ghost"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="h-auto w-full justify-start gap-2 px-4 py-3"
      >
        <Users className="size-4" />
        <span className="font-medium">SFN classification</span>
        <span className="text-sm text-muted-foreground">
          {unclassified === 0
            ? `All ${counterparties.length} counterparties classified`
            : `${unclassified} of ${counterparties.length} ${pluralize(unclassified, "counterparty", "counterparties")} still counted as non-member`}
        </span>
        <ChevronRight
          className={
            isOpen ? "ms-auto rotate-90 transition-transform" : "ms-auto"
          }
        />
      </Button>

      {isOpen && (
        <div className="border-t">
          <p className="px-4 py-3 text-xs text-muted-foreground">
            A counterparty is domestic or abroad based on its main address
            country. Producers and SFN members are reported separately; everyone
            else counts as a non-member.
          </p>
          {error && (
            <p className="px-4 pb-2 text-xs text-destructive">{error}</p>
          )}
          <div className="max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">Code</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-56">SFN role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counterparties.map((counterparty) => (
                  <TableRow key={counterparty.uuid}>
                    <TableCell className="text-right">
                      {counterparty.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {counterparty.companyName}
                    </TableCell>
                    <TableCell>{counterparty.country ?? "—"}</TableCell>
                    <TableCell>
                      {counterparty.domestic ? "Domestic" : "Abroad"}
                    </TableCell>
                    <TableCell>
                      <Select
                        options={roleOptions}
                        value={counterparty.sfnRole ?? "non_member"}
                        onValueChange={(role) =>
                          onRoleChange(counterparty.uuid, role)
                        }
                        disabled={isPending}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};
