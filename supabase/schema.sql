-- Updated Supabase Schema for Afrisale Pricing Engine

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_no TEXT UNIQUE NOT NULL, -- e.g., BE001, AL001
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Suppliers Table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact TEXT,
  access_token UUID DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Supplier Prices Table
CREATE TABLE supplier_prices (
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (supplier_id, product_id)
);

-- 5. Pricing Configuration (Per-Product Margin/Overrides)
CREATE TABLE pricing_config (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  margin_type TEXT DEFAULT 'percentage', -- 'percentage' or 'fixed'
  margin_value DECIMAL(10, 2) DEFAULT 15.00,
  override_price DECIMAL(10, 2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Final Materialized Prices Table
CREATE TABLE final_prices (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  lowest_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Pricing Engine Logic (Trigger-based)
CREATE OR REPLACE FUNCTION recalculate_price(p_id UUID)
RETURNS VOID AS $$
DECLARE
  lowest NUMERIC;
  margin_type TEXT;
  margin_value NUMERIC;
  override NUMERIC;
  final NUMERIC;
BEGIN
  -- Get lowest supplier price
  SELECT MIN(price) INTO lowest
  FROM supplier_prices
  WHERE product_id = p_id;

  -- Get config (fallback to defaults if not specifically set)
  SELECT c.margin_type, c.margin_value, c.override_price
  INTO margin_type, margin_value, override
  FROM pricing_config c
  WHERE product_id = p_id;

  -- Default handle if no specific config exists yet
  IF margin_type IS NULL THEN
     margin_type := 'percentage';
     margin_value := 15.00;
  END IF;

  -- Calculate final
  IF override IS NOT NULL THEN
    final := override;
  ELSE
    IF lowest IS NULL THEN
      final := NULL;
    ELSE
      IF margin_type = 'percentage' THEN
        final := lowest * (1 + margin_value / 100);
      ELSE
        final := lowest + margin_value;
      END IF;
    END IF;
  END IF;

  -- Upsert into materialized table
  INSERT INTO final_prices(product_id, lowest_price, final_price, updated_at)
  VALUES (p_id, lowest, final, now())
  ON CONFLICT (product_id)
  DO UPDATE SET
    lowest_price = EXCLUDED.lowest_price,
    final_price = EXCLUDED.final_price,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 8. Triggers
-- Trigger for supplier price changes
CREATE OR REPLACE FUNCTION trigger_recalculate_price()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_price(OLD.product_id);
    RETURN OLD;
  ELSE
    PERFORM recalculate_price(NEW.product_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_supplier_price_change ON supplier_prices;
CREATE TRIGGER on_supplier_price_change
AFTER INSERT OR UPDATE OR DELETE ON supplier_prices
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_price();

-- Trigger for config changes
DROP TRIGGER IF EXISTS on_config_change ON pricing_config;
CREATE TRIGGER on_config_change
AFTER INSERT OR UPDATE ON pricing_config
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_price();
