"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Cropper from "react-easy-crop";
import { motion, AnimatePresence } from "motion/react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PixelCrop } from "@/lib/image";
import { cropToSquareDataUrl } from "@/lib/image";

type Area = { x: number; y: number; width: number; height: number };

export function ProfilePhotoPicker({
  value,
  onChange,
}: {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<PixelCrop | null>(null);
  const [saving, setSaving] = useState(false);

  const previewSrc = value || null;

  const openFile = () => inputRef.current?.click();

  const onFile = async (file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setOpen(true);
  };

  useEffect(() => {
    return () => {
      if (imageSrc?.startsWith("blob:")) URL.revokeObjectURL(imageSrc);
    };
  }, [imageSrc]);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setAreaPixels({
      x: Math.round(areaPixels.x),
      y: Math.round(areaPixels.y),
      width: Math.round(areaPixels.width),
      height: Math.round(areaPixels.height),
    });
  }, []);

  const canSave = useMemo(() => !!imageSrc && !!areaPixels && !saving, [imageSrc, areaPixels, saving]);

  const handleSave = async () => {
    if (!imageSrc || !areaPixels) return;
    setSaving(true);
    try {
      const dataUrl = await cropToSquareDataUrl({
        imageSrc,
        cropPixels: areaPixels,
        size: 256,
      });
      onChange(dataUrl);
      setOpen(false);
      setImageSrc(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 overflow-hidden rounded-full border border-border bg-surface-elevated">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt=""
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-text-muted">
              <ImagePlus className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary text-sm" onClick={openFile}>
            Change photo
          </button>
          {previewSrc && (
            <button
              type="button"
              className="btn-ghost text-sm"
              onClick={() => onChange(null)}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              </Dialog.Overlay>

              <Dialog.Content asChild>
                <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-lg">
                  <motion.div
                    className="rounded-2xl border border-border bg-surface p-4 shadow-2xl"
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Dialog.Title className="text-sm font-semibold text-text-primary">
                          Crop photo
                        </Dialog.Title>
                        <p className="text-xs text-text-muted">Drag to position. Pinch/scroll to zoom.</p>
                      </div>
                      <Dialog.Close asChild>
                        <button
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
                          aria-label="Close"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </Dialog.Close>
                    </div>

                    <div className="mt-3 relative h-72 w-full overflow-hidden rounded-xl border border-border bg-base">
                      {imageSrc && (
                        <Cropper
                          image={imageSrc}
                          crop={crop}
                          zoom={zoom}
                          aspect={1}
                          cropShape="round"
                          showGrid={false}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={onCropComplete}
                        />
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-xs text-text-muted">Zoom</span>
                      <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className={cn("w-full")}
                      />
                    </div>

                    <div className="mt-4 flex flex-col-reverse sm:flex-row justify-end gap-2">
                      <button
                        type="button"
                        className="btn-ghost text-sm w-full sm:w-auto"
                        onClick={() => {
                          setOpen(false);
                          setImageSrc(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary text-sm w-full sm:w-auto disabled:opacity-50"
                        disabled={!canSave}
                        onClick={handleSave}
                      >
                        {saving ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </motion.div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </div>
  );
}

