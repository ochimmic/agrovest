ALTER TABLE public.payout_requests ADD COLUMN rate numeric NOT NULL DEFAULT 1550;
ALTER TABLE public.payout_requests ADD CONSTRAINT payout_rate_sane CHECK (rate > 100 AND rate < 100000) NOT VALID;