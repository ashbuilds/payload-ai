# 4.0.0

Fixes access-control gaps in AI generation by enforcing Payload permissions for source documents, instructions, reference media, and generated uploads. Instruction metadata now requires authentication, and endpoint failures use Payload's standard errors.

Reference images and extracted prompt attachments use an explicit storage resolver. The plugin no longer automatically downloads these URLs or forwards the caller's credentials to them. Built-in text models receive attachment bytes instead of downloadable URLs.

## Upgrade notes

This is a breaking release. Projects using reference images or extracted prompt attachments must configure `resolveReferenceImage`. Generation without those attachments does not require it. Custom `mediaUpload` callbacks must enforce Payload permissions.

See [the migration guide](MIGRATION.md) before upgrading.

## Verification

92 tests passed, with 3 skipped. Coverage includes real Payload permission checks, authenticated HTTP requests with local disk storage, and attachment handling. The storage/attachment subset also passed on Node 20 and Node 22. Cloud storage and deployment testing were deferred.

Thanks to [mansurmavlankulov](https://github.com/mansurmavlankulov) for reporting the access-control issue privately and independently verifying the patch with a regression control.
