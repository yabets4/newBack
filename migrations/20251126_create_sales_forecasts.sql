-- Migration: create sales_forecasts table
CREATE TABLE IF NOT EXISTS sales_forecasts (
  id SERIAL PRIMARY KEY,
  timestamp timestamptz DEFAULT now(),
  params jsonb,
  results jsonb
);
