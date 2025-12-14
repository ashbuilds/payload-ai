# Payload AI Plugin

<p align="center">
  <img alt="Payload AI Plugin" src="assets/payload-ai-intro.gif" width="100%" />
</p>

<p align="center">
  <strong>Transform your Payload CMS into an AI-powered content powerhouse</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@ai-stack/payloadcms"><img src="https://img.shields.io/npm/v/@ai-stack/payloadcms.svg" alt="npm version"></a>
  <a href="LICENSE.md"><img src="https://img.shields.io/github/license/ashbuilds/payload-ai" alt="License"></a>
  <a href="https://discord.com/channels/967097582721572934/1264949995656843345"><img src="https://img.shields.io/badge/discord-join-7289DA.svg" alt="Discord"></a>
</p>

---

## Why Payload AI?

**Stop context-switching between your CMS and AI tools.** The Payload AI Plugin brings the power of OpenAI, Anthropic, Google Gemini, xAI Grok, ElevenLabs, and more directly into your editing experience—no external apps, no copy-pasting, no friction.

Whether you're generating blog posts, creating product images, translating content, or building custom AI workflows, this plugin puts everything at your fingertips.

> **💡 New in this release:** Programmatic `payload.ai` API, multimodal image generation with Gemini, vision model support, and 7 AI providers!

---

### 🎥 [Watch the Magic in Action](https://youtu.be/qaYukeGpuu4) | [Extended Demo](https://youtu.be/LEsuHbKalNY) | [Setup Guide](guide.md)

---

## ✨ What Can You Do?

### 📝 Text & Rich Text Generation

| Feature       | Status | Description                                    |
| ------------- | ------ | ---------------------------------------------- |
| **Compose**   | ✅     | Generate content from natural language prompts |
| **Proofread** | ✅     | Fix grammar, spelling, and style issues        |
| **Translate** | ✅     | Translate to 100+ languages                    |
| **Rephrase**  | ✅     | Rewrite for different tones and audiences      |
| **Expand**    | 🔜     | Elaborate on existing content                  |
| **Summarize** | 🔜     | Condense long-form content                     |

### 🖼️ Image Generation

- **DALL-E 3** and **GPT-Image-1** from OpenAI
- **Imagen 3** from Google
- **Gemini 2.5 Flash** multimodal image generation
- **FAL** for fast, high-quality images
- Reference existing images with `@fieldName` syntax for variations

### 🎙️ Voice Generation (Text-to-Speech)

- **ElevenLabs** — Premium, lifelike voices
- **OpenAI TTS** — Fast, affordable voices
- **Google Gemini TTS** — Native multilingual support

### 🚀 Developer-First Features

| Feature                  | Description                                                                      |
| ------------------------ | -------------------------------------------------------------------------------- |
| **`payload.ai` API**     | Programmatic access to all AI capabilities in hooks, endpoints, and custom logic |
| **7 AI Providers**       | OpenAI, Anthropic, Google, xAI, ElevenLabs, FAL, OpenAI-Compatible               |
| **Bring Your Own Model** | Add custom models from any provider                                              |
| **Schema Validation**    | Generate structured JSON with Zod or JSON Schema                                 |
| **Streaming**            | Real-time streaming for text and structured output                               |
| **Vision Models**        | Reference images in prompts for multimodal generation                            |

### 🔐 Enterprise Ready

- **Encrypted API Keys** — Secure storage in your database
- **Access Control** — Granular permissions for generation and settings
- **Custom Base URLs** — Support for proxies and self-hosted models
- **Multi-Tenant** — Custom media upload handlers

---

## 📦 Installation

```bash
pnpm add @ai-stack/payloadcms
```

---

## 🛠 Quick Start

### 1. Add the Plugin

```typescript
// payload.config.ts
import { payloadAiPlugin } from '@ai-stack/payloadcms'

export default buildConfig({
  plugins: [
    payloadAiPlugin({
      collections: {
        [Posts.slug]: true,
      },
    }),
  ],
})
```

### 2. Enable Rich Text AI Features

```typescript
// collections/Posts.ts
import { PayloadAiPluginLexicalEditorFeature } from '@ai-stack/payloadcms'

fields: [
  {
    name: 'content',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => [...rootFeatures, PayloadAiPluginLexicalEditorFeature()],
    }),
  },
]
```

### 3. Set Your API Keys

```env
# .env
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key     # Optional
GOOGLE_AI_API_KEY=your-google-api-key         # Optional
XAI_API_KEY=your-xai-api-key                  # Optional
ELEVENLABS_API_KEY=your-elevenlabs-api-key   # Optional
```

> **✨ Pro tip:** You can also configure API keys directly in the AI Settings panel within Payload Admin—encrypted and secure.

---

## 🚀 Programmatic API (`payload.ai`)

Use AI directly in your server-side code—hooks, endpoints, custom scripts, and more.

```typescript
// Generate text
const text = await payload.ai.generateText({
  prompt: 'Write a compelling product description',
  provider: 'openai',
  model: 'gpt-4o',
})

// Generate structured data with schema validation
const product = await payload.ai.generateObject({
  prompt: 'Generate product details for a coffee maker',
  provider: 'anthropic',
  model: 'claude-3-sonnet',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    features: z.array(z.string()),
    price: z.number(),
  }),
})

// Generate images
const image = await payload.ai.generateMedia({
  prompt: 'A modern minimalist logo for a tech startup',
  provider: 'openai',
  model: 'dall-e-3',
})

// Generate speech
const audio = await payload.ai.generateMedia({
  prompt: 'Welcome to our store!',
  provider: 'elevenlabs',
  voice: 'Rachel',
})

// Stream responses
const stream = await payload.ai.streamObject({
  prompt: 'Generate a blog post about AI',
  provider: 'google',
  model: 'gemini-2.5-pro',
  schema: blogPostSchema,
})
```

