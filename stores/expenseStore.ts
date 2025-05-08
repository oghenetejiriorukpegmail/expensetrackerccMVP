import { defineStore } from 'pinia';
import { Expense, ExpenseType, CurrencyCode } from '~/types';
import { useSupabaseClient } from '#imports';
import { uploadFile } from '~/utils/supabase';
import { processReceiptWithAI, generateReceiptDescription } from '~/utils/ai-processing';

/**
 * Helper function to normalize currency codes extracted from receipts
 * @param currencyStr The currency string to normalize
 * @returns Normalized currency code matching the CurrencyCode enum
 */
function normalizeCurrencyCode(currencyStr: string): string {
  if (!currencyStr) return 'USD';
  
  // Remove any non-alphanumeric characters
  const cleaned = currencyStr.trim().toUpperCase();
  
  // Handle specific special cases
  if (cleaned === 'CA$' || cleaned === 'CAD$' || cleaned === 'C$') {
    return 'CAD';
  }
  if (cleaned === 'US$' || cleaned === 'USD$' || cleaned === '$') {
    return 'USD';
  }
  if (cleaned === '€' || cleaned === 'EURO') {
    return 'EUR';
  }
  if (cleaned === '£' || cleaned === 'GBP£') {
    return 'GBP';
  }
  if (cleaned === 'AU$' || cleaned === 'AUD$') {
    return 'AUD';
  }
  if (cleaned === '¥') {
    return 'JPY'; // Could be CNY too, but JPY more common
  }
  
  // If the code is 3 letters, assume it's a valid currency code
  if (/^[A-Z]{3}$/.test(cleaned)) {
    return cleaned;
  }
  
  // Default to USD if no match
  return 'USD';
}

