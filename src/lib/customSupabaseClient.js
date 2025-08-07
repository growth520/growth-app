import { createClient } from '@supabase/supabase-js';

// Environment variable validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
  
  // Show user-friendly error for missing config
  if (typeof window !== 'undefined') {
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        position: fixed; 
        top: 0; 
        left: 0; 
        right: 0; 
        bottom: 0; 
        background: rgba(0,0,0,0.9); 
        color: white; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        flex-direction: column;
        font-family: system-ui;
        z-index: 99999;
      ">
        <h1>⚠️ Configuration Error</h1>
        <p>Missing Supabase environment variables. Please check your .env file.</p>
        <small>Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</small>
      </div>
    `;
    document.body.appendChild(errorDiv);
  }
  
  throw new Error('Missing required Supabase environment variables');
}

// Singleton pattern for Supabase client
let supabaseInstance = null;

const createSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      // Completely disable realtime to prevent WebSocket connections
      realtime: {
        params: {
          eventsPerSecond: 0
        }
      },
      // Disable realtime globally and add proper headers
      global: {
        headers: {
          'x-client-info': 'growth-app@1.0.0',
          'apikey': supabaseAnonKey
        }
      },
      // Disable realtime subscriptions
      db: {
        schema: 'public'
      }
    });
  }
  
  return supabaseInstance;
};

export const supabase = createSupabaseClient();