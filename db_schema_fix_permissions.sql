-- Povolení INSERT pro tabulku licence pro přihlášené uživatele
-- (Uživatel může vložit licenci pouze pro sebe)

-- Nejprve povolíme RLS (pokud není)
alter table public.licence enable row level security;

-- Policy pro vkládání (INSERT)
create policy "Uživatelé mohou vkládat vlastní licence"
on public.licence for insert
with check (
  auth.uid() in (
    select auth_id from public.osoby where id = licence.osoba_id
  )
);

-- Policy pro čtení (SELECT) - už existuje? Pro jistotu:
create policy "Licence jsou viditelné pro všechny"
on public.licence for select
using (true);

-- Policy pro mazání (DELETE) - jen vlastník nebo admin
create policy "Vlastník může smazat svou (neschválenou) licenci"
on public.licence for delete
using (
  auth.uid() in (
    select auth_id from public.osoby where id = licence.osoba_id
  )
  AND schvaleno = false -- Může smazat jen neschválenou
);
