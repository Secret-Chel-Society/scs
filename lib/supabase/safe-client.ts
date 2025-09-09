// Midnight Studios INTl - All rights reserved

/**
 * Safe Supabase client creation utility
 * Handles missing environment variables gracefully
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface SafeClientOptions {
  auth?: {
    persistSession?: boolean
  }
}

/**
 * Creates a Supabase client safely, handling missing environment variables
 * @param options Optional configuration for the client
 * @returns Supabase client or null if environment variables are missing
 */
export function createSafeSupabaseClient(
  options: SafeClientOptions = {}
): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables not configured')
    return null
  }

  return createClient(supabaseUrl, supabaseKey, options)
}

/**
 * Creates a Supabase admin client safely
 * @param options Optional configuration for the client
 * @returns Supabase client or null if environment variables are missing
 */
export function createSafeSupabaseAdminClient(
  options: SafeClientOptions = {}
): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase admin environment variables not configured')
    return null
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      ...options.auth
    }
  })
}

/**
 * Creates a Supabase client for public access safely
 * @param options Optional configuration for the client
 * @returns Supabase client or null if environment variables are missing
 */
export function createSafeSupabasePublicClient(
  options: SafeClientOptions = {}
): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase public environment variables not configured')
    return null
  }

  return createClient(supabaseUrl, supabaseAnonKey, options)
}

/**
 * Checks if Supabase is properly configured
 * @returns true if environment variables are available, false otherwise
 */
export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return !!(supabaseUrl && supabaseKey)
}

/**
 * Gets a standardized error response for missing Supabase configuration
 * @returns NextResponse with error message
 */
export function getSupabaseConfigError() {
  return {
    success: false,
    error: "Supabase not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
  }
}
