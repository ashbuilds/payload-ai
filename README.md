# Payload AI Plugin

<p align="center">
  <img alt="Payload AI Plugin" src="assets/payload-ai-intro.gif" width="100%" />
</p>

## 🌟 Supercharge Your [Payload CMS](https://payloadcms.com) with AI-Powered Content Creation

The Payload AI Plugin is an advanced extension that integrates modern AI capabilities into your Payload CMS, streamlining content creation and management.

> **⚠️ Important:** This plugin is in active development. We're doing our best to improve its features and functionality. Please be prepared for regular updates; The plugin has been tested with Payload version v3.38.0.
>
> To give it a try, we recommend using [Payload's website template](https://github.com/payloadcms/payload/tree/main/templates/website).

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

- 🔌 **Bring Your Own Model** ([Setup guide](https://github.com/ashbuilds/payload-ai/blob/main/guide.md#5-add-custom-model))
- 🎛️ **Field-level Prompt Customization**
- 🔐 **Access Control Support**
- 🧠 **Prompt Editor**
- 📊 **Document Analyzer** (Coming Soon)
- ✅ **Fact Checking** (Coming Soon)
- 🔄 **Automated Content Workflows** (Coming Soon)
- 🌍 **Internationalization Support** (Coming Soon)
- 🌍 **Editor AI suggestions** (Coming Soon)
- 💬 **AI Chat Support** (Coming Soon)

## 📚 Table of Contents

- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#%EF%B8%8F-configuration)
- [Setup Guide](guide.md)
- [Contributing](#-contributing)

## 📦 Installation

After PayloadCMS has been installed, run this command:

```bash
pnpm add @ai-stack/payloadcms
```

## 🛠 Usage

Config with ease:

```javascript
// Add below in src/payload.config.ts
import { payloadAiPlugin } from '@ai-stack/payloadcms'

export default buildConfig({
  plugins: [
    payloadAiPlugin({
      collections: {
        [Posts.slug]: true,
      },
      debugging: false,
      disableSponsorMessage: false,
      
      generatePromptOnInit: process.env.NODE_ENV !== 'production',

      // Publicly accessible upload collection for gpt-image-1 model, for reference images. Defaults to "media".
      uploadCollectionSlug: "media"

      /* Enable to restrict access to AI plugin settings only to admin users
      access: {
        settings: ({ req }: { req: PayloadRequest }) => {
          return req.user?.role === 'admin';
        },
      },
      */
    }),
  ],
  // ... your existing Payload configuration
})
```

Configure your richText fields:

```javascript
import { PayloadAiPluginLexicalEditorFeature } from '@ai-stack/payloadcms'

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

To get started, choose your preferred AI model by setting one or more of the following environment variables. Create a .env file in your project root and add any of the following keys:

```
OPENAI_API_KEY=your-openai-api-key

## OPENAI_ORG_ID is required if you use gpt-image-1 model
OPENAI_ORG_ID=your-org-id

ANTHROPIC_API_KEY=your-anthropic-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

> **⚠️ Important:** Once you've configured or installed this plugin, a server restart is required to activate the changes.

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
> `@ai-stack/payloadcms/fields#ComposeField`
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
