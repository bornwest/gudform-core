import Link from "next/link";
import { Suspense } from "react";

import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { UserAuthForm } from "@/components/forms/user-auth-form";
import { DemoFormMockup } from "@/components/demo-form-mockup";

export const metadata = {
  title: "Create an account",
  description: "Create an account to get started.",
};

export default function RegisterPage() {
  return (
    <MaxWidthWrapper className="py-16 md:py-24">
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
        <div className="hidden items-center justify-center lg:flex">
          <DemoFormMockup />
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <Icons.logo className="mx-auto size-6" />
              <h1 className="text-2xl font-semibold tracking-tight">
                Create an account
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your details below to create your account
              </p>
            </div>
            <Suspense>
              <UserAuthForm type="register" />
            </Suspense>
            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <Link
                href="/terms"
                className="hover:text-brand underline underline-offset-4"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="hover:text-brand underline underline-offset-4"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
