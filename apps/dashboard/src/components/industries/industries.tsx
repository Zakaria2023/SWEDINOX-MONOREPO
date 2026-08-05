"use client";

import { createIndustry } from "@/app/(dashboard)/industries/actions";
import { SelectIndustries } from "@/db/schema/industries";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const industrySchema = z.object({
  id: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
});

type IndustryFormValues = z.infer<typeof industrySchema>;

const DEFAULT_VALUES: IndustryFormValues = { id: "", name: "" };

type Props = {
  industries: SelectIndustries[];
};

export const Industries = ({ industries }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | undefined>();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IndustryFormValues>({
    resolver: zodResolver(industrySchema),
    defaultValues: DEFAULT_VALUES,
  });

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      reset(DEFAULT_VALUES);
      setFormError(undefined);
    }
    setDialogOpen(open);
  };

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await createIndustry(values);
      if (result.success) {
        setDialogOpen(false);
        reset(DEFAULT_VALUES);
        router.refresh();
        return;
      }
      setFormError(result.error);
    });
  });

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button type="button" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            New Industry
          </Button>
        </div>

        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SBI code</TableHead>
                <TableHead>Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {industries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No industries yet.
                  </TableCell>
                </TableRow>
              ) : (
                industries.map((industry) => (
                  <TableRow key={industry.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/industries/${encodeURIComponent(industry.id)}`}
                        className="text-primary hover:underline"
                      >
                        {industry.id}
                      </Link>
                    </TableCell>
                    <TableCell>{industry.name}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Industry</DialogTitle>
            <DialogDescription>
              Add an SBI code that can be assigned to a company&apos;s industry.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit}>
            <DialogBody className="space-y-4">
              <div>
                <FormLabel htmlFor="industry-id" required>
                  SBI code
                </FormLabel>
                <Input
                  id="industry-id"
                  {...register("id")}
                  aria-invalid={!!errors.id}
                  placeholder="e.g. 4674"
                  disabled={isPending}
                />
                <FormFieldError message={errors.id?.message} />
              </div>

              <div>
                <FormLabel htmlFor="industry-name" required>
                  Name
                </FormLabel>
                <Input
                  id="industry-name"
                  {...register("name")}
                  aria-invalid={!!errors.name}
                  placeholder="e.g. Wholesale of metals"
                  disabled={isPending}
                />
                <FormFieldError message={errors.name?.message} />
              </div>

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
                {isPending ? "Saving..." : "Create Industry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
