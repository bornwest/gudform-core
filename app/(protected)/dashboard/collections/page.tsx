"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createCollection,
  deleteCollection,
  getUserCollections,
  updateCollection,
} from "@/actions/collection-actions";

type CollectionWithCounts = Awaited<
  ReturnType<typeof getUserCollections>
>[number];

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  // Rename dialog
  const [showRename, setShowRename] = useState(false);
  const [renameId, setRenameId] = useState("");
  const [renameName, setRenameName] = useState("");

  useEffect(() => {
    getUserCollections().then((data) => {
      setCollections(data);
      setLoading(false);
    });
  }, []);

  const handleCreate = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      const collection = await createCollection(newName);
      setCollections((prev) => [...prev, { ...collection, _count: { forms: 0, teams: 0 } }]);
      setNewName("");
      setShowCreate(false);
      toast.success("Collection created");
    });
  };

  const handleRename = () => {
    if (!renameName.trim()) return;
    startTransition(async () => {
      await updateCollection(renameId, renameName);
      setCollections((prev) =>
        prev.map((c) =>
          c.id === renameId ? { ...c, name: renameName.trim() } : c,
        ),
      );
      setShowRename(false);
      toast.success("Collection renamed");
    });
  };

  const handleDelete = (collectionId: string) => {
    startTransition(async () => {
      await deleteCollection(collectionId);
      setCollections((prev) => prev.filter((c) => c.id !== collectionId));
      toast.success("Collection deleted — forms moved to Default");
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">
            Organize your forms into collections
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} disabled={isPending}>
          <Plus className="mr-2 size-4" />
          New Collection
        </Button>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[150px] rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <Card
              key={collection.id}
              className="group relative cursor-pointer p-5 transition-shadow hover:shadow-md"
              onClick={() =>
                router.push(`/dashboard/collections/${collection.id}`)
              }
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-green-500/10 to-teal-500/10 p-2">
                    <FolderOpen className="size-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">
                        {collection.name}
                      </h3>
                      {collection.isDefault && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {collection._count.forms} form
                      {collection._count.forms !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {!collection.isDefault && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenameId(collection.id);
                          setRenameName(collection.name);
                          setShowRename(true);
                        }}
                      >
                        <Pencil className="mr-2 size-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(collection.id);
                        }}
                      >
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {collection._count.teams > 0 && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3" />
                  {collection._count.teams} team
                  {collection._count.teams !== 1 ? "s" : ""} assigned
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Collection name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending || !newName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Collection</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="New name"
            value={renameName}
            onChange={(e) => setRenameName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRename(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={isPending || !renameName.trim()}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
