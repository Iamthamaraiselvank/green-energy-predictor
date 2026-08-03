import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/analytics", label: "Analytics" },
  { to: "/model", label: "Model" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 glass border-x-0 border-t-0 rounded-none">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span
            className="flex size-9 items-center justify-center rounded-xl"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Leaf className="size-5 text-primary-foreground" />
          </span>
          <span className="text-base font-semibold tracking-tight">EcoPower</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium bg-secondary/60" }}
            >
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
