-- JoTrip Sea Request Ledger v2
-- Confirmation invariant: a request can be CONFIRMED only when
-- sea suitability, operation, and actual availability are all explicitly green.

CREATE OR REPLACE FUNCTION sea_api.ops_update_request(
  p_request_code text,
  p_status text DEFAULT NULL,
  p_sea_suitability text DEFAULT NULL,
  p_operation_status text DEFAULT NULL,
  p_availability_status text DEFAULT NULL,
  p_public_note text DEFAULT NULL,
  p_private_note text DEFAULT NULL,
  p_actor text DEFAULT 'ops'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, sea, sea_api
AS $$
DECLARE
  v_before sea.requests%ROWTYPE;
  v_after sea.requests%ROWTYPE;
  v_next_status text;
  v_next_sea text;
  v_next_operation text;
  v_next_availability text;
BEGIN
  p_request_code := upper(btrim(p_request_code));
  p_status := nullif(upper(btrim(p_status)), '');
  p_sea_suitability := nullif(upper(btrim(p_sea_suitability)), '');
  p_operation_status := nullif(upper(btrim(p_operation_status)), '');
  p_availability_status := nullif(upper(btrim(p_availability_status)), '');
  p_public_note := nullif(btrim(p_public_note), '');
  p_private_note := nullif(btrim(p_private_note), '');
  p_actor := coalesce(nullif(btrim(p_actor), ''), 'ops');

  SELECT * INTO v_before
  FROM sea.requests
  WHERE request_code = p_request_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('NEW','CHECKING','CONFIRMED','MODIFY','UNAVAILABLE','CANCELLED','EXPIRED') THEN
    RAISE EXCEPTION 'invalid status' USING ERRCODE = '22023';
  END IF;
  IF p_sea_suitability IS NOT NULL AND p_sea_suitability NOT IN ('PENDING','GO','MODIFY','HOLD','CANCEL') THEN
    RAISE EXCEPTION 'invalid sea suitability' USING ERRCODE = '22023';
  END IF;
  IF p_operation_status IS NOT NULL AND p_operation_status NOT IN ('PENDING','OPERATING','LIMITED','NOT_OPERATING') THEN
    RAISE EXCEPTION 'invalid operation status' USING ERRCODE = '22023';
  END IF;
  IF p_availability_status IS NOT NULL AND p_availability_status NOT IN ('PENDING','AVAILABLE','LIMITED','UNAVAILABLE') THEN
    RAISE EXCEPTION 'invalid availability status' USING ERRCODE = '22023';
  END IF;
  IF p_public_note IS NOT NULL AND length(p_public_note) > 1000 THEN
    RAISE EXCEPTION 'public note too long' USING ERRCODE = '22023';
  END IF;
  IF p_private_note IS NOT NULL AND length(p_private_note) > 2000 THEN
    RAISE EXCEPTION 'private note too long' USING ERRCODE = '22023';
  END IF;

  v_next_status := coalesce(p_status, v_before.status);
  v_next_sea := coalesce(p_sea_suitability, v_before.sea_suitability);
  v_next_operation := coalesce(p_operation_status, v_before.operation_status);
  v_next_availability := coalesce(p_availability_status, v_before.availability_status);

  IF v_next_status = 'CONFIRMED' AND NOT (
    v_next_sea = 'GO'
    AND v_next_operation = 'OPERATING'
    AND v_next_availability = 'AVAILABLE'
  ) THEN
    RAISE EXCEPTION 'CONFIRMED requires sea GO, operation OPERATING, and availability AVAILABLE'
      USING ERRCODE = '22023';
  END IF;

  UPDATE sea.requests
  SET status = v_next_status,
      sea_suitability = v_next_sea,
      operation_status = v_next_operation,
      availability_status = v_next_availability,
      public_note = coalesce(p_public_note, public_note),
      confirmed_at = CASE
        WHEN v_next_status = 'CONFIRMED' AND confirmed_at IS NULL THEN now()
        ELSE confirmed_at
      END
  WHERE id = v_before.id
  RETURNING * INTO v_after;

  INSERT INTO sea.request_events(
    request_id, event_type, from_status, to_status,
    public_message, private_note, actor
  ) VALUES (
    v_after.id, 'OPS_UPDATE', v_before.status, v_after.status,
    p_public_note, p_private_note, p_actor
  );

  RETURN jsonb_build_object(
    'found', true,
    'request_code', v_after.request_code,
    'status', v_after.status,
    'sea_suitability', v_after.sea_suitability,
    'operation_status', v_after.operation_status,
    'availability_status', v_after.availability_status,
    'updated_at', v_after.updated_at
  );
END $$;
