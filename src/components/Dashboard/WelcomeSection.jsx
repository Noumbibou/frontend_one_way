import { Sparkles } from "lucide-react";

export function WelcomeSection({ userName, firstName }) {
  const displayName = firstName || userName || "Recruteur";
  return (
    <section
      className="relative overflow-hidden rounded-2xl p-8 animate-fade-in-up"
      style={{
        background: "var(--bg-subtle)",
        color: "var(--text-primary)",
        border: "1px solid var(--border-color)",
        backdropFilter: "saturate(120%) blur(10px)",
      }}
    >
      {/* Content */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">Bonjour, {displayName}</h1>
            <Sparkles className="h-8 w-8 animate-float text-yellow-300" />
          </div>
          <div style={{ width: 80, height: 6, borderRadius: 999, background: "var(--gradient-violet)" }} />
          <p className="text-lg max-w-lg" style={{ color: "var(--text-primary)" }}>
            Voici votre aperçu des performances et activités récentes
          </p>
        </div>
      </div>
      {/* Soft glow */}
      <div className="pointer-events-none absolute inset-0"
           style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)" }}
      />
    </section>
  );
}