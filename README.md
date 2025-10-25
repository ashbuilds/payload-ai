# Payload AI Plugin

<p align="center">
  <img alt="Payload AI Plugin" src="assets/payload-ai-intro.gif" width="100%" />
</p>

## 🌟 Supercharge Your [Payload CMS](https://payloadcms.com) with AI-Powered Content Creation

The Payload AI Plugin is an advanced extension that integrates modern AI capabilities into your Payload CMS, streamlining content creation and management.

> **⚠️ Important:** This plugin is in active development. We're doing our best to improve its features and functionality. Please be prepared for regular updates; The plugin has been tested with a Payload version v3.38.0.
>
> To give it a try, we recommend using [Payload's website template](https://github.com/payloadcms/payload/tree/main/templates/website).

## 📝 Changelog

### v0.1.0 - Architecture Improvements

**🎯 Major Change: Markdown-First Generation**

We've completely redesigned how the plugin generates rich text content. The new approach is more reliable and maintainable:

**What Changed:**
- ✅ **LLMs now generate Markdown** instead of complex Lexical JSON schemas
- ✅ **Automatic conversion** using Payload's built-in `convertMarkdownToLexical()`
- ✅ **Removed complex schema validation** - no more JSON schema constraints sent to LLMs
- ✅ **More reliable output** - LLMs are ~95-99% accurate with Markdown vs ~85-90% with JSON schemas
- ✅ **Simpler prompts** - clearer instructions for AI models
- ✅ **Real-time streaming** - content converts to rich text as it streams in

**Why This Matters:**
- 🚀 **Better reliability** - Markdown is a standard format LLMs excel at
- 🎨 **Same rich features** - all Lexical formatting still works (headings, bold, lists, links, etc.)
- 🔧 **Easier maintenance** - no complex schema validation to debug
- ⚡ **Faster responses** - LLMs generate markdown more efficiently

**Technical Details:**
- Changed from `streamObject()` to `streamText()` in AI handlers
- Removed `editorSchema` filtering and validation utilities
- Updated client-side to convert markdown → Lexical in real-time
- Fixed type compatibility issues between client and server configs

**Breaking Changes:**
- None! The API remains the same from a user perspective.

---

### 🎥 [Watch the Magic in Action](https://youtu.be/qaYukeGpuu4)

Want to dive deeper?

### 🎥 [Explore More in Our Extended Demo](https://youtu.be/LEsuHbKalNY)

### ⚙️ [Guide to Personalize](guide.md)

## ✨ Supported Fields and Features

### Text and RichText Field

- 📝 **Text Generation**
  - [x] **Compose** masterpieces effortlessly
  - [x] **Proofread** with precision (Beta)
  - [x] **Translate** across languages
  - [ ] **Expand** your ideas
  - [ ] **Summarize** with clarity
  - [ ] **Simplify** complex concepts
  - [x] **Rephrase** for maximum impact (Beta)

### Upload Field

- 🎙️ **Voice Generation** powered by ElevenLabs, OpenAI
- 🖼️ **Image Generation** powered by OpenAI
  - Now also supports **[GPT-Image-1](https://github.com/ashbuilds/payload-ai/pull/82)** Model

### Other Features

- 🔌 **Bring Your Own Model** ([Setup guide](https://github.com/pawelmantur/payload-ai/blob/main/guide.md#5-add-custom-model))
- 🎛️ **Field-level Prompt Customization**
- 🔐 **Access Control Support**
- 🧠 **Prompt Editor**
- 🌍 **Internationalization Support**
- 📊 **Document Analyzer** (Coming Soon)
- ✅ **Fact Checking** (Coming Soon)
- 🔄 **Automated Content Workflows** (Coming Soon)
- 🌍 **Editor AI suggestions** (Coming Soon)
- 💬 **AI Chat Support** (Coming Soon)

## 📚 Table of Contents

- [Changelog](#-changelog)
- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#%EF%B8%8F-configuration)
- [Setup Guide](guide.md)
- [Contributing](#-contributing)

## 📦 Installation

After PayloadCMS has been installed, run this command:

```bash
pnpm add @pawelmantur/payload-ai
```

> **Note:** This package was previously published as `@ai-stack/payloadcms`. If you're migrating, uninstall the old package first:
> ```bash
> pnpm remove @ai-stack/payloadcms
> ```

## 🛠 Usage

Add below in `src/payload.config.ts`

```javascript
import { payloadAiPlugin } from '@pawelmantur/payload-ai'

export default buildConfig({
  plugins: [
    payloadAiPlugin({
      collections: {
        [Posts.slug]: true,
      },
      debugging: false,
    }),
  ],
  // ... your existing Payload configuration
})
```

Add AI Plugin feature to your richText field:

```javascript
import { PayloadAiPluginLexicalEditorFeature } from '@pawelmantur/payload-ai'

// Add below in the Lexical Editor field config of you Collection or Plugin (e.g. src/collections/Posts/index.ts)
fields: [
  {
    name: 'content',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [
          // ... your existing features
          HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),

          // Please add below
          PayloadAiPluginLexicalEditorFeature(),
        ]
      },
    }),
  },
]
```

## ⚙️ Configuration

To get started, set your API keys in a `.env` file in your project root:

```env
# Required for text and image generation
OPENAI_API_KEY=your-openai-api-key

# Required if using gpt-image-1 model
OPENAI_ORG_ID=your-org-id

# Optional: Other supported providers
ANTHROPIC_API_KEY=your-anthropic-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key

# Optional: Custom OpenAI Endpoint
OPENAI_BASE_URL=https://api.openai.com/v1
```

> **⚠️ Important:** Restart your server after updating .env or plugin settings to apply the changes.
Also, you might want to run payload `generate:importmap` to regenerate the import map before starting the server.
---

### 👇 Advanced Configuration
<details>
<summary>
   🔧 Access Control, Multi-Tenant, Media Upload 
</summary>

```typescript
import { payloadAiPlugin } from '@pawelmantur/payload-ai'

export default buildConfig({
  plugins: [
    payloadAiPlugin({
      collections: {
        [Posts.slug]: true,
      },

      // Optional
      globals: {
        [Home.slug]: true,
      },

      // Optional: Show debug logs to list AI-enabled fields
      debugging: false,

      // Optional: Disable sponsor message in the console
      disableSponsorMessage: false,

      // Optional: Pre-generate prompts on server start (recommended for dev only)
      generatePromptOnInit: process.env.NODE_ENV !== 'production',

      // Optional: Specify the media collection used by the gpt-image-1 model to reference images (defaults to media)
      uploadCollectionSlug: "media",

      // Optional: Access control for AI features
      access: {
        // Control who can generate AI content
        generate: ({ req }) => req.user?.role === 'admin',
        
        // Control who can modify AI settings and prompts
        settings: ({ req }) => req.user?.role === 'admin',
      },

      options: {
        // Visit locale-codes for tags, 
        // defaults to display all language options for Translate feature
        // https://www.npmjs.com/package/locale-codes
        enabledLanguages: ["en-US", "zh-SG", "zh-CN", "en"],
      },

      // Optional: Additional fields that can be referenced in prompts
      promptFields: [
        // Expose "url" field on images collection
        {
          name: 'url',
          collections: ['images'],
        },
        // Expose custom async function that generates markdown summary of any document
        {
          name: 'markdown',
          async getter(doc, {collection}) => docToMarkdown(collection, doc)
        }
      ],

      // Optional: Control how field prompts are seeded for the first time
      seedPrompts: ({path}) => {
        if (path.endsWith('.meta.description')) {
          return {
            data: {
              prompt: 'Generate SEO-friendly title for this document: {{markdown}}',
              // other instruction options
            }
          }
        }
        // Don't allow generating slugs
        if (path.endswith('.slug')) return false
        // returning undefined fallbacks to default seed prompt
      },

      // Optional: Custom media upload handling, useful for multi-tenant setups
      mediaUpload: async (result, { request, collection }) => {
        return request.payload.create({
          collection,
          data: result.data,
          file: result.file,
        })
      },
    }),
  ],
})
```

</details>

---

### OpenAI Endpoint

If you want to use a custom endpoint for the OpenAI provider, set your base URL like this:

```
OPENAI_BASE_URL=https://api.openai.com/v1
```

If not specified, the [default](src/ai/models/openai/openai.ts) OpenAI endpoint will be used.

For detailed guidance on personalizing and configuring the plugin to match your needs, check out the **[Complete Guide](guide.md)**. It walks you through every step, from setting up fields to generating amazing content!

### Enabling AI for Custom Components

> **⚠️ Note:** Custom fields don't fully adhere to the Payload schema, making it difficult to determine which components support injecting ComposeField as a Description.
> If AI enabled fields don't display Compose settings, manually add the following component path:
>
> `@pawelmantur/payload-ai/fields#ComposeField`
>
> To view AI enabled fields, enable the `debugging` flag in your plugin config or check your server startup logs.

---

## 🤝 Support Development
I build and maintain this in my free time because I love seeing the community benefit from it.
Keeping it alive takes real hours and real money (those AI credits aren’t free 😄).

If this project has saved you time or made your work easier, why not fuel my next coding session with a coffee?

<a href="https://www.buymeacoffee.com/ashbuilds" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;"></a>

**Any support means the world to me. Thank you for even considering it!**

---

## 👥 Contributing

Innovators: welcome! We're always excited to expand our community and hear fresh ideas. Whether you’re here to share feedback, suggest features, or contribute code, we’d love to have you on board.

Feel free to create a pull request with your ideas, improvements, or bug fixes. No contribution is too small, and every bit helps us grow!

Join the conversation on Payload's [Discord](https://discord.com/channels/967097582721572934/1264949995656843345) and let’s build something amazing together! 🚀✨

### Local development

This repo includes a minimal Payload app under [dev](dev/README.md) to iterate on the plugin quickly.

Prerequisites
- Node.js (see `.nvmrc`) and pnpm
- A database connection string for `DATABASE_URI` (Postgres or Mongo)
- Optional: AI provider keys to test features (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`)

1) Install dependencies
```bash
pnpm install
```

2) Set up the dev app environment
```bash
cp dev/.env.example dev/.env
# Edit dev/.env:
# - Set DATABASE_URI to your DB connection string
# - Set PAYLOAD_SECRET to a strong random string
# - Optionally set AI provider keys to exercise features
```

3) Start the dev app (admin available at http://localhost:3000)
```bash
pnpm dev
```

If you run into admin import-map issues, regenerate it:
```bash
pnpm generate:importmap
```
Optionally regenerate Payload types:
```bash
pnpm generate:types
```

4) Develop
- Plugin source lives in `src/`; the dev app imports it locally.
- Edit files in `src/**` and refresh the dev app to validate changes.

5) Tests, linting, formatting
```bash
pnpm test           # runs Vitest + Playwright (see dev/int.spec.ts, dev/e2e.spec.ts)
pnpm lint           # ESLint
pnpm prettier --write .   # Prettier (format all files)
```

6) Build the plugin
```bash
pnpm build
```

7) Try the built package in another Payload project (optional)
```bash
pnpm pack  # creates a tarball in the repo root
# then in your other project:
pnpm add /path/to/ai-plugin-*.tgz
```

Project structure quick reference
- `src/` — plugin source code
- `dev/` — minimal Payload app wired to this plugin for local testing
- Tests — see `dev/int.spec.ts` and `dev/e2e.spec.ts` for integration and e2e tests
