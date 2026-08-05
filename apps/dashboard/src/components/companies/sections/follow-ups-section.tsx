"use client";

import { CompanyFollowUpInput } from "@/app/(dashboard)/companies/actions";
import { Checkbox } from "@/components/shadcn/checkbox";
import { Input } from "@/components/shadcn/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { Plus, X } from "lucide-react";

type Props = {
  followUps: CompanyFollowUpInput[];
  addFollowUp: () => void;
  updateFollowUp: (index: number, patch: Partial<CompanyFollowUpInput>) => void;
  removeFollowUp: (index: number) => void;
  isPending: boolean;
};

export const FollowUpsSection = ({
  followUps,
  addFollowUp,
  updateFollowUp,
  removeFollowUp,
  isPending,
}: Props) => (
  <section className="space-y-4">
    <div className="flex items-center justify-between border-b pb-2">
      <h2 className="text-lg font-semibold text-foreground">Follow-up</h2>
      <button
        type="button"
        onClick={addFollowUp}
        className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        disabled={isPending}
      >
        <Plus className="size-4" />
        New
      </button>
    </div>

    {followUps.length > 0 && (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Date</TableHead>
              <TableHead className="w-40">By</TableHead>
              <TableHead>Contact person</TableHead>
              <TableHead>Text</TableHead>
              <TableHead className="w-24 text-center">Completed</TableHead>
              <TableHead className="w-28 text-right">Days in system</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {followUps.map((followUp, index) => (
              <TableRow key={index}>
                <TableCell className="text-muted-foreground">
                  {followUp.date ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {followUp.by ?? "—"}
                </TableCell>
                <TableCell>
                  <Input
                    value={followUp.contactPerson ?? ""}
                    onChange={(e) =>
                      updateFollowUp(index, { contactPerson: e.target.value })
                    }
                    placeholder="Contact person"
                    disabled={isPending}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={followUp.text ?? ""}
                    onChange={(e) =>
                      updateFollowUp(index, { text: e.target.value })
                    }
                    placeholder="Text"
                    disabled={isPending}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    checked={followUp.completed ?? false}
                    onChange={(e) =>
                      updateFollowUp(index, { completed: e.target.checked })
                    }
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  0
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => removeFollowUp(index)}
                    className="text-muted-foreground hover:text-destructive"
                    disabled={isPending}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Remove follow-up</span>
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )}
  </section>
);
