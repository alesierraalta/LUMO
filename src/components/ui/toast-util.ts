"use client";

import { ReactNode } from "react";

export interface ToastProps {
  title?: ReactNode;
  description?: ReactNode;
  variant?: "default" | "destructive" | "success";
  duration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export type ToastActionElement = React.ReactElement;

// Simple toast implementation (in a real app, use a proper toast library)
export function toast(options: ToastProps) {
  const { title, description, variant = "default", duration = 3000 } = options;
  
  // Create toast element
  const toastEl = document.createElement("div");
  toastEl.className = `fixed bottom-4 right-4 p-4 rounded-md shadow-md z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 ${
    variant === "destructive" 
      ? "bg-destructive text-destructive-foreground" 
      : variant === "success"
      ? "bg-green-600 text-white"
      : "bg-background border"
  }`;
  
  // Create toast content
  toastEl.innerHTML = `
    <div class="flex flex-col gap-1">
      <h3 class="font-semibold">${title}</h3>
      ${description ? `<p class="text-sm opacity-90">${description}</p>` : ''}
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(toastEl);
  
  // Remove after duration
  setTimeout(() => {
    toastEl.classList.add("animate-out", "fade-out", "slide-out-to-right-5");
    setTimeout(() => {
      document.body.removeChild(toastEl);
    }, 300); // Animation duration
  }, duration);
} 