# ADR 007: Re-encode private helper images on the server

## Status

Implemented with exact-pinned dependency `sharp@0.35.5`; owner review is pending. This is Phase A upload hardening only. It does not authorize real applicant collection or alter the legal/privacy gate.

## Context

The helper intake accepts JPEG, PNG, and WebP by magic bytes but stores the original image bytes. That can preserve EXIF metadata, including location, and accepts files that may be malformed after their signature. Client-side image compression cannot be trusted as a privacy or validation control.

## Decision

- Use `sharp@0.35.5` from a server-only module to decode and re-encode helper ID and selfie images before storage. The selected release is exact-pinned, older than 14 days, requires Node.js 20.9 or later, and is Apache-2.0 licensed. Its v0.35.0 release removed the package install script.
- Accept only the formats already declared by the helper form: JPEG, PNG, and WebP. Preserve the decoded format, auto-orient pixels before removing metadata, and do not call metadata-preserving output APIs. Fail closed on decode errors or resource-limit violations.
- Keep the existing 8 MB input limit and cap decoded pixels/channels in the sanitizer. The storage upload receives only the re-encoded bytes and a MIME type derived from the decoded format; never trust the original filename or client MIME type.
- Do not implement face matching, OCR, image comparison, or any automated vetting. Tests use generated synthetic images with non-personal metadata.

## Alternatives

- Browser-only image conversion was rejected because clients can bypass it and send original bytes directly to the API.
- No image library is available in the project; built-in Node APIs do not decode and re-encode JPEG/PNG/WebP images. `sharp` is chosen because it supports the three required formats and documents metadata stripping as the default output behavior.

## Consequences

- Add the native image-processing dependency and its exact lockfile entry. Production and local runtimes must support a matching sharp/libvips binary or the documented WebAssembly fallback.
- Sanitized output may differ slightly from the submitted image due to re-encoding; the uploaded image remains private and admin-only.
- This ADR covers image sanitization only. All-or-nothing database/object cleanup, existing-application re-entry, the one-reference flow, and owner/lawyer-approved consent and retention text remain separate Stage 3.2 requirements.

## Sources checked

- [sharp v0.35.5 release](https://github.com/lovell/sharp/releases/tag/v0.35.5) — released 27 September 2026.
- [sharp output options](https://sharp.pixelplumbing.com/api-output/) — output metadata is stripped by default unless a metadata-preserving method is requested.
- [sharp security guidance](https://sharp.pixelplumbing.com/security/) — input is treated as untrusted; resource limits are available.
- [sharp security advisory](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c) — versions before 0.35.4 are affected; selected 0.35.5 is patched.
