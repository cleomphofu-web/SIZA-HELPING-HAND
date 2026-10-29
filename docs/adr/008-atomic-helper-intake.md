# ADR 008: Atomic helper application intake

## Status

Implemented locally for the Phase A helper-intake slice; owner review remains pending. This does not approve real applicant collection or the pending reference/legal wording.

## Context

The current intake writes `helper_details` and private-document metadata in separate requests. A retry can overwrite an existing helper profile, and a later write failure can leave partial rows. Storage objects and Postgres cannot share a transaction. The security rules require all-or-nothing database rows, compensating removal of any staged objects, and retention measured from the approval/decline decision.

## Decision

- Validate and sanitize both images before side effects. Upload each to a random helper-scoped path in the private bucket, then call one service-role-only RPC to insert the pending helper profile and both document rows in a single Postgres transaction.
- The RPC verifies the persisted profile is an active helper, validates both unique object paths are scoped to that helper, and uses `INSERT` semantics. An existing profile is a conflict and remains unchanged.
- If an upload fails, remove every staged object. If the database RPC returns a definite error, remove the staged objects because the transaction rolled back. If the RPC promise rejects or times out, preserve the objects: the commit outcome is unknown, and deleting them could break a profile and document rows that committed before the response was lost. Return a generic copy-deck message asking the helper to check the application before retrying. Do not expose provider errors, ID data, or object paths. Failed deletion after a definite rollback can still leave an unreferenced object; an age-bounded retryable cleanup job remains open for Stage 4.4.
- Pending document rows have `delete_after = NULL`. The existing atomic approve/decline function assigns the expiry using `id_doc_retention_days` at decision time. If config is invalid while documents exist, the review transaction fails closed. Existing review behavior still clears the encrypted ID at decision time and retains the ID hash.
- Do not add reference capture, alter consent copy, or change the real-user privacy gate in this decision.

## Consequences and tests

Forward-only migration `0022_atomic_helper_intake.sql` relaxes pending-document expiry and adds the intake RPC, then replaces the helper review function to set decision-relative expiry. Follow-up migration `0023_remove_assumed_reference_review.sql` removes the old auto-written “references called” note until the reference check exists. Unit tests cover upload compensation, definite database rejection, and ambiguous RPC transport failure; local Supabase tests cover service-role enforcement, persisted role, helper-scoped paths, atomic rows, duplicate non-mutation, decision-relative retention, and absence of unsupported review claims. `0001_init.sql` and the linked Supabase project remain unchanged.
