import { Tenant } from '@/hooks/useTenantRouter';
import { useTenantTheme } from '@/hooks/useTenantTheme';
import { useAuth } from '@/hooks/useAuth';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { TenantNavLink } from '@/components/tenant/TenantNavLink';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, Bell, MessageSquare, Database, BarChart3, Users, Cog } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

interface TenantChatProps {
  tenant: Tenant;
}

export function TenantChat({ tenant }: TenantChatProps) {
  const config = tenant.tenant_config;
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Aplicar tema do tenant (no container específico)
  useTenantTheme(tenant, '.tenant-page-container');

  const handleSignOut = async () => {
    await signOut();
    navigate(`/${tenant.slug}/auth`);
  };

  const primaryColor = config?.primary_color || '#0A5C3E';

  const navigationLinks = [
    { to: `/${tenant.slug}/chat`, label: 'Assistente', icon: MessageSquare },
    // Adicionar mais links conforme necessário
  ];

  const NavigationContent = () => (
    <>
      {navigationLinks.map((link) => (
        <TenantNavLink key={link.to} to={link.to}>
          <link.icon className="h-4 w-4" />
          <span>{link.label}</span>
        </TenantNavLink>
      ))}
    </>
  );

  return (
    <div className="tenant-page-container h-screen flex flex-col">
      {/* Header Customizado */}
      <header 
        className="border-b backdrop-blur supports-[backdrop-filter]:bg-primary/95"
        style={{ 
          backgroundColor: primaryColor,
          color: 'white'
        }}
      >
        <div className="container flex h-14 items-center justify-between px-4">
          {/* Logo + Nome */}
          <div className="flex items-center gap-3">
            {config?.logo_url && (
              <img 
                src={config.logo_url} 
                alt={tenant.name} 
                className="h-8 object-contain cursor-pointer"
                onClick={() => navigate(`/${tenant.slug}`)}
              />
            )}
            <span className="font-semibold hidden md:inline">{tenant.name}</span>
          </div>
          
          {/* Navegação Desktop */}
          {!isMobile && (
            <nav className="hidden lg:flex items-center gap-1">
              <NavigationContent />
            </nav>
          )}

          {/* Navegação Mobile */}
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-4">
                  <NavigationContent />
                </nav>
              </SheetContent>
            </Sheet>
          )}
          
          {/* Ações */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hidden md:flex">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-white hidden md:flex">
              <Settings className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-white text-primary">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">{user?.user_metadata?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/${tenant.slug}/configuracoes`)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Área principal de chat */}
      <main className="flex-1 overflow-hidden">
        <ChatInterface />
      </main>
    </div>
  );
}
