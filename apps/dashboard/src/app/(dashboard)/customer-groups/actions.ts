"use server";

import { db, CustomerGroups, InsertCustomerGroups, SelectCustomerGroups } from "@/db";
import { generateUuid } from "@/lib/helpers";
import { desc } from "drizzle-orm";

export type CustomerGroupInput = Omit<
  InsertCustomerGroups,
  "id" | "uuid" | "createdAt" | "updatedAt"
>;

export type CustomerGroupActionResult = {
  success?: boolean;
  error?: string;
};

export const getCustomerGroups = async (): Promise<SelectCustomerGroups[]> => {
  return db
    .select()
    .from(CustomerGroups)
    .orderBy(desc(CustomerGroups.createdAt));
};

export const createCustomerGroup = async (
  input: CustomerGroupInput,
): Promise<CustomerGroupActionResult> => {
  try {
    await db.insert(CustomerGroups).values({ ...input, uuid: generateUuid() });
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create customer group",
    };
  }
};
