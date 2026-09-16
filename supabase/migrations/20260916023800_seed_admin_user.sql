-- SPEC 15 — Seed del usuario admin de "Guardería Sala Soles".
-- El trigger `on_auth_user_created` (SPEC 09) replica la fila en public.users con
-- `role = admin` (desde raw_app_meta_data) y `status = active` (default); no setea `room_id`.

-- Desviación (idempotencia, pedida para este seed): `where not exists` evita romper por
-- PK/unique si la migración se re-ejecuta o si el admin ya existe. `crypt`/`gen_salt` vienen
-- de pgcrypto, ya usado por el seed de staff (20260905231206).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@opendaycare.com',
  crypt('Admin123!', gen_salt('bf')),
  now(),
  jsonb_build_object('provider', 'email', 'providers', array['email'], 'role', 'admin'),
  jsonb_build_object(
    'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles'),
    'full_name', 'Admin Demo'
  ),
  now(), now(),
  '', '', '', '', ''
where not exists (
  select 1 from auth.users where email = 'admin@opendaycare.com'
);

-- El trigger no setea room_id; se asigna aquí para que el admin pueda publicar "Toda la sala".
-- Desviaciones respecto del SQL literal de la spec
--   1) `room_id` se resuelve dentro del daycare del admin (nombre de sala no es único global;
--      con otro daycare podría haber un "Soles" ajeno o duplicar el escalar).
--   2) `limit 1` + `exists` mantienen el UPDATE idempotente y sin fallo si la sala no existe.
update public.users u
set room_id = (
  select r.id
  from public.rooms r
  where r.name = 'Soles' and r.daycare_id = u.daycare_id
  limit 1
)
where u.role = 'admin'
  and u.room_id is null
  and exists (
    select 1 from public.rooms r
    where r.name = 'Soles' and r.daycare_id = u.daycare_id
  );
