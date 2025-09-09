import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export class Logger {
  private static instance: Logger;
  private supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async logToDatabase(
    level: LogLevel,
    message: string,
    context: Record<string, any> = {},
    userId?: string
  ) {
    try {
      await this.supabase.from('audit_logs').insert({
        action: `log_${level}`,
        user_id: userId || null,
        details: {
          level,
          message,
          ...context,
          environment: process.env.NODE_ENV,
        },
        ip_address: context.ipAddress,
        user_agent: context.userAgent,
      });
    } catch (error) {
      // Fallback to console if database logging fails
      console.error('Failed to log to database:', error);
      console[level](`[${level.toUpperCase()}] ${message}`, context);
    }
  }

  public error(message: string, error?: any, context: Record<string, any> = {}) {
    const errorContext = error ? { 
      error: error.message || String(error),
      stack: error.stack,
      ...context 
    } : context;
    
    this.logToDatabase('error', message, errorContext, context.userId);
    console.error(`[ERROR] ${message}`, errorContext);
  }

  public warn(message: string, context: Record<string, any> = {}) {
    this.logToDatabase('warn', message, context, context.userId);
    console.warn(`[WARN] ${message}`, context);
  }

  public info(message: string, context: Record<string, any> = {}) {
    this.logToDatabase('info', message, context, context.userId);
    console.info(`[INFO] ${message}`, context);
  }

  public debug(message: string, context: Record<string, any> = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.logToDatabase('debug', message, context, context.userId);
      console.debug(`[DEBUG] ${message}`, context);
    }
  }
}

export const logger = Logger.getInstance();
