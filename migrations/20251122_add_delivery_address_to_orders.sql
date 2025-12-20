-- Migration: add delivery_address to orders
-- Adds a delivery_address column to store delivery address text for sales orders

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_address VARCHAR(500);
