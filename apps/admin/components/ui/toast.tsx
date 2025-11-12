import * as React from "react";

// Placeholder component
export const Toaster = () => <div />;
export const Toast = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const ToastAction = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const ToastDescription = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const ToastProvider = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const ToastTitle = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
export const ToastViewport = () => <div />;
export const useToast = () => ({ toast: () => {} });
