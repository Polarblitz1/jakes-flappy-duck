
CREATE TABLE public.scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 12),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scores"
  ON public.scores FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert scores"
  ON public.scores FOR INSERT
  WITH CHECK (true);

CREATE INDEX scores_score_desc_idx ON public.scores (score DESC, created_at ASC);
