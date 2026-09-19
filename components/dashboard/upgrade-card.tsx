import Link from "next/link";

import { SubscriptionPlan } from "@/config/subscriptions";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface UpgradeCardProps {
  plan?: SubscriptionPlan;
}

export function UpgradeCard({ plan }: UpgradeCardProps) {
  const isBusiness = plan === SubscriptionPlan.BUSINESS;
  const buttonLabel = isBusiness ? "Manage plan" : "Upgrade plan";

  return (
    <Card className="md:max-xl:rounded-none md:max-xl:border-none md:max-xl:shadow-none">
      <CardHeader className="md:max-xl:px-4">
        <CardTitle>
          {isBusiness ? "Business" : "Upgrade to Pro"}
        </CardTitle>
        <CardDescription>
          {isBusiness
            ? "Manage your subscription and billing."
            : "Unlock all features and get unlimited access to our support team."}
        </CardDescription>
      </CardHeader>
      <CardContent className="md:max-xl:px-4">
        <Link
          href="/dashboard/billing"
          className={cn(buttonVariants({ size: "sm" }), "w-full")}
        >
          {buttonLabel}
        </Link>
      </CardContent>
    </Card>
  );
}
