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
  { title: "Tenants", url: "/tenants", icon: Building2 },
  { title: "Agentes", url: "/agents", icon: Bot },
  { title: "Chat", url: "/chat", icon: MessageSquare },
  { title: "Qualidade", url: "/quality", icon: FlaskConical },
  { title: "Benchmarks", url: "/benchmarks", icon: Target },
  { title: "Logs", url: "/logs", icon: Activity },
  { title: "Plataforma", url: "/platform-settings", icon: Palette },
  { title: "Configurações", url: "/settings", icon: Settings },
];

export function AppSidebar({ currentTenant }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isCollapsed = state === "collapsed";

  const getNavCls = (url: string) =>
    location.pathname === url ? "bg-accent text-accent-foreground" : "hover:bg-accent/50";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b p-4">
        {!isCollapsed && (
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
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
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

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
