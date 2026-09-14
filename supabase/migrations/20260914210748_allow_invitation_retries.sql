-- Reintentos de invitaciones (SPEC 13)
-- Permite al staff autenticado leer y actualizar sus propias invitaciones pendientes.

-- lectura: solo las invitaciones creadas por el propio usuario
create policy "invitations_own_select"
  on public.invitations for select to authenticated
  using ((select auth.uid()) = invited_by);

-- actualización: solo invitaciones propias, pendientes y vigentes
create policy "invitations_own_pending_update"
  on public.invitations for update to authenticated
  using (
    (select auth.uid()) = invited_by
    and status = 'pending'
    and expires_at > now()
  )
  with check (
    (select auth.uid()) = invited_by
    and status = 'pending'
    and expires_at > now()
  );

-- el rol authenticated no tiene permiso general de actualización sobre la tabla
revoke update on public.invitations from authenticated;

-- solo puede modificar las columnas requeridas por el reintento
grant update (full_name, relationship) on public.invitations to authenticated;

-- búsqueda de reintentos: coincide con el filtro estable de la consulta
create index invitations_pending_retry_idx
  on public.invitations (invited_by, child_id, lower(email), created_at desc)
  where status = 'pending';