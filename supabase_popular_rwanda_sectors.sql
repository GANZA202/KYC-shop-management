-- Migration to add popular administrative sectors in Rwanda
-- These are major sectors in Kigali and key regional hubs

INSERT INTO public.sectors (name, description)
VALUES 
    ('Nyarugenge', 'Kigali City - Central Business District'),
    ('Kicukiro', 'Kigali City - Residential and Industrial hub'),
    ('Gasabo', 'Kigali City - Administrative and Residential hub'),
    ('Remera', 'Kigali City - Major commercial and sports hub'),
    ('Kimironko', 'Kigali City - Popular residential and market area'),
    ('Gikondo', 'Kigali City - Industrial and residential area'),
    ('Nyamirambo', 'Kigali City - Vibrant cultural and commercial hub'),
    ('Muhima', 'Kigali City - Commercial and transport hub'),
    ('Kacyiru', 'Kigali City - Government and diplomatic hub'),
    ('Kanombe', 'Kigali City - Airport and residential area'),
    ('Masaka', 'Kigali City - Growing residential and industrial area'),
    ('Remera', 'Kigali City - Commercial hub'),
    ('Musanze', 'Northern Province - Tourism and Agriculture hub'),
    ('Rubavu', 'Western Province - Tourism and Cross-border trade hub'),
    ('Huye', 'Southern Province - Academic and Cultural hub'),
    ('Rwamagana', 'Eastern Province - Regional administrative hub'),
    ('Kayonza', 'Eastern Province - Transport and Agriculture hub'),
    ('Nyagatare', 'Eastern Province - Livestock and Agriculture hub'),
    ('Muhanga', 'Southern Province - Transport and Trade hub'),
    ('Rusizi', 'Western Province - Cross-border trade hub')
ON CONFLICT (name) DO NOTHING;
