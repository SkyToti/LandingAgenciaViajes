-- Portal de itinerarios — Tierra de Viajes
-- Esquema: docs/sistema-itinerarios/CONTEXTO.md §3

create table if not exists public.itinerarios (
  id             uuid        primary key default gen_random_uuid(),
  token          text        not null unique,
  cliente_nombre text        not null,
  titulo         text        not null,
  tipo           text        not null default 'viaje',
  fecha_inicio   date,
  fecha_fin      date,
  pdf_path       text,
  dias           jsonb,
  pin            text,
  expires_at     timestamptz not null,
  revoked        boolean     not null default false,
  version        integer     not null default 1,
  updated_at     timestamptz not null default now(),
  last_opened_at timestamptz,
  created_at     timestamptz not null default now(),

  constraint itinerarios_tipo_valido  check (tipo in ('asesoria','viaje')),
  -- El token es la única credencial de acceso: nunca puede ser corto (nanoid >= 21).
  constraint itinerarios_token_largo  check (char_length(token) >= 21),
  constraint itinerarios_fechas_orden check (fecha_fin is null or fecha_inicio is null or fecha_fin >= fecha_inicio)
);

comment on table  public.itinerarios                is 'Un itinerario por cliente. El acceso es por capability URL: quien tiene el token, entra.';
comment on column public.itinerarios.token         is 'nanoid >= 21 caracteres. Va en la URL /viaje/{token}. Nunca se regenera.';
comment on column public.itinerarios.pdf_path      is 'Ruta dentro del bucket privado "itinerarios". Se sirve solo con URL firmada.';
comment on column public.itinerarios.dias          is 'Sin uso por ahora: Karla decidio no capturar el dia por dia (CONTEXTO.md §7).';
comment on column public.itinerarios.pin           is 'Sin uso por ahora: PIN descartado por Karla. La columna queda por si algun dia se pide.';
comment on column public.itinerarios.expires_at    is 'Obligatorio. fecha_fin + 3 meses, o creacion + 6 meses si no hay fechas (CONTEXTO.md §7.1).';
comment on column public.itinerarios.updated_at    is 'Se muestra al cliente como "Actualizado el...". Se toca SOLO al reemplazar el PDF, nunca en otros updates.';
comment on column public.itinerarios.version       is 'Sube al reemplazar el PDF. Sirve para detectar la copia vieja en el telefono (PLAN-DE-TRABAJO.md §2.5).';

-- Buscador de /admin por nombre de cliente (Paso 4)
create index if not exists itinerarios_cliente_nombre_idx on public.itinerarios (lower(cliente_nombre));
create index if not exists itinerarios_created_at_idx     on public.itinerarios (created_at desc);

-- ------------------------------------------------------------------
-- RLS: nadie toca esta tabla directamente salvo Karla (autenticada).
-- El cliente sin sesion NO tiene ninguna politica => select devuelve vacio.
-- Su unica via de lectura es la funcion itinerario_por_token().
-- ------------------------------------------------------------------
alter table public.itinerarios enable row level security;

drop policy if exists karla_lee    on public.itinerarios;
drop policy if exists karla_crea   on public.itinerarios;
drop policy if exists karla_edita  on public.itinerarios;
drop policy if exists karla_borra  on public.itinerarios;

create policy karla_lee   on public.itinerarios for select to authenticated using (true);
create policy karla_crea  on public.itinerarios for insert to authenticated with check (true);
create policy karla_edita on public.itinerarios for update to authenticated using (true) with check (true);
create policy karla_borra on public.itinerarios for delete to authenticated using (true);
