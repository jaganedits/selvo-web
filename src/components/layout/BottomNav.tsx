import { NavLink } from 'react-router'
import { ROUTES } from '@/config/routes.ts'
import { cn } from '@/lib/utils.ts'
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Plus,
} from 'lucide-react'

const navItems = [
  { to: ROUTES.DASHBOARD, label: 'Home', icon: LayoutDashboard },
  { to: ROUTES.TRANSACTIONS, label: 'Transactions', icon: ArrowLeftRight },
  { to: ROUTES.TRANSACTION_FORM, label: 'Add', icon: Plus, isFab: true },
  { to: ROUTES.REPORTS, label: 'Reports', icon: BarChart3 },
  { to: ROUTES.SETTINGS, label: 'More', icon: Settings },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Frosted glass background */}
      <div className="border-t border-border/30 bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-around px-2 py-1.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === ROUTES.DASHBOARD}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-semibold transition-all duration-200',
                  item.isFab ? '' : isActive
                    ? 'text-brand'
                    : 'text-muted-foreground'
                )
              }
            >
              {item.isFab ? (
                <div className="flex h-12 w-12 -translate-y-4 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_4px_16px_rgba(207,69,0,0.35)] transition-transform duration-200 active:scale-95">
                  <item.icon className="h-5 w-5" />
                </div>
              ) : (
                <>
                  <item.icon className="h-5 w-5" />
                  <span className="tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
