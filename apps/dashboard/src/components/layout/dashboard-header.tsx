import { currentUser } from "@clerk/nextjs/server";
import { HeaderPageTitle } from "@/components/layout/header-page-title";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { GlobalSearch } from "@/components/search/global-search";
import { SidebarTrigger } from "@/components/shadcn/sidebar";
import { SignOutButton } from "@clerk/nextjs";

export const DashboardHeader = async () => {
  const userFullname = await currentUser()?.then((user) => user?.fullName);

  if (!userFullname) {
    return null;
  }

  return (
    <header className="flex h-12 items-center gap-3 border-b px-4">
      <SidebarTrigger />

      <div className="min-w-0 shrink">
        <HeaderPageTitle />
      </div>

      <div className="ms-auto flex min-w-0 flex-1 items-center justify-end gap-3">
        <GlobalSearch />

        <LanguageSwitcher />

        <SignOutButton>
          <button className="shrink-0 cursor-pointer text-sm text-muted-foreground">
            Logout
          </button>
        </SignOutButton>

        <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">
          {userFullname}
        </span>
      </div>
    </header>
  );
};
