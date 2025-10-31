"use client";

import * as React from "react";
import { AlertModal } from "./alert-modal";

interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

interface AlertContextType {
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, options?: Partial<AlertOptions>) => Promise<boolean>;
}

const AlertContext = React.createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alertState, setAlertState] = React.useState<{
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    variant: "default" | "destructive";
    resolve?: (value: boolean) => void;
  }>({
    open: false,
    title: "",
    message: "",
    confirmText: "Tamam",
    variant: "default",
  });

  const showAlert = React.useCallback((message: string, title?: string): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({
        open: true,
        title: title || "Bilgi",
        message,
        confirmText: "Tamam",
        cancelText: undefined,
        variant: "default",
        resolve: () => {
          resolve();
        },
      });
    });
  }, []);

  const showConfirm = React.useCallback(
    (message: string, options?: Partial<AlertOptions>): Promise<boolean> => {
      return new Promise((resolve) => {
        setAlertState({
          open: true,
          title: options?.title || "Onay",
          message,
          confirmText: options?.confirmText || "Evet",
          cancelText: options?.cancelText || "İptal",
          variant: options?.variant || "default",
          resolve,
        });
      });
    },
    []
  );

  const handleConfirm = () => {
    alertState.resolve?.(true);
    setAlertState((prev) => ({ ...prev, open: false }));
  };

  const handleCancel = () => {
    alertState.resolve?.(false);
    setAlertState((prev) => ({ ...prev, open: false }));
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertModal
        open={alertState.open}
        onOpenChange={(open) => {
          if (!open) handleCancel();
        }}
        title={alertState.title}
        description={alertState.message}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onConfirm={handleConfirm}
        variant={alertState.variant}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = React.useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }
  return context;
}

// Global alert override
let globalAlertContext: AlertContextType | null = null;

export function setGlobalAlertContext(context: AlertContextType) {
  globalAlertContext = context;
}

// Override native alert and confirm
if (typeof window !== "undefined") {
  const originalAlert = window.alert;
  const originalConfirm = window.confirm;

  window.alert = function (message?: any): void {
    const msg = String(message ?? "");
    if (globalAlertContext) {
      globalAlertContext.showAlert(msg);
    } else {
      originalAlert.call(window, msg);
    }
  };

  window.confirm = function (message?: string): boolean {
    const msg = String(message ?? "");
    if (globalAlertContext) {
      // Since native confirm is synchronous but our modal is async,
      // we need to handle this differently
      // For now, we'll use the original confirm
      // In practice, code should use useAlert().showConfirm() directly
      console.warn(
        "window.confirm() called - consider using useAlert().showConfirm() for better UX"
      );
      return originalConfirm.call(window, msg);
    }
    return originalConfirm.call(window, msg);
  };
}

