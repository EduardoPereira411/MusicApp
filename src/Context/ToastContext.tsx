import React from "react";
import { ToastNotification } from "@/Components/ToastNotification";
import { useToastStore } from "@/Stores/useToastStore";

export const useToast = () => {
  return { showToast: useToastStore((state) => state.showToast) };
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToastNotification />
    </>
  );
}