export const useExpenseStore = defineStore('expense', {
  state: () => ({
    expenses: [] as Expense[],
    currentExpense: null as Expense | null,
    tripExpenses: [] as Expense[],
    loading: false,
    error: null as string | null,
    
    // AI processing state
    processingReceipt: false,
    aiProcessingError: null as string | null,
    
    // Async description state
    generatedDescription: null as string | null,
    lastDescriptionTimestamp: null as Date | null,
  }),
  
  getters: {
    // Get expense by ID
    getExpenseById: (state) => (id: string) => {
      return state.expenses.find(expense => expense.id === id);
    },
    
    // Filter expenses by type
    expensesByType: (state) => (type: ExpenseType) => {
      return state.expenses.filter(expense => expense.expense_type === type);
    },
    
    // Filter expenses by trip
    expensesByTrip: (state) => (tripId: string) => {
      // If the tripId matches the current tripExpenses, use that directly
      if (state.tripExpenses.length > 0 && state.tripExpenses[0].trip_id === tripId) {
        return state.tripExpenses;
      } else {
        // Otherwise filter from all expenses
        return state.expenses.filter(expense => expense.trip_id === tripId);
      }
    },
    
    // Calculate total expense amount
    totalAmount: (state) => {
      return state.expenses.reduce((total, expense) => {
        // TODO: Handle currency conversion properly
        // For now, simple sum regardless of currency
        return total + expense.amount;
      }, 0);
    },
    
    // Calculate total for a specific trip
    tripTotalAmount: (state) => (tripId: string) => {
      // If the tripId matches the current tripExpenses, use that directly
      if (state.tripExpenses.length > 0 && state.tripExpenses[0].trip_id === tripId) {
        return state.tripExpenses.reduce((total, expense) => {
          return total + expense.amount;
        }, 0);
      } else {
        // Otherwise filter from all expenses
        return state.expenses
          .filter(expense => expense.trip_id === tripId)
          .reduce((total, expense) => {
            return total + expense.amount;
          }, 0);
      }
    },
    
    // Group expenses by date
    expensesByDate: (state) => {
      const grouped = state.expenses.reduce((acc, expense) => {
        const date = expense.date.split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(expense);
        return acc;
      }, {} as Record<string, Expense[]>);
      
      // Sort dates in descending order (newest first)
      return Object.keys(grouped)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .reduce((acc, date) => {
          acc[date] = grouped[date];
          return acc;
        }, {} as Record<string, Expense[]>);
    },
    
    // Group trip expenses by date
    tripExpensesByDate: (state) => {
      const grouped = state.tripExpenses.reduce((acc, expense) => {
        const date = expense.date.split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(expense);
        return acc;
      }, {} as Record<string, Expense[]>);
      
      // Sort dates in descending order (newest first)
      return Object.keys(grouped)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        .reduce((acc, date) => {
          acc[date] = grouped[date];
          return acc;
        }, {} as Record<string, Expense[]>);
    },
    
    // Get expenses sorted by date (newest first)
    sortedExpenses: (state) => {
      return [...state.expenses].sort((a, b) => {
        // Convert dates to timestamps for comparison
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA; // Sort in descending order (newest first)
      });
    }
  },
  
  actions: {
    // Fetch all expenses for the current user
    async fetchExpenses() {
      this.loading = true;
      this.error = null;
      
      try {
        const supabase = useSupabaseClient();
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .order('date', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        this.expenses = data as Expense[];
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch expenses';
        console.error('Error fetching expenses:', error);
      } finally {
        this.loading = false;
      }
    },
    
    // Fetch expenses for a specific trip
    async fetchTripExpenses(tripId: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const supabase = useSupabaseClient();
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('trip_id', tripId)
          .order('date', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        this.tripExpenses = data as Expense[];
        return this.tripExpenses;
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch trip expenses';
        console.error('Error fetching trip expenses:', error);
        return [];
      } finally {
        this.loading = false;
      }
    },
    
    // Fetch a single expense by ID
    async fetchExpense(id: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const supabase = useSupabaseClient();
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        this.currentExpense = data as Expense;
        return this.currentExpense;
      } catch (error: any) {
        this.error = error.message || 'Failed to fetch expense';
        console.error('Error fetching expense:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    // Create a new expense
    async createExpense(expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>, receiptFile?: File) {
      this.loading = true;
      this.error = null;
      
      try {
        let receiptUrl = expense.receipt_url;
        
        // Get the supabase client
        const supabase = useSupabaseClient();
        
        // Get the current user directly - middleware should ensure we're authenticated
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error fetching user:', userError);
          throw new Error('Failed to authenticate user. Please login again.');
        }
        
        if (!userData || !userData.user) {
          console.error('No authenticated user found');
          throw new Error('No authenticated user found. Please login again.');
        }
        
        const user = userData.user;
        console.log('Creating expense as user:', user.id);
        
        // Upload receipt file if provided
        if (receiptFile) {
          try {
            console.log('Starting receipt file upload');
            // Pass the supabase client to ensure we use the same authenticated session
            receiptUrl = await uploadFile(receiptFile, `expenses/${expense.trip_id}`, 'receipts', supabase);
            
            if (!receiptUrl) {
              console.warn('Receipt upload failed, continuing without receipt');
              // Continue without receipt instead of throwing error
            } else {
              console.log('Receipt uploaded successfully:', receiptUrl);
            }
          } catch (uploadError) {
            console.error('Receipt upload error:', uploadError);
            console.warn('Continuing expense creation without receipt');
            // Continue without receipt instead of throwing error
          }
        }
        
        // Add the user_id to the expense data
        const expenseWithUserId = {
          ...expense,
          user_id: user.id,
          receipt_url: receiptUrl
        };
        
        console.log('Creating expense with data:', expenseWithUserId);
        
        const { data, error } = await supabase
          .from('expenses')
          .insert(expenseWithUserId)
          .select()
          .single();
        
        if (error) {
          console.error('Error inserting expense:', error);
          throw error;
        }
        
        const newExpense = data as Expense;
        this.expenses.push(newExpense);
        this.tripExpenses.push(newExpense);
        return newExpense;
      } catch (error: any) {
        this.error = error.message || 'Failed to create expense';
        console.error('Error creating expense:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    // Update an existing expense
    async updateExpense(id: string, updates: Partial<Expense>, receiptFile?: File) {
      this.loading = true;
      this.error = null;
      
      try {
        let receiptUrl = updates.receipt_url;
        
        // Upload receipt file if provided
        if (receiptFile) {
          const expense = this.getExpenseById(id);
          if (!expense) {
            throw new Error('Expense not found');
          }
          
          receiptUrl = await uploadFile(receiptFile, `expenses/${expense.trip_id}`, 'receipts');
          
          if (!receiptUrl) {
            throw new Error('Failed to upload receipt');
          }
          
          updates.receipt_url = receiptUrl;
        }
        
        const supabase = useSupabaseClient();
        const { data, error } = await supabase
          .from('expenses')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        const updatedExpense = data as Expense;
        
        // Update the expense in the local state
        const index = this.expenses.findIndex(expense => expense.id === id);
        if (index !== -1) {
          this.expenses[index] = updatedExpense;
        }
        
        const tripIndex = this.tripExpenses.findIndex(expense => expense.id === id);
        if (tripIndex !== -1) {
          this.tripExpenses[tripIndex] = updatedExpense;
        }
        
        if (this.currentExpense?.id === id) {
          this.currentExpense = updatedExpense;
        }
        
        return updatedExpense;
      } catch (error: any) {
        this.error = error.message || 'Failed to update expense';
        console.error('Error updating expense:', error);
        return null;
      } finally {
        this.loading = false;
      }
    },
    
    // Delete an expense
    async deleteExpense(id: string) {
      this.loading = true;
      this.error = null;
      
      try {
        const supabase = useSupabaseClient();
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        // Remove the expense from the local state
        this.expenses = this.expenses.filter(expense => expense.id !== id);
        this.tripExpenses = this.tripExpenses.filter(expense => expense.id !== id);
        
        if (this.currentExpense?.id === id) {
          this.currentExpense = null;
        }
        
        return true;
      } catch (error: any) {
        this.error = error.message || 'Failed to delete expense';
        console.error('Error deleting expense:', error);
        return false;
      } finally {
        this.loading = false;
      }
    },
    
    // Process receipt with AI to extract expense data
    async processReceipt(receiptFile: File) {
      this.processingReceipt = true;
      this.aiProcessingError = null;
      
      try {
        // Convert file to base64 with proper format
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Pass the full data URL including mime type information
            // Document AI will correctly extract the base64 content and detect the image type
            resolve(result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(receiptFile);
        });
        
        // Process with AI
        const extractedData = await processReceiptWithAI(base64);
        
        // Normalize and extract data
        const amount = extractedData.amount ? parseFloat(extractedData.amount) : null;
        
        // Handle currency
        const currency = extractedData.currency ? 
          normalizeCurrencyCode(extractedData.currency) : 
          'USD';
        
        // Handle location - convert object to string if needed
        let location = '';
        if (extractedData.location) {
          if (typeof extractedData.location === 'object') {
            // Format as "City, State, Country" - skip empty parts
            const locationParts = [];
            const locationObj = extractedData.location as {city?: string, state?: string, country?: string};
            
            if (locationObj.city) locationParts.push(locationObj.city);
            if (locationObj.state) locationParts.push(locationObj.state);
            if (locationObj.country && locationObj.country !== 'US') locationParts.push(locationObj.country);
            
            location = locationParts.join(', ');
          } else {
            location = extractedData.location as string;
          }
        }
        
        // Try to detect expense type
        let expenseType = ExpenseType.OTHER;
        
        // Try to detect expense type from vendor or description
        const vendorLower = (extractedData.vendor || '').toLowerCase();
        const descLower = (extractedData.description || '').toLowerCase();
        
        if (vendorLower.includes('hotel') || 
            vendorLower.includes('inn') || 
            vendorLower.includes('resort') ||
            descLower.includes('accommodation') ||
            descLower.includes('lodging')) {
          expenseType = ExpenseType.ACCOMMODATION;
        } else if (vendorLower.includes('airline') || 
                  vendorLower.includes('air') || 
                  vendorLower.includes('train') ||
                  vendorLower.includes('taxi') ||
                  vendorLower.includes('uber') ||
                  vendorLower.includes('lyft') ||
                  descLower.includes('transport')) {
          expenseType = ExpenseType.TRANSPORTATION;
        } else if (vendorLower.includes('restaurant') || 
                  vendorLower.includes('café') || 
                  vendorLower.includes('cafe') ||
                  vendorLower.includes('bar') ||
                  vendorLower.includes('diner') ||
                  vendorLower.includes('grill') ||
                  descLower.includes('food') ||
                  descLower.includes('meal')) {
          expenseType = ExpenseType.MEALS;
        }
        
        // Generate a description for the receipt using AI
        let description = null;
        try {
          // First check if a description was already generated by the server
          if (extractedData.description) {
            console.log('Using server-generated description:', extractedData.description);
            description = extractedData.description;
          } else {
            console.log('Generating receipt description...');
            description = await generateReceiptDescription(extractedData);
            console.log('Generated description:', description);
          }
        } catch (descError) {
          console.warn('Failed to generate receipt description:', descError);
          // Continue without description
        }
        
        // Prepare the result object with debugging for the description
        console.log('Before creating result - description value:', description);
        
        const result = {
          vendor: extractedData.vendor || '',
          amount: amount || 0,
          currency: currency,
          date: extractedData.date ? new Date(extractedData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          location: location,
          expense_type: expenseType,
          description: description || '',
          confidence: extractedData.confidence
        };
        
        console.log('Final result object with description:', JSON.stringify(result));
        return result;
      } catch (error: any) {
        this.aiProcessingError = error.message || 'Failed to process receipt';
        console.error('AI processing error:', error);
        return null;
      } finally {
        this.processingReceipt = false;
      }
    },
    
    // Set generated description for a receipt
    setGeneratedDescription(description: string) {
      this.generatedDescription = description;
      this.lastDescriptionTimestamp = new Date();
    },
    
    // Clear state
    clearState() {
      this.expenses = [];
      this.currentExpense = null;
      this.tripExpenses = [];
      this.error = null;
      this.loading = false;
      this.generatedDescription = null;
      this.lastDescriptionTimestamp = null;
    }
  }
});