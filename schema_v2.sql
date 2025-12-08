-- Add role and status to profiles
alter table profiles 
add column if not exists role text default 'member' check (role in ('admin', 'member')),
add column if not exists status text default 'pending' check (status in ('active', 'pending', 'suspended'));

-- RLS Policies Update
-- Allow admins to update any profile (promotion/approval)
create policy "Admins can update any profile." 
on profiles for update 
using ( auth.uid() in ( select id from profiles where role = 'admin' ) );

-- Allow admins to delete profiles
create policy "Admins can delete profiles." 
on profiles for delete 
using ( auth.uid() in ( select id from profiles where role = 'admin' ) );

-- Update select policy to ensure basic visibility (already enabled in v1 as "public", but good to reaffirm or refine if needed)
-- (Existing policy "Public profiles are viewable by everyone" covers this)
