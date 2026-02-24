"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/actions/login";
import { register } from "@/actions/register";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@/lib/utils";
import { loginSchema, registerSchema } from "@/lib/validations/auth";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/shared/icons";

function getPendingTemplateCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)pending_template=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function clearPendingTemplateCookie() {
  document.cookie = "pending_template=;path=/;max-age=0";
}

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: string;
  onSuccess?: () => void;
}

export function UserAuthForm({
  className,
  type,
  onSuccess,
  ...props
}: UserAuthFormProps) {
  const isRegister = type === "register";
  const schema = isRegister ? registerSchema : loginSchema;
  type FormData = z.infer<typeof schema>;

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    if (isRegister) {
      const result = await register(data as z.infer<typeof registerSchema>);

      setIsLoading(false);

      if (result.error) {
        return toast.error(result.error);
      }

      toast.success(result.success);
      onSuccess?.();
      router.push("/check-email");
    } else {
      const result = await login(data as z.infer<typeof loginSchema>);

      setIsLoading(false);

      if (result.error) {
        return toast.error(result.error);
      }

      toast.success("Welcome back!");
      onSuccess?.();

      const pendingTemplate = getPendingTemplateCookie();
      if (pendingTemplate) {
        clearPendingTemplateCookie();
        router.push(`/dashboard/templates/use?templateId=${pendingTemplate}`);
        router.refresh();
        return;
      }

      router.push(searchParams?.get("from") || "/dashboard");
      router.refresh();
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-3">
          {isRegister && (
            <div className="grid gap-1">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                type="text"
                autoCapitalize="words"
                autoComplete="name"
                autoCorrect="off"
                disabled={isLoading || isGoogleLoading}
                {...formRegister("name" as any)}
              />
              {(errors as any)?.name && (
                <p className="px-1 text-xs text-red-600">
                  {(errors as any).name.message}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading || isGoogleLoading}
              {...formRegister("email")}
            />
            {errors?.email && (
              <p className="px-1 text-xs text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="grid gap-1">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                placeholder={
                  isRegister ? "Min. 8 characters" : "Enter your password"
                }
                type={showPassword ? "text" : "password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                disabled={isLoading || isGoogleLoading}
                {...formRegister("password")}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            {errors?.password && (
              <p className="px-1 text-xs text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button className={cn(buttonVariants(), "mt-1")} disabled={isLoading}>
            {isLoading && (
              <Icons.spinner className="mr-2 size-4 animate-spin" />
            )}
            {isRegister ? "Create Account" : "Sign In"}
          </button>
        </div>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <button
        type="button"
        className={cn(buttonVariants({ variant: "outline" }))}
        onClick={() => {
          setIsGoogleLoading(true);
          const pendingTemplate = getPendingTemplateCookie();
          const callbackUrl = pendingTemplate
            ? `/dashboard/templates/use?templateId=${pendingTemplate}`
            : searchParams?.get("from") || "/dashboard";
          if (pendingTemplate) clearPendingTemplateCookie();
          signIn("google", { callbackUrl });
        }}
        disabled={isLoading || isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Icons.spinner className="mr-2 size-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 size-4" />
        )}{" "}
        Google
      </button>
    </div>
  );
}
