import { UserRole } from "@/lib/enums";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

/**
 * Who may release a financial block. The reference gives `Deblokkeren` on the
 * financially blocked queue to its Finance and admin profiles only.
 */
export const FINANCIAL_RELEASE_ROLES: readonly UserRole[] = [
  "admin",
  "finance",
];

export const requireAuth = async () => {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return userId;
};

export const requireAdmin = async () => {
  const userId = await requireAuth();
  const user = await currentUser();
  const role = user?.publicMetadata?.role;

  if (role !== "admin") {
    redirect("/unauthorized");
  }

  return { userId, user };
};

/** Whether the signed-in user holds one of these roles. */
export const currentUserHasRole = async (
  roles: readonly UserRole[],
): Promise<boolean> => {
  const user = await currentUser();
  const role = user?.publicMetadata?.role;
  return typeof role === "string" && roles.some((allowed) => allowed === role);
};
