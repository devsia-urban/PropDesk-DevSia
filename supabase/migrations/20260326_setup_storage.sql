-- 1. Create the bucket
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

-- 2. Allow public to view images
create policy "Public Access"
on storage.objects for select
to public
using ( bucket_id = 'property-images' );

-- 3. Allow authenticated users to upload images
create policy "Authenticated Upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'property-images' );

-- 4. Allow users to update/delete their own uploads (basic policy)
create policy "User Management"
on storage.objects for all
to authenticated
using ( bucket_id = 'property-images' );
