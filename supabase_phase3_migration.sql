-- Phase 3 Migration: Inventory & Stock Management

-- 1. Product Categories Table
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    category_id UUID REFERENCES public.product_categories(id),
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
    quantity_in_stock INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Stock Movements Table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) NOT NULL,
    movement_type TEXT CHECK (movement_type IN ('stock_in','stock_out','adjustment')) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2),
    reference_type TEXT CHECK (reference_type IN ('purchase','credit_request','manual_adjustment')),
    reference_id UUID,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Function to auto-generate SKU
CREATE OR REPLACE FUNCTION generate_product_sku()
RETURNS TRIGGER AS $$
DECLARE
    new_sku TEXT;
    last_num INTEGER;
BEGIN
    -- Get the last number from the highest SKU
    SELECT COALESCE(MAX(CAST(SUBSTRING(sku FROM 5) AS INTEGER)), 0)
    INTO last_num
    FROM public.products
    WHERE sku LIKE 'SKU-%';

    -- Generate new SKU
    new_sku := 'SKU-' || LPAD((last_num + 1)::TEXT, 4, '0');
    
    NEW.sku := new_sku;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Trigger for auto-generating SKU on insert
DROP TRIGGER IF EXISTS tr_generate_product_sku ON public.products;
CREATE TRIGGER tr_generate_product_sku
    BEFORE INSERT ON public.products
    FOR EACH ROW
    WHEN (NEW.sku IS NULL OR NEW.sku = '')
    EXECUTE FUNCTION generate_product_sku();

-- 6. Function to update quantity_in_stock on stock movement
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.movement_type = 'stock_in') THEN
        UPDATE public.products 
        SET quantity_in_stock = quantity_in_stock + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    ELSIF (NEW.movement_type = 'stock_out') THEN
        UPDATE public.products 
        SET quantity_in_stock = quantity_in_stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    ELSIF (NEW.movement_type = 'adjustment') THEN
        -- For adjustments, 'quantity' can be positive or negative
        UPDATE public.products 
        SET quantity_in_stock = quantity_in_stock + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger for updating stock on movement insert
DROP TRIGGER IF EXISTS tr_update_product_stock ON public.stock_movements;
CREATE TRIGGER tr_update_product_stock
    AFTER INSERT ON public.stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock();

-- 8. Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for Inventory

-- Categories: Read for all authenticated, Write for Admin
CREATE POLICY "Categories are readable by all authenticated" ON public.product_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Categories are manageable by Admin" ON public.product_categories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Products: Read for all authenticated, Write for Admin
CREATE POLICY "Products are readable by all authenticated" ON public.products
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Products are manageable by Admin" ON public.products
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Stock Movements: Read for Admin/Accountant, Write for Admin
CREATE POLICY "Stock movements are readable by Admin and Accountant" ON public.stock_movements
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'accountant'))
    );

CREATE POLICY "Stock movements are manageable by Admin" ON public.stock_movements
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
