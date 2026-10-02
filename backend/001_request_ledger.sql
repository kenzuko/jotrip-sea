-- JoTrip Sea Request Ledger v1
-- Runtime target: Neon default database `neondb`.
-- No secrets belong in this file.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE SCHEMA IF NOT EXISTS sea AUTHORIZATION neondb_owner;
CREATE SCHEMA IF NOT EXISTS sea_api AUTHORIZATION neondb_owner;

CREATE TABLE IF NOT EXISTS sea.requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_code text NOT NULL UNIQUE,
  public_token text NOT NULL UNIQUE,
  idempotency_key text UNIQUE,
  service text NOT NULL CHECK (service IN ('fishing','snorkeling','scuba-diving','private-cano','island-trips','yacht-charter','sunset','squid-fishing')),
  trip_date date NOT NULL,
  pax smallint NOT NULL CHECK (pax BETWEEN 1 AND 40),
  hotel_area text,
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  customer_name text NOT NULL,
  customer_contact text,
  customer_notes text,
  source_channel text NOT NULL DEFAULT 'web',
  status text NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW','CHECKING','CONFIRMED','MODIFY','UNAVAILABLE','CANCELLED','EXPIRED')),
  sea_suitability text NOT NULL DEFAULT 'PENDING' CHECK (sea_suitability IN ('PENDING','GO','MODIFY','HOLD','CANCEL')),
  operation_status text NOT NULL DEFAULT 'PENDING' CHECK (operation_status IN ('PENDING','OPERATING','LIMITED','NOT_OPERATING')),
  availability_status text NOT NULL DEFAULT 'PENDING' CHECK (availability_status IN ('PENDING','AVAILABLE','LIMITED','UNAVAILABLE')),
  public_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

CREATE TABLE IF NOT EXISTS sea.request_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id bigint NOT NULL REFERENCES sea.requests(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  public_message text,
  private_note text,
  actor text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS requests_status_trip_date_idx ON sea.requests(status, trip_date);
CREATE INDEX IF NOT EXISTS requests_created_at_idx ON sea.requests(created_at DESC);
CREATE INDEX IF NOT EXISTS request_events_request_id_created_at_idx ON sea.request_events(request_id, created_at);

CREATE OR REPLACE FUNCTION sea.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS requests_touch_updated_at ON sea.requests;
CREATE TRIGGER requests_touch_updated_at BEFORE UPDATE ON sea.requests FOR EACH ROW EXECUTE FUNCTION sea.touch_updated_at();

CREATE OR REPLACE FUNCTION sea_api.create_request(
  p_service text, p_trip_date date, p_pax integer, p_customer_name text,
  p_hotel_area text DEFAULT NULL, p_options jsonb DEFAULT '{}'::jsonb,
  p_customer_contact text DEFAULT NULL, p_customer_notes text DEFAULT NULL,
  p_idempotency_key text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, sea, sea_api AS $$
DECLARE
  v_req sea.requests%ROWTYPE; v_existing sea.requests%ROWTYPE;
  v_code text; v_token text; v_try integer;
BEGIN
  p_service := lower(btrim(p_service));
  p_customer_name := btrim(p_customer_name);
  p_hotel_area := nullif(btrim(p_hotel_area), '');
  p_customer_contact := nullif(btrim(p_customer_contact), '');
  p_customer_notes := nullif(btrim(p_customer_notes), '');
  p_idempotency_key := nullif(btrim(p_idempotency_key), '');
  p_options := coalesce(p_options, '{}'::jsonb);

  IF p_service NOT IN ('fishing','snorkeling','scuba-diving','private-cano','island-trips','yacht-charter','sunset','squid-fishing') THEN RAISE EXCEPTION 'invalid service' USING ERRCODE='22023'; END IF;
  IF p_trip_date IS NULL OR p_trip_date < ((now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) THEN RAISE EXCEPTION 'trip date must be today or later' USING ERRCODE='22023'; END IF;
  IF p_pax IS NULL OR p_pax < 1 OR p_pax > 40 THEN RAISE EXCEPTION 'pax must be between 1 and 40' USING ERRCODE='22023'; END IF;
  IF p_customer_name IS NULL OR p_customer_name = '' OR length(p_customer_name) > 100 THEN RAISE EXCEPTION 'customer name is required and must be <= 100 characters' USING ERRCODE='22023'; END IF;
  IF p_hotel_area IS NOT NULL AND length(p_hotel_area) > 200 THEN RAISE EXCEPTION 'hotel area must be <= 200 characters' USING ERRCODE='22023'; END IF;
  IF p_customer_contact IS NOT NULL AND length(p_customer_contact) > 120 THEN RAISE EXCEPTION 'contact must be <= 120 characters' USING ERRCODE='22023'; END IF;
  IF p_customer_notes IS NOT NULL AND length(p_customer_notes) > 1500 THEN RAISE EXCEPTION 'notes must be <= 1500 characters' USING ERRCODE='22023'; END IF;
  IF jsonb_typeof(p_options) <> 'object' OR octet_length(p_options::text) > 8000 THEN RAISE EXCEPTION 'options must be a JSON object <= 8KB' USING ERRCODE='22023'; END IF;
  IF p_idempotency_key IS NOT NULL AND length(p_idempotency_key) > 120 THEN RAISE EXCEPTION 'idempotency key too long' USING ERRCODE='22023'; END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing FROM sea.requests WHERE idempotency_key=p_idempotency_key LIMIT 1;
    IF FOUND THEN RETURN jsonb_build_object('created',false,'request_code',v_existing.request_code,'public_token',v_existing.public_token,'status',v_existing.status,'created_at',v_existing.created_at); END IF;
  END IF;

  FOR v_try IN 1..5 LOOP
    v_code := 'JTSEA-' || to_char(now() AT TIME ZONE 'Asia/Ho_Chi_Minh','YYMMDD') || '-' || upper(substr(encode(public.gen_random_bytes(6),'hex'),1,10));
    v_token := encode(public.gen_random_bytes(24),'hex');
    BEGIN
      INSERT INTO sea.requests(request_code,public_token,idempotency_key,service,trip_date,pax,hotel_area,options,customer_name,customer_contact,customer_notes,source_channel)
      VALUES(v_code,v_token,p_idempotency_key,p_service,p_trip_date,p_pax,p_hotel_area,p_options,p_customer_name,p_customer_contact,p_customer_notes,'web') RETURNING * INTO v_req;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF p_idempotency_key IS NOT NULL THEN
        SELECT * INTO v_existing FROM sea.requests WHERE idempotency_key=p_idempotency_key LIMIT 1;
        IF FOUND THEN RETURN jsonb_build_object('created',false,'request_code',v_existing.request_code,'public_token',v_existing.public_token,'status',v_existing.status,'created_at',v_existing.created_at); END IF;
      END IF;
      IF v_try=5 THEN RAISE; END IF;
    END;
  END LOOP;

  INSERT INTO sea.request_events(request_id,event_type,to_status,public_message,actor)
  VALUES(v_req.id,'CREATED',v_req.status,'JoTrip đã nhận yêu cầu và đang kiểm tra điều kiện biển, vận hành và availability thực tế.','web');
  RETURN jsonb_build_object('created',true,'request_code',v_req.request_code,'public_token',v_req.public_token,'status',v_req.status,'created_at',v_req.created_at);
END $$;

CREATE OR REPLACE FUNCTION sea_api.get_request(p_public_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = pg_catalog, sea, sea_api AS $$
DECLARE v_req sea.requests%ROWTYPE; v_events jsonb;
BEGIN
  p_public_token := lower(btrim(p_public_token));
  IF p_public_token IS NULL OR p_public_token !~ '^[0-9a-f]{48}$' THEN RETURN jsonb_build_object('found',false); END IF;
  SELECT * INTO v_req FROM sea.requests WHERE public_token=p_public_token LIMIT 1;
  IF NOT FOUND THEN RETURN jsonb_build_object('found',false); END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('event_type',e.event_type,'status',e.to_status,'message',e.public_message,'created_at',e.created_at) ORDER BY e.created_at),'[]'::jsonb)
  INTO v_events FROM sea.request_events e WHERE e.request_id=v_req.id AND e.public_message IS NOT NULL;
  RETURN jsonb_build_object('found',true,'request_code',v_req.request_code,'service',v_req.service,'trip_date',v_req.trip_date,'pax',v_req.pax,'hotel_area',v_req.hotel_area,'options',v_req.options,'status',v_req.status,'sea_suitability',v_req.sea_suitability,'operation_status',v_req.operation_status,'availability_status',v_req.availability_status,'public_note',v_req.public_note,'created_at',v_req.created_at,'updated_at',v_req.updated_at,'events',v_events);
END $$;

CREATE OR REPLACE FUNCTION sea_api.ops_update_request(
  p_request_code text, p_status text DEFAULT NULL, p_sea_suitability text DEFAULT NULL,
  p_operation_status text DEFAULT NULL, p_availability_status text DEFAULT NULL,
  p_public_note text DEFAULT NULL, p_private_note text DEFAULT NULL, p_actor text DEFAULT 'ops'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, sea, sea_api AS $$
DECLARE v_before sea.requests%ROWTYPE; v_after sea.requests%ROWTYPE;
BEGIN
  p_request_code:=upper(btrim(p_request_code)); p_status:=nullif(upper(btrim(p_status)),''); p_sea_suitability:=nullif(upper(btrim(p_sea_suitability)),''); p_operation_status:=nullif(upper(btrim(p_operation_status)),''); p_availability_status:=nullif(upper(btrim(p_availability_status)),''); p_public_note:=nullif(btrim(p_public_note),''); p_private_note:=nullif(btrim(p_private_note),''); p_actor:=coalesce(nullif(btrim(p_actor),''),'ops');
  SELECT * INTO v_before FROM sea.requests WHERE request_code=p_request_code FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('found',false); END IF;
  IF p_status IS NOT NULL AND p_status NOT IN ('NEW','CHECKING','CONFIRMED','MODIFY','UNAVAILABLE','CANCELLED','EXPIRED') THEN RAISE EXCEPTION 'invalid status' USING ERRCODE='22023'; END IF;
  IF p_sea_suitability IS NOT NULL AND p_sea_suitability NOT IN ('PENDING','GO','MODIFY','HOLD','CANCEL') THEN RAISE EXCEPTION 'invalid sea suitability' USING ERRCODE='22023'; END IF;
  IF p_operation_status IS NOT NULL AND p_operation_status NOT IN ('PENDING','OPERATING','LIMITED','NOT_OPERATING') THEN RAISE EXCEPTION 'invalid operation status' USING ERRCODE='22023'; END IF;
  IF p_availability_status IS NOT NULL AND p_availability_status NOT IN ('PENDING','AVAILABLE','LIMITED','UNAVAILABLE') THEN RAISE EXCEPTION 'invalid availability status' USING ERRCODE='22023'; END IF;
  IF p_public_note IS NOT NULL AND length(p_public_note)>1000 THEN RAISE EXCEPTION 'public note too long' USING ERRCODE='22023'; END IF;
  IF p_private_note IS NOT NULL AND length(p_private_note)>2000 THEN RAISE EXCEPTION 'private note too long' USING ERRCODE='22023'; END IF;
  UPDATE sea.requests SET status=coalesce(p_status,status),sea_suitability=coalesce(p_sea_suitability,sea_suitability),operation_status=coalesce(p_operation_status,operation_status),availability_status=coalesce(p_availability_status,availability_status),public_note=coalesce(p_public_note,public_note),confirmed_at=CASE WHEN coalesce(p_status,status)='CONFIRMED' AND confirmed_at IS NULL THEN now() ELSE confirmed_at END WHERE id=v_before.id RETURNING * INTO v_after;
  INSERT INTO sea.request_events(request_id,event_type,from_status,to_status,public_message,private_note,actor) VALUES(v_after.id,'OPS_UPDATE',v_before.status,v_after.status,p_public_note,p_private_note,p_actor);
  RETURN jsonb_build_object('found',true,'request_code',v_after.request_code,'status',v_after.status,'sea_suitability',v_after.sea_suitability,'operation_status',v_after.operation_status,'availability_status',v_after.availability_status,'updated_at',v_after.updated_at);
END $$;

CREATE OR REPLACE FUNCTION sea_api.ops_list_requests(p_from date DEFAULT current_date,p_to date DEFAULT (current_date+14),p_status text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = pg_catalog, sea, sea_api AS $$
DECLARE v_rows jsonb;
BEGIN
  p_status:=nullif(upper(btrim(p_status)),'');
  IF p_from IS NULL OR p_to IS NULL OR p_to<p_from OR p_to>p_from+31 THEN RAISE EXCEPTION 'date range must be valid and <= 31 days' USING ERRCODE='22023'; END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('request_code',r.request_code,'service',r.service,'trip_date',r.trip_date,'pax',r.pax,'hotel_area',r.hotel_area,'options',r.options,'customer_name',r.customer_name,'customer_contact',r.customer_contact,'customer_notes',r.customer_notes,'status',r.status,'sea_suitability',r.sea_suitability,'operation_status',r.operation_status,'availability_status',r.availability_status,'public_note',r.public_note,'created_at',r.created_at,'updated_at',r.updated_at) ORDER BY r.trip_date,r.created_at),'[]'::jsonb)
  INTO v_rows FROM (SELECT * FROM sea.requests WHERE trip_date BETWEEN p_from AND p_to AND (p_status IS NULL OR status=p_status) ORDER BY trip_date,created_at LIMIT 200) r;
  RETURN v_rows;
END $$;

REVOKE ALL ON SCHEMA sea FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA sea FROM PUBLIC;
REVOKE ALL ON SCHEMA sea_api FROM PUBLIC;
REVOKE ALL ON FUNCTION sea_api.create_request(text,date,integer,text,text,jsonb,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION sea_api.get_request(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION sea_api.ops_update_request(text,text,text,text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION sea_api.ops_list_requests(date,date,text) FROM PUBLIC;
GRANT USAGE ON SCHEMA sea_api TO jotrip_sea_ops;
GRANT EXECUTE ON FUNCTION sea_api.ops_update_request(text,text,text,text,text,text,text,text) TO jotrip_sea_ops;
GRANT EXECUTE ON FUNCTION sea_api.ops_list_requests(date,date,text) TO jotrip_sea_ops;
