"use client";

import { useState } from "react";
import {
  createApiKey,
  deleteApiKey,
  rotateApiKey,
} from "@/actions/api-key-actions";
import { Copy, Key, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyData {
  id: string;
  name: string;
  maskedKey: string;
  lastUsedAt: Date | null;
  createdAt: Date;
}

interface ApiKeyManagerProps {
  initialKeys: ApiKeyData[];
}

export function ApiKeyManager({ initialKeys }: ApiKeyManagerProps) {
  const [keys, setKeys] = useState(initialKeys);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  // Full keys are no longer stored client-side after initial display

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const result = await createApiKey(newKeyName.trim());
      setNewlyCreatedKey(result.key);
      setKeys((prev) => [
        {
          id: result.id,
          name: result.name,
          maskedKey: `${result.key.substring(0, 7)}...****`,
          lastUsedAt: null,
          createdAt: new Date(),
        },
        ...prev,
      ]);
      setNewKeyName("");
      toast.success("API key created! Copy it now — it won't be shown again.");
    } catch {
      toast.error("Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApiKey(id);
      setKeys((prev) => prev.filter((k) => k.id !== id));
      toast.success("API key deleted");
    } catch {
      toast.error("Failed to delete API key");
    }
  };

  const handleRotate = async (id: string) => {
    try {
      const result = await rotateApiKey(id);
      setNewlyCreatedKey(result.key);
      setKeys((prev) =>
        prev.map((k) =>
          k.id === id
            ? {
                ...k,
                maskedKey: `${result.key.substring(0, 7)}...****`,
              }
            : k,
        ),
      );
      toast.success("API key rotated! Copy the new key.");
    } catch {
      toast.error("Failed to rotate API key");
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* New key alert */}
      {newlyCreatedKey && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <p className="mb-2 text-sm font-medium text-green-800 dark:text-green-200">
            Your new API key (copy it now — it won&apos;t be shown again):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-white px-3 py-2 font-mono text-sm dark:bg-gray-900">
              {newlyCreatedKey}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyKey(newlyCreatedKey)}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setNewlyCreatedKey(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Create button */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-1.5 size-4" />
            Create API Key
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create API Key</DialogTitle>
            <DialogDescription>
              Give your key a name to identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Key Name</Label>
              <Input
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production, Development"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newKeyName.trim()}
            >
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keys list */}
      {keys.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <Key className="size-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">No API keys</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create an API key to access the GudForm API.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border">
          {keys.map((key, i) => (
            <div
              key={key.id}
              className={`flex items-center justify-between px-4 py-3 ${
                i > 0 ? "border-t" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{key.name}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <code className="font-mono text-xs text-muted-foreground">
                    {key.maskedKey}
                  </code>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Created {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsedAt &&
                    ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => handleRotate(key.id)}
                  title="Rotate key"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-red-500 hover:text-red-600"
                  onClick={() => handleDelete(key.id)}
                  title="Delete key"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Usage docs */}
      <div className="rounded-lg border bg-muted/30 p-6">
        <h3 className="text-sm font-semibold">API Usage</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Use your API key in the Authorization header:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-background p-3 text-xs">
          {`curl -H "Authorization: Bearer ff_your_api_key" \\
  ${typeof window !== "undefined" ? window.location.origin : ""}/api/v1/forms`}
        </pre>
        <p className="mt-3 text-xs text-muted-foreground">
          Available endpoints: GET /api/v1/forms, POST /api/v1/forms,
          GET/PATCH/DELETE /api/v1/forms/:id, GET /api/v1/forms/:id/responses
        </p>
      </div>
    </div>
  );
}
