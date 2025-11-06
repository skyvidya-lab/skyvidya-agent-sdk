import { NavLink as RouterNavLink, NavLinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface TenantNavLinkProps extends Omit<NavLinkProps, 'className'> {
  children: React.ReactNode;
  active?: boolean;
}

export function TenantNavLink({ children, active, ...props }: TenantNavLinkProps) {
  return (
    <RouterNavLink
      {...props}
      className={({ isActive }) => cn(
        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        "hover:bg-white/10",
        (isActive || active) && "bg-white/20"
      )}
    >
      {children}
    </RouterNavLink>
  );
}
