import {
  ArrowLeftRight,
  ChevronsUpDown,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Sun,
  Tags,
  Wallet,
} from 'lucide-react';
import { NavLink } from 'react-router';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUser } from '@/features/auth/hooks/use-current-user';
import { useLogout } from '@/features/auth/hooks/use-logout';
import { useTheme } from '@/lib/theme';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Transações', to: '/transacoes', icon: ArrowLeftRight },
  { label: 'Categorias', to: '/categorias', icon: Tags },
  { label: 'Ajustes', to: '/ajustes', icon: Settings, disabled: true },
];

export function AppSidebar() {
  const user = useCurrentUser();
  const logout = useLogout();
  const { theme, toggle } = useTheme();
  const initials = user?.email.slice(0, 2).toUpperCase() ?? '?';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-green to-balance text-white">
            <Wallet className="size-4" />
          </div>
          <span className="font-heading font-semibold text-lg tracking-tight group-data-[collapsible=icon]:hidden">
            fintrack
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  {item.disabled ? (
                    <SidebarMenuButton tooltip="Em breve" disabled aria-disabled="true">
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  ) : (
                    <NavLinkMenuButton item={item} />
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  />
                }
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-gradient-to-br from-brand-green to-balance font-medium text-white text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.email ?? 'Usuário'}</span>
                  <span className="truncate text-muted-foreground text-xs">Conta pessoal</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--anchor-width) min-w-56 rounded-lg"
                side="right"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarFallback className="rounded-lg bg-gradient-to-br from-brand-green to-balance font-medium text-white text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{user?.email ?? 'Usuário'}</span>
                        <span className="truncate text-muted-foreground text-xs">
                          Conta pessoal
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggle}>
                  {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  Tema {theme === 'dark' ? 'claro' : 'escuro'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function NavLinkMenuButton({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink to={item.to} end>
      {({ isActive }) => (
        <SidebarMenuButton isActive={isActive} tooltip={item.label}>
          <Icon className="size-4" />
          <span>{item.label}</span>
        </SidebarMenuButton>
      )}
    </NavLink>
  );
}
