-- 1. Create the product record
INSERT INTO public.products (id, title, subtitle)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Pantacal',
  '(750mg Tablet)'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Give your account admin access
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'nutrixptofficial@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;