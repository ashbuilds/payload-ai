# Alternative version of official @payloadcms/plugin-seo package with AI generating improvements

[Official docs](https://payloadcms.com/docs/plugins/seo)

## List of the added options:

`openaiApiKey`
API key for OpenAI

`generateTitleAi`:
Should return prompt, example: `"Generate meta SEO title for <type of site> site in language=${data.locale}"`

`generateDescriptionAi`:
Should return prompt, example: "`Generate meta SEO description for <type of site> site in language=${data.locale}`"

The args are the same as `generateTitle` and `generateDescription`
