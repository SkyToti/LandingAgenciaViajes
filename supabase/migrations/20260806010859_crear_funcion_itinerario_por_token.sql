-- Unica puerta de lectura para el cliente sin sesion.
-- Recibe el token exacto y devuelve solo lo que la pagina necesita mostrar.
-- Nunca expone: token de otros, pin, dias, pdf_path de un enlace muerto.
create or replace function public.itinerario_por_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r      public.itinerarios;
  estado text;
begin
  -- Corta enumeracion barata antes de tocar la tabla.
  if p_token is null or char_length(p_token) < 21 then
    return jsonb_build_object('estado', 'no_encontrado');
  end if;

  select * into r from public.itinerarios where token = p_token;

  if not found then
    return jsonb_build_object('estado', 'no_encontrado');
  end if;

  -- Los tres estados que la pagina del cliente sabe contar con carino (Paso 5).
  if r.revoked then
    estado := 'revocado';
  elsif r.expires_at <= now() then
    estado := 'caducado';
  else
    estado := 'ok';
  end if;

  return jsonb_build_object(
    'estado',         estado,
    'cliente_nombre', r.cliente_nombre,
    'titulo',         r.titulo,
    'tipo',           r.tipo,
    'fecha_inicio',   r.fecha_inicio,
    'fecha_fin',      r.fecha_fin,
    'version',        r.version,
    'updated_at',     r.updated_at,
    'expires_at',     r.expires_at,
    -- Un enlace revocado o caducado no entrega la ruta del PDF: sin ruta no hay firma posible.
    'pdf_path',       case when estado = 'ok' then r.pdf_path else null end
  );
end;
$$;

comment on function public.itinerario_por_token(text) is 'Lectura publica por token exacto. Unica via de acceso del cliente; la tabla nunca se lista.';

-- Por defecto Postgres deja ejecutar a todo el mundo: acotar explicitamente.
revoke all     on function public.itinerario_por_token(text) from public;
grant  execute on function public.itinerario_por_token(text) to anon, authenticated;
