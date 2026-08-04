"use client";

import { updateMachinePostProcessings } from "@/app/(dashboard)/machines/[uuid]/edit/actions";
import { MachineActionResult } from "@/app/(dashboard)/machines/actions";
import { PostProcessingRow } from "@/app/(dashboard)/machines/use-machine-submit";
import { SelectOption } from "@/components/shadcn/select";
import { FormActions } from "@/components/ui/form-actions";
import { FormError } from "@/components/ui/form-error";
import { MachineOptionType, machineOptionTypes } from "@/lib/enums";
import { toIntOrNull } from "@/lib/helpers";
import { MACHINE_OPTION_LABELS } from "@/lib/labels";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { PostProcessingSection } from "../sections/post-processing-section";

type Props = {
  machineUuid: string;
  postProcessings: PostProcessingRow[];
};

export const MachinePostProcessingEditor = ({
  machineUuid,
  postProcessings: saved,
}: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<MachineActionResult>({});
  const [postProcessings, setPostProcessings] =
    useState<PostProcessingRow[]>(saved);

  const postProcessingOptions: SelectOption[] = [
    { value: "", label: "Empty" },
    ...machineOptionTypes.map((option) => ({
      value: option,
      label: MACHINE_OPTION_LABELS[option],
    })),
  ];

  const addPostProcessing = () =>
    setPostProcessings((prev) => [
      ...prev,
      { option: "", preference: "0", daysInSystem: "0" },
    ]);

  const updatePostProcessing = (
    index: number,
    patch: Partial<PostProcessingRow>,
  ) =>
    setPostProcessings((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );

  const removePostProcessing = (index: number) =>
    setPostProcessings((prev) => prev.filter((_, i) => i !== index));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startTransition(async () => {
      setState(
        await updateMachinePostProcessings(
          machineUuid,
          // A row left on "Empty" was never filled in, so it is dropped rather
          // than saved as a step with no option.
          postProcessings
            .filter((row) => row.option)
            .map((row) => ({
              option: row.option as MachineOptionType,
              preference: toIntOrNull(row.preference) ?? 0,
              daysInSystem: toIntOrNull(row.daysInSystem) ?? 0,
            })),
        ),
      );
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {state.error && <FormError>{state.error}</FormError>}

      <PostProcessingSection
        postProcessings={postProcessings}
        postProcessingOptions={postProcessingOptions}
        addPostProcessing={addPostProcessing}
        updatePostProcessing={updatePostProcessing}
        removePostProcessing={removePostProcessing}
        isPending={isPending}
      />

      <FormActions
        submitLabel="Save Post-Processing"
        isPending={isPending}
        onCancel={() => router.push(`/machines/${machineUuid}/edit`)}
      />
    </form>
  );
};
