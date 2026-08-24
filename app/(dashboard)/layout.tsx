import React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

export default DashboardLayout;
