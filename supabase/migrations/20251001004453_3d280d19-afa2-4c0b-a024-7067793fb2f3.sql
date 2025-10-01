-- Bootstrap: Create initial tenant and assign first super admin
-- Create initial tenant
INSERT INTO public.tenants (name, slug, primary_color, is_active)
VALUES ('Skyvidya', 'skyvidya', '#2563eb', true);

-- Get the tenant_id that was just created
DO $$
DECLARE
  v_tenant_id uuid;
  v_user_id uuid := 'dec48185-a6ec-499d-9cfe-3330667fdf77';
BEGIN
  -- Get the tenant id
  SELECT id INTO v_tenant_id
  FROM public.tenants
  WHERE slug = 'skyvidya';

  -- Assign super_admin role to the user
  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (v_user_id, v_tenant_id, 'super_admin');

  -- Update user profile with current tenant and full name
  UPDATE public.profiles
  SET 
    current_tenant_id = v_tenant_id,
    full_name = 'Everton'
  WHERE id = v_user_id;
END $$;