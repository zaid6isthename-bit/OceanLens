-- Manual SQL migration to create vessel and observability tables (PostgreSQL)
CREATE TABLE IF NOT EXISTS vessel_positions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  imo TEXT NOT NULL,
  name TEXT,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  speed double precision,
  heading double precision,
  destination TEXT,
  eta timestamp with time zone,
  provider TEXT,
  lastUpdated timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vessel_positions_imo ON vessel_positions(imo);
CREATE INDEX IF NOT EXISTS idx_vessel_positions_lastUpdated ON vessel_positions(lastUpdated DESC);

CREATE TABLE IF NOT EXISTS vessel_tracking_cache (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  imo TEXT NOT NULL,
  payload JSONB NOT NULL,
  ttlSeconds INT NOT NULL DEFAULT 300,
  createdAt timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vessel_tracking_cache_imo ON vessel_tracking_cache(imo);

CREATE TABLE IF NOT EXISTS provider_metrics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event TEXT NOT NULL,
  details JSONB,
  createdAt timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provider_health (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  last_checked timestamp with time zone,
  avg_response_time double precision,
  available boolean DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_provider_health_provider ON provider_health(provider);

CREATE TABLE IF NOT EXISTS provider_failures (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  error TEXT
);

CREATE TABLE IF NOT EXISTS provider_request_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  details JSONB
);
