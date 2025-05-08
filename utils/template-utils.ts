/**
 * Utility functions for template analysis and variable mapping
 */

import { Expense, MileageRecord, Trip, UserSettings } from '~/types';

/**
 * Interface for template analysis results
 */
export interface TemplateAnalysis {
  variables: TemplateVariable[];
  worksheets: WorksheetAnalysis[];
  detectedDataTypes: Record<string, string>;
  hasHeaderRow: boolean;
  hasSummarySection: boolean;
  hasExpenseTable: boolean;
  hasMileageTable: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
}

/**
 * Interface for template variable
 */
export interface TemplateVariable {
  name: string;
  occurrences: number;
  locations: string[];
}

/**
 * Interface for worksheet analysis
 */
export interface WorksheetAnalysis {
  name: string;
  rowCount: number;
  colCount: number;
  variables: string[];
  tableSections: TableSection[];
  staticSections: StaticSection[];
}

/**
 * Interface for table section in worksheet
 */
export interface TableSection {
  type: 'table';
  startRow: number;
  endRow: number;
  headers: { column: number; text: string }[];
  variablesInTable: string[];
}

/**
 * Interface for static section in worksheet
 */
export interface StaticSection {
  type: 'static';
  startRow: number;
  endRow: number;
  title?: string;
  variables: string[];
}

/**
 * Interface for AI-generated schema
 */
export interface TemplateSchema {
  requiredFields: string[];
  dynamicContent: string[];
  dataStructure: {
    tables: string[];
    dynamicTables: string[];
    singleValues: string[];
  };
}

/**
 * Analyzes a template URL and returns the analysis and schema
 * @param templateUrl URL of the Excel template
 * @returns Template analysis and schema
 */
export async function analyzeTemplate(templateUrl: string): Promise<{ analysis: TemplateAnalysis; schema: TemplateSchema }> {
  try {
    // Call the template-analyzer Netlify function
    const response = await fetch('/.netlify/functions/template-analyzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ templateUrl })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze template');
    }
    
    const data = await response.json();
    return {
      analysis: data.analysis as TemplateAnalysis,
      schema: data.schema as TemplateSchema
    };
  } catch (error) {
    console.error('Error analyzing template:', error);
    throw error;
  }
}

/**
 * Maps data from expenses, mileage records, and trips to template variables
 * @param schema Template schema from analysis
 * @param expenses List of expenses
 * @param mileageRecords List of mileage records
 * @param tripData Trip data (if applicable)
 * @param userSettings User settings
 * @returns Mapped variables for the template
 */
export function mapDataToTemplateVariables(
  schema: TemplateSchema,
  expenses: Expense[],
  mileageRecords: MileageRecord[],
  tripData: Trip | null,
  userSettings: UserSettings
): Record<string, any> {
  const variables: Record<string, any> = {};
  
  // Get today's date in various formats
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const dateFormatted = now.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // Format functions for currency and numbers
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2
    }).format(num);
  };
  
  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalMileage = mileageRecords.reduce((sum, record) => sum + record.distance, 0);
  const mileageRate = userSettings.mileage_rate;
  const mileageCost = totalMileage * mileageRate;
  const grandTotal = totalExpenses + mileageCost;
  
  // Count expense types
  const expenseTypeCount: Record<string, number> = {};
  const expenseTypeAmount: Record<string, number> = {};
  
  expenses.forEach(expense => {
    const type = expense.expense_type;
    expenseTypeCount[type] = (expenseTypeCount[type] || 0) + 1;
    expenseTypeAmount[type] = (expenseTypeAmount[type] || 0) + expense.amount;
  });
  
  // Create expense descriptions
  const expenseDescriptions = expenses.map(expense => {
    return {
      id: expense.id,
      description: expense.description || `Expense at ${expense.vendor || 'unknown vendor'}`,
      vendor: expense.vendor || '',
      amount: formatCurrency(expense.amount),
      type: expense.expense_type,
      date: expense.date || ''
    };
  });
  
  // Map report metadata
  const reportTitle = tripData 
    ? `Expense Report: ${tripData.name}`
    : 'Expense Report';
    
  const filename = tripData
    ? `Trip-${tripData.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-Report`
    : 'Expense-Report';
  
  // Build base variables object
  Object.assign(variables, {
    // Date information
    'date': dateStr,
    'date.formatted': dateFormatted,
    'date.year': now.getFullYear().toString(),
    'date.month': (now.getMonth() + 1).toString(),
    'date.day': now.getDate().toString(),
    
    // Report information
    'report.title': reportTitle,
    'report.filename': filename,
    
    // Trip information (if applicable)
    'trip.name': tripData?.name || 'All Expenses',
    'trip.description': tripData?.description || '',
    'trip.location': tripData?.location || '',
    'trip.status': tripData?.status || '',
    'trip.start_date': tripData?.start_date || '',
    'trip.end_date': tripData?.end_date || '',
    
    // Counts and totals
    'expenses.count': expenses.length.toString(),
    'expenses.total': formatNumber(totalExpenses),
    'expenses.total.currency': formatCurrency(totalExpenses),
    
    'mileage.count': mileageRecords.length.toString(),
    'mileage.total.distance': formatNumber(totalMileage),
    'mileage.total.cost': formatCurrency(mileageCost),
    'mileage.rate': mileageRate.toString(),
    
    'grand_total': formatNumber(grandTotal),
    'grand_total.currency': formatCurrency(grandTotal),
  });
  
  // Add expense type counts and totals
  Object.entries(expenseTypeCount).forEach(([type, count]) => {
    variables[`expenses.${type}.count`] = count.toString();
  });
  
  Object.entries(expenseTypeAmount).forEach(([type, amount]) => {
    variables[`expenses.${type}.total`] = formatCurrency(amount);
  });
  
  // Add expense descriptions
  variables['expenses.descriptions'] = expenseDescriptions.map(ed => ed.description).join('; ');
  
  // Add individual expense descriptions with index
  expenseDescriptions.forEach((ed, index) => {
    variables[`expense.${index+1}.description`] = ed.description;
    variables[`expense.${index+1}.vendor`] = ed.vendor;
    variables[`expense.${index+1}.amount`] = ed.amount;
    variables[`expense.${index+1}.type`] = ed.type;
    variables[`expense.${index+1}.date`] = ed.date;
  });
  
  return variables;
}

