"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { PromoData } from "@/types/PromoData";
import { AlertCircle, ScanLine } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanned: (promo: PromoData) => void;
}

const SCANNER_ELEMENT_ID = "promo-qr-scanner";

export default function PromoQRScanner({
  open,
  onOpenChange,
  onScanned,
}: Props) {
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null);
  const scanningStateRef = useRef<
    typeof import("html5-qrcode").Html5QrcodeScannerState | null
  >(null);
  const [status, setStatus] = useState<
    "starting" | "scanning" | "checking" | "error"
  >("starting");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setStatus("starting");
    setErrorMessage("");

    async function startScanner() {
      const { Html5Qrcode, Html5QrcodeScannerState } =
        await import("html5-qrcode");
      if (cancelled) return;

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;
      scanningStateRef.current = Html5QrcodeScannerState;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          async (decodedText) => {
            await handleDecoded(decodedText);
          },
          () => {
            // Fires ~every frame with no QR found — ignore, not an error.
          },
        );
        if (!cancelled) setStatus("scanning");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setErrorMessage(
            "Couldn't access the camera. Check that this site has camera permission.",
          );
        }
      }
    }

    async function handleDecoded(code: string) {
      const scanner = scannerRef.current;
      const ScannerState = scanningStateRef.current;
      if (!scanner || !ScannerState) return;
      if (scanner.getState() !== ScannerState.SCANNING) return;

      try {
        await scanner.pause(true);
      } catch {
        // already paused/stopped — fine
      }
      setStatus("checking");

      try {
        const res = await api.get("/api/promos/lookup", {
          params: { code },
        });
        onScanned(res.data as PromoData);
        onOpenChange(false);
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "That QR code doesn't match any promo.";
        setStatus("error");
        setErrorMessage(message);
      }
    }

    startScanner();

    return () => {
      cancelled = true;
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {
            // camera may already be stopped — ignore
          });
      }
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = async () => {
    const scanner = scannerRef.current;
    setErrorMessage("");
    if (scanner) {
      try {
        await scanner.resume();
        setStatus("scanning");
        return;
      } catch {
        // fall through to a full restart below
      }
    }
    // Force the effect to re-run and restart the camera from scratch.
    onOpenChange(false);
    setTimeout(() => onOpenChange(true), 50);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-primary" />
            Scan Promo QR
          </DialogTitle>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-xl border border-border/60 bg-black aspect-square">
          <div id={SCANNER_ELEMENT_ID} className="w-full h-full" />
        </div>

        {status === "starting" && (
          <p className="text-xs text-center text-muted-foreground">
            Starting camera...
          </p>
        )}
        {status === "scanning" && (
          <p className="text-xs text-center text-muted-foreground">
            Point the camera at the promo QR code.
          </p>
        )}
        {status === "checking" && (
          <p className="text-xs text-center text-muted-foreground">
            Checking code...
          </p>
        )}
        {status === "error" && (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs text-destructive text-center justify-center">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errorMessage}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleRetry}
            >
              Scan Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
