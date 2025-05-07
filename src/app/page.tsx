import Image from "next/image";
import Link from "next/link";
import { BarChart3, ClipboardList, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const navigationCards = [
    {
      title: "Dashboard",
      description: "View inventory summary and stats",
      href: "/dashboard",
      icon: <BarChart3 className="h-6 w-6" />,
      color: "from-primary/20 to-primary/10 hover:from-primary/30 hover:to-primary/20 border-primary/20"
    },
    {
      title: "Inventory",
      description: "Manage products and track stock levels",
      href: "/inventory",
      icon: <ClipboardList className="h-6 w-6" />,
      color: "from-secondary/30 to-muted/30 hover:from-secondary/40 hover:to-muted/40 border-secondary/20"
    },
    {
      title: "Configuración",
      description: "Personaliza la configuración del sistema",
      href: "/settings",
      icon: <Settings className="h-6 w-6" />,
      color: "from-slate-500/20 to-slate-400/10 hover:from-slate-500/30 hover:to-slate-400/20 border-slate-500/20"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow container max-w-7xl mx-auto px-4 py-8 lg:px-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="relative w-full flex justify-center mb-6">
              <Image
                className="dark:invert transition-transform duration-700 hover:scale-105"
                src="/next.svg"
                alt="Next.js logo"
                width={180}
                height={38}
                priority
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Inventory Management System</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A modern solution for tracking products, managing inventory, and optimizing your stock levels
            </p>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {navigationCards.map((card) => (
              <Link 
                key={card.title}
                href={card.href}
                className={cn(
                  "group flex flex-col items-center justify-center p-6 rounded-lg transition-all duration-300",
                  "border shadow-sm bg-gradient-to-br text-foreground", 
                  "transform hover:-translate-y-1 hover:shadow-md",
                  card.color
                )}
              >
                <div className="mb-3 text-primary transition-transform duration-300 group-hover:scale-110">
                  {card.icon}
                </div>
                <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
                <p className="text-center text-sm text-muted-foreground">{card.description}</p>
              </Link>
            ))}
          </div>

          {/* Features Section */}
          <div className="bg-card rounded-lg border p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Real-time inventory tracking and management</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Detailed product and category management</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                  <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Automated low stock alerts and notifications</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="border-t py-6">
        <div className="container max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Inventory Management System &copy; {new Date().getFullYear()}
          </div>
          <div className="flex gap-4">
            <a
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/globe.svg"
                alt="Globe icon"
                width={16}
                height={16}
              />
              nextjs.org
            </a>
            <a
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/vercel.svg"
                alt="Vercel logo"
                width={16}
                height={16}
              />
              Vercel
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
