"use client";

import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PromoData } from "@/types/PromoData";
import { Download, QrCode } from "lucide-react";

interface Props {
  promo: PromoData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PromoQRCode({ promo, open, onOpenChange }: Props) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!captureRef.current) return;
    setIsDownloading(true);
    try {
      // pixelRatio bumps the export resolution so it still looks sharp
      // when printed or zoomed in on a phone.
      const dataUrl = await toPng(captureRef.current, {
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      const safeName = promo.name.trim().replace(/[^a-z0-9]+/gi, "-");
      link.download = `promo-qr-${safeName || promo.code}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export QR code:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-4 h-4 text-primary" />
            Promo QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center py-2">
          <div
            ref={captureRef}
            className="flex flex-col items-center gap-3 bg-white p-6 rounded-xl border border-border/50"
          >
            <p className="text-sm font-bold text-center text-neutral-900 max-w-[220px] leading-tight">
              {promo.name}
            </p>
            <QRCodeSVG value={promo.code} size={200} level="M" />
            <p className="text-[11px] tracking-widest font-mono text-neutral-500">
              {promo.code}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Scan this at checkout to auto-apply the &quot;{promo.name}&quot;
          promo. Print it or show it from a phone.
        </p>

        <Button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full"
        >
          <Download className="mr-2 h-4 w-4" />
          {isDownloading ? "Preparing..." : "Download as PNG"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
