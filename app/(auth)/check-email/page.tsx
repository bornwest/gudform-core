import { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Check Your Email",
  description: "We sent you a verification link",
};

export default function CheckEmailPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Mail className="size-8 text-primary" />
        </div>
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground">
            We sent a verification link to your email address. Click the link to
            activate your account.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          The link expires in 24 hours. If you don&apos;t see the email, check
          your spam folder.
        </p>
        <Link
          href="/login"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
