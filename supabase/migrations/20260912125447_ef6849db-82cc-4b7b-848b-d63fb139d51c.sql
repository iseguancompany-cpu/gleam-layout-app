-- 1. balance on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance numeric(14,2) NOT NULL DEFAULT 0;

-- 2. cash loads
CREATE TABLE IF NOT EXISTS public.cash_loads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cash_loads TO authenticated;
GRANT ALL ON public.cash_loads TO service_role;
ALTER TABLE public.cash_loads ENABLE ROW LEVEL SECURITY;
CREATE POLICY cash_loads_select_own ON public.cash_loads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY cash_loads_select_admin ON public.cash_loads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. admin audit log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_select_admin ON public.admin_audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. withdrawal request validation (no fees; amount must fit available balance)
CREATE OR REPLACE FUNCTION public.validate_withdrawal_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bal numeric;
  pending_total numeric;
BEGIN
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Withdrawal amount must be greater than zero';
  END IF;

  SELECT balance INTO bal FROM public.profiles WHERE id = NEW.user_id;
  IF bal IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO pending_total
  FROM public.withdrawal_requests
  WHERE user_id = NEW.user_id AND status = 'pending';

  IF NEW.amount > (bal - pending_total) THEN
    RAISE EXCEPTION 'Amount exceeds your available balance';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_withdrawal_request() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS withdrawals_validate ON public.withdrawal_requests;
CREATE TRIGGER withdrawals_validate BEFORE INSERT ON public.withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal_request();

-- 5. admin: set withdrawal status (deducts only the requested amount, once)
CREATE OR REPLACE FUNCTION public.admin_set_withdrawal_status(
  _withdrawal_id uuid,
  _status withdrawal_status,
  _note text DEFAULT NULL
)
RETURNS public.withdrawal_requests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wr public.withdrawal_requests;
  admin_uid uuid := auth.uid();
BEGIN
  IF NOT public.has_role(admin_uid, 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO wr FROM public.withdrawal_requests WHERE id = _withdrawal_id FOR UPDATE;
  IF wr.id IS NULL THEN
    RAISE EXCEPTION 'Withdrawal request not found';
  END IF;

  IF wr.status <> 'pending' THEN
    RAISE EXCEPTION 'This request has already been processed';
  END IF;

  IF _status = 'approved' OR _status = 'completed' THEN
    UPDATE public.profiles
       SET balance = balance - wr.amount
     WHERE id = wr.user_id AND balance >= wr.amount;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'User balance is no longer sufficient for this request';
    END IF;

    INSERT INTO public.activity_log (user_id, kind, description, amount)
    VALUES (wr.user_id, 'withdrawal', 'Withdrawal ' || _status::text || ' — ' || wr.method_summary, wr.amount);
  ELSIF _status = 'rejected' THEN
    INSERT INTO public.activity_log (user_id, kind, description, amount)
    VALUES (wr.user_id, 'withdrawal', 'Withdrawal declined — ' || wr.method_summary, wr.amount);
  ELSE
    RAISE EXCEPTION 'Unsupported status';
  END IF;

  UPDATE public.withdrawal_requests
     SET status = _status,
         admin_note = COALESCE(_note, admin_note),
         updated_at = now()
   WHERE id = _withdrawal_id
  RETURNING * INTO wr;

  INSERT INTO public.admin_audit_log (admin_id, target_user_id, action, detail)
  VALUES (admin_uid, wr.user_id, 'withdrawal_' || _status::text,
          jsonb_build_object('withdrawal_id', wr.id, 'amount', wr.amount));

  RETURN wr;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_withdrawal_status(uuid, withdrawal_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_withdrawal_status(uuid, withdrawal_status, text) TO authenticated;

-- 6. admin: load cash (no fees, no charges)
CREATE OR REPLACE FUNCTION public.admin_load_cash(
  _user_id uuid,
  _amount numeric,
  _note text DEFAULT ''
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_uid uuid := auth.uid();
  new_balance numeric;
BEGIN
  IF NOT public.has_role(admin_uid, 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  UPDATE public.profiles SET balance = balance + _amount WHERE id = _user_id
  RETURNING balance INTO new_balance;
  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  INSERT INTO public.cash_loads (user_id, admin_id, amount, note)
  VALUES (_user_id, admin_uid, _amount, COALESCE(_note, ''));

  INSERT INTO public.activity_log (user_id, kind, description, amount)
  VALUES (_user_id, 'deposit', CASE WHEN COALESCE(_note,'') = '' THEN 'Cash loaded to account' ELSE 'Cash loaded — ' || _note END, _amount);

  INSERT INTO public.admin_audit_log (admin_id, target_user_id, action, detail)
  VALUES (admin_uid, _user_id, 'cash_load', jsonb_build_object('amount', _amount));

  RETURN new_balance;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_load_cash(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_load_cash(uuid, numeric, text) TO authenticated;

-- 7. allow admin-side activity inserts through definer funcs only; admins may read all activity (exists)
-- 8. designated admin account
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, country, referrer)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'country', 'United States'),
    COALESCE(NEW.raw_user_meta_data ->> 'referrer', '')
  )
  ON CONFLICT (id) DO NOTHING;

  IF lower(COALESCE(NEW.email, '')) = 'emmanueljunioru@gmail.com' THEN
    assigned_role := 'admin';
  ELSIF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    assigned_role := 'user';
  ELSE
    assigned_role := 'admin';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE lower(email) = 'emmanueljunioru@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;