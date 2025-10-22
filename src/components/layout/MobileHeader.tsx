import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileHeaderProps {
  currentTenant?: any;
}

export function MobileHeader({ currentTenant }: MobileHeaderProps) {
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  return (
    <header className="fixed top-0 left-0 right-0 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 flex items-center px-4 gap-3">
      <SidebarTrigger />
      {currentTenant?.logo_url && (
        <img 
          src={currentTenant.logo_url} 
          alt={currentTenant.name} 
          className="h-8 w-auto object-contain"
        />
      )}
    </header>
  );
}
