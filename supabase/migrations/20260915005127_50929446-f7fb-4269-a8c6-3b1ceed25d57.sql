ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS id_verification_status text NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS payment_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS admin_notes text NOT NULL DEFAULT '';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_verification_status_check
  CHECK (id_verification_status IN ('unverified','pending','verified','rejected'));

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_account_status_check
  CHECK (account_status IN ('active','suspended'));

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));