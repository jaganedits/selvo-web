import { NavLink, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button.tsx'
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
  SidebarSeparator,
} from '@/components/ui/sidebar.tsx'
import { ROUTES } from '@/config/routes.ts'
import { signOut } from '@/services/auth.service.ts'
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Repeat,
  Tags,
  BarChart3,
  Split,
  Settings,
  LogOut,
  Plus,
} from 'lucide-react'

const mainNav = [
  { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { to: ROUTES.TRANSACTIONS, label: 'Transactions', icon: ArrowLeftRight },
  { to: ROUTES.BUDGETS, label: 'Budgets', icon: PiggyBank },
  { to: ROUTES.RECURRING, label: 'Recurring', icon: Repeat },
]

const toolsNav = [
  { to: ROUTES.CATEGORIES, label: 'Categories', icon: Tags },
  { to: ROUTES.REPORTS, label: 'Reports', icon: BarChart3 },
  { to: ROUTES.SPLITWISE, label: 'Splitwise', icon: Split },
]

export function AppSidebar() {
  const navigate = useNavigate()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2.5 px-1 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand shadow-sm">
            <span className="font-heading text-sm font-extrabold text-white">S</span>
          </div>
          <div className="leading-none">
            <span className="font-heading text-sm font-bold tracking-tight">Selvo</span>
            <p className="text-[10px] font-medium text-muted-foreground">Finance</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <div className="px-3 py-2">
        <Button
          size="sm"
          className="h-8 w-full rounded-lg bg-brand text-xs font-semibold hover:bg-brand-light"
          onClick={() => navigate(ROUTES.TRANSACTION_FORM)}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          New Transaction
        </Button>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map(item => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton render={<NavLink to={item.to} end={item.to === ROUTES.DASHBOARD} />} tooltip={item.label}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsNav.map(item => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton render={<NavLink to={item.to} />} tooltip={item.label}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<NavLink to={ROUTES.SETTINGS} />} tooltip="Settings">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} tooltip="Sign out">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
