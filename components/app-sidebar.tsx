"use client";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  GalleryVerticalEndIcon,
  LayoutDashboardIcon,
  ReceiptIcon,
  TagsIcon,
  UsersIcon,
  WrenchIcon,
} from "lucide-react"; // Added new icons
import * as React from "react";

// Updated sample data with requested navigation
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "H Breakfast to Bar",
      logo: <GalleryVerticalEndIcon />,
      plan: "",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: <LayoutDashboardIcon />,
      isActive: true,
    },
    {
      title: "Services Management",
      url: "/admin/services",
      icon: <WrenchIcon />,
    },
    {
      title: "Promo Management",
      url: "/admin/promos",
      icon: <TagsIcon />,
    },
    {
      title: "Staff & Commissions",
      url: "/admin/staffs",
      icon: <UsersIcon />,
    },
    {
      title: "Transactions",
      url: "/admin/transactions",
      icon: <ReceiptIcon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        {/* NavMain maps the new items array */}
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
