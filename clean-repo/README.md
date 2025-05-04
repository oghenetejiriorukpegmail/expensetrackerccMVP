# Expense Tracker MVP

A comprehensive expense tracking application built with Nuxt 3, Supabase, and Vue.js.

## Features

- **User Authentication**: Secure login and registration with Supabase Auth
- **Trip Management**: Create and manage business trips
- **Expense Tracking**: Log and categorize expenses with receipt uploads
- **Mileage Tracking**: Track travel distances and associated costs
- **Receipt Processing**: AI-powered receipt data extraction
- **Data Visualization**: Dashboard with expense summaries and charts
- **Export Functionality**: Generate reports in various formats

## Tech Stack

- **Frontend**: Nuxt 3, Vue.js, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **AI Integration**: Google Document AI for receipt processing
- **State Management**: Pinia
- **Styling**: TailwindCSS

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/oghenetejiriorukpegmail/expensetrackerccMVP.git
   cd expensetrackerccMVP
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file with the following variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   GOOGLE_API_KEY=your_google_api_key
   GOOGLE_PROJECT_ID=your_google_project_id
   GOOGLE_PROCESSOR_ID=your_google_processor_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Database Setup

The application requires a Supabase database with specific tables and RLS policies. See [README-STORAGE-FIX.md](./README-STORAGE-FIX.md) for detailed SQL setup instructions.

## Project Structure

- `assets/`: CSS and static assets
- `components/`: Vue components
- `composables/`: Vue composables
- `layouts/`: Application layouts
- `middleware/`: Nuxt middleware
- `pages/`: Application routes
- `plugins/`: Nuxt plugins
- `public/`: Public static files
- `server/`: Server-side code
- `stores/`: Pinia stores
- `utils/`: Utility functions

## Key Files

- `app.vue`: Main application component
- `nuxt.config.ts`: Nuxt configuration
- `stores/userStore.ts`: User authentication and profile management
- `stores/tripStore.ts`: Trip management
- `stores/expenseStore.ts`: Expense management
- `utils/ai-processing.ts`: Receipt AI processing

## MCP Integration

This repository includes GitHub MCP (Model Context Protocol) server configuration for AI assistant integration. See [GITHUB-MCP-README.md](./GITHUB-MCP-README.md) for setup instructions.

## License

MIT

## Contributors

- Expense Tracker Developer