-- Notification System for Low Stock Alerts
-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DO $$ BEGIN
    CREATE POLICY "Users can read their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Function to check low stock and create notifications
CREATE OR REPLACE FUNCTION public.check_low_stock_notification()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
BEGIN
    -- Only trigger if stock level drops below reorder level
    IF NEW.quantity_in_stock <= NEW.reorder_level AND 
       (OLD.quantity_in_stock > NEW.reorder_level OR OLD.quantity_in_stock IS NULL) THEN
        
        -- Find all admins and accountants
        FOR admin_record IN (SELECT id FROM public.profiles WHERE role IN ('admin', 'accountant')) LOOP
            INSERT INTO public.notifications (user_id, title, message, type)
            VALUES (
                admin_record.id,
                'Low Stock Alert: ' || NEW.product_name,
                'The stock level for ' || NEW.product_name || ' (' || NEW.sku || ') has dropped to ' || NEW.quantity_in_stock || ', which is at or below the reorder level of ' || NEW.reorder_level || '.',
                'warning'
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger
DROP TRIGGER IF EXISTS on_product_stock_change_notify ON public.products;
CREATE TRIGGER on_product_stock_change_notify
    AFTER INSERT OR UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.check_low_stock_notification();
