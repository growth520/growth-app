# Growth App

A personal development app focused on growth challenges and community support.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (Optional)
VITE_OPENAI_API_KEY=your_openai_api_key  # Optional - for AI-powered suggestions

# App Base URL Configuration
VITE_APP_BASE_URL=https://growthapp.site  # Production URL
# For development: VITE_APP_BASE_URL=http://localhost:5173
```

### OpenAI API Key (Optional)

The app includes AI-powered personalized challenge suggestions. To enable this feature:

1. **Get an OpenAI API Key**: Sign up at [OpenAI](https://platform.openai.com/) and create an API key
2. **Add to Environment**: Add `VITE_OPENAI_API_KEY=your_key_here` to your `.env` file
3. **Vercel Deployment**: Add the same environment variable in your Vercel project settings

**Note**: If the OpenAI API key is not provided, the app will use fallback suggestions and show a warning banner in production.

### App Base URL Configuration

The app automatically handles different environments:

- **Development**: Uses `http://localhost:5173` by default
- **Production**: Uses `https://growthapp.site` by default  
- **Vercel Preview**: Automatically detects and uses `window.location.origin`

You can override this behavior by setting `VITE_APP_BASE_URL` in your environment variables.

**Important**: For Supabase OAuth setup, ensure your redirect URLs include:
- `https://growthapp.site/auth/callback` (production)
- `http://localhost:5173/auth/callback` (development)

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
``` 