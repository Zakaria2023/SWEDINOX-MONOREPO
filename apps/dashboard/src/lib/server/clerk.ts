"use server";

import { clerkClient } from "@clerk/nextjs/server";

type ClerkUserMetadata = {
  role?: unknown;
};

export type ClerkUserOption = {
  value: string;
  label: string;
};

export type DashboardUserOption = {
  id: string;
  label: string;
  value: string;
  email: string;
  role: string | null;
};

export const getClerkUsers = async (): Promise<DashboardUserOption[]> => {
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

export const getClerkUsersForSelect = async (): Promise<ClerkUserOption[]> => {
  const client = await clerkClient();
  const response = await client.users.getUserList({ limit: 100 });

  return response.data
    .map((user) => ({
      value: user.id,
      label:
        // Trimmed and re-joined: a first name typed with a trailing space
        // otherwise prints as "Zakaria  Asad" everywhere the name is shown.
        [user.firstName, user.lastName]
          .map((part) => part?.trim())
          .filter(Boolean)
          .join(" ") ||
        user.primaryEmailAddress?.emailAddress ||
        user.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

export const getClerkAdminUsers = async (): Promise<DashboardUserOption[]> => {
  const users = await getClerkUsers();
  return users.filter((user) => user.role === "admin");
};

/**
 * Every Clerk id with the name to show for it.
 *
 * These columns — seller, purchaser, created_by, responsible, blocked_by —
 * store a Clerk id, because Clerk owns the user list and there is no local
 * Users table to join against. That makes resolving them a read-time job, and
 * this is the one place it happens.
 *
 * A plain object rather than a Map so it can be handed to a client component,
 * which is where most of these are rendered. Pair it with `userName` from
 * lib/helpers.ts, which decides what to show when an id is not in it.
 */
export const getClerkUserNames = async (): Promise<Record<string, string>> => {
  const users = await getClerkUsersForSelect();
  return Object.fromEntries(users.map((user) => [user.value, user.label]));
};
