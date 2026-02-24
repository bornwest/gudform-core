"use client";

import { useRef, useState } from "react";
import {
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

interface ShareFormDialogProps {
  formId: string;
  formTitle: string;
  slug: string;
  children: React.ReactNode;
}

export function ShareFormDialog({
  formId,
  formTitle,
  slug,
  children,
}: ShareFormDialogProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const formUrl = `${baseUrl}/f/${slug}`;
  const iframeCode = `<iframe src="${formUrl}" width="100%" height="600" frameborder="0" style="border:none;border-radius:8px;"></iframe>`;
  const scriptCode = `<div id="gudform-${slug}"></div>\n<script src="${baseUrl}/embed.js" data-form="${slug}"></script>`;

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

        <Tabs defaultValue="link" className="mt-4">
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
            <div className="space-y-2">
              <Label>iFrame Embed</Label>
              <div className="relative">
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  {iframeCode}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => copyToClipboard(iframeCode, "iframe")}
                >
                  {copied === "iframe" ? (
                    <Check className="mr-1 size-3" />
                  ) : (
                    <Copy className="mr-1 size-3" />
                  )}
                  Copy
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Script Embed</Label>
              <div className="relative">
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                  {scriptCode}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => copyToClipboard(scriptCode, "script")}
                >
                  {copied === "script" ? (
                    <Check className="mr-1 size-3" />
                  ) : (
                    <Copy className="mr-1 size-3" />
                  )}
                  Copy
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
