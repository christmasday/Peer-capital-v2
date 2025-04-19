"use client"

import { useToast } from "@/hooks/use-toast"
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose } from "@/components/ui/toast"

export function ToastContainer() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map((toast, index) => (
        <Toast key={index} variant={toast.variant}>
          <div className="grid gap-1">
            <ToastTitle>{toast.title}</ToastTitle>
            <ToastDescription>{toast.description}</ToastDescription>
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
