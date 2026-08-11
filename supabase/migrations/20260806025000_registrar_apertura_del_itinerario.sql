-- "¿Ya lo abrió?" — la pregunta que Karla se hace despues de mandar el enlace.
--
-- Va aparte de itinerario_por_token a proposito: si registrar la visita fallara,
-- el cliente tiene que seguir viendo su itinerario igual. La lectura no puede
-- depender de la estadistica.
--
-- Sobre la vista previa de WhatsApp (PLAN-DE-TRABAJO.md §2.2): no la cuenta.
-- El robot que arma la miniatura descarga el HTML pero no ejecuta JavaScript,
-- y esta funcion solo se llama desde el JavaScript de la pagina.
create or replace function public.registrar_apertura(p_token text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_token is null or char_length(p_token) < 21 then
    return;
  end if;

  -- Un enlace muerto no registra aperturas: nadie llego a ver nada.
  update public.itinerarios
     set last_opened_at = now()
   where token = p_token
     and not revoked
     and expires_at > now();
end;
$$;

comment on function public.registrar_apertura(text) is 'Marca la ultima vez que el cliente abrio su itinerario. Solo se llama desde el navegador.';

revoke all     on function public.registrar_apertura(text) from public;
grant  execute on function public.registrar_apertura(text) to anon, authenticated;
