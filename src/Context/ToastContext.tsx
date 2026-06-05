import React, { createContext, useContext, useState, useCallback } from "react";
import { ToastNotification } from "@/Components/ToastNotification";

export type ToastType = "success" | "error";

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [toastData, setToastData] = useState({
    message: "",
    type: "success" as ToastType,
    id: 0,
  });

  const showToast = useCallback((msg: string, type: ToastType = "success") => {
    setToastData({ message: msg, type, id: Date.now() });
    setVisible(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastNotification
        visible={visible}
        message={toastData.message}
        type={toastData.type}
        toastId={toastData.id}
        onDismiss={handleDismiss}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
