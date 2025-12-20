-- Table to store raw material movements
CREATE TABLE raw_material_movements (
    movement_id BIGSERIAL PRIMARY KEY,
    company_id VARCHAR(20) NOT NULL REFERENCES companies(company_id) ON DELETE CASCADE,
    raw_material_id VARCHAR(20) NOT NULL,
    movement_type VARCHAR(20) NOT NULL, -- 'Inbound', 'Outbound', 'Transfer', 'Adjustment'
    quantity DECIMAL(10, 2) NOT NULL,
    movement_date DATE NOT NULL,
    
    -- Inbound specific
    source_document VARCHAR(100), -- e.g., PO number
    supplier VARCHAR(255),

    -- Outbound specific
    destination_document VARCHAR(100), -- e.g., Production Order
    department_or_project VARCHAR(100),

    -- Transfer specific
    from_location VARCHAR(255),
    to_location VARCHAR(255),

    -- Adjustment specific
    adjustment_type VARCHAR(20), -- 'Increase', 'Decrease'
    adjustment_reason VARCHAR(255),

    notes TEXT,
    responsible_person VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (company_id, raw_material_id) REFERENCES raw_materials(company_id, raw_material_id)
);

-- This trigger will update the current_stock in raw_materials table
CREATE OR REPLACE FUNCTION update_raw_material_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.movement_type = 'Inbound' OR (NEW.movement_type = 'Adjustment' AND NEW.adjustment_type = 'Increase') THEN
            UPDATE raw_materials
            SET current_stock = current_stock + NEW.quantity
            WHERE company_id = NEW.company_id AND raw_material_id = NEW.raw_material_id;
        ELSIF NEW.movement_type = 'Outbound' OR (NEW.movement_type = 'Adjustment' AND NEW.adjustment_type = 'Decrease') THEN
            UPDATE raw_materials
            SET current_stock = current_stock - NEW.quantity
            WHERE company_id = NEW.company_id AND raw_material_id = NEW.raw_material_id;
        END IF;
        -- For 'Transfer', stock level doesn't change globally, only location.
    ELSIF TG_OP = 'DELETE' THEN
        -- Revert the stock change on deletion of a movement
        IF OLD.movement_type = 'Inbound' OR (OLD.movement_type = 'Adjustment' AND OLD.adjustment_type = 'Increase') THEN
            UPDATE raw_materials
            SET current_stock = current_stock - OLD.quantity
            WHERE company_id = OLD.company_id AND raw_material_id = OLD.raw_material_id;
        ELSIF OLD.movement_type = 'Outbound' OR (OLD.movement_type = 'Adjustment' AND OLD.adjustment_type = 'Decrease') THEN
            UPDATE raw_materials
            SET current_stock = current_stock + OLD.quantity
            WHERE company_id = OLD.company_id AND raw_material_id = OLD.raw_material_id;
        END IF;
    END IF;
    RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the movements table
CREATE TRIGGER stock_update_trigger
AFTER INSERT OR DELETE ON raw_material_movements
FOR EACH ROW EXECUTE FUNCTION update_raw_material_stock();
