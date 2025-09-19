# Midnight Studios INTl - Tracking Tables Setup

## 🗄️ Database Tables Setup

Run this SQL in your Supabase SQL Editor to create the tracking tables:

```sql
-- Midnight Studios INTl - All rights reserved
-- Create tracking tables for code protection monitoring

-- Table for tracking code downloads and file access
CREATE TABLE IF NOT EXISTS public.code_downloads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  file_type text NOT NULL,
  filename text NOT NULL,
  file_path text,
  ip_address text NOT NULL,
  user_agent text NOT NULL,
  referer text,
  session_id text,
  user_id uuid,
  timestamp timestamp with time zone DEFAULT now(),
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT code_downloads_pkey PRIMARY KEY (id),
  CONSTRAINT code_downloads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Table for security events and suspicious activity
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ip_address text NOT NULL,
  user_agent text NOT NULL,
  user_id uuid,
  session_id text,
  details jsonb,
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT security_events_pkey PRIMARY KEY (id),
  CONSTRAINT security_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT security_events_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id)
);

-- Table for analytics events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  session_id text NOT NULL,
  ip_address text,
  user_agent text,
  metadata jsonb,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT analytics_events_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Table for file access logs
CREATE TABLE IF NOT EXISTS public.file_access_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  file_type text NOT NULL,
  ip_address text NOT NULL,
  user_agent text NOT NULL,
  referer text,
  method text DEFAULT 'GET',
  user_id uuid,
  session_id text,
  response_status integer,
  response_time_ms integer,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT file_access_logs_pkey PRIMARY KEY (id),
  CONSTRAINT file_access_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_code_downloads_timestamp ON public.code_downloads(timestamp);
CREATE INDEX IF NOT EXISTS idx_code_downloads_ip ON public.code_downloads(ip_address);
CREATE INDEX IF NOT EXISTS idx_code_downloads_file_type ON public.code_downloads(file_type);

CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON public.security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON public.security_events(ip_address);

CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON public.analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_file_access_logs_timestamp ON public.file_access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_file_access_logs_ip ON public.file_access_logs(ip_address);

-- Row Level Security (RLS) policies
ALTER TABLE public.code_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_access_logs ENABLE ROW LEVEL SECURITY;

-- Policies for admin access
CREATE POLICY "Admins can view all tracking data" ON public.code_downloads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can view all security events" ON public.security_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can view all analytics events" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'Admin'
    )
  );

CREATE POLICY "Admins can view all file access logs" ON public.file_access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'Admin'
    )
  );

-- Allow service role to insert (for server-side tracking)
CREATE POLICY "Service role can insert tracking data" ON public.code_downloads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert security events" ON public.security_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert analytics events" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can insert file access logs" ON public.file_access_logs
  FOR INSERT WITH CHECK (true);
```

## 📊 How to Access Your Tracking Data

### 1. **Security Dashboard**
- URL: `/admin/security-dashboard`
- Real-time monitoring interface
- Visual charts and statistics

### 2. **Supabase Dashboard**
- Go to your Supabase project
- Navigate to Table Editor
- Check these tables:
  - `code_downloads`
  - `security_events` 
  - `analytics_events`
  - `file_access_logs`

### 3. **Browser Console**
- Open Developer Tools (F12)
- Check Console tab for real-time logs
- Look for emoji indicators: 🔍 📁 📦 🎨 ⚡ 🚨

## 🚨 What Gets Tracked

- **Source Map Access** - High priority (code inspection attempts)
- **File Downloads** - Medium priority (JS, CSS, assets)
- **Security Events** - Critical priority (attacks, suspicious activity)
- **User Analytics** - Low priority (usage patterns)

## ✅ Build Fix Applied

The build error has been resolved by:
- Removing `require()` calls from ES module
- Using built-in webpack optimizations
- Preserving Midnight Studios INTl comments
- Removing console logs in production
