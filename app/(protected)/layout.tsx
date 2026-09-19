import { redirect } from "next/navigation";

import { sidebarLinks } from "@/config/dashboard";
import { isOssEdition } from "@/config/edition";
import { getUserPlan } from "@/lib/subscription";
import { getCurrentUser } from "@/lib/session";
import { getUserById } from "@/lib/user";
import { isEmailConfigured } from "@/lib/mailer";
import { SearchCommand } from "@/components/dashboard/search-command";
import {
  DashboardSidebar,
  MobileSheetSidebar,
} from "@/components/layout/dashboard-sidebar";
import { ModeToggle } from "@/components/layout/mode-toggle";
import { UserAccountNav } from "@/components/layout/user-account-nav";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default async function Dashboard({ children }: ProtectedLayoutProps) {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  // Block unverified email users from accessing dashboard
  const dbUser = user.id ? await getUserById(user.id) : null;
  if (dbUser && !dbUser.emailVerified && isEmailConfigured()) {
    redirect("/check-email");
  }

  const filteredLinks = sidebarLinks.map((section) => ({
    ...section,
    items: section.items.filter(({ authorizeOnly, saasOnly }) => {
      if (authorizeOnly && authorizeOnly !== user.role) return false;
      if (saasOnly && isOssEdition()) return false;
      return true;
    }),
  }));

  const plan = user?.id ? await getUserPlan(user.id) : undefined;

  return (
    <div className="relative flex min-h-screen w-full">
      <DashboardSidebar links={filteredLinks} plan={plan} />

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-50 flex h-14 bg-background px-4 lg:h-[60px] xl:px-8">
          <MaxWidthWrapper className="flex max-w-7xl items-center gap-x-3 px-0">
            <MobileSheetSidebar links={filteredLinks} plan={plan} />

            <div className="w-full flex-1">
              <SearchCommand links={filteredLinks} />
            </div>

            <ModeToggle />
            <UserAccountNav />
          </MaxWidthWrapper>
        </header>

        <main className="flex-1 p-4 xl:px-8">
          <MaxWidthWrapper className="flex h-full max-w-7xl flex-col gap-4 px-0 lg:gap-6">
            {children}
          </MaxWidthWrapper>
        </main>
      </div>
    </div>
  );
}
