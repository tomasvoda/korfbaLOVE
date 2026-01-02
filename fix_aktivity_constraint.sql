-- Skript pro opravu omezení (constraint) v tabulce aktivity
-- Povolíme nové typy aktivit: 'zapas_cks', 'zapas_int', 'turnaj', 'jine'

-- 1. Odstraníme staré omezení
ALTER TABLE aktivity DROP CONSTRAINT IF EXISTS aktivity_typ_aktivity_check;

-- 2. Přidáme nové omezení se všemi potřebnými typy
ALTER TABLE aktivity 
ADD CONSTRAINT aktivity_typ_aktivity_check 
CHECK (typ_aktivity IN ('trenink', 'zapas_cks', 'zapas_int', 'turnaj', 'jine', 'publikace', 'seminar'));

COMMENT ON TABLE aktivity IS 'Tabulka pro jednorázové aktivity a zápasy';
