"use client";

import { useEffect, useState, useTransition } from "react";
import { FolderOpen } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getUserCollections,
  moveFormToCollection,
} from "@/actions/collection-actions";

type Collection = Awaited<ReturnType<typeof getUserCollections>>[number];

interface MoveFormDialogProps {
  formId: string;
  currentCollectionId: string | null;
  onClose: () => void;
  onMoved: () => void;
}

export function MoveFormDialog({
  formId,
  currentCollectionId,
  onClose,
  onMoved,
}: MoveFormDialogProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getUserCollections().then((data) => {
      setCollections(data);
      setLoading(false);
    });
  }, []);

  const handleMove = () => {
    if (!selectedId) return;
    startTransition(async () => {
      await moveFormToCollection(formId, selectedId);
      toast.success("Form moved to collection");
      onMoved();
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move to Collection</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Loading collections...
          </div>
        ) : (
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {collections.map((collection) => {
              const isCurrent = collection.id === currentCollectionId;
              return (
                <button
                  key={collection.id}
                  onClick={() => !isCurrent && setSelectedId(collection.id)}
                  disabled={isCurrent}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                    isCurrent
                      ? "cursor-not-allowed border-muted bg-muted/50 opacity-60"
                      : selectedId === collection.id
                        ? "border-green-500 bg-green-50 dark:bg-green-500/10"
                        : "hover:bg-muted/50",
                  )}
                >
                  <FolderOpen
                    className={cn(
                      "size-4",
                      selectedId === collection.id
                        ? "text-green-600 dark:text-green-400"
                        : "text-muted-foreground",
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {collection.name}
                      </span>
                      {collection.isDefault && (
                        <span className="text-xs text-muted-foreground">
                          (default)
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-xs text-muted-foreground">
                          — current
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {collection._count.forms} form
                      {collection._count.forms !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedId || isPending}
          >
            Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
