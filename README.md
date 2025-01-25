# Payload AI Plugin

<p align="center">
  <img alt="Payload AI Plugin" src="assets/payload-ai-intro.gif" width="100%" />
</p>

## 🌟 Supercharge Your [Payload CMS](https://payloadcms.com) with AI-Powered Content Creation

The Payload AI Plugin is an advanced extension that integrates modern AI capabilities into your Payload CMS, streamlining content creation and management.

> **⚠️ Important:** This plugin is in active development. We're doing our best to improve its features and functionality. Please be prepared for regular updates; at the moment, the plugin has only been tested with Payload version v3.2.1.
>
> To give it a try, we recommend using [Payload's website template](https://github.com/payloadcms/payload/tree/v3.2.1/templates/website).

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

### Other Features
- 🎛️ **Field-level Prompt Customization**
- 🧠 **Prompt Editor** (Beta)
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
      disableSponsorMessage: false
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
          HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
          InlineToolbarFeature(),
          HorizontalRuleFeature(),
          OrderedListFeature(),
          UnorderedListFeature(),
          BlockquoteFeature(),      
          PayloadAiPluginLexicalEditorFeature() // Add this line
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
ANTHROPIC_API_KEY=your-anthropic-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```
For detailed guidance on personalizing and configuring the plugin to match your needs, check out the **[Complete Guide](guide.md)**. It walks you through every step, from setting up fields to generating amazing content!


### Enabling AI for Custom Components

> **⚠️ Note:** Custom fields don't fully adhere to the Payload schema, making it difficult to determine which components support injecting ComposeField as a Description.
> If AI enabled fields don't display Compose settings, please manually add the following component path:
>
> `@ai-stack/payloadcms/fields#ComposeField`
>
> To view AI enabled fields, enable the `debugging` flag in your plugin config or check your server startup logs.


## 👥 Contributing

Innovators: welcome! We're always excited to expand our community and hear fresh ideas. Whether you’re here to share feedback, suggest features, or contribute code, we’d love to have you on board.  

Feel free to create a pull request with your ideas, improvements, or bug fixes. No contribution is too small, and every bit helps us grow!  

Join the conversation on Payload's [Discord](https://discord.com/channels/967097582721572934/1264949995656843345) and let’s build something amazing together! 🚀✨  
