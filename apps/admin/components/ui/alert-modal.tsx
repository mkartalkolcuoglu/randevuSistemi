"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";

interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  variant?: "default" | "destructive";
}

export function AlertModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Tamam",
  cancelText,
  onConfirm,
  variant = "default",
}: AlertModalProps) {
  const handleConfirm = () => {
    onConfirm?.();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {cancelText && (
            <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          )}
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              variant === "destructive"
                ? "bg-red-600 hover:bg-red-700"
                : undefined
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for easy usage
export function useAlertModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [config, setConfig] = React.useState<{
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    variant?: "default" | "destructive";
  }>({
    title: "",
    description: "",
  });

  const showAlert = React.useCallback(
    (options: {
      title: string;
      description: string;
      confirmText?: string;
      onConfirm?: () => void;
    }) => {
      setConfig({
        ...options,
        variant: "default",
      });
      setIsOpen(true);
    },
    []
  );

  const showConfirm = React.useCallback(
    (options: {
      title: string;
      description: string;
      confirmText?: string;
      cancelText?: string;
      onConfirm?: () => void;
      variant?: "default" | "destructive";
    }) => {
      setConfig({
        confirmText: "Evet",
        cancelText: "İptal",
        ...options,
      });
      setIsOpen(true);
    },
    []
  );

  const AlertModalComponent = React.useMemo(
    () => (
      <AlertModal
        open={isOpen}
        onOpenChange={setIsOpen}
        {...config}
      />
    ),
    [isOpen, config]
  );

  return {
    showAlert,
    showConfirm,
    AlertModal: AlertModalComponent,
  };
}

