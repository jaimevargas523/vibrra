import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-text-muted opacity-50" style={{ fontSize: 64 }}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-text-secondary mt-4">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-text-muted mt-2 max-w-sm text-center leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button variant="secondary" size="md" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
}
