-- Helpers SECURITY DEFINER: evitan la recursión de RLS sobre `users` y solo exponen datos del llamador.
-- Se definen antes de las policies de `users` porque Postgres resuelve las funciones al crear la policy.
create or replace function public.current_daycare_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select daycare_id from public.users where id = (select auth.uid())
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.users where id = (select auth.uid()) and role = 'staff')
$$;

revoke execute on function public.current_daycare_id() from public, anon;
revoke execute on function public.is_staff() from public, anon;
grant execute on function public.current_daycare_id() to authenticated;
grant execute on function public.is_staff() to authenticated;

-- El usuario lee su propia fila (rol, sala, daycare).
create policy "users_select_self"
  on public.users for select to authenticated
  using (id = (select auth.uid()));

-- El staff lee los usuarios de su daycare (para resolver el autor del feed).
create policy "users_select_staff_daycare"
  on public.users for select to authenticated
  using (public.is_staff() and daycare_id = public.current_daycare_id());

-- Escritura: solo staff del daycare y como autor propio.
create policy "posts_staff_insert"
  on public.posts for insert to authenticated
  with check (
    public.is_staff()
    and author_id = (select auth.uid())
    and daycare_id = public.current_daycare_id()
  );

-- Lectura: staff ve todo su daycare; el padre ve los posts de sus hijos + anuncios de su sala.
create policy "posts_select_visible"
  on public.posts for select to authenticated
  using (
    (public.is_staff() and daycare_id = public.current_daycare_id())
    or exists (
      select 1
      from public.post_children pc
      join public.parent_children pch on pch.child_id = pc.child_id
      where pc.post_id = posts.id
        and pch.parent_id = (select auth.uid())
        and posts.daycare_id = public.current_daycare_id()
    )
    or (
      type = 'announcement'
      and room_id in (
        select c.room_id
        from public.parent_children pch
        join public.children c on c.id = pch.child_id
        where pch.parent_id = (select auth.uid())
      )
    )
  );

-- Permisiva (mismo criterio que children/parent_children): evita la recursión de policies con `posts`.
create policy "post_children_select"
  on public.post_children for select to authenticated using (true);

create policy "post_photos_select"
  on public.post_photos for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_photos.post_id));

create policy "post_children_staff_insert"
  on public.post_children for insert to authenticated with check (public.is_staff());

create policy "post_photos_staff_insert"
  on public.post_photos for insert to authenticated with check (public.is_staff());

-- RPC: inserta posts + post_children + post_photos en una sola transacción.
-- SECURITY INVOKER: las policies y la validación de destinatarios aplican igual.
create or replace function public.create_post(
  p_type      public.post_type,
  p_body      text,
  p_room_id   uuid,
  p_child_ids uuid[],
  p_photos    jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_post_id uuid;
begin
  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'La descripción es obligatoria.';
  end if;

  if p_room_id is null and (p_child_ids is null or cardinality(p_child_ids) = 0) then
    raise exception 'Elegí al menos un destinatario.';
  end if;

  if p_room_id is not null and p_child_ids is not null and cardinality(p_child_ids) > 0 then
    raise exception 'Elegí niños o toda la sala, no ambos.';
  end if;

  if p_type = 'photo' and (p_photos is null or jsonb_array_length(p_photos) = 0) then
    raise exception 'El tipo Foto requiere al menos una imagen.';
  end if;

  -- Aislamiento de tenant: la sala y todos los niños deben pertenecer al daycare del autor.
  if p_room_id is not null and not exists (
    select 1 from public.rooms
    where id = p_room_id and daycare_id = public.current_daycare_id()
  ) then
    raise exception 'Sala inválida.';
  end if;

  if p_child_ids is not null and cardinality(p_child_ids) > 0 and exists (
    select 1
    from unnest(p_child_ids) as cid
    left join public.children c on c.id = cid
    left join public.rooms    r on r.id = c.room_id
    where c.id is null or r.daycare_id is distinct from public.current_daycare_id()
  ) then
    raise exception 'Destinatarios inválidos.';
  end if;

  insert into public.posts (daycare_id, author_id, room_id, type, body, published_at)
  values (public.current_daycare_id(), (select auth.uid()), p_room_id, p_type, trim(p_body), now())
  returning id into v_post_id;

  if p_child_ids is not null and cardinality(p_child_ids) > 0 then
    insert into public.post_children (post_id, child_id)
    select v_post_id, unnest(p_child_ids);
  end if;

  if p_photos is not null and jsonb_array_length(p_photos) > 0 then
    insert into public.post_photos (post_id, url, width, height, position)
    select
      v_post_id,
      e ->> 'path',
      nullif(e ->> 'width', '')::int,
      nullif(e ->> 'height', '')::int,
      coalesce((e ->> 'position')::int, 0)
    from jsonb_array_elements(p_photos) as e;
  end if;

  return v_post_id;
end;
$$;

revoke execute on function public.create_post(public.post_type, text, uuid, uuid[], jsonb) from public, anon;
grant execute on function public.create_post(public.post_type, text, uuid, uuid[], jsonb) to authenticated;
