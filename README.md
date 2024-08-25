# Payload AI Plugin

<p align="center">
  <img alt="Payload AI Plugin" src="assets/payloadcms-ai.gif" width="100%" />
</p>

## 🌟 Supercharge Your [Payload CMS](https://payloadcms.com) with AI-Powered Content Creation

The Payload AI Plugin is an advanced extension that integrates modern AI capabilities into your Payload CMS, streamlining content creation and management.

> **⚠️ Important:** This plugin is in active development. We're doing our best to improve its features and functionality. Please be prepared for regular updates; at the moment, the plugin has only been tested with Payload version 3.0.0-beta.65.
>
> To give it a try, we recommend using [Payload's website template](https://github.com/payloadcms/payload/tree/v3.0.0-beta.65/templates/website).

### 🎥 [Watch the Magic in Action](https://youtu.be/qaYukeGpuu4)


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

### Other Features
- 🎛️ **Field-level Prompt Customization**
- 🧠 **Prompt Editor** (Beta)
- 📊 **Document Analyzer** (Coming Soon)
- ✅ **Fact Checking** (Coming Soon)
- 🔄 **Automated Content Workflows** (Coming Soon)
- 🌍 **Internationalization Support** (Coming Soon)
- 💬 **AI Chat Support** (Coming Soon)

## 📚 Table of Contents

- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#%EF%B8%8F-configuration)
- [Contributing](#-contributing)
- [License](#licensing)

## 📦 Installation

Rock your Payload project with a single command:

```bash
pnpm add @ai-stack/payloadcms
```

## 🛠 Usage

Config with ease: 

```javascript

// Add below in payload.config.ts
import { buildConfig } from 'payload/config';
import { payloadAiPlugin } from '@ai-stack/payloadcms';

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
});


// Add below in Lexical Editor field config
import { PayloadAiPluginLexicalEditorFeature } from '@ai-stack/payloadcms'

fields: [
  {
    name: 'content',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [
          // ... your existing features
          PayloadAiPluginLexicalEditorFeature()
        ]
      },
    }),
  },
]

```

## ⚙️ Configuration

The plugin uses environment variables for configuration. Create a .env file in your project root and add the following variables:

```
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```


## 👥 Contributing

Innovators: welcome! We're always excited to expand our community. Connect with us on [Discord](https://discord.com/channels/967097582721572934/1264949995656843345) to get started.

## Licensing

This plugin is available under dual licensing:

- ### Open-Source License

  This plugin is available under the [MIT License](LICENSE.md). You can use, modify, and distribute it freely under the terms of this license.

- ### Commercial License

  For companies or individuals who wish to use the plugin in a commercial context, require additional features, or need support, please refer to the [Commercial License Agreement](COMMERCIAL-LICENSE.md) for more details.
