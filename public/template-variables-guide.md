# Excel Template Variables Guide

This guide explains how to create custom Excel templates for your expense reports using variable placeholders. When you upload a custom template, our system will automatically analyze it and replace the variables with your actual expense data.

## How to Use Variables in Templates

1. Create an Excel spreadsheet with your desired formatting and structure
2. Add variable placeholders using double braces: `{{variable_name}}`
3. Upload the template in the Settings page
4. When generating reports, select "Use custom Excel template"

## Available Variables

### User Information

| Variable | Description | Example |
|----------|-------------|---------|
| `{{user.full_name}}` | User's full name | John Smith |
| `{{user.email}}` | User's email address | john@example.com |

### Date Information

| Variable | Description | Example |
|----------|-------------|---------|
| `{{date}}` | Today's date in ISO format | 2025-05-08 |
| `{{date.formatted}}` | Today's date in formatted style | May 8, 2025 |
| `{{date.year}}` | Current year | 2025 |
| `{{date.month}}` | Current month number | 5 |
| `{{date.day}}` | Current day of month | 8 |

### Report Information

| Variable | Description | Example |
|----------|-------------|---------|
| `{{report.title}}` | Report title | Expense Report: Business Trip |
| `{{report.filename}}` | Report filename | Trip-business-trip-Report |

### Trip Information

| Variable | Description | Example |
|----------|-------------|---------|
| `{{trip.name}}` | Trip name | Business Trip |
| `{{trip.description}}` | Trip description | Quarterly client meetings |
| `{{trip.location}}` | Trip location | New York |
| `{{trip.status}}` | Trip status | completed |
| `{{trip.start_date}}` | Trip start date | 2025-04-01 |
| `{{trip.end_date}}` | Trip end date | 2025-04-05 |

### Expense Counts and Totals

| Variable | Description | Example |
|----------|-------------|---------|
| `{{expenses.count}}` | Number of expenses | 12 |
| `{{expenses.total}}` | Total expense amount as number | 1,234.56 |
| `{{expenses.total.currency}}` | Total expense amount as currency | $1,234.56 |

### Mileage Information

| Variable | Description | Example |
|----------|-------------|---------|
| `{{mileage.count}}` | Number of mileage records | 3 |
| `{{mileage.total.distance}}` | Total miles traveled | 120.5 |
| `{{mileage.total.cost}}` | Total mileage cost | $69.89 |
| `{{mileage.rate}}` | Mileage rate | 0.58 |

### Expense Categories

#### Counts by Category

| Variable | Description | Example |
|----------|-------------|---------|
| `{{expenses.accommodation.count}}` | Count of accommodation expenses | 4 |
| `{{expenses.transportation.count}}` | Count of transportation expenses | 5 |
| `{{expenses.meals.count}}` | Count of meal expenses | 8 |
| `{{expenses.entertainment.count}}` | Count of entertainment expenses | 2 |
| `{{expenses.business.count}}` | Count of business expenses | 3 |
| `{{expenses.office.count}}` | Count of office expenses | 1 |
| `{{expenses.other.count}}` | Count of other expenses | 2 |

#### Totals by Category

| Variable | Description | Example |
|----------|-------------|---------|
| `{{expenses.accommodation.total}}` | Total for accommodation | $650.00 |
| `{{expenses.transportation.total}}` | Total for transportation | $245.75 |
| `{{expenses.meals.total}}` | Total for meals | $187.90 |
| `{{expenses.entertainment.total}}` | Total for entertainment | $95.00 |
| `{{expenses.business.total}}` | Total for business | $325.50 |
| `{{expenses.office.total}}` | Total for office | $42.99 |
| `{{expenses.other.total}}` | Total for other expenses | $85.25 |

### Individual Expense Information

You can access information about specific expenses by index (starting at 1):

| Variable | Description | Example |
|----------|-------------|---------|
| `{{expense.1.description}}` | Description of 1st expense | Hotel stay |
| `{{expense.1.vendor}}` | Vendor of 1st expense | Marriott |
| `{{expense.1.amount}}` | Amount of 1st expense | $175.00 |
| `{{expense.1.type}}` | Type of 1st expense | accommodation |
| `{{expense.1.date}}` | Date of 1st expense | 2025-04-01 |

You can use indices 1 through the total number of expenses (e.g., `expense.2.description`, `expense.3.description`, etc.)

### Grand Total

| Variable | Description | Example |
|----------|-------------|---------|
| `{{grand_total}}` | Sum of all expenses and mileage costs | 1,304.45 |
| `{{grand_total.currency}}` | Formatted grand total | $1,304.45 |

### AI-Generated Content

These variables are filled with AI-generated content to enrich your reports:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{llm.report.summary}}` | Summary of the entire report | This report covers expenses for a business trip to New York with a total of 12 expenses amounting to $1,234.56. |
| `{{llm.categories.analysis}}` | Analysis of expense categories | The largest expense category is accommodation at $650.00, representing 53% of total expenses. |
| `{{llm.description.summary}}` | Summary of expense descriptions | Summary of 12 expenses including Hotel stay, Taxi fare, Client dinner... |
| `{{llm.trip.summary}}` | Summary of the trip | This business trip to New York from April 1-5 included client meetings and resulted in $1,234.56 in expenses. |

## Creating Table-Based Templates

You can also create table structures in your template. The system will automatically populate rows in your table with expense or mileage data.

A simple expense table might have these headers:
- Date
- Type
- Vendor
- Description
- Amount
- Location

The system will automatically fill in expense data under these headers.

## Tips for Template Design

1. **Use variable placeholders for dynamic content**: Any information that should change between reports should use variables.

2. **Create header rows for tables**: If you want to include expense or mileage tables, create header rows and the system will populate the data below.

3. **Apply your own formatting**: Feel free to add your company logo, custom colors, and any other formatting - the system will preserve it.

4. **Test your template**: After creating a template, generate a test report to ensure all variables are correctly replaced.

5. **Mix static and dynamic content**: You can combine fixed text with variables, like "Report generated for {{user.full_name}} on {{date.formatted}}".

## Example Template Structure

```
EXPENSE REPORT

Employee: {{user.full_name}}
Date: {{date.formatted}}
Trip: {{trip.name}}
Location: {{trip.location}}

Summary: {{llm.report.summary}}

-----------------------------------------
EXPENSES
-----------------------------------------
[Table with expense data]

-----------------------------------------
MILEAGE
-----------------------------------------
[Table with mileage data]

-----------------------------------------
TOTALS
-----------------------------------------
Total Expenses: {{expenses.total.currency}}
Total Mileage Cost: {{mileage.total.cost}}
GRAND TOTAL: {{grand_total.currency}}

Analysis: {{llm.categories.analysis}}
```

## Need Help?

If you have questions about creating custom templates, please contact support.