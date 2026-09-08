insert into public.rooms (daycare_id, name)
select d.id, r.name
from (values ('Soles'), ('Lunas'), ('Estrellas')) as r(name)
cross join public.daycares d
where d.name = 'Guardería Sala Soles';

insert into public.children (room_id, full_name, birth_date, enrolled_at, allergy_tags, medical_notes)
select r.id, c.full_name, c.birth_date, c.enrolled_at, c.allergy_tags, c.medical_notes
from (values
  ('Mateo Fernández', date '2022-03-12', date '2025-02-01', array['Maní'],    'Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.'),
  ('Sofía Méndez',    date '2023-06-14', date '2025-03-01', array[]::text[], null),
  ('Benjamín Ruiz',   date '2022-09-02', date '2025-01-01', array[]::text[], null),
  ('Valentina Soto',  date '2023-11-20', date '2025-04-01', array[]::text[], null),
  ('Tomás Díaz',      date '2022-01-08', date '2025-02-01', array['Lactosa'], 'Alergia a la lactosa. Evitar lácteos. Trae su propia leche.'),
  ('Emma Castro',     date '2023-07-25', date '2025-05-01', array[]::text[], null)
) as c(full_name, birth_date, enrolled_at, allergy_tags, medical_notes)
join public.rooms r on r.name = 'Soles';