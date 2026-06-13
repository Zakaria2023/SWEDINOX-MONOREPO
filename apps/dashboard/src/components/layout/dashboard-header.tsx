import { currentUser } from "@clerk/nextjs/server";
import { SidebarTrigger } from "@/components/shadcn/sidebar";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { SignOutButton } from "@clerk/nextjs";

export const DashboardHeader = async () => {
  const userFullname = await currentUser()?.then((user) => user?.fullName);

  if (!userFullname) {
    return null;
  }

  return (
    <header className="flex h-12 items-center border-b px-4">
      <SidebarTrigger />

      <div className="ms-auto flex items-center gap-3">
        <LanguageSwitcher />

        <SignOutButton>
          <button className="text-sm text-muted-foreground cursor-pointer">
            Logout
          </button>
        </SignOutButton>

        <span className="hidden text-sm text-muted-foreground sm:inline">
          {userFullname}
        </span>
      </div>
    </header>
  );
};
