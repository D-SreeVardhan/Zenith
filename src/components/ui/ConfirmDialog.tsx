"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel?: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
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
              <motion.div
                className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] sm:w-full max-w-md -translate-x-1/2 -translate-y-1/2 max-h-[75vh] sm:max-h-[85vh] overflow-y-auto rounded-xl sm:rounded-2xl border border-border bg-surface p-3.5 sm:p-6 shadow-2xl"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="flex items-start gap-2.5 sm:gap-4">
                  <div
                    className={cn(
                      "flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full",
                      variant === "danger"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-amber-500/15 text-amber-400"
                    )}
                  >
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <Dialog.Title className="text-sm sm:text-lg font-semibold text-text-primary leading-tight">
                      {title}
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 sm:mt-2 text-[11px] sm:text-sm text-text-secondary leading-snug">
                      {description}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <button
                      className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
                      aria-label="Close"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="mt-3 sm:mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2">
                  <button
                    onClick={handleCancel}
                    className="btn-ghost px-4 py-2 text-xs sm:text-sm w-full sm:w-auto"
                  >
                    {cancelLabel}
                  </button>
                  <motion.button
                    onClick={handleConfirm}
                    className={cn(
                      "rounded-lg sm:rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto",
                      variant === "danger"
                        ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                        : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {confirmLabel}
                  </motion.button>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
