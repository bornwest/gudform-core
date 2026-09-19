"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  Code,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Mail,
  QrCode,
  Share2,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getPublicBaseUrl, isPreviewHost } from "@/lib/utils";

interface ShareFormDialogProps {
  formId: string;
  formTitle: string;
  slug: string;
  children: React.ReactNode;
  defaultTab?: "link" | "qr" | "social" | "embed";
}

export function ShareFormDialog({
  formId,
  formTitle,
  slug,
  children,
  defaultTab = "link",
}: ShareFormDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  
  // Embed settings
  const [embedType, setEmbedType] = useState<"iframe" | "script">("iframe");
  const [embedHeight, setEmbedHeight] = useState<"auto" | "compact" | "tall">("auto");

  // Use public base URL for embeds to avoid Vercel preview auth blocking iframes
  const publicBaseUrl = getPublicBaseUrl();
  const isOnPreview = isPreviewHost();

  // For viewing, use current origin; for sharing/embedding, use public URL
  const viewUrl = typeof window !== "undefined" ? window.location.origin : publicBaseUrl;
  const formUrl = `${viewUrl}/f/${slug}`;
  const embedUrl = `${publicBaseUrl}/f/${slug}?embed=1`;
  
  // Calculate height based on selected preset
  const heightValue = embedHeight === "compact" ? "400" : embedHeight === "tall" ? "800" : "600";
  
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="${heightValue}" frameborder="0" style="border:none;border-radius:8px;max-width:100%;"></iframe>
<script>
window.addEventListener("message", function (e) {
  if (!e.data || e.data.type !== "gudform:resize") return;
  var iframe = document.querySelector('iframe[src="${embedUrl}"]');
  if (iframe) iframe.style.height = Math.max(320, e.data.height) + "px";
});
</script>`;
  const scriptCode = `<div id="gudform-${slug}"></div>\n<script src="${publicBaseUrl}/embed.js" data-form="${slug}"></script>`;
  
  const embedCode = embedType === "iframe" ? iframeCode : scriptCode;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `gudform-${slug}-qr.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const shareUrl = encodeURIComponent(formUrl);
  const shareTitle = encodeURIComponent(formTitle || "Check out this form");

  const socialLinks = [
    {
      name: "Twitter / X",
      url: `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`,
      color: "bg-black text-white dark:bg-white dark:text-black",
    },
    {
      name: "Facebook",
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      color: "bg-green-600 text-white",
    },
    {
      name: "LinkedIn",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      color: "bg-green-700 text-white",
    },
    {
      name: "WhatsApp",
      url: `https://wa.me/?text=${shareTitle}%20${shareUrl}`,
      color: "bg-green-500 text-white",
    },
  ];

  const handleSendEmail = async () => {
    if (!emailRecipients.trim()) return;
    setSendingEmail(true);
    try {
      const { sendFormByEmail } = await import("@/actions/share-actions");
      const emails = emailRecipients
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);
      await sendFormByEmail(formId, emails, emailMessage);
      toast.success("Invitation emails sent!");
      setEmailRecipients("");
      setEmailMessage("");
    } catch {
      toast.error("Failed to send emails");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Form</DialogTitle>
          <DialogDescription>
            Share your form via link, QR code, social media, or email
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="link" className="text-xs">
              <Link2 className="mr-1 size-3.5" />
              Link
            </TabsTrigger>
            <TabsTrigger value="qr" className="text-xs">
              <QrCode className="mr-1 size-3.5" />
              QR
            </TabsTrigger>
            <TabsTrigger value="social" className="text-xs">
              <Share2 className="mr-1 size-3.5" />
              Social
            </TabsTrigger>
            <TabsTrigger value="embed" className="text-xs">
              <Code className="mr-1 size-3.5" />
              Embed
            </TabsTrigger>
          </TabsList>

          {/* Link Tab */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-2">
              <Label>Form URL</Label>
              <div className="flex gap-2">
                <Input value={formUrl} readOnly />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(formUrl, "link")}
                >
                  {copied === "link" ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => window.open(formUrl, "_blank")}
            >
              <ExternalLink className="mr-2 size-4" />
              Open in new tab
            </Button>
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qr" className="space-y-4">
            <div
              ref={qrRef}
              className="flex items-center justify-center rounded-lg border bg-white p-6"
            >
              <QRCodeSVG value={formUrl} size={200} level="M" includeMargin />
            </div>
            <Button onClick={downloadQR} className="w-full">
              <Download className="mr-2 size-4" />
              Download QR Code
            </Button>
          </TabsContent>

          {/* Social Tab */}
          <TabsContent value="social" className="space-y-3">
            {socialLinks.map((social) => (
              <Button
                key={social.name}
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  window.open(
                    social.url,
                    "_blank",
                    "noopener,noreferrer,width=600,height=400",
                  )
                }
              >
                <span
                  className={`mr-3 flex size-7 items-center justify-center rounded text-xs font-bold ${social.color}`}
                >
                  {social.name[0]}
                </span>
                Share on {social.name}
              </Button>
            ))}

            {/* Email sharing */}
            <div className="space-y-3 border-t pt-3">
              <Label>
                <Mail className="mr-1.5 inline size-4" />
                Share via Email
              </Label>
              <Input
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
              />
              <Textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Optional message..."
                rows={2}
              />
              <Button
                onClick={handleSendEmail}
                disabled={sendingEmail || !emailRecipients.trim()}
                className="w-full"
              >
                {sendingEmail ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </TabsContent>

          {/* Embed Tab */}
          <TabsContent value="embed" className="space-y-4">
            {isOnPreview && (
              <Alert>
                <AlertCircle className="size-4" />
                <AlertDescription>
                  Preview iframes are blocked by Vercel auth — snippet uses the
                  public production URL.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Embed Settings */}
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Embed Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={embedType === "iframe" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEmbedType("iframe")}
                    className="flex-1"
                  >
                    iFrame
                  </Button>
                  <Button
                    type="button"
                    variant={embedType === "script" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEmbedType("script")}
                    className="flex-1"
                  >
                    Script
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {embedType === "iframe" 
                    ? "Fixed-size iframe with auto-resize script" 
                    : "Dynamic script embed (recommended)"}
                </p>
              </div>
              
              {embedType === "iframe" && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Initial Height</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={embedHeight === "compact" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEmbedHeight("compact")}
                      className="flex-1"
                    >
                      Compact
                      <span className="ml-1 text-xs opacity-70">(400px)</span>
                    </Button>
                    <Button
                      type="button"
                      variant={embedHeight === "auto" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEmbedHeight("auto")}
                      className="flex-1"
                    >
                      Auto
                      <span className="ml-1 text-xs opacity-70">(600px)</span>
                    </Button>
                    <Button
                      type="button"
                      variant={embedHeight === "tall" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEmbedHeight("tall")}
                      className="flex-1"
                    >
                      Tall
                      <span className="ml-1 text-xs opacity-70">(800px)</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Height will automatically adjust to fit content
                  </p>
                </div>
              )}
            </div>
            
            {/* Generated Code Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Embed Code</Label>
              <div className="relative">
                <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-muted p-4 pr-16 text-xs">
                  {embedCode}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => copyToClipboard(embedCode, "embed")}
                >
                  {copied === "embed" ? (
                    <Check className="mr-1 size-3" />
                  ) : (
                    <Copy className="mr-1 size-3" />
                  )}
                  Copy
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Paste this code into your website where you want the form to appear
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