/**
 * Processes variables in a string using template syntax
 * @param text Text to process
 * @param variables Variable mappings
 * @returns Processed text with variables replaced
 */
export function processVariables(text: string, variables: Record<string, any>): string {
  if (!text || typeof text !== 'string') return text;
  
  // Check if there are variables to process (using mustache-like syntax {{variable}})
  if (!text.includes('{{')) return text;
  
  // Replace variables with their values
  return text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    const trimmedVar = variable.trim();
    // Return the variable value or keep the original syntax if variable not found
    return variables[trimmedVar] !== undefined ? variables[trimmedVar] : match;
  });
}

/**
 * Generates dynamic content for template variables using AI
 * @param schema Template schema 
 * @param expenses List of expenses
 * @param mileageRecords List of mileage records
 * @param tripData Trip data (if applicable)
 * @param variables Already mapped variables
 * @returns Additional dynamically generated content variables
 */
export async function generateDynamicContent(
  schema: TemplateSchema,
  expenses: Expense[],
  mileageRecords: MileageRecord[],
  tripData: Trip | null,
  variables: Record<string, any>
): Promise<Record<string, string>> {
  const dynamicContent: Record<string, string> = {};
  
  // If there are no dynamic content fields, return an empty object
  if (!schema.dynamicContent || schema.dynamicContent.length === 0) {
    return dynamicContent;
  }
  
  try {
    // Call the OpenRouter API directly for dynamic content generation
    const response = await fetch('/.netlify/functions/generate-report-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dynamicFields: schema.dynamicContent,
        expenseData: expenses.map(e => ({
          date: e.date,
          type: e.expense_type,
          vendor: e.vendor,
          description: e.description,
          amount: e.amount,
          location: e.location
        })),
        mileageData: mileageRecords.map(m => ({
          date: m.date,
          distance: m.distance,
          purpose: m.purpose
        })),
        tripData: tripData ? {
          name: tripData.name,
          description: tripData.description,
          status: tripData.status,
          startDate: tripData.start_date,
          endDate: tripData.end_date,
          location: tripData.location
        } : null,
        existingVariables: variables
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate dynamic content');
    }
    
    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error generating dynamic content:', error);
    
    // Provide fallback values for common dynamic fields
    if (schema.dynamicContent.includes('llm.report.summary')) {
      dynamicContent['llm.report.summary'] = tripData 
        ? `This report covers expenses for trip "${tripData.name}" with a total of ${expenses.length} expenses amounting to ${variables['expenses.total.currency']}.`
        : `This report covers all expenses with a total of ${expenses.length} entries amounting to ${variables['expenses.total.currency']}.`;
    }
    
    if (schema.dynamicContent.includes('llm.categories.analysis')) {
      // Find top category
      const topCategory = Object.entries(expenses.reduce((acc: Record<string, number>, expense) => {
        acc[expense.expense_type] = (acc[expense.expense_type] || 0) + expense.amount;
        return acc;
      }, {})).sort(([, a], [, b]) => b - a)[0] || ['other', 0];
      
      dynamicContent['llm.categories.analysis'] = `The largest expense category is ${topCategory[0]} at ${
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(topCategory[1] as number)
      }, representing ${Math.round(((topCategory[1] as number) / parseFloat(variables['expenses.total'])) * 100)}% of total expenses.`;
    }
    
    if (schema.dynamicContent.includes('llm.description.summary')) {
      const descriptions = expenses.slice(0, 3).map(e => e.description || `Expense at ${e.vendor || 'unknown vendor'}`);
      dynamicContent['llm.description.summary'] = `Summary of ${expenses.length} expenses including ${descriptions.join(', ')}${expenses.length > 3 ? '...' : '.'}`;
    }
    
    return dynamicContent;
  }
}