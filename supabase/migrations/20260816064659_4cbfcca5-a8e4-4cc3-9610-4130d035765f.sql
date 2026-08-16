-- GIVEAWAYS -----------------------------------------------------------------
CREATE TABLE public.giveaways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  prize text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  winner_name text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.giveaways TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.giveaways TO authenticated;
GRANT ALL ON public.giveaways TO service_role;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "giveaways public read" ON public.giveaways FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "giveaways staff manage" ON public.giveaways FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER giveaways_updated_at BEFORE UPDATE ON public.giveaways
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.giveaway_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id uuid NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (giveaway_id, user_id)
);
GRANT SELECT, INSERT ON public.giveaway_entries TO authenticated;
GRANT ALL ON public.giveaway_entries TO service_role;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entries insert own" ON public.giveaway_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "entries read own" ON public.giveaway_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "entries staff read" ON public.giveaway_entries FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.giveaway_entry_counts()
RETURNS TABLE (giveaway_id uuid, entries bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT e.giveaway_id, count(*) FROM public.giveaway_entries e GROUP BY e.giveaway_id;
$$;
REVOKE ALL ON FUNCTION public.giveaway_entry_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.giveaway_entry_counts() TO anon, authenticated;

-- APPLICATIONS (whitelist + ban appeals) --------------------------------------
CREATE TABLE public.member_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'whitelist',
  display_name text NOT NULL DEFAULT 'Member',
  discord text,
  character_name text,
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  staff_notes text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.member_applications TO authenticated;
GRANT ALL ON public.member_applications TO service_role;
ALTER TABLE public.member_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "apps insert own" ON public.member_applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "apps read own" ON public.member_applications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "apps staff manage" ON public.member_applications FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER member_applications_updated_at BEFORE UPDATE ON public.member_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- WANTED LIST -----------------------------------------------------------------
CREATE TABLE public.wanted_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  crime text NOT NULL DEFAULT '',
  bounty integer NOT NULL DEFAULT 0,
  danger text NOT NULL DEFAULT 'medium',
  photo_url text,
  status text NOT NULL DEFAULT 'wanted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wanted_list TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wanted_list TO authenticated;
GRANT ALL ON public.wanted_list TO service_role;
ALTER TABLE public.wanted_list ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wanted public read" ON public.wanted_list FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "wanted staff manage" ON public.wanted_list FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER wanted_list_updated_at BEFORE UPDATE ON public.wanted_list
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- REFERRALS -------------------------------------------------------------------
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_id)
);
GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals read own" ON public.referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());
CREATE POLICY "referrals staff read" ON public.referrals FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "referrals insert own" ON public.referrals FOR INSERT TO authenticated WITH CHECK (referred_id = auth.uid());

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code) WHERE referral_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.redeem_referral(_code text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ref_user uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT user_id INTO ref_user FROM public.profiles WHERE upper(referral_code) = upper(_code);
  IF ref_user IS NULL THEN RAISE EXCEPTION 'Unknown referral code'; END IF;
  IF ref_user = auth.uid() THEN RAISE EXCEPTION 'You cannot use your own code'; END IF;
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = auth.uid()) THEN
    RAISE EXCEPTION 'You already used a referral code';
  END IF;
  INSERT INTO public.referrals (referrer_id, referred_id, code) VALUES (ref_user, auth.uid(), upper(_code));
  UPDATE public.profiles SET credits = credits + 100 WHERE user_id = auth.uid();
  UPDATE public.profiles SET credits = credits + 250 WHERE user_id = ref_user;
  INSERT INTO public.credit_ledger (user_id, amount, reason) VALUES (auth.uid(), 100, 'referral_redeemed');
  INSERT INTO public.credit_ledger (user_id, amount, reason) VALUES (ref_user, 250, 'referral_bonus');
  RETURN 'ok';
END; $$;
REVOKE ALL ON FUNCTION public.redeem_referral(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_referral(text) TO authenticated;

INSERT INTO public.wanted_list (name, crime, bounty, danger, status) VALUES
  ('Marcus "Hollow" Vane', 'Armed robbery of the Pacific Bank vault', 75000, 'extreme', 'wanted'),
  ('Delia Crane', 'Arson at the Vinewood clinic', 42000, 'high', 'wanted'),
  ('The Butcher of Sandy Shores', 'Multiple abductions, no confirmed identity', 120000, 'extreme', 'wanted'),
  ('Ricky Salt', 'Street racing, evading police, chop shop operation', 18000, 'medium', 'wanted'),
  ('Nina Vale', 'Blackmail of city officials', 30000, 'high', 'captured');

INSERT INTO public.giveaways (title, prize, description, ends_at, status) VALUES
  ('Halloween Blood Drop', '5,000 credits + Platinum tier for 1 month', 'One entry per member. Winner drawn live in Discord.', now() + interval '14 days', 'active'),
  ('Custom Vehicle Giveaway', 'Fully customised in-game vehicle of your choice', 'Open to all whitelisted members.', now() + interval '30 days', 'active');