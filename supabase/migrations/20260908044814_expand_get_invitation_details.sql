-- Amplía get_invitation_details para que la Server Action `activate` del Step 7
-- pueda resolver daycare_id y full_name (necesarios para signUp) sin leer la tabla.
drop function if exists public.get_invitation_details(text, text);

create or replace function public.get_invitation_details(
  p_code text,
  p_email text
)
returns table (
  child_name text,
  relationship public.relationship_type,
  parent_full_name text,
  daycare_id uuid
)
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
    select c.full_name, v_invitation.relationship, v_invitation.full_name, r.daycare_id
    from public.children c
    join public.rooms r on r.id = c.room_id
    where c.id = v_invitation.child_id;
end;
$$;

grant execute on function public.get_invitation_details(text, text) to anon;
revoke execute on function public.get_invitation_details(text, text) from public, authenticated;