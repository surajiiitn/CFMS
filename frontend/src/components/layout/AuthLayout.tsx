import type { ReactNode } from "react";
import { GraduationCap, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { ConnectionBadge } from "@/components/layout/ConnectionBadge";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

const highlights = [
  {
    icon: Workflow,
    title: "One workspace",
    description: "Jobs, proposals, chat, and submissions in one timeline.",
  },
  {
    icon: ShieldCheck,
    title: "Verified campus users",
    description: "OTP onboarding keeps freelancing trusted and student-first.",
  },
  {
    icon: Sparkles,
    title: "Faster delivery",
    description: "Post quick tasks and move from brief to completion without friction.",
  },
] as const;

export const AuthLayout = ({ title, subtitle, children, footer }: AuthLayoutProps) => {
  return (
    <div className="relative min-h-screen overflow-hidden app-shell-bg">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <ConnectionBadge />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-10">
        <aside className="relative hidden flex-1 overflow-hidden rounded-3xl border border-primary/15 bg-primary text-primary-foreground shadow-2xl lg:flex lg:flex-col lg:justify-between lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.18)_0,transparent_44%),radial-gradient(circle_at_78%_78%,rgba(255,145,77,0.36)_0,transparent_48%)]" />
          <div className="relative">
            <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h1 className="display-font text-4xl font-bold leading-tight">Campus Freelance Management</h1>
            <p className="mt-4 max-w-md text-sm text-primary-foreground/80">
              Freelancers and posters collaborate in a single, real-time system built for campus work.
            </p>
          </div>

          <div className="relative space-y-4">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                  <item.icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs text-primary-foreground/75">{item.description}</p>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex flex-1 items-center justify-center lg:px-10">
          <div className="glass-panel w-full max-w-md rounded-3xl border border-border/60 p-7 shadow-xl sm:p-9">
            <div className="mb-7">
              <h2 className="display-font text-3xl font-bold text-foreground">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            </div>

            {children}

            {footer ? <div className="mt-6 text-sm text-muted-foreground">{footer}</div> : null}
          </div>
        </main>
      </div>
    </div>
  );
};
