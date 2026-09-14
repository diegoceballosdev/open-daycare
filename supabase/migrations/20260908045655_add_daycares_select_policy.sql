-- daycares es una tabla maestra no sensible (nombre/dirección). El staff autenticado
-- necesita leerla para resolver daycare_id en los joins (sendInvitation: child→room→daycare).
create policy "daycares_authenticated_select"
  on public.daycares for select to authenticated using (true);