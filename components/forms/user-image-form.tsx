"use client";

import { useState, useTransition } from "react";
import { updateUserImage, type FormData } from "@/actions/update-user-image";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { userImageSchema } from "@/lib/validations/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionColumns } from "@/components/dashboard/section-columns";
import { Icons } from "@/components/shared/icons";
import { UserAvatar } from "@/components/shared/user-avatar";

interface UserImageFormProps {
  user: Pick<User, "id" | "name" | "image">;
}

export function UserImageForm({ user }: UserImageFormProps) {
  const { update } = useSession();
  const [preview, setPreview] = useState(user.image || "");
  const [updated, setUpdated] = useState(false);
  const [isPending, startTransition] = useTransition();
  const updateUserImageWithId = updateUserImage.bind(null, user.id);

  const checkUpdate = (value: string) => {
    setPreview(value.trim());
    setUpdated((user.image || "") !== value.trim());
  };

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userImageSchema),
    defaultValues: {
      image: user?.image || "",
    },
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      const { status, error } = await updateUserImageWithId(data);

      if (status !== "success") {
        toast.error("Something went wrong.", {
          description:
            error || "Your photo was not updated. Please try again.",
        });
      } else {
        await update();
        setUpdated(false);
        toast.success("Your profile photo has been updated.");
      }
    });
  });

  return (
    <form onSubmit={onSubmit}>
      <SectionColumns
        title="Profile Photo"
        description="Paste a link to an image hosted elsewhere. Uploads are not supported."
      >
        <div className="flex w-full items-center gap-2">
          <UserAvatar
            user={{ name: user.name, image: preview || null }}
            className="size-9 shrink-0"
          />
          <Label className="sr-only" htmlFor="image">
            Profile photo URL
          </Label>
          <Input
            id="image"
            type="url"
            inputMode="url"
            placeholder="https://example.com/photo.jpg"
            className="flex-1"
            {...register("image")}
            onChange={(e) => checkUpdate(e.target.value)}
          />
          <Button
            type="submit"
            variant={updated ? "default" : "disable"}
            disabled={isPending || !updated}
            className="w-[67px] shrink-0 px-0 sm:w-[130px]"
          >
            {isPending ? (
              <Icons.spinner className="size-4 animate-spin" />
            ) : (
              <p>
                Save
                <span className="hidden sm:inline-flex">&nbsp;Changes</span>
              </p>
            )}
          </Button>
        </div>
        <div className="flex flex-col justify-between p-1">
          {errors?.image && (
            <p className="pb-0.5 text-[13px] text-red-600">
              {errors.image.message}
            </p>
          )}
          <p className="text-[13px] text-muted-foreground">
            Must be an https:// link. Leave empty to remove your photo.
          </p>
        </div>
      </SectionColumns>
    </form>
  );
}
