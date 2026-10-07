"use client";

import {
  createContractGroup,
  type ContractGroupItem,
} from "@/app/(dashboard)/contract-groups/actions";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { Input } from "@/components/shadcn/input";
import { Select } from "@/components/shadcn/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/table";
import { FormError } from "@/components/ui/form-error";
import { FormFieldError, FormLabel } from "@/components/ui/form-field";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { TableExportButton } from "@/components/ui/table-export-button";

const createGroupSchema = (nameRequiredMessage: string) =>
  z.object({
    name: z.string().min(1, nameRequiredMessage),
    description: z.string().optional(),
    contractSubgroupUuid: z.string().optional(),
    sequenceWithinSubgroup: z.number().int().min(0),
    quicklyChangeSequenceNumber: z.string().optional(),
    isActive: z.boolean(),
  });

type GroupFormValues = z.infer<ReturnType<typeof createGroupSchema>>;

const DEFAULT_VALUES: GroupFormValues = {
  name: "",
  description: "",
  contractSubgroupUuid: "",
  sequenceWithinSubgroup: 0,
  quicklyChangeSequenceNumber: "",
  isActive: true,
};

type Props = { groups: ContractGroupItem[] };

export const ContractGroups = ({ groups }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(createGroupSchema("Name is required")),
    defaultValues: DEFAULT_VALUES,
  });

  const {
    register,
    control,
    formState: { errors },
    reset,
    handleSubmit,
  } = form;

  const subgroupOptions = [
    { value: "", label: "Empty" },
    ...groups.map((group) => ({ value: group.uuid, label: group.name })),
  ];

  const openCreate = () => {
    reset(DEFAULT_VALUES);
    setFormError(undefined);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      reset(DEFAULT_VALUES);
      setFormError(undefined);
    }
    setDialogOpen(open);
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createContractGroup({
        ...values,
        contractSubgroupUuid: values.contractSubgroupUuid || undefined,
        quicklyChangeSequenceNumber:
          values.quicklyChangeSequenceNumber || undefined,
      });

      if (result.success) {
        setDialogOpen(false);
        router.refresh();
        return;
      }

      setFormError(result.error);
    });
  });

  const activeBadge = (value: boolean | null) =>
    value ? (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        Active
      </span>
    ) : (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Inactive
      </span>
    );

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button type="button" onClick={openCreate} className="gap-2">
            <Plus className="size-4" />
            New Group
          </Button>
        </div>

        <div>
          <div className="space-y-4">
            <div className="flex justify-end">
              <TableExportButton
                tableId="contract-groups-table"
                fileName="contract-groups"
                sheetName="Contract Groups"
              />
            </div>
            <Table id="contract-groups-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Contract group</TableHead>
                  <TableHead>Main group</TableHead>
                  <TableHead className="text-right">Main seq.</TableHead>
                  <TableHead>Subgroup</TableHead>
                  <TableHead className="text-right">Sub seq.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No contract groups yet
                    </TableCell>
                  </TableRow>
                ) : (
                  groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.id}</TableCell>
                      <TableCell className="font-medium">
                        {group.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {group.mainGroupName ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {group.mainGroupName === null
                          ? "—"
                          : (group.mainGroupSequence ?? 0)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {group.subgroupName ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {group.subgroupName === null
                          ? "—"
                          : group.sequenceWithinSubgroup}
                      </TableCell>
                      <TableCell>{activeBadge(group.isActive)}</TableCell>
                      <TableCell>
                        {new Date(group.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Contract Group</DialogTitle>
            <DialogDescription>
              Create a new group that can be linked to contracts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit}>
            <DialogBody className="space-y-4">
              <div>
                <FormLabel htmlFor="name" required>
                  Name
                </FormLabel>
                <Input
                  id="name"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                  placeholder="e.g. Procurement"
                  disabled={isPending}
                />
                <FormFieldError message={errors.name?.message} />
              </div>

              <div>
                <FormLabel htmlFor="contractSubgroupUuid">
                  Contract subgroup
                </FormLabel>
                <Controller
                  name="contractSubgroupUuid"
                  control={control}
                  render={({ field }) => (
                    <Select
                      id="contractSubgroupUuid"
                      options={subgroupOptions}
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      placeholder="Empty"
                      disabled={isPending}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FormLabel htmlFor="sequenceWithinSubgroup">
                    Sequence within subgroup
                  </FormLabel>
                  <Input
                    id="sequenceWithinSubgroup"
                    type="number"
                    min={0}
                    {...register("sequenceWithinSubgroup", {
                      valueAsNumber: true,
                    })}
                    disabled={isPending}
                  />
                </div>
                <div>
                  <FormLabel htmlFor="quicklyChangeSequenceNumber">
                    Quickly change seq. no.
                  </FormLabel>
                  <Input
                    id="quicklyChangeSequenceNumber"
                    {...register("quicklyChangeSequenceNumber")}
                    disabled={isPending}
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40">
                <input
                  type="checkbox"
                  className="size-4 rounded border-border accent-primary"
                  {...register("isActive")}
                  disabled={isPending}
                />
                <span className="text-sm font-medium text-foreground">
                  Active
                </span>
              </label>

              <FormError>{formError}</FormError>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogClose(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
