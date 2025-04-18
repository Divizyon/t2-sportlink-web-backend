-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin', -- superadmin, admin, editor, moderator
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create RLS policy to allow admins to be updated only by themselves or superadmins
CREATE POLICY admin_self_update ON admins 
    FOR UPDATE TO authenticated 
    USING (
        (is_admin() AND auth.uid() = id) OR
        (get_admin_role(auth.uid()) = 'superadmin')
    );

-- Create admin profiles table
CREATE TABLE IF NOT EXISTS admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    phone_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (admin_id)
);

-- Create function to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admins
        WHERE email = auth.email()
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get admin role
CREATE OR REPLACE FUNCTION get_admin_role(user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    admin_role VARCHAR;
BEGIN
    SELECT role INTO admin_role FROM admins
    WHERE id = user_id AND is_active = true;
    
    RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX admins_email_idx ON admins(email);
CREATE INDEX admins_role_idx ON admins(role);
CREATE INDEX admin_profiles_admin_id_idx ON admin_profiles(admin_id); 