CREATE OR REPLACE FUNCTION public.admin_set_withdrawal_status(_withdrawal_id uuid, _status withdrawal_status, _note text DEFAULT NULL::text)
 RETURNS withdrawal_requests
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  IF wr.status = 'pending' AND (_status = 'approved' OR _status = 'completed') THEN
    UPDATE public.profiles
       SET balance = balance - wr.amount
     WHERE id = wr.user_id AND balance >= wr.amount;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'User balance is no longer sufficient for this request';
    END IF;

    INSERT INTO public.activity_log (user_id, kind, description, amount)
    VALUES (wr.user_id, 'withdrawal', 'Withdrawal ' || _status::text || ' - ' || wr.method_summary, wr.amount);

  ELSIF wr.status = 'pending' AND _status = 'rejected' THEN
    INSERT INTO public.activity_log (user_id, kind, description, amount)
    VALUES (wr.user_id, 'withdrawal', 'Withdrawal declined - ' || wr.method_summary, wr.amount);

  ELSIF wr.status = 'approved' AND _status = 'completed' THEN
    -- Settlement only: the balance was already reduced at approval time.
    INSERT INTO public.activity_log (user_id, kind, description, amount)
    VALUES (wr.user_id, 'withdrawal', 'Withdrawal paid out - ' || wr.method_summary, wr.amount);

  ELSE
    RAISE EXCEPTION 'This request has already been processed';
  END IF;

  UPDATE public.withdrawal_requests
     SET status = _status,
         admin_note = COALESCE(NULLIF(_note, ''), admin_note),
         updated_at = now()
   WHERE id = _withdrawal_id
  RETURNING * INTO wr;

  INSERT INTO public.admin_audit_log (admin_id, target_user_id, action, detail)
  VALUES (admin_uid, wr.user_id, 'withdrawal_' || _status::text,
          jsonb_build_object('withdrawal_id', wr.id, 'amount', wr.amount));

  RETURN wr;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_withdrawal_status(uuid, withdrawal_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_withdrawal_status(uuid, withdrawal_status, text) TO authenticated;