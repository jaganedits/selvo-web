import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { ThemeProvider } from '@/contexts/theme-context.tsx'
import { AuthProvider } from '@/contexts/auth-context.tsx'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute.tsx'
import { AppShell } from '@/components/layout/AppShell.tsx'
import { ROUTES } from '@/config/routes.ts'
import LoginPage from '@/pages/auth/LoginPage.tsx'
import RegisterPage from '@/pages/auth/RegisterPage.tsx'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage.tsx'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage.tsx'
import OnboardingPage from '@/pages/onboarding/OnboardingPage.tsx'
import DashboardPage from '@/pages/dashboard/DashboardPage.tsx'
import TransactionsPage from '@/pages/transactions/TransactionsPage.tsx'
import TransactionFormPage from '@/pages/transactions/TransactionFormPage.tsx'
import BudgetsPage from '@/pages/budgets/BudgetsPage.tsx'
import RecurringPage from '@/pages/recurring/RecurringPage.tsx'
import CategoriesPage from '@/pages/categories/CategoriesPage.tsx'
import ReportsPage from '@/pages/reports/ReportsPage.tsx'
import SplitwisePage from '@/pages/splitwise/SplitwisePage.tsx'
import SettingsPage from '@/pages/settings/SettingsPage.tsx'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
            <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
            <Route path={ROUTES.ONBOARDING} element={<OnboardingPage />} />

            {/* Protected routes with AppShell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path={ROUTES.TRANSACTIONS} element={<TransactionsPage />} />
              <Route path={ROUTES.TRANSACTION_FORM} element={<TransactionFormPage />} />
              <Route path={ROUTES.BUDGETS} element={<BudgetsPage />} />
              <Route path={ROUTES.RECURRING} element={<RecurringPage />} />
              <Route path={ROUTES.CATEGORIES} element={<CategoriesPage />} />
              <Route path={ROUTES.REPORTS} element={<ReportsPage />} />
              <Route path={ROUTES.SPLITWISE} element={<SplitwisePage />} />
              <Route path={ROUTES.SETTINGS} element={<SettingsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
