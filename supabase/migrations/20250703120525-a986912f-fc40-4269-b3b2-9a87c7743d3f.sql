
-- Dodaj kolumnę 'active' do tabeli members (domyślnie wszyscy członkowie są aktywni)
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Ustaw nieaktywnych członków zgodnie z Twoimi wymaganiami
UPDATE public.members 
SET active = false 
WHERE name IN ('Anna Lakomiak-Melka', 'Agata Łakomiak', 'Piotr Szajkowski');
