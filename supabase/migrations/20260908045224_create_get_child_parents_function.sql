-- Lista los padres vinculados de un niño con su nombre.
-- SECURITY DEFINER: `users` es deny-all (sin policies) y el perfil necesita el nombre
-- de los padres; la función resuelve el join sin exponer la tabla vía la Data API.
-- Solo accesible para `authenticated` (staff) desde el perfil.
create or replace function public.get_child_parents(p_child_id uuid)
returns table (full_name text, relationship public.relationship_type)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select u.full_name, pc.relationship
    from public.parent_children pc
    join public.users u on u.id = pc.parent_id
    where pc.child_id = p_child_id
    order by pc.created_at;
end;
$$;

grant execute on function public.get_child_parents(uuid) to authenticated;
revoke execute on function public.get_child_parents(uuid) from public, anon;