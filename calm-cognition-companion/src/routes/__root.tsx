import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/lib/auth";
import { SettingsProvider } from "@/lib/settings";
import { AlarmProvider } from "@/components/AlarmProvider";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold text-foreground">This page is not here</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Let's take you back to your home screen.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-primary px-8 text-lg font-semibold text-primary-foreground"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-foreground">This page didn't load</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Something went wrong. You can try again or go back home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-primary px-8 text-lg font-semibold text-primary-foreground"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex min-h-14 items-center justify-center rounded-2xl border-2 border-input bg-card px-8 text-lg font-semibold text-foreground"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "AI Cognitia — Calm memory care companion" },
      {
        name: "description",
        content:
          "AI Cognitia helps older adults remember medicines, appointments and daily routines with loud, easy reminders and gentle brain games.",
      },
      { name: "author", content: "AI Cognitia" },
      { name: "theme-color", content: "#2c4a86" },
      { property: "og:title", content: "AI Cognitia — Calm memory care companion" },
      {
        property: "og:description",
        content:
          "Loud reminders, brain games and a friendly assistant, designed for people living with memory loss.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Nunito:wght@600;700;800&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <AuthProvider>
          <AlarmProvider>
            {/* Required: nested routes render here. */}
            <Outlet />
            <Toaster />
          </AlarmProvider>
        </AuthProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}
