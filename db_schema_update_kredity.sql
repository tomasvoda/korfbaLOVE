-- Přidání sloupce pro typ aktivity (pro výpočet kreditů)
-- Defaultně 'trenink' (1 kredit)
-- Další možnosti: 'zapas_cks' (3 kredity), 'zapas_int' (5 kreditů), 'publikace' (10 kreditů)

alter table public.cinnosti 
add column typ_aktivity text default 'trenink';

-- Aktualizace existujících záznamů
update public.cinnosti set typ_aktivity = 'trenink' where typ_aktivity is null;
