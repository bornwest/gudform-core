import { UserRole } from "@prisma/client";

import { SidebarNavItem } from "types";

export const sidebarLinks: SidebarNavItem[] = [
  {
    title: "FORMS",
    items: [
      { href: "/dashboard", icon: "dashboard", title: "My Forms" },
      { href: "/dashboard/collections", icon: "package", title: "Collections" },
      { href: "/dashboard/teams", icon: "users", title: "Teams" },
      {
        href: "/admin",
        icon: "laptop",
        title: "Admin Panel",
        authorizeOnly: UserRole.ADMIN,
      },
      {
        href: "/admin/users",
        icon: "users",
        title: "Manage Users",
        authorizeOnly: UserRole.ADMIN,
      },
      {
        href: "/admin/integrations",
        icon: "laptop",
        title: "Review Integrations",
        authorizeOnly: UserRole.ADMIN,
        saasOnly: true,
      },
      {
        href: "/admin/templates",
        icon: "layout",
        title: "Review Templates",
        authorizeOnly: UserRole.ADMIN,
      },
    ],
  },
  {
    title: "OPTIONS",
    items: [
      { href: "/dashboard/templates", icon: "layout", title: "Templates" },
      {
        href: "/dashboard/integrations",
        icon: "laptop",
        title: "Integrations",
        saasOnly: true,
      },
      {
        href: "/dashboard/integrations/developer",
        icon: "laptop",
        title: "Developer Portal",
        saasOnly: true,
      },
      { href: "/dashboard/billing", icon: "billing", title: "Billing", saasOnly: true },
      {
        href: "/dashboard/settings/payments",
        icon: "billing",
        title: "Payments",
        saasOnly: true,
      },
      { href: "/dashboard/settings/api-keys", icon: "key", title: "API Keys" },
      { href: "/dashboard/settings/storage", icon: "hardDrive", title: "Storage" },
      { href: "/dashboard/settings", icon: "settings", title: "Settings" },
      { href: "/", icon: "home", title: "Homepage" },
    ],
  },
];
