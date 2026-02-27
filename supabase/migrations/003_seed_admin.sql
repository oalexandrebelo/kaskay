-- ============================================================
-- Kaskay - Seed: Admin Master Inicial
--
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard > Authentication > Users
-- 2. Clique em "Add User" > "Create new user"
-- 3. E-mail: bello.alexandre@gmail.com
-- 4. Defina uma senha segura
-- 5. Marque "Auto Confirm User"
-- 6. Copie o UUID gerado (aparece na lista de usuários)
-- 7. Execute este SQL substituindo <UUID_DO_AUTH_USER> pelo UUID copiado
-- ============================================================

-- Substitua <UUID_DO_AUTH_USER> pelo UUID real após criar o usuário no Auth
DO $$
DECLARE
  auth_user_id UUID;
BEGIN
  -- Busca o auth user pelo e-mail (criado via Dashboard)
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = 'bello.alexandre@gmail.com'
  LIMIT 1;

  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário bello.alexandre@gmail.com não encontrado em auth.users. Crie o usuário primeiro no Dashboard > Authentication > Users.';
  END IF;

  -- Cria o registro em server_users
  INSERT INTO public.server_users (
    auth_user_id,
    nome,
    email,
    role,
    ativo,
    convite_aceito
  ) VALUES (
    auth_user_id,
    'Alexandre Belo',
    'bello.alexandre@gmail.com',
    'admin_master',
    TRUE,
    TRUE
  )
  ON CONFLICT (email) DO UPDATE
    SET auth_user_id = EXCLUDED.auth_user_id,
        role = 'admin_master',
        ativo = TRUE,
        convite_aceito = TRUE;

  -- Atualiza os metadados do usuário no Auth para incluir o role
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'admin_master')
  WHERE id = auth_user_id;

  RAISE NOTICE 'Admin master criado com sucesso! UUID: %', auth_user_id;
END $$;
