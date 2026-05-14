# Frozen signature HTML output

Do **not** modify the following files without explicit approval and cross-client email testing. Output is consumed by `renderSignature()` and is validated in major email clients.

**Note (Tailnote):** Social icons and asset URLs were moved off any external legacy host; after substantive edits here, run `scripts/email-client-smoke.ts` and paste-test in Gmail/Outlook again.

- `src/core/renderer.ts`
- `src/core/templates/standard.ts`
- `src/core/templates/stacked.ts`
- `src/core/socialIcons.ts`

App-layer code may map domain models into `RenderSignatureInput` (see `tailnote/lib/email/`) and choose presets; new visual layouts belong here only after the freeze is lifted.
