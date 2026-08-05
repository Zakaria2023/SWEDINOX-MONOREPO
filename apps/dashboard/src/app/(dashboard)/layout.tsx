import { CSSProperties, ReactNode } from "react";
import { SidebarProvider } from "@/components/shadcn/sidebar";
import { TooltipProvider } from "@/components/shadcn/tooltip";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { DashboardHeader } from "@/components/layout/dashboard-header";

type Props = {
  children: ReactNode;
};

// Wide enough that the longest entry ("Purchases & Sales per Revenue Group")
// reads in full rather than ending in an ellipsis.
const SIDEBAR_WIDTHS = {
  "--sidebar-width": "20rem",
  "--sidebar-width-icon": "4rem",
} as CSSProperties;

// The page keeps its margin at the rail's width whatever the sidebar is doing,
// so opening the panel lays it over the page instead of shoving every chart and
// table sideways.
const STATIC_SIDEBAR_GAP =
  "[&_[data-slot=sidebar-gap]]:w-(--sidebar-width-icon)";

const DashboardLayout = ({ children }: Props) => (
  <TooltipProvider>
    <SidebarProvider
      defaultOpen={false}
      style={SIDEBAR_WIDTHS}
      className={STATIC_SIDEBAR_GAP}
    >
      <AppSidebar />
      <main className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader />
        <div className="flex-1 p-6">{children}</div>
      </main>
    </SidebarProvider>
  </TooltipProvider>
);

export default DashboardLayout;
