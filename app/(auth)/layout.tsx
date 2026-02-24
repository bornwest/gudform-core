import { redirect } from "next/navigation";

import { NavBar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { NavMobile } from "@/components/layout/mobile-nav";
import { getCurrentUser } from "@/lib/session";
import { getUserById } from "@/lib/user";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  const user = await getCurrentUser();

  if (user) {
    const dbUser = user.id ? await getUserById(user.id) : null;
    if (dbUser && !dbUser.emailVerified) {
      // Allow unverified users to stay on auth pages (e.g. /check-email)
    } else if (user.role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavMobile />
      <NavBar scroll={true} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
