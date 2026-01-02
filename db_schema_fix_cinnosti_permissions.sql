-- Povolení INSERT pro tabulku cinnosti pro přihlášené uživatele
-- (Uživatel může vložit aktivitu pouze pro sebe)

-- Nejprve povolíme RLS (pokud není)
alter table public.cinnosti enable row level security;

-- Policy pro vkládání (INSERT)
create policy "Uživatelé mohou vkládat vlastní aktivity"
on public.cinnosti for insert
with check (
  auth.uid() in (
    select auth_id from public.osoby where id = cinnosti.osoba_id
  )
);

-- Policy pro čtení (SELECT) - už existuje? Pro jistotu:
create policy "Aktivity jsou viditelné pro všechny"
on public.cinnosti for select
using (true);

-- Policy pro mazání (DELETE) - jen vlastník nebo admin
create policy "Vlastník může smazat svou aktivitu"
on public.cinnosti for delete
using (
  auth.uid() in (
    select auth_id from public.osoby where id = cinnosti.osoba_id
  )
);
