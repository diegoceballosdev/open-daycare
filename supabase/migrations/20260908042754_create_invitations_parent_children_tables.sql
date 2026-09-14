create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.invitations (
  id           uuid                  primary key default gen_random_uuid(),
  child_id     uuid                  not null references public.children (id),
  invited_by   uuid                  not null references public.users (id),
  full_name    text                  not null,
  email        text                  not null,
  relationship public.relationship_type not null,
  code         text                  not null unique,
  status       public.invitation_status not null default 'pending',
  expires_at   timestamptz           not null,
  accepted_at  timestamptz,
  created_at   timestamptz           not null default now()
);

create table public.parent_children (
  id           uuid                  primary key default gen_random_uuid(),
  parent_id    uuid                  not null references public.users (id),
  child_id     uuid                  not null references public.children (id),
  relationship public.relationship_type not null,
  created_at   timestamptz           not null default now(),
  unique (parent_id, child_id)
);

alter table public.invitations enable row level security;
alter table public.parent_children enable row level security;

-- staff (autenticado) crea la invitación desde el modal
create policy "invitations_authenticated_insert"
  on public.invitations for insert to authenticated with check (true);

-- perfil: staff autenticado lee los padres vinculados
create policy "parent_children_authenticated_select"
  on public.parent_children for select to authenticated using (true);

-- activación atómica y privilegiada (valida la invitación, crea el vínculo y marca accepted)
create or replace function public.activate_invitation(
  p_code text,
  p_email text,
  p_new_user_id uuid
)
returns table (ok boolean, message text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.invitations%rowtype;
begin
  select * into v_invitation
  from public.invitations
  where code = p_code and lower(email) = lower(p_email)
  limit 1;

  if not found then
    return query select false, 'Código o email no válido.';
    return;
  end if;

  if v_invitation.status <> 'pending' then
    return query select false, 'Esta invitación ya fue usada.';
    return;
  end if;

  if v_invitation.expires_at < now() then
    return query select false, 'Esta invitación venció.';
    return;
  end if;

  insert into public.parent_children (parent_id, child_id, relationship)
  values (p_new_user_id, v_invitation.child_id, v_invitation.relationship);

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where id = v_invitation.id;

  return query select true, 'Cuenta activada.';
end;
$$;

-- la función RPC es el único acceso en escritura a invitations/parent_children; blindar execute
revoke execute on function public.activate_invitation(text, text, uuid) from public, anon, authenticated;