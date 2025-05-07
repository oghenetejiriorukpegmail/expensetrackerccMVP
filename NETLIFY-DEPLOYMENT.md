# Netlify Deployment Guide

This guide explains how to deploy the Expense Tracker application to Netlify.

## Prerequisites

- A Netlify account
- Git repository with the Expense Tracker code

## Deployment Steps

1. **Ensure dependencies are correctly configured**:
   - Make sure `tailwindcss-animate` is in the `dependencies` section of `package.json`, not just in `devDependencies`.
   - This is necessary because Netlify needs this package during the build process.

2. **Configure Netlify**:
   - Connect your GitHub repository to Netlify
   - Set the build command to `./netlify-build.sh`
   - Set the publish directory to `.output/public`

3. **Environment Variables**:
   - Add all required environment variables in the Netlify dashboard:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_KEY`
     - `GOOGLE_API_KEY`
     - `GOOGLE_PROJECT_ID`
     - `GOOGLE_PROCESSOR_ID`

4. **Netlify Functions**:
   - The Netlify functions are automatically configured by the `netlify-functions-setup.cjs` script
   - The functions are copied from `/netlify/functions` to `.netlify/functions-internal`

## Troubleshooting

### Missing tailwindcss-animate error

If you encounter this error during build:
```
Cannot find module 'tailwindcss-animate'
```

Ensure that `tailwindcss-animate` is in the main `dependencies` section of your `package.json` file, not just in `devDependencies`.

### Build Script Failures

The `netlify-build.sh` script handles:
1. Setting up Netlify functions
2. Building the Nuxt application with the static preset
3. Creating fallback files if needed

Check this script if you encounter build issues.

## Netlify Configuration

The `netlify.toml` file contains all the necessary Netlify-specific configurations.