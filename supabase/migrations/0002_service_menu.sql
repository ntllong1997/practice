-- Staff-managed service menu. Every menu item belongs to one of the two
-- categories (pedicure, nails); customers pick specific items at check-in.

create table salon.menu_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('pedicure', 'nails')),
  name text not null check (length(btrim(name)) between 1 and 40),
  sort int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table salon.menu_items enable row level security;
create unique index menu_items_active_name on salon.menu_items (category, lower(name)) where active;

insert into salon.menu_items (category, name, sort) values
  ('pedicure', 'Pedicure', 1),
  ('nails', 'Manicure', 1);

-- checkin_services.service keeps the category; the chosen item is recorded
-- by id plus a copy of its name, so renaming/removing a menu item later does
-- not change past tickets.
alter table salon.checkin_services
  add column item_id uuid references salon.menu_items (id) on delete set null,
  add column item_name text;
update salon.checkin_services set item_name = initcap(service) where item_name is null;
alter table salon.checkin_services drop constraint checkin_services_checkin_id_service_key;

-- ---------- menu (read by the check-in page) ----------

create or replace function public.salon_menu(p_key text)
returns json language plpgsql security definer set search_path = '' as $$
begin
  perform salon.assert_app_key(p_key);
  return coalesce((
    select json_agg(json_build_object('id', m.id, 'category', m.category, 'name', m.name)
                    order by m.category = 'nails', m.sort, lower(m.name))
    from salon.menu_items m where m.active
  ), '[]'::json);
end $$;

-- ---------- check-in with specific menu items ----------
-- The older salon_check_in(p_services text[]) overload is left in place so a
-- deployment running the previous app version keeps working during rollout.

create or replace function public.salon_check_in(
  p_key text, p_nonce text, p_name text, p_items uuid[]
) returns json language plpgsql security definer set search_path = '' as $$
declare
  v_date date;
  v_number int;
  v_id uuid;
  v_name text := nullif(left(btrim(coalesce(p_name, '')), 40), '');
  v_wanted int;
  v_found int;
begin
  perform salon.assert_app_key(p_key);

  select count(distinct i) into v_wanted from unnest(coalesce(p_items, '{}')) as i;
  select count(*) into v_found from salon.menu_items m where m.active and m.id = any (p_items);
  if v_wanted = 0 or v_wanted > 10 or v_found <> v_wanted then
    raise exception 'choose at least one valid service' using errcode = '22023';
  end if;
  if p_nonce is null or length(p_nonce) < 16 then
    raise exception 'invalid entry' using errcode = '22023';
  end if;

  v_date := salon.today();
  perform pg_advisory_xact_lock(hashtext('salon_check_in:' || v_date::text));

  select coalesce(max(ticket_number), 0) + 1 into v_number
  from salon.checkins where ticket_date = v_date;

  begin
    insert into salon.checkins (ticket_date, ticket_number, name, entry_nonce)
    values (v_date, v_number, v_name, p_nonce)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'this check-in link was already used' using errcode = 'P0001';
  end;

  -- Pedicure services first, then nails, in menu order.
  insert into salon.checkin_services (checkin_id, service, item_id, item_name, position)
  select v_id, m.category, m.id, m.name,
         row_number() over (order by m.category = 'nails', m.sort, lower(m.name))
  from salon.menu_items m
  where m.active and m.id = any (p_items);

  return json_build_object(
    'id', v_id, 'ticket_number', v_number, 'ticket_date', v_date,
    'name', v_name, 'created_at', now(),
    'services', (select json_agg(item_name order by position)
                 from salon.checkin_services where checkin_id = v_id)
  );
end $$;

-- ---------- dashboard now shows item names ----------

create or replace function public.salon_staff_today(p_key text, p_tag text)
returns json language plpgsql security definer set search_path = '' as $$
begin
  perform salon.assert_staff(p_key, p_tag);
  return coalesce((
    select json_agg(json_build_object(
      'id', c.id,
      'ticket_number', c.ticket_number,
      'name', c.name,
      'created_at', c.created_at,
      'services', (select json_agg(json_build_object(
                      'id', s.id, 'category', s.service, 'service', s.service,
                      'name', coalesce(s.item_name, initcap(s.service)), 'status', s.status,
                      'started_at', s.started_at, 'completed_at', s.completed_at)
                    order by s.position)
                   from salon.checkin_services s where s.checkin_id = c.id)
    ) order by c.ticket_number)
    from salon.checkins c
    where c.ticket_date = salon.today() and c.cancelled_at is null
  ), '[]'::json);
end $$;

-- ---------- staff: manage the menu ----------

create or replace function public.salon_staff_menu_add(
  p_key text, p_tag text, p_category text, p_name text
) returns json language plpgsql security definer set search_path = '' as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_item salon.menu_items;
begin
  perform salon.assert_staff(p_key, p_tag);
  if p_category not in ('pedicure', 'nails') or length(v_name) not between 1 and 40 then
    raise exception 'invalid service' using errcode = '22023';
  end if;
  begin
    insert into salon.menu_items (category, name, sort)
    values (p_category, v_name,
            (select coalesce(max(sort), 0) + 1 from salon.menu_items where category = p_category))
    returning * into v_item;
  exception when unique_violation then
    raise exception 'that service already exists' using errcode = 'P0003';
  end;
  return json_build_object('id', v_item.id, 'category', v_item.category, 'name', v_item.name);
end $$;

create or replace function public.salon_staff_menu_rename(
  p_key text, p_tag text, p_id uuid, p_name text
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_updated int;
begin
  perform salon.assert_staff(p_key, p_tag);
  if length(v_name) not between 1 and 40 then
    raise exception 'invalid service' using errcode = '22023';
  end if;
  begin
    update salon.menu_items set name = v_name where id = p_id and active;
  exception when unique_violation then
    raise exception 'that service already exists' using errcode = 'P0003';
  end;
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end $$;

-- Removing hides the item from the menu; past tickets keep their copy of the name.
create or replace function public.salon_staff_menu_remove(p_key text, p_tag text, p_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_updated int;
begin
  perform salon.assert_staff(p_key, p_tag);
  update salon.menu_items set active = false where id = p_id and active;
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end $$;

revoke all on function public.salon_menu(text) from public, anon, authenticated;
revoke all on function public.salon_check_in(text, text, text, uuid[]) from public, anon, authenticated;
revoke all on function public.salon_staff_menu_add(text, text, text, text) from public, anon, authenticated;
revoke all on function public.salon_staff_menu_rename(text, text, uuid, text) from public, anon, authenticated;
revoke all on function public.salon_staff_menu_remove(text, text, uuid) from public, anon, authenticated;
grant execute on function public.salon_menu(text) to anon;
grant execute on function public.salon_check_in(text, text, text, uuid[]) to anon;
grant execute on function public.salon_staff_menu_add(text, text, text, text) to anon;
grant execute on function public.salon_staff_menu_rename(text, text, uuid, text) to anon;
grant execute on function public.salon_staff_menu_remove(text, text, uuid) to anon;
