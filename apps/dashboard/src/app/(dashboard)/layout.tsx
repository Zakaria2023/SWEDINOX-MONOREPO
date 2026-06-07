import type { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/shadcn/sidebar";
import { TooltipProvider } from "@/components/shadcn/tooltip";
import { AppSidebar } from "@/components/sidebar/app-sidebar";

type Props = {
  children: ReactNode;
};

const DashboardLayout = ({ children }: Props) => (
  <TooltipProvider>
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-1 flex-col">
        <header className="flex h-12 items-center border-b px-4">
          <SidebarTrigger />
        </header>
        <div className="flex-1 p-6">{children}</div>
      </main>
    </SidebarProvider>
  </TooltipProvider>
);

export default DashboardLayout;
