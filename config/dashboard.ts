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
    ],
  },
  {
    title: "OPTIONS",
    items: [
      { href: "/dashboard/settings/api-keys", icon: "key", title: "API Keys" },
      { href: "/dashboard/settings/storage", icon: "hardDrive", title: "Storage" },
      { href: "/dashboard/settings", icon: "settings", title: "Settings" },
      { href: "/", icon: "home", title: "Homepage" },
    ],
  },
];
