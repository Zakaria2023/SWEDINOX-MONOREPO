import { currentUser } from "@clerk/nextjs/server";
import { LogOut } from "lucide-react";
import { SidebarTrigger } from "@/components/shadcn/sidebar";
import { signOutAction } from "@/app/(dashboard)/sign-out-action";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { getTranslation } from "@/i18n/getTranslation";

export const DashboardHeader = async () => {
  const user = await currentUser();
  const { t } = await getTranslation();

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : (user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? "");

  return (
    <header className="flex h-12 items-center border-b px-4">
      <SidebarTrigger />

      <div className="ms-auto flex items-center gap-3">
        <LanguageSwitcher />

        {displayName && (
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {displayName}
          </span>
        )}

        <form action={signOutAction}>
          <button
            type="submit"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
            <span>{t("dashboard-header.logout")}</span>
          </button>
        </form>
      </div>
    </header>
  );
};
