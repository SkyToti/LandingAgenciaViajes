-- Bucket PRIVADO: un bucket publico haria el token inutil (PLAN-DE-TRABAJO.md §1).
-- Tope de 25 MB por archivo. En /admin ademas se avisa a partir de ~8 MB (§2.6),
-- porque un PDF pesado se descarga fatal con datos moviles en el extranjero.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('itinerarios', 'itinerarios', false, 26214400, array['application/pdf'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Solo Karla (autenticada) toca los objetos del bucket.
-- El cliente sin sesion no tiene ninguna politica aqui: no puede listar ni descargar.
drop policy if exists karla_sube_pdfs      on storage.objects;
drop policy if exists karla_lee_pdfs       on storage.objects;
drop policy if exists karla_actualiza_pdfs on storage.objects;
drop policy if exists karla_borra_pdfs     on storage.objects;

create policy karla_sube_pdfs      on storage.objects for insert to authenticated
  with check (bucket_id = 'itinerarios');
create policy karla_lee_pdfs       on storage.objects for select to authenticated
  using (bucket_id = 'itinerarios');
create policy karla_actualiza_pdfs on storage.objects for update to authenticated
  using (bucket_id = 'itinerarios') with check (bucket_id = 'itinerarios');
create policy karla_borra_pdfs     on storage.objects for delete to authenticated
  using (bucket_id = 'itinerarios');
