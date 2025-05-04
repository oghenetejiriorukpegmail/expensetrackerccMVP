// Type definitions for the expense tracker application

// Trip status enum
export enum TripStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Expense type enum
export enum ExpenseType {
  ACCOMMODATION = 'accommodation',
  TRANSPORTATION = 'transportation',
  MEALS = 'meals',
  ENTERTAINMENT = 'entertainment',
  BUSINESS = 'business',
  OFFICE = 'office',
  OTHER = 'other'
}

// Currency code enum
export enum CurrencyCode {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  CAD = 'CAD',
  AUD = 'AUD',
  JPY = 'JPY',
  CNY = 'CNY',
  INR = 'INR',
  RUB = 'RUB',
  BRL = 'BRL',
  MXN = 'MXN',
  ZAR = 'ZAR'
}

// User profile interface
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// User settings interface
export interface UserSettings {
  user_id: string;
  default_currency: CurrencyCode;
  mileage_rate: number;
  excel_template_url?: string;
  default_expense_type: ExpenseType;
  created_at: string;
  updated_at: string;
}

// Trip interface
export interface Trip {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: TripStatus;
  start_date?: string;
  end_date?: string;
  location?: string;
  created_at: string;
  updated_at: string;
}

// Location interface
export interface Location {
  city?: string;
  state?: string;
  country?: string;
}

// Expense interface
export interface Expense {
  id: string;
  trip_id: string;
  user_id: string;
  expense_type: ExpenseType;
  amount: number;
  currency: CurrencyCode;
  vendor?: string;
  location?: string;
  date: string;
  description?: string;
  receipt_url?: string;
  receipt_extracted: boolean;
  created_at: string;
  updated_at: string;
}

// Mileage record interface
export interface MileageRecord {
  id: string;
  trip_id: string;
  user_id: string;
  start_odometer: number;
  end_odometer: number;
  distance: number;
  date: string;
  purpose?: string;
  image_start_url?: string;
  image_end_url?: string;
  created_at: string;
  updated_at: string;
}

// Form validation interfaces
export interface TripForm {
  name: string;
  description?: string;
  status: TripStatus;
  start_date?: string;
  end_date?: string;
  location?: string;
}

export interface ExpenseForm {
  trip_id: string;
  expense_type: ExpenseType;
  amount: number;
  currency: CurrencyCode;
  vendor?: string;
  location?: string;
  date: string;
  description?: string;
  receipt_file?: File;
}

export interface MileageForm {
  trip_id: string;
  start_odometer: number;
  end_odometer: number;
  date: string;
  purpose?: string;
  start_image_file?: File;
  end_image_file?: File;
}

// Dashboard interface for summary data
export interface DashboardSummary {
  totalExpenses: number;
  tripCount: number;
  recentExpenses: Expense[];
  expensesByCategory: {
    category: ExpenseType;
    amount: number;
    count: number;
  }[];
  totalMileage: number;
  mileageCost: number;
}

// Receipt processing interfaces
export interface ProcessedReceipt {
  vendor?: string;
  amount?: number;
  currency?: string;
  date?: string;
  items?: {
    name: string;
    quantity?: number;
    price?: number;
  }[];
  location?: Location;
  expenseType?: string;
  taxAmount?: number;
  total?: number;
  confidence: number;
}

// Export options interface
export interface ExportOptions {
  startDate?: string;
  endDate?: string;
  tripIds?: string[];
  includeReceipts: boolean;
  format: 'excel' | 'csv' | 'pdf';
  template?: string;
}

// API response interfaces
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}