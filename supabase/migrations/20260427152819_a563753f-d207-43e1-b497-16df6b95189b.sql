-- Harden tg_set_updated_at: pin search_path, revoke direct execute
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.tg_set_updated_at() from public, anon, authenticated;

-- handle_new_user must remain SECURITY DEFINER (runs from auth schema trigger),
-- but revoke direct execute so only the trigger can invoke it.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
