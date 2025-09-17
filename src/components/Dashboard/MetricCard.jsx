import { cn } from "../../lib/utils";

const variantColors = {
  primary: "text-primary bg-primary/10 border-l-primary",
  success: "text-success bg-success/10 border-l-success", 
  warning: "text-warning bg-warning/10 border-l-warning",
  info: "text-info bg-info/10 border-l-info"
};

export function MetricCard({ title, value, icon: Icon, variant = "primary", trend }) {
  return (
    <div className={cn(
      "glass rounded-xl border-l-4 p-6 shadow-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
      variantColors[variant]
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground-muted mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-card-foreground">
            {value}
          </p>
          {trend && (
            <p className="text-xs text-foreground-muted mt-2">
              +{trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-lg",
          variantColors[variant]
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}