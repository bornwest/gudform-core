"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import { SectionColumns } from "@/components/dashboard/section-columns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserEmailInfoProps {
  email: string | null;
  emailVerified: Date | null;
}

export function UserEmailInfo({ email, emailVerified }: UserEmailInfoProps) {
  return (
    <SectionColumns
      title="Email"
      description="Your email address is used for login and notifications."
    >
      <div className="space-y-2">
        <Label className="sr-only" htmlFor="email">
          Email
        </Label>
        <Input
          id="email"
          value={email || "No email set"}
          disabled
          className="flex-1"
        />
        <div className="flex items-center gap-1.5 text-sm">
          {emailVerified ? (
            <>
              <CheckCircle2 className="size-3.5 text-green-500" />
              <span className="text-muted-foreground">Verified</span>
            </>
          ) : (
            <>
              <XCircle className="size-3.5 text-yellow-500" />
              <span className="text-muted-foreground">Not verified</span>
            </>
          )}
        </div>
      </div>
    </SectionColumns>
  );
}