### Available Methods

| Method             | Purpose                                |
| ------------------ | -------------------------------------- |
| `generateText()`   | Simple text generation                 |
| `generateObject()` | Structured output with Zod/JSON schema |
| `generateMedia()`  | Images, audio (TTS), video             |
| `streamText()`     | Streaming text responses               |
| `streamObject()`   | Streaming structured output            |
| `getModel()`       | Direct access to model instances       |
| `getRegistry()`    | Access provider configuration          |

---

## 🔌 Supported Providers

| Provider               | Text | Image | TTS | Vision |
| ---------------------- | :--: | :---: | :-: | :----: |
| **OpenAI**             |  ✅  |  ✅   | ✅  |   ✅   |
| **Anthropic** (Claude) |  ✅  |   —   |  —  |   ✅   |
| **Google** (Gemini)    |  ✅  |  ✅   | ✅  |   ✅   |
| **xAI** (Grok)         |  ✅  |   —   |  —  |   ✅   |
| **ElevenLabs**         |  —   |   —   | ✅  |   —    |
| **FAL**                |  —   |  ✅   |  —  |   —    |
| **OpenAI-Compatible**  |  ✅  |  ✅   |  —  |   —    |

### Popular Models

- **Text:** GPT-4o, Claude 3.5 Sonnet, Gemini 2.5 Pro, Grok 4
- **Image:** DALL-E 3, GPT-Image-1, Imagen 3, Gemini 2.5 Flash
- **Voice:** ElevenLabs Multilingual v2, OpenAI TTS, Gemini TTS

---

## 📸 Vision Models & Image Input

Reference images directly in your prompts using the `@fieldName` syntax:

```typescript
// In your prompt field
"Describe what's in this image: @heroImage"

// Reference specific file from hasMany upload
'Analyze this photo: @gallery:product-shot.jpg'
```

Images are automatically fetched and sent to vision-capable models like GPT-4o, Claude, Gemini, and Grok Vision.

---

## ⚙️ Advanced Configuration

<details>
<summary>🔧 Access Control, Multi-Tenant, Custom Prompts</summary>

```typescript
payloadAiPlugin({
  collections: {
    [Posts.slug]: true,
  },
  globals: {
    [Home.slug]: true,
  },

  // Access control
  access: {
    generate: ({ req }) => req.user?.role === 'admin',
    settings: ({ req }) => req.user?.role === 'admin',
  },

  // Custom media upload (multi-tenant)
  mediaUpload: async (result, { request, collection }) => {
    return request.payload.create({
      collection,
      data: { ...result.data, tenant: request.user.tenant },
      file: result.file,
    })
  },

  // Custom prompt seeding
  seedPrompts: ({ path, fieldLabel }) => {
    if (path.endsWith('.meta.description')) {
      return {
        data: {
          prompt: `Generate an SEO-optimized description for: {{title}}`,
        },
      }
    }
    if (path.endsWith('.slug')) return false // Disable AI for slugs
  },

  // Language options for translation
  options: {
    enabledLanguages: ['en-US', 'es', 'fr', 'de', 'zh-CN', 'ja'],
  },

  // Expose custom fields in prompts
  promptFields: [
    { name: 'url', collections: ['media'] },
    {
      name: 'summary',
      getter: async (doc) => generateSummary(doc),
    },
  ],
})
```

</details>

---

## 💪 Support This Project
This plugin is built and maintained as an independent project. If it's helped you ship faster or saved you development time, consider supporting its continued development:

<a href="https://www.buymeacoffee.com/ashbuilds" target="_blank">
<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50">
</a>

⭐ **Star the repo** — It helps others discover the project  
🐛 **Report issues** — Help improve stability  
💡 **Share feedback** — Your ideas shape the roadmap
---

## 👥 Contributing

We welcome contributions of all sizes! Whether it's fixing a typo, adding a feature, or improving docs—every bit helps.

Join the conversation on Payload's [Discord](https://discord.com/channels/967097582721572934/1264949995656843345) and let's build something amazing together! 🚀

<details>
<summary>🔧 Local Development Setup</summary>

This repo includes a minimal Payload app under [dev](dev/README.md) for quick iteration.

**Prerequisites:**

- Node.js (see `.nvmrc`) and pnpm
- Database connection string (`DATABASE_URI`)
- Optional: AI provider API keys

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment
cp dev/.env.example dev/.env
# Edit dev/.env with your DATABASE_URI and PAYLOAD_SECRET

# 3. Start development server
pnpm dev

# 4. Other commands
pnpm test                    # Run tests
pnpm lint                    # Lint code
pnpm build                   # Build plugin
pnpm generate:importmap      # Regenerate import map
pnpm generate:types          # Regenerate Payload types
```

**Project Structure:**

- `src/` — Plugin source code
- `dev/` — Development Payload app
- `dev/int.spec.ts` — Integration tests
- `dev/e2e.spec.ts` — End-to-end tests

</details>

---