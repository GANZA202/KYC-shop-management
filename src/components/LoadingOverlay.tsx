import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      <p className="mt-4 text-sm font-medium text-stone-600">{message}</p>
    </div>
  );
}
