# Supabase

- Keep Storage buckets private.
- Every table must have RLS enabled.
- Public writes go through server routes using the server-only admin client; never expose the service-role key.
- Any migration change must preserve the launch vetting and payment-truth rules.
