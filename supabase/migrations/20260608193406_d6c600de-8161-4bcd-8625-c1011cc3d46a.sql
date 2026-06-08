
CREATE TABLE public.diensten (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  datum date NOT NULL,
  aanwezig_tijd time NOT NULL,
  dienst_tijd time NOT NULL,
  titel text NOT NULL DEFAULT '',
  misdienaars text[] NOT NULL DEFAULT '{}',
  toelichting text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX diensten_datum_tijd_uniq ON public.diensten (datum, dienst_tijd);
CREATE INDEX diensten_datum_idx ON public.diensten (datum);

GRANT SELECT ON public.diensten TO anon;
GRANT SELECT ON public.diensten TO authenticated;
GRANT ALL ON public.diensten TO service_role;

ALTER TABLE public.diensten ENABLE ROW LEVEL SECURITY;

-- Publiek leesbaar (openbare dienlijst)
CREATE POLICY "Diensten zijn publiek leesbaar"
  ON public.diensten FOR SELECT
  TO anon, authenticated
  USING (true);

-- Geen schrijfrechten via Data API; alleen via server functions met service_role + wachtwoord
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER diensten_set_updated_at
  BEFORE UPDATE ON public.diensten
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
