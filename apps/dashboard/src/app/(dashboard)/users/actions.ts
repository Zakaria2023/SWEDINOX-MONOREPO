"use server";

import { requireAdmin } from "@/lib/auth";
import { clerkClient } from "@clerk/nextjs/server";

type ClerkUserMetadata = {
  role?: unknown;
};

export type DashboardUserOption = {
  id: string;
  label: string;
  value: string;
  email: string;
  role: string | null;
};

export const getUsers = async (): Promise<DashboardUserOption[]> => {
  await requireAdmin();

  const client = await clerkClient();
  const response = await client.users.getUserList({ limit: 100 });

  return response.data
    .map((user) => {
      const name = user.fullName?.trim();
      const email =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        user.username ??
        user.id;
      const display = name && name !== email ? `${name} (${email})` : email;
      const metadata = user.publicMetadata as ClerkUserMetadata | undefined;

      return {
        id: user.id,
        label: display,
        value: display,
        email,
        role: typeof metadata?.role === "string" ? metadata.role : null,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
};

export const getAdminUsers = async (): Promise<DashboardUserOption[]> => {
  const users = await getUsers();
  return users.filter((user) => user.role === "admin");
};
