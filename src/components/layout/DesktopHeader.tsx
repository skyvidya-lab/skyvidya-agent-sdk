import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function DesktopHeader() {
  const isMobile = useIsMobile();

  if (isMobile) return null;

  return (
    <header className="fixed top-0 left-0 md:left-[var(--sidebar-width)] right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 flex items-center px-4">
      <SidebarTrigger />
    </header>
  );
}
