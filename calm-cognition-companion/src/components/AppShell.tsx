import { BottomNav } from "@/components/BottomNav";

export function AppShell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen surface-calm pb-32">
      <header className="mx-auto flex max-w-lg items-start justify-between gap-4 px-5 pt-8 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          {subtitle ? <p className="mt-1 text-lg text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <main className="mx-auto max-w-lg px-5 animate-soft-rise">{children}</main>
      <BottomNav />
    </div>
  );
}

export function Panel({
  children,
  className = "",
  as: Tag = "section",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article";
}) {
  return (
    <Tag
      className={`rounded-3xl border-2 border-border bg-card p-5 shadow-card ${className}`}
    >
      {children}
    </Tag>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <Panel className="flex flex-col items-center gap-3 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary">
        {icon}
      </div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-lg text-muted-foreground">{message}</p>
      {action}
    </Panel>
  );
}
