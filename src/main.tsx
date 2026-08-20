import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { GuestViewProvider } from "@/hooks/use-guest-view";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";
import "./index.css";

// Lazy load route components for better code splitting
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const RulesPage = lazy(() => import("./pages/RulesPage.tsx"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage.tsx"));
const SearchPage = lazy(() => import("./pages/SearchPage.tsx"));
const ManagePage = lazy(() => import("./pages/ManagePage.tsx"));
const BackupPage = lazy(() => import("./pages/BackupPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in WebContainer environment). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[WebContainer preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);



function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexProvider client={convex}>
      <BrowserRouter>
        <RouteSyncer />
        <GuestViewProvider>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/" element={<Navigate to="/rules" replace />} />
            <Route
              path="/auth"
              element={<AuthPage redirectAfterAuth="/manage" />}
            />
            {/* หน้าเปิดเว็บ: กฎทั้งหมด (อ่านได้โดยไม่ต้องเข้าสู่ระบบ) */}
            <Route
              path="/rules"
              element={
                <AppShell>
                  <RulesPage />
                </AppShell>
              }
            />
            <Route
              path="/search"
              element={
                <AppShell>
                  <SearchPage />
                </AppShell>
              }
            />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <AppShell>
                    <Dashboard />
                  </AppShell>
                </RequireAuth>
              }
            />
            <Route
              path="/categories"
              element={
                <RequireAuth>
                  <AppShell>
                    <CategoriesPage />
                  </AppShell>
                </RequireAuth>
              }
            />
            <Route
              path="/manage"
              element={
                <RequireAuth>
                  <AppShell>
                    <ManagePage />
                  </AppShell>
                </RequireAuth>
              }
            />
            <Route
              path="/backup"
              element={
                <RequireAuth>
                  <AppShell>
                    <BackupPage />
                  </AppShell>
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </GuestViewProvider>
      </BrowserRouter>
      </ConvexProvider>
      <Toaster />
    </RootErrorBoundary>
  </StrictMode>,
);
