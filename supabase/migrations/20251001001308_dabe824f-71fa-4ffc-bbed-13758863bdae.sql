-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'tenant_admin', 'agent_manager', 'user');

-- Create enum for agent status
CREATE TYPE public.agent_status AS ENUM ('active', 'inactive', 'maintenance');

-- Create enum for agent platform
CREATE TYPE public.agent_platform AS ENUM ('dify', 'langflow', 'crewai', 'native');

-- Create tenants table
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    domain TEXT UNIQUE,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#000000',
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    current_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create user_roles table (security best practice - roles in separate table)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, tenant_id, role)
);

-- Create agents table
CREATE TABLE public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    platform agent_platform NOT NULL,
    platform_agent_id TEXT NOT NULL,
    config JSONB DEFAULT '{}',
    status agent_status DEFAULT 'active',
    avatar_url TEXT,
    system_prompt TEXT,
    model_name TEXT,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create conversations table
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    external_session_id TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    tokens_used INTEGER,
    latency_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create metrics table
CREATE TABLE public.metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    metric_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create logs table
CREATE TABLE public.logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error')),
    message TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _tenant_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user has any role in tenant
CREATE OR REPLACE FUNCTION public.has_tenant_access(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
  )
$$;

-- Create security definer function to get user's current tenant
CREATE OR REPLACE FUNCTION public.get_current_tenant(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_tenant_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- RLS Policies for tenants
CREATE POLICY "Users can view tenants they belong to"
ON public.tenants FOR SELECT
USING (public.has_tenant_access(auth.uid(), id));

CREATE POLICY "Super admins can manage all tenants"
ON public.tenants FOR ALL
USING (public.has_role(auth.uid(), id, 'super_admin'));

CREATE POLICY "Tenant admins can update their tenant"
ON public.tenants FOR UPDATE
USING (public.has_role(auth.uid(), id, 'tenant_admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their tenants"
ON public.user_roles FOR SELECT
USING (public.has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Tenant admins can manage roles in their tenant"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), tenant_id, 'tenant_admin') OR public.has_role(auth.uid(), tenant_id, 'super_admin'));

-- RLS Policies for agents
CREATE POLICY "Users can view agents in their tenants"
ON public.agents FOR SELECT
USING (public.has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Agent managers can manage agents in their tenant"
ON public.agents FOR ALL
USING (
  public.has_role(auth.uid(), tenant_id, 'agent_manager') OR 
  public.has_role(auth.uid(), tenant_id, 'tenant_admin') OR 
  public.has_role(auth.uid(), tenant_id, 'super_admin')
);

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (user_id = auth.uid() AND public.has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can create conversations in their tenants"
ON public.conversations FOR INSERT
WITH CHECK (user_id = auth.uid() AND public.has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "Users can update their own conversations"
ON public.conversations FOR UPDATE
USING (user_id = auth.uid() AND public.has_tenant_access(auth.uid(), tenant_id));

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations
    WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
  )
);

-- RLS Policies for metrics
CREATE POLICY "Users can view metrics in their tenants"
ON public.metrics FOR SELECT
USING (public.has_tenant_access(auth.uid(), tenant_id));

CREATE POLICY "System can insert metrics"
ON public.metrics FOR INSERT
WITH CHECK (public.has_tenant_access(auth.uid(), tenant_id));

-- RLS Policies for logs
CREATE POLICY "Admins can view logs in their tenants"
ON public.logs FOR SELECT
USING (
  public.has_role(auth.uid(), tenant_id, 'tenant_admin') OR 
  public.has_role(auth.uid(), tenant_id, 'super_admin')
);

CREATE POLICY "System can insert logs"
ON public.logs FOR INSERT
WITH CHECK (public.has_tenant_access(auth.uid(), tenant_id));

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_tenant_id ON public.user_roles(tenant_id);
CREATE INDEX idx_agents_tenant_id ON public.agents(tenant_id);
CREATE INDEX idx_conversations_tenant_id ON public.conversations(tenant_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_agent_id ON public.conversations(agent_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_metrics_tenant_id ON public.metrics(tenant_id);
CREATE INDEX idx_metrics_created_at ON public.metrics(created_at);
CREATE INDEX idx_logs_tenant_id ON public.logs(tenant_id);
CREATE INDEX idx_logs_created_at ON public.logs(created_at);