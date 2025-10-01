-- Drop the insecure public policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create secure policies: users can only view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create policy: users can view profiles of users in their tenants
CREATE POLICY "Users can view profiles in their tenants"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur1
    WHERE ur1.user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.user_roles ur2
      WHERE ur2.user_id = profiles.id
      AND ur2.tenant_id = ur1.tenant_id
    )
  )
);