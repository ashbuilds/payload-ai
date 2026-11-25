# OpenAI text model retirements

The built-in text and rich-text handlers now offer GPT-5.6 Sol, Terra, and Luna.
For the OpenAI API, saved GPT-5 / GPT-5 mini / GPT-5 nano selections (including
2025-08-07 snapshots) resolve to Sol / Terra / Luna respectively. GPT-4 Turbo
(and its 2024-04-09 snapshot) resolves to Sol; GPT-3.5 Turbo (and its 0125
snapshot) resolves to Terra. These replacements follow the
[OpenAI deprecation guide](https://developers.openai.com/api/docs/deprecations).
The older GPT-4 Turbo and GPT-3.5 Turbo models retired October 23, 2026;
the listed GPT-5 models retire December 11, 2026.

Legacy values remain in the picker with explicit replacement labels so saved
instructions can still be opened and validated. No database rewrite is needed;
the replacement is applied when generating, immediately after upgrading.
Select the replacement explicitly to update a saved instruction. Unknown model
IDs and custom OpenAI-compatible endpoints pass through unchanged.

Text and rich-text defaults remain GPT-4o mini and GPT-4o respectively. Review
replacement model access, pricing, output quality, and reasoning/token behavior
before deploying. The AI SDK omits temperature for the replacement reasoning
models at their default reasoning effort. The GPT-4 series has a separate January 14, 2027 retirement;
plan an explicit review of those defaults before that date. This update does
not migrate image or speech models.

# OpenAI GPT Image model update

OpenAI [retires `gpt-image-1` on October 23, 2026](https://developers.openai.com/api/docs/deprecations).
The built-in OpenAI GPT Image option now defaults to `gpt-image-2.5-sunburst`;
`gpt-image-2.5-flare` is also available in its Version picker. Both support image
generation and editing through the existing Images API.

Existing instructions keep their `gpt-image-1` model ID and
`gpt-image-1-settings` group, so no database migration is required. Saved
`version: 'gpt-image-1'` values are sent as `gpt-image-2.5-sunburst` for both
generation and editing. Other explicitly selected versions pass through unchanged.
Custom OpenAI-compatible endpoints using the legacy version receive the same mapping.
Review output quality, account access, and [pricing](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst)
before deploying; this changes the model used by existing instructions.

# Upgrading to 4.0.0

Version 4 fixes permission bypasses in generation endpoints and removes automatic downloads of reference-image and prompt-attachment URLs. Existing image-editing and attachment workflows need configuration before upgrading.

## What changes

- Generation requires authentication and passes `access.generate`.
- Source documents, instructions, selected reference media, and built-in generated-media creation respect Payload collection, document, and field access rules.
- Instruction metadata requires authentication and respects instruction read access.
- Reference images and text-model `extractAttachments` now require `resolveReferenceImage` when images are present. Missing or rejected resolution stops generation.
- Text-to-image generation without references and text generation without extracted attachments do not need a resolver.

## Configure reference storage

Supply `resolveReferenceImage` in `payloadAiPlugin` configuration. It receives `source`, `request`, `signal`, and `maxBytes`, and returns a PNG, JPEG, or WebP `Blob`.

For a `media` source, the plugin has reloaded `source.document` from `source.collection` with the caller's read permissions. Map its ID to an object in your fixed storage bucket or local store. Restricted document fields are not available to the callback.

For a `url` source, `source.url` is untrusted prompt content. Reject it unless your application maps it to an approved storage object and authorizes the caller to read that object. The plugin does not automatically fetch it.

```ts
resolveReferenceImage: async ({ source, signal, maxBytes }) => {
  if (source.kind !== 'media') {
    throw new Error('Only selected media is supported.')
  }

  return readReferenceBlobFromStorage({
    collection: source.collection,
    id: source.document.id,
    signal,
    maxBytes,
  })
},
```

`readReferenceBlobFromStorage` is an application-owned helper, not a plugin API. Implement it using your storage adapter. This example deliberately rejects prompt URL attachments; supporting those requires a separate approved-URL-to-object mapping and authorization check.

Do not fetch arbitrary URLs, use unchecked filenames as filesystem paths, or forward the caller's cookies or Authorization header. Read only from storage controlled by your application. Enforce `maxBytes` while loading and honor `signal` for cancellation. The plugin checks the returned Blob, limits it to 20 MiB, and stops waiting after 30 seconds; it cannot prevent an incorrectly implemented callback from allocating too much memory or continuing background work. MIME checks do not validate file contents.

## Check permissions and custom uploads

Update collection and field access rules if legitimate users are now denied. Keep `overrideAccess: false` for operations performed on behalf of callers. `access.settings` controls the settings UI; restrict instruction reads and edits using `overrideInstructions.access`.

Custom `mediaUpload` callbacks must enforce access themselves:

```ts
mediaUpload: async (result, { collection, request }) =>
  request.payload.create({
    collection,
    data: result.data,
    file: result.file,
    overrideAccess: false,
    req: request,
  }),
```

## Verify the upgrade

Test an allowed user and a denied user, including tenant-specific media. Check reference-image editing, text attachments if enabled, and generated-media creation. Built-in text models pass resolved image bytes to the AI SDK and disable its automatic attachment downloads. Application-defined models, resolvers, hooks, and upload callbacks remain responsible for their own behavior.

Validation for this release includes real Payload Local API checks, authenticated HTTP requests with local disk storage, and storage/attachment tests on Node 20 and Node 22. Cloud object storage and hosted deployment testing were deferred; no hosting-platform certification is implied.
