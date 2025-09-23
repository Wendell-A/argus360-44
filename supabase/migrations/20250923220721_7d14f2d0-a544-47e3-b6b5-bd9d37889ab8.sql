-- Critical Security Fixes - Stage 1: SQL Injection Prevention & RLS Hardening (Fixed)
-- 23/09/2025 - Fixing SQL functions with search_path vulnerabilities and strengthening RLS

-- 1. Fix search_path vulnerabilities in critical SQL functions
CREATE OR REPLACE FUNCTION public.get_user_tenant_ids(user_uuid uuid)
RETURNS uuid[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN ARRAY(
    SELECT tenant_id 
    FROM public.tenant_users 
    WHERE user_id = user_uuid AND active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_in_tenant(user_uuid uuid, tenant_uuid uuid)
RETURNS user_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_role_val user_role;
BEGIN
  SELECT role INTO user_role_val
  FROM public.tenant_users
  WHERE user_id = user_uuid 
    AND tenant_id = tenant_uuid 
    AND active = true;
    
  RETURN COALESCE(user_role_val, 'viewer'::user_role);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_owner(user_uuid uuid, tenant_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.tenant_users 
    WHERE user_id = user_uuid 
      AND tenant_id = tenant_uuid 
      AND role = 'owner' 
      AND active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_authenticated_user_data()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_data jsonb;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('authenticated', false);
  END IF;
  
  SELECT jsonb_build_object(
    'authenticated', true,
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'avatar_url', p.avatar_url
  ) INTO user_data
  FROM public.profiles p
  WHERE p.id = current_user_id;
  
  RETURN COALESCE(user_data, jsonb_build_object('authenticated', true, 'id', current_user_id));
END;
$$;

-- 2. Strengthen RLS policies for clients table (critical customer data protection)
DROP POLICY IF EXISTS "Users can manage clients based on context" ON public.clients;
DROP POLICY IF EXISTS "Users can view clients based on context" ON public.clients;

-- New restrictive SELECT policy for clients
CREATE POLICY "Secure client access with strict tenant isolation"
ON public.clients
FOR SELECT
TO authenticated
USING (
  -- Must be in same tenant with strict role-based access
  tenant_id = ANY (public.get_user_tenant_ids(auth.uid()))
  AND (
    -- Owner/Admin: all clients in tenant
    public.get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager: only clients in accessible offices
    (
      public.get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND office_id = ANY (public.get_user_context_offices(auth.uid(), tenant_id))
    )
    OR
    -- User/Viewer: only their own clients
    (
      public.get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer')
      AND responsible_user_id = auth.uid()
    )
  )
);

-- New restrictive INSERT policy for clients
CREATE POLICY "Users can create clients with proper context"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (
  -- Must be in user's tenant with proper context
  tenant_id = ANY (public.get_user_tenant_ids(auth.uid()))
  AND (
    -- Owner/Admin: can create anywhere in tenant
    public.get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    -- Manager: only in accessible offices
    (
      public.get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND office_id = ANY (public.get_user_context_offices(auth.uid(), tenant_id))
    )
    OR
    -- User: only as their own responsible user
    (
      public.get_user_role_in_tenant(auth.uid(), tenant_id) = 'user'
      AND responsible_user_id = auth.uid()
      AND office_id = ANY (public.get_user_context_offices(auth.uid(), tenant_id))
    )
  )
);

-- New restrictive UPDATE policy for clients
CREATE POLICY "Users can update clients with proper context"
ON public.clients
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY (public.get_user_tenant_ids(auth.uid()))
  AND (
    public.get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    (
      public.get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND office_id = ANY (public.get_user_context_offices(auth.uid(), tenant_id))
    )
    OR
    (
      public.get_user_role_in_tenant(auth.uid(), tenant_id) IN ('user', 'viewer')
      AND responsible_user_id = auth.uid()
    )
  )
)
WITH CHECK (
  tenant_id = ANY (public.get_user_tenant_ids(auth.uid()))
  AND (
    public.get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
    OR
    (
      public.get_user_role_in_tenant(auth.uid(), tenant_id) = 'manager'
      AND office_id = ANY (public.get_user_context_offices(auth.uid(), tenant_id))
    )
    OR
    (
      public.get_user_role_in_tenant(auth.uid(), tenant_id) = 'user'
      AND responsible_user_id = auth.uid()
    )
  )
);

-- New restrictive DELETE policy for clients  
CREATE POLICY "Admins can delete clients within tenant context"
ON public.clients
FOR DELETE
TO authenticated
USING (
  tenant_id = ANY (public.get_user_tenant_ids(auth.uid()))
  AND public.get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
);

-- 3. Strengthen support ticket RLS policies (prevent cross-tenant access)
DROP POLICY IF EXISTS "Users can view tickets from their tenant" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets in their tenant" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can edit their own tickets" ON public.support_tickets;

-- New secure support ticket policies with strict tenant isolation
CREATE POLICY "Secure support ticket access"
ON public.support_tickets
FOR SELECT  
TO authenticated
USING (
  tenant_id = ANY (public.get_user_tenant_ids(auth.uid()))
  AND (
    -- Users can see their own tickets
    user_id = auth.uid()
    OR
    -- Admins can see all tickets in their tenant
    public.get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can create tickets in their tenant only"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = ANY (public.get_user_tenant_ids(auth.uid()))
  AND user_id = auth.uid()
);

CREATE POLICY "Secure ticket updates"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (
  tenant_id = ANY (public.get_user_tenant_ids(auth.uid()))
  AND (
    user_id = auth.uid()
    OR public.get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
  )
)
WITH CHECK (
  tenant_id = ANY (public.get_user_tenant_ids(auth.uid()))
  AND (
    user_id = auth.uid()
    OR public.get_user_role_in_tenant(auth.uid(), tenant_id) IN ('owner', 'admin')
  )
);

-- 4. Create function to validate tenant isolation (security utility)
CREATE OR REPLACE FUNCTION public.validate_tenant_isolation(
  table_name text,
  record_tenant_id uuid,
  user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Ensure user has access to this tenant
  IF record_tenant_id != ANY (public.get_user_tenant_ids(user_id)) THEN
    RAISE EXCEPTION 'Tenant isolation violation in table %: User % cannot access tenant %', 
      table_name, user_id, record_tenant_id;
  END IF;
  
  RETURN true;
END;
$$;