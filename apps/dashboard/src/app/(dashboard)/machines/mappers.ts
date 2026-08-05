import { SelectMachines } from "@/db";
import { toDateInput } from "@/lib/helpers";
import { MachineFormValues } from "./validation";

/**
 * A stored machine in the shape its form edits.
 *
 * Every section edits the same value set even though it saves only its own
 * columns, so the cross-field rules — min against max length, a capacity that
 * needs its unit, an out-of-business window that needs both ends — still have
 * everything they check available on whichever section is open.
 */
export const machineToFormValues = (
  machine: SelectMachines,
): MachineFormValues => ({
  code: machine.code,
  name: machine.name,
  option: machine.option,
  production: machine.production,
  loading: machine.loading ?? "",
  stockLocationUuid: machine.stockLocationUuid,
  remarks: machine.remarks ?? "",
  minLengthMm: machine.minLengthMm ?? "",
  maxLengthMm: machine.maxLengthMm ?? "",
  outOfBusiness: machine.outOfBusiness ?? false,
  outOfBusinessFrom: toDateInput(machine.outOfBusinessFrom),
  outOfBusinessUntil: toDateInput(machine.outOfBusinessUntil),
  averageDailyCapacity: machine.averageDailyCapacity ?? "",
  averageDailyCapacityUnit: machine.averageDailyCapacityUnit ?? "",
  warningPercentage: machine.warningPercentage ?? "",
  documents: machine.documents ?? [],
});
