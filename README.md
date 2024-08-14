# Payload AI Plugin

<p align="center">
  <img alt="Payload AI Plugin" src="assets/payloadcms-ai.gif" width="100%" />
</p>

## 🌟 Supercharge Your [Payload CMS](https://payloadcms.com) with AI-Powered Content Creation

The Payload AI Plugin is an extension that seamlessly integrates advanced AI capabilities into your Payload CMS, elevating content creation and management.

> **⚠️ Note:** This plugin is currently under heavy development. Expect frequent updates and improvements as we work tirelessly to enhance its capabilities. Currently, the plugin is only tested with Payload version 3.0.0-beta.65

### 🎥 [Watch the Magic in Action](https://youtu.be/qaYukeGpuu4)



## ✨ Supported fields and features

### Text and Rich text Field
- 📝 **Text Generation**
  - [x] **Compose** masterpieces effortlessly
  - [ ] **Proofread** with precision (Beta)
  - [ ] **Translate** across languages
  - [ ] **Expand** your ideas
  - [ ] **Summarize** with clarity
  - [ ] **Simplify** complex concepts
  - [ ] **Rephrase** for impact (Beta)

### Upload Field
- 🎙️ **Voice Generation** powered by ElevenLabs
- 🖼️ **Image Generation** powered by OpenAI

### Other features
- 🎛️ **Field-level Prompt Customization**
- 🧠 **Prompt Editor** (Beta)
- 📊 **Document Analyser** (Coming Soon)
- ✅ **Fact Checking** (Coming Soon)
- 🔄 **Automated Content Workflows** (Coming Soon)
- 🌍 **Internationalization Support** (Coming Soon)
- 💬 **AI Chat Support** (Coming Soon)

## 📚 Table of Contents

- [Installation](#-installation)
- [Usage](#-usage)
- [Configuration](#%EF%B8%8F-configuration)
- [Contributing](#-contributing)
- [License](#-license)

## 📦 Installation

Elevate your Payload project with a single command:

```bash
pnpm add @ai-stack/payloadcms
```

## 🛠 Usage

Integrate the AI magic into your Payload config:

```javascript
import { buildConfig } from 'payload/config';
import { payloadAI } from '@ai-stack/payloadcms';

export default buildConfig({
  plugins: [
    payloadAI({
      collections: [Posts.slug],
    }),
  ],
  // ... your existing Payload configuration
});
```

## ⚙️ Configuration

The plugin uses environment variables for configuration. Create a .env file in your project root and add the following variables:

```
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

Remember to replace the placeholders with your actual API keys.

## 👥 Contributing

Join our community of innovators! We welcome contributions to the Payload AI Plugin. Connect with us on [Discord](https://discord.com/channels/967097582721572934/1264949995656843345) to get started.

## Licensing

This plugin is available under dual licensing:

- ### Open-Source License

  This plugin is available under the [MIT License](LICENSE.md). You can use, modify, and distribute it freely under the terms of this license.

- ### Commercial License

  For companies or individuals who wish to use the plugin in a commercial context, require additional features, or need support, please refer to the [Commercial License Agreement](COMMERCIAL-LICENSE.md) for more details.