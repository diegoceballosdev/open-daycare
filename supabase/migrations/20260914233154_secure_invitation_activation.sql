-- La activación puede continuar como anon o authenticated según la configuración
-- de confirmación de email de Supabase Auth. En ambos casos se valida que el
-- usuario creado corresponda al email original de la invitación.
create or replace function public.activate_invitation(
  p_code text,
  p_email text,
  p_new_user_id uuid
)
returns table (ok boolean, message text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invitation public.invitations%rowtype;
begin
  select * into v_invitation
  from public.invitations
  where code = upper(trim(p_code))
    and lower(email) = lower(trim(p_email))
  limit 1
  for update;

  if not found then
    return query select false, 'Código o email no válido.';
    return;
  end if;

  if v_invitation.status <> 'pending' then
    return query select false, 'Esta invitación ya fue usada.';
    return;
  end if;

  if v_invitation.expires_at <= now() then
    return query select false, 'Esta invitación venció.';
    return;
  end if;

  if not exists (
    select 1
    from auth.users
    where id = p_new_user_id
      and lower(email) = lower(v_invitation.email)
  ) then
    return query select false, 'La cuenta no corresponde al email invitado.';
    return;
  end if;

  if auth.uid() is not null and auth.uid() <> p_new_user_id then
    return query select false, 'La sesión no corresponde a la cuenta creada.';
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

revoke execute on function public.activate_invitation(text, text, uuid) from public;
grant execute on function public.activate_invitation(text, text, uuid) to anon, authenticated;
