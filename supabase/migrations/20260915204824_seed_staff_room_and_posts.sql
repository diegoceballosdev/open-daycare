update public.users u
set room_id = (select id from public.rooms where name = 'Soles')
where u.role = 'staff' and u.room_id is null;

-- Desviación (decidida por el usuario) respecto del SQL literal de la spec:
-- las 3 publicaciones se siembran a las 14:20 / 09:40 / 07:50 en hora de Argentina
-- (America/Argentina/Buenos_Aires), no en la zona horaria de la sesión de migración (UTC).
do $$
declare
  v_staff_id   uuid;
  v_daycare_id uuid;
  v_soles      uuid;
  v_mateo      uuid;
  v_post       uuid;
begin
  select id, daycare_id into v_staff_id, v_daycare_id
  from public.users where role = 'staff' order by created_at limit 1;

  select id into v_soles from public.rooms where name = 'Soles' limit 1;
  select id into v_mateo from public.children where full_name = 'Mateo Fernández' limit 1;

  -- 1) logro (niño)
  insert into public.posts (daycare_id, author_id, type, body, published_at)
  values (v_daycare_id, v_staff_id, 'achievement',
          '¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.',
          (date_trunc('day', (now() at time zone 'America/Argentina/Buenos_Aires')) + interval '14 hours 20 minutes')
            at time zone 'America/Argentina/Buenos_Aires')
  returning id into v_post;
  if v_mateo is not null then
    insert into public.post_children (post_id, child_id) values (v_post, v_mateo);
  end if;

  -- 2) actividad (niño; sin foto: ver Risks)
  insert into public.posts (daycare_id, author_id, type, body, published_at)
  values (v_daycare_id, v_staff_id, 'activity',
          'Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.',
          (date_trunc('day', (now() at time zone 'America/Argentina/Buenos_Aires')) + interval '9 hours 40 minutes')
            at time zone 'America/Argentina/Buenos_Aires')
  returning id into v_post;
  if v_mateo is not null then
    insert into public.post_children (post_id, child_id) values (v_post, v_mateo);
  end if;

  -- 3) anuncio (toda la sala)
  insert into public.posts (daycare_id, author_id, room_id, type, body, published_at)
  values (v_daycare_id, v_staff_id, v_soles, 'announcement',
          'El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.',
          (date_trunc('day', (now() at time zone 'America/Argentina/Buenos_Aires')) + interval '7 hours 50 minutes')
            at time zone 'America/Argentina/Buenos_Aires');
end $$;
