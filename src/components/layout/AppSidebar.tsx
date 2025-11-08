import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Building2, Bot, MessageSquare, Settings, LogOut, Activity, FlaskConical, Target, Palette } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { TenantSwitcher } from "./TenantSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppSidebarProps {
  currentTenant?: any;
}

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Workspaces", url: "/tenants", icon: Building2 },
  { title: "Agentes", url: "/agents", icon: Bot },
  { title: "Playground", url: "/playground", icon: MessageSquare },
  { title: "Qualidade", url: "/quality", icon: FlaskConical },
  { title: "Benchmarks", url: "/benchmarks", icon: Target },
  { title: "Logs", url: "/logs", icon: Activity },
  { title: "Plataforma", url: "/platform-settings", icon: Palette },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar({ currentTenant }: AppSidebarProps) {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isCollapsed = state === "collapsed";
  
  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setOpenMobile?.(false);
    }
  };

  const getNavCls = (url: string) =>
    location.pathname === url ? "bg-accent text-accent-foreground" : "hover:bg-accent/50";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      {!isCollapsed && (
        <SidebarHeader className="border-b p-4">
          <div className="space-y-3">
            {currentTenant?.logo_url && (
              <div className="flex justify-center pb-2">
                <img 
                  src={currentTenant.logo_url} 
                  alt={currentTenant.name} 
                  className="h-10 w-auto object-contain"
                />
              </div>
            )}
            <TenantSwitcher />
          </div>
        </SidebarHeader>
      )}

      <SidebarContent className="overflow-y-auto overflow-x-hidden">
        <SidebarGroup className={isCollapsed ? "p-0" : ""}>
          {!isCollapsed && <SidebarGroupLabel>Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavCls(item.url)}
                      onClick={handleNavClick}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={isCollapsed ? "border-t p-2" : "border-t p-4"}>
        <div className={`flex items-center gap-2 ${isCollapsed ? "justify-center" : ""}`}>
          <Avatar className="h-8 w-8">
            <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
