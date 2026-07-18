import {
  machineCapacityUnits,
  machineLoadingTypes,
  machineOptionTypes,
  machineProductionTypes,
} from "@/lib/enums";
import { VALIDATION_MESSAGES } from "@/lib/validation-messages";
import { z } from "zod";

const optionalNonNegativeInteger = z.union([
  z.number().int().min(0),
  z.literal(""),
  z.undefined(),
]);

const optionalPercentage = z.union([
  z.number().min(0).max(100),
  z.literal(""),
  z.undefined(),
]);

export const createMachineSchema = () =>
  z
    .object({
      code: z.string().trim().min(1, "Code is required"),
      name: z.string().trim().min(1, VALIDATION_MESSAGES.nameRequired),
      option: z.union([z.enum(machineOptionTypes), z.literal("")]),
      production: z.union([z.enum(machineProductionTypes), z.literal("")]),
      loading: z.union([z.enum(machineLoadingTypes), z.literal("")]),
      stockLocationUuid: z
        .string()
        .trim()
        .min(1, "Stock location is required"),
      remarks: z.string(),
      minLengthMm: optionalNonNegativeInteger,
      maxLengthMm: optionalNonNegativeInteger,
      outOfBusiness: z.boolean(),
      outOfBusinessFrom: z.union([z.string(), z.literal(""), z.undefined()]),
      outOfBusinessUntil: z.union([z.string(), z.literal(""), z.undefined()]),
      averageDailyCapacity: optionalNonNegativeInteger,
      averageDailyCapacityUnit: z.union([
        z.enum(machineCapacityUnits),
        z.literal(""),
        z.undefined(),
      ]),
      warningPercentage: optionalPercentage,
      documents: z.array(z.object({ id: z.string(), fileName: z.string() })),
    })
    .superRefine((values, ctx) => {
      if (!values.option) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["option"],
          message: "Option is required",
        });
      }

      if (!values.production) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["production"],
          message: "Production is required",
        });
      }

      if (!values.loading) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["loading"],
          message: "Loading is required",
        });
      }

      if (
        values.minLengthMm !== "" &&
        values.minLengthMm !== undefined &&
        values.maxLengthMm !== "" &&
        values.maxLengthMm !== undefined &&
        values.minLengthMm > values.maxLengthMm
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maxLengthMm"],
          message: "Maximum length must be greater than or equal to minimum length",
        });
      }

      if (values.outOfBusiness) {
        if (!values.outOfBusinessFrom) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["outOfBusinessFrom"],
            message: "Start date is required when the machine is out of business",
          });
        }

        if (!values.outOfBusinessUntil) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["outOfBusinessUntil"],
            message: "End date is required when the machine is out of business",
          });
        }

        if (
          values.outOfBusinessFrom &&
          values.outOfBusinessUntil &&
          values.outOfBusinessUntil < values.outOfBusinessFrom
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["outOfBusinessUntil"],
            message: "End date must be on or after the start date",
          });
        }
      }

      const hasCapacityValue =
        values.averageDailyCapacity !== "" &&
        values.averageDailyCapacity !== undefined;
      const hasCapacityUnit =
        values.averageDailyCapacityUnit !== "" &&
        values.averageDailyCapacityUnit !== undefined;

      if (hasCapacityValue && !hasCapacityUnit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["averageDailyCapacityUnit"],
          message: "Capacity unit is required when average daily capacity is set",
        });
      }

      if (!hasCapacityValue && hasCapacityUnit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["averageDailyCapacity"],
          message: "Average daily capacity is required when a capacity unit is selected",
        });
      }
    });

export type MachineFormValues = z.infer<ReturnType<typeof createMachineSchema>>;

// ── Machine Product dialog ───────────────────────────────────────────────────

export const machineProductDialogSchema = z.object({
  productUuid: z.string().min(1, "Please select a product"),
  preference: z.string().optional(),
  productionPerHour: z.string().optional(),
  prodUnit: z.string().optional(),
  minCorner: z.string().optional(),
  maxCorner: z.string().optional(),
  daysInSystem: z.string().optional(),
});

export type MachineProductDialogValues = z.infer<
  typeof machineProductDialogSchema
>;

export const DEFAULT_MACHINE_PRODUCT: MachineProductDialogValues = {
  productUuid: "",
  preference: "1",
  productionPerHour: "0",
  prodUnit: "",
  minCorner: "0",
  maxCorner: "90",
  daysInSystem: "0",
};

export const DEFAULT_MACHINE: MachineFormValues = {
  code: "",
  name: "",
  option: "",
  production: "",
  loading: "",
  stockLocationUuid: "",
  remarks: "",
  minLengthMm: "",
  maxLengthMm: "",
  outOfBusiness: false,
  outOfBusinessFrom: "",
  outOfBusinessUntil: "",
  averageDailyCapacity: "",
  averageDailyCapacityUnit: "",
  warningPercentage: "",
  documents: [],
};
