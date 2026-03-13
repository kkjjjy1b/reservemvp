alter table public.reservations
add column color_key text;

update public.reservations
set color_key = case mod(abs(hashtext(id::text)), 5)
  when 0 then 'rose'
  when 1 then 'mint'
  when 2 then 'sky'
  when 3 then 'amber'
  else 'violet'
end
where color_key is null;

alter table public.reservations
alter column color_key set not null;

alter table public.reservations
add constraint reservations_color_key_chk
check (color_key in ('rose', 'mint', 'sky', 'amber', 'violet'));
