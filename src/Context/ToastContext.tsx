import React, { createContext, useContext, useState, useCallback } from "react";
import { ToastNotification } from "@/Components/ToastNotification";

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [toastData, setToastData] = useState({ message: "", id: 0 });

  const showToast = useCallback((msg: string) => {
    setToastData({ message: msg, id: Date.now() });
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
