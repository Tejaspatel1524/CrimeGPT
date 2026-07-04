-- Add 'viewer' role to UserRole enum
ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'viewer';
