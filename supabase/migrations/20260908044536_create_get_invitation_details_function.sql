-- Lectura read-only de los datos de la invitación para la pantalla pública /activar.
-- SECURITY DEFINER: el padre está deslogueado (rol anon) y invitations no expone SELECT.
-- La credencial es el código + email: la función solo devuelve datos si coinciden,
-- la invitación está pending y no venció.
create or replace function public.get_invitation_details(
  p_code text,
  p_email text
)
returns table (child_name text, relationship public.relationship_type)
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

  if not found or v_invitation.status <> 'pending' or v_invitation.expires_at < now() then
    return;
  end if;

  return query
    select c.full_name, v_invitation.relationship
    from public.children c
    where c.id = v_invitation.child_id;
end;
$$;

-- Accesible para anon (misma lógica que activate_invitation: el código+email es la credencial).
grant execute on function public.get_invitation_details(text, text) to anon;

-- Blinda el resto de roles de llamadas directas.
revoke execute on function public.get_invitation_details(text, text) from public, authenticated;