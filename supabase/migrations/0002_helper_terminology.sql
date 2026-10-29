-- Forward-only terminology migration. 0001_init.sql is already applied and remains immutable.
alter type public.cleaner_status rename to helper_status;

alter table public.cleaners rename to helpers;
alter table public.cleaner_documents rename to helper_documents;
alter table public.cleaner_references rename to helper_references;

alter table public.helper_documents rename column cleaner_id to helper_id;
alter table public.helper_references rename column cleaner_id to helper_id;
alter table public.bookings rename column cleaners_needed to helpers_needed;
alter table public.bookings rename column assigned_cleaner_ids to assigned_helper_ids;

alter policy cleaners_admin_all on public.helpers rename to helpers_admin_all;
alter policy documents_admin_all on public.helper_documents rename to helper_documents_admin_all;
alter policy references_admin_all on public.helper_references rename to helper_references_admin_all;

insert into storage.buckets (id, name, public)
values ('helper-docs', 'helper-docs', false)
on conflict (id) do update set public = false;

create policy helper_docs_admin_read on storage.objects for select to authenticated
using (bucket_id = 'helper-docs' and public.is_admin());

create policy helper_docs_admin_write on storage.objects for insert to authenticated
with check (bucket_id = 'helper-docs' and public.is_admin());

create policy helper_docs_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'helper-docs' and public.is_admin());
