"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Trash2,
  Users,
  X,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getCollectionById,
  assignTeamToCollection,
  removeTeamFromCollection,
  toggleTeamAccessAllCollections,
} from "@/actions/collection-actions";
import { deleteForm, duplicateForm } from "@/actions/form-actions";
import { getTeams } from "@/actions/team-actions";
import { MoveFormDialog } from "@/components/collections/move-form-dialog";

type CollectionDetail = NonNullable<
  Awaited<ReturnType<typeof getCollectionById>>
>;
type TeamSummary = Awaited<ReturnType<typeof getTeams>>[number];

export default function CollectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const collectionId = params.collectionId as string;

  const [collection, setCollection] = useState<CollectionDetail | null>(null);
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Move dialog
  const [moveFormId, setMoveFormId] = useState<string | null>(null);

  // Assign team
  const [selectedTeamId, setSelectedTeamId] = useState("");

  const loadData = async () => {
    const [col, userTeams] = await Promise.all([
      getCollectionById(collectionId),
      getTeams(),
    ]);
    setCollection(col);
    setTeams(userTeams);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [collectionId]);

  const handleDeleteForm = (formId: string) => {
    startTransition(async () => {
      await deleteForm(formId);
      setCollection((prev) =>
        prev
          ? {
              ...prev,
              forms: prev.forms.filter((f) => f.id !== formId),
              _count: { ...prev._count, forms: prev._count.forms - 1 },
            }
          : null,
      );
      toast.success("Form deleted");
    });
  };

  const handleDuplicateForm = (formId: string) => {
    startTransition(async () => {
      await duplicateForm(formId);
      await loadData();
      toast.success("Form duplicated");
    });
  };

  const handleAssignTeam = () => {
    if (!selectedTeamId) return;
    startTransition(async () => {
      await assignTeamToCollection(collectionId, selectedTeamId);
      await loadData();
      setSelectedTeamId("");
      toast.success("Team assigned to collection");
    });
  };

  const handleRemoveTeam = (teamId: string) => {
    startTransition(async () => {
      await removeTeamFromCollection(collectionId, teamId);
      await loadData();
      toast.success("Team removed from collection");
    });
  };

  const handleToggleAccessAll = (teamId: string, accessAll: boolean) => {
    startTransition(async () => {
      await toggleTeamAccessAllCollections(teamId, accessAll);
      await loadData();
      toast.success(
        accessAll
          ? "Team now has access to all collections"
          : "Team access limited to assigned collections",
      );
    });
  };

  if (loading) {
    return (
      <div>
        <Skeleton className="mb-6 h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[180px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold">Collection not found</h2>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => router.push("/dashboard/collections")}
        >
          Back to Collections
        </Button>
      </div>
    );
  }

  // Teams that are NOT already assigned to this collection
  const assignedTeamIds = new Set(collection.teams.map((ct) => ct.team.id));
  const availableTeams = teams.filter((t) => !assignedTeamIds.has(t.id));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push("/dashboard/collections")}
          className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Collections
        </button>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-green-500/10 to-teal-500/10 p-2">
            <FolderOpen className="size-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {collection.name}
              </h1>
              {collection.isDefault && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {collection._count.forms} form
              {collection._count.forms !== 1 ? "s" : ""} &middot;{" "}
              {collection._count.teams} team
              {collection._count.teams !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="forms">
        <TabsList>
          <TabsTrigger value="forms">Forms</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        {/* Forms Tab */}
        <TabsContent value="forms" className="mt-6">
          {collection.forms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4">
                <FolderOpen className="size-8 text-muted-foreground" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">
                No forms in this collection
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Move forms here from the My Forms page
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {collection.forms.map((form) => (
                <Card
                  key={form.id}
                  className="group relative cursor-pointer p-5 transition-shadow hover:shadow-md"
                  onClick={() =>
                    router.push(`/dashboard/forms/${form.id}/builder`)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="truncate font-semibold">{form.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {form._count.responses} response
                        {form._count.responses !== 1 ? "s" : ""} &middot;{" "}
                        {form._count.questions} question
                        {form._count.questions !== 1 ? "s" : ""}
                      </p>
                    </div>
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
                            router.push(
                              `/dashboard/forms/${form.id}/builder`,
                            );
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        {form.status === "PUBLISHED" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/f/${form.slug}`, "_blank");
                            }}
                          >
                            <ExternalLink className="mr-2 size-4" />
                            View Live
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setMoveFormId(form.id);
                          }}
                        >
                          <FolderOpen className="mr-2 size-4" />
                          Move to Collection
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateForm(form.id);
                          }}
                        >
                          <Copy className="mr-2 size-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteForm(form.id);
                          }}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        form.status === "PUBLISHED"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : form.status === "CLOSED"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                      )}
                    >
                      {form.status.toLowerCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(form.updatedAt.toISOString())}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="mt-6">
          {/* Assign team row */}
          {availableTeams.length > 0 && (
            <div className="mb-6 flex items-center gap-3">
              <Select
                value={selectedTeamId}
                onValueChange={setSelectedTeamId}
              >
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Select a team to assign" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAssignTeam}
                disabled={!selectedTeamId || isPending}
                size="sm"
              >
                <Plus className="mr-2 size-4" />
                Assign Team
              </Button>
            </div>
          )}

          {collection.teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4">
                <Users className="size-8 text-muted-foreground" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">
                No teams assigned
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Assign teams to give them access to forms in this collection
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {collection.teams.map((ct) => (
                <div
                  key={ct.team.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      <Users className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium">{ct.team.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {ct.team._count.members} member
                        {ct.team._count.members !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={ct.team.accessAllCollections}
                        onCheckedChange={(checked) =>
                          handleToggleAccessAll(ct.team.id, checked)
                        }
                      />
                      <span className="text-muted-foreground">
                        All collections
                      </span>
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTeam(ct.team.id)}
                      disabled={isPending}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Move Form Dialog */}
      {moveFormId && (
        <MoveFormDialog
          formId={moveFormId}
          currentCollectionId={collectionId}
          onClose={() => setMoveFormId(null)}
          onMoved={() => {
            setMoveFormId(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
