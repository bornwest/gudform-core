"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateNotificationPreferences } from "@/actions/update-user-settings";
import { SectionColumns } from "@/components/dashboard/section-columns";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface NotificationPreferencesProps {
  notifyResponses: boolean;
  notifyStorage: boolean;
  marketingEmails: boolean;
}

export function NotificationPreferences({
  notifyResponses: initialResponses,
  notifyStorage: initialStorage,
  marketingEmails: initialMarketing,
}: NotificationPreferencesProps) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(
    field: "notifyResponses" | "notifyStorage" | "marketingEmails",
    checked: boolean,
  ) {
    const current = {
      notifyResponses: initialResponses,
      notifyStorage: initialStorage,
      marketingEmails: initialMarketing,
    };

    startTransition(async () => {
      const result = await updateNotificationPreferences({
        ...current,
        [field]: checked,
      });

      if (result.status === "success") {
        toast.success("Notification preferences updated.");
      } else {
        toast.error("Failed to update preferences.");
      }
    });
  }

  return (
    <SectionColumns
      title="Notifications"
      description="Choose which email notifications you'd like to receive."
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="notify-responses" className="text-sm font-medium">
              Form responses
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified when someone submits a response to your forms.
            </p>
          </div>
          <Switch
            id="notify-responses"
            defaultChecked={initialResponses}
            disabled={isPending}
            onCheckedChange={(checked) =>
              handleToggle("notifyResponses", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="notify-storage" className="text-sm font-medium">
              Storage alerts
            </Label>
            <p className="text-sm text-muted-foreground">
              Get notified when you're running low on file storage.
            </p>
          </div>
          <Switch
            id="notify-storage"
            defaultChecked={initialStorage}
            disabled={isPending}
            onCheckedChange={(checked) =>
              handleToggle("notifyStorage", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="marketing-emails" className="text-sm font-medium">
              Product updates
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive emails about new features, tips, and product news.
            </p>
          </div>
          <Switch
            id="marketing-emails"
            defaultChecked={initialMarketing}
            disabled={isPending}
            onCheckedChange={(checked) =>
              handleToggle("marketingEmails", checked)
            }
          />
        </div>
      </div>
    </SectionColumns>
  );
}
