import { ReactNode } from "react";
import { SidebarProvider } from "@/components/shadcn/sidebar";
import { TooltipProvider } from "@/components/shadcn/tooltip";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

type Props = {
  children: ReactNode;
};

const DashboardLayout = ({ children }: Props) => (
  <TooltipProvider>
    <SidebarProvider>
      <AppSidebar />
      <main className="flex flex-1 flex-col">
        <DashboardHeader />
        <div className="flex-1 p-6">{children}</div>
      </main>
    </SidebarProvider>
  </TooltipProvider>
);

export default DashboardLayout;
