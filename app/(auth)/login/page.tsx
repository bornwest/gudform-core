import { Suspense } from "react";
import { Metadata } from "next";
import Link from "next/link";

import { Icons } from "@/components/shared/icons";
import MaxWidthWrapper from "@/components/shared/max-width-wrapper";
import { UserAuthForm } from "@/components/forms/user-auth-form";
import { VerificationAlert } from "@/components/forms/verification-alert";
import { DemoFormMockup } from "@/components/demo-form-mockup";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const from = params?.from || "";
  const signupHref = from.startsWith("/invite/") ? from : "/register";

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
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your credentials to sign in to your account
              </p>
            </div>

            <VerificationAlert
              verified={params?.verified}
              error={params?.error}
            />

            <Suspense>
              <UserAuthForm />
            </Suspense>
            <p className="px-8 text-center text-sm text-muted-foreground">
              <Link
                href={signupHref}
                className="hover:text-brand underline underline-offset-4"
              >
                Don&apos;t have an account? Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </MaxWidthWrapper>
  );
}
