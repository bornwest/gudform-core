"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronsUpDown, FolderOpen, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getUserCollections } from "@/actions/collection-actions";

type CollectionItem = {
  id: string;
  name: string;
  isDefault: boolean;
  _count: { forms: number; teams: number };
};

export default function ProjectSwitcher({
  large = false,
}: {
  large?: boolean;
}) {
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPopover, setOpenPopover] = useState(false);

  useEffect(() => {
    getUserCollections().then((data) => {
      setCollections(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <ProjectSwitcherPlaceholder />;
  }

  const defaultCollection = collections.find((c) => c.isDefault);
  const displayName = defaultCollection?.name || "My Forms";

  return (
    <div>
      <Popover open={openPopover} onOpenChange={setOpenPopover}>
        <PopoverTrigger asChild>
          <Button
            className="h-8 px-2"
            variant={openPopover ? "secondary" : "ghost"}
          >
            <div className="flex items-center space-x-2 pr-2">
              <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
              <span
                className={cn(
                  "inline-block truncate text-sm font-medium xl:max-w-[120px]",
                  large ? "w-full" : "max-w-[80px]",
                )}
              >
                {displayName}
              </span>
            </div>
            <ChevronsUpDown
              className="size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="max-w-60 p-2">
          <div className="flex flex-col gap-1">
            {/* All Forms link */}
            <Link
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "relative flex h-9 items-center gap-2 p-3 text-muted-foreground hover:text-foreground",
              )}
              href="/dashboard"
              onClick={() => setOpenPopover(false)}
            >
              <FolderOpen className="size-3.5 shrink-0" />
              <span className="flex-1 truncate text-sm font-medium text-foreground">
                All Forms
              </span>
            </Link>

            {/* Divider */}
            {collections.length > 0 && <div className="my-1 border-t" />}

            {/* Collection list */}
            {collections.map((c) => (
              <Link
                key={c.id}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "relative flex h-9 items-center gap-2 p-3 text-muted-foreground hover:text-foreground",
                )}
                href={`/dashboard/collections/${c.id}`}
                onClick={() => setOpenPopover(false)}
              >
                <FolderOpen className="size-3.5 shrink-0" />
                <span className="flex-1 truncate text-sm">
                  {c.name}
                  {c.isDefault ? " (Default)" : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {c._count.forms}
                </span>
              </Link>
            ))}

            {/* Create collection link */}
            <Link
              href="/dashboard/collections"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "relative mt-1 flex h-9 items-center justify-center gap-2 p-2",
              )}
              onClick={() => setOpenPopover(false)}
            >
              <Plus size={16} />
              <span className="text-sm">New Collection</span>
            </Link>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function ProjectSwitcherPlaceholder() {
  return (
    <div className="flex animate-pulse items-center space-x-1.5 rounded-lg px-1.5 py-2 sm:w-60">
      <div className="h-8 w-36 animate-pulse rounded-md bg-muted xl:w-[180px]" />
    </div>
  );
}
