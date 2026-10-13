# 5.0.0

Updates dependencies to address security advisories, including Handlebars and the Payload/Next.js development stack.

## Breaking changes

Requires Payload `^3.90.2` and Lexical `^0.50.0`. Upgrade your Payload packages together and align directly installed Lexical packages to `0.50.0`.

See the [migration guide](https://github.com/ashbuilds/payload-ai/blob/5.0.0/MIGRATION.md) before upgrading. Application dependencies need their own updates; this repository's overrides do not propagate to consumers.

## Validation

92 tests passed, 3 skipped; build passed. Manual testing of the updated demo also passed. The production dependency audit reported no known vulnerabilities. An unpatched `braces` advisory remains in development tooling.

**Full changelog:** https://github.com/ashbuilds/payload-ai/compare/4.0.0...5.0.0
