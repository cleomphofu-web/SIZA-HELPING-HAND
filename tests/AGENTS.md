# Tests

- Cover security invariants, not only happy paths.
- Use test-only keys and mocks; never load real `.env` secrets into fixtures.
- Add regression coverage for duplicate submissions, authorization failures, upload spoofing, and approval checklist bypasses.
