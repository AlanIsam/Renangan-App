import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <main className="flex-1 min-w-0">
          <header className="sticky top-0 z-40 flex h-12 items-center border-b border-border bg-background px-4">
            <SidebarTrigger />
          </header>
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </SidebarProvider>
    </TooltipProvider>
  );
}
