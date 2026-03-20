import type { CategoryDef } from '@/types/category.ts'

export const PAYMENT_MODES = ['UPI', 'Card', 'Cash', 'Net Banking', 'Other'] as const

export const DEFAULT_EXPENSE_CATEGORIES: CategoryDef[] = [
  { name: 'Food & Dining', icon: 'UtensilsCrossed', color: '#E74C3C' },
  { name: 'Transport', icon: 'Bus', color: '#3498DB' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#9B59B6' },
  { name: 'Bills', icon: 'Receipt', color: '#F39C12' },
  { name: 'Entertainment', icon: 'Clapperboard', color: '#E91E63' },
  { name: 'Health', icon: 'Heart', color: '#2ECC71' },
  { name: 'Education', icon: 'GraduationCap', color: '#00BCD4' },
  { name: 'Other', icon: 'MoreHorizontal', color: '#95A5A6' },
]

export const DEFAULT_INCOME_CATEGORIES: CategoryDef[] = [
  { name: 'Salary', icon: 'Landmark', color: '#2ECC71' },
  { name: 'Freelance', icon: 'Laptop', color: '#3498DB' },
  { name: 'Business', icon: 'Store', color: '#F39C12' },
  { name: 'Investment', icon: 'TrendingUp', color: '#9B59B6' },
  { name: 'Gift', icon: 'Gift', color: '#E91E63' },
  { name: 'Other', icon: 'MoreHorizontal', color: '#95A5A6' },
]

export const DEFAULT_CATEGORY_MAP: Record<string, { icon: string; color: string }> = Object.fromEntries(
  [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES].map(c => [
    c.name,
    { icon: c.icon, color: c.color },
  ])
)

export const COLORS = {
  orange: '#CF4500',
  orangeLight: '#FF6B2C',
  orangeDark: '#A83800',
  charcoal: '#323231',
  charcoalLight: '#4A4A49',
  charcoalDark: '#1A1A1A',
  income: '#2ECC71',
  expense: '#CF4500',
  budget: '#3498DB',
  surfaceLight: '#F8F8F8',
  cardLight: '#FFFFFF',
  surfaceDark: '#1E1E1E',
  cardDark: '#2A2A2A',
} as const

export const CHART_PALETTE = [
  '#CF4500', '#323231', '#8E8E8D', '#2ECC71', '#3498DB', '#F39C12',
]

export const SPLITWISE_CATEGORY_MAP: Record<string, string> = {
  food: 'Food & Dining',
  dining: 'Food & Dining',
  restaurant: 'Food & Dining',
  groceries: 'Food & Dining',
  transport: 'Transport',
  taxi: 'Transport',
  car: 'Transport',
  parking: 'Transport',
  entertainment: 'Entertainment',
  movie: 'Entertainment',
  game: 'Entertainment',
  shopping: 'Shopping',
  clothing: 'Shopping',
  rent: 'Housing',
  house: 'Housing',
  utilities: 'Housing',
  health: 'Health',
  medical: 'Health',
  education: 'Education',
  book: 'Education',
  travel: 'Travel',
  hotel: 'Travel',
}
