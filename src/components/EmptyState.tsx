import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ 
  icon: Icon = Inbox, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-50 text-stone-400">
        <Icon size={32} />
      </div>
      <h3 className="mt-4 text-lg font-bold text-stone-900">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-stone-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
