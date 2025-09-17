import { Link } from "react-router-dom";
import { Target, Users, Video, BarChart3 } from "lucide-react";

const actions = [
  {
    title: "Gérer les campagnes",
    description: "Créez et modifiez vos campagnes d'entretien",
    icon: Target,
    href: "/recruiter/campaigns",
    color: "bg-primary/10 text-primary"
  },
  {
    title: "Voir les sessions", 
    description: "Suivez les entretiens en cours",
    icon: Video,
    href: "/recruiter/sessions",
    color: "bg-info/10 text-info"
  },
  {
    title: "Candidats",
    description: "Gérez votre pool de talents",
    icon: Users,
    href: "/recruiter/candidates", 
    color: "bg-success/10 text-success"
  },
  {
    title: "Analytiques",
    description: "Mesures de performance détaillées",
    icon: BarChart3,
    href: "/recruiter/analytics",
    color: "bg-warning/10 text-warning"
  }
];

export function QuickActions() {
  return (
    <section className="space-y-6">
      <h2 className="text-2xl font-semibold text-card-foreground flex items-center gap-3">
        <div className="h-1 w-8 bg-gradient-primary rounded-full" />
        Actions Rapides
      </h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            to={action.href}
            className="glass rounded-xl p-6 shadow-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
          >
            <div className="flex flex-col items-start space-y-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg transition-all duration-300 ${action.color} group-hover:scale-110`}>
                <action.icon className="h-6 w-6" />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-semibold text-card-foreground group-hover:text-gradient">
                  {action.title}
                </h3>
                <p className="text-sm text-foreground-muted">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}