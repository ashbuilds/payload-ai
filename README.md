<img alt="Payload AI Plugin" src="assets/payloadcms-ai.gif" width="100%" />

### The Payload AI Plugin is a powerful extension for the [Payload CMS](https://payloadcms.com), integrating advanced AI capabilities to enhance content creation and management.

### 🖼️ [Quick demo](https://youtu.be/qaYukeGpuu4)

## 🌟 Features

- [x] Rich text generation
  - [x] Compose
  - [ ] Proofread(Beta)
  - [ ] Translate
  - [ ] Expand
  - [ ] Summarize
  - [ ] Simplify
  - [ ] Rephrase(Beta)
  
- [x] Voice generation with ElevenLabs
- [x] Image generation with OpenAI
- [x] Field level prompt customization
- [ ] Prompt Editor(Beta)
- [ ] Analyse documents
- [ ] Fact checking
- [ ] Automation of content creation workflows
- [ ] Internationalization support
- [ ] AI Chat support

## 📋 Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Installation

To install the Payload AI Plugin, run the following command in your Payload project:

```bash
pnpm add payload-ai-plugin
```

## 🔧 Usage

To use the Payload AI Plugin in your Payload config:

```javascript
import { buildConfig } from 'payload/config';
import { payloadAI } from 'payload-ai-plugin';

export default buildConfig({
  plugins: [
    payloadAI({
      collections: [Posts.slug],
    }),
  ],
  // ... rest of your payload config
});
```

## ⚙️ Configuration

The plugin uses environment variables for configuration. Create a `.env` file in your project root and add the following variables:

```
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key
ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

Make sure to replace the placeholder values with your actual API keys.

## 🤝 Contributing

We welcome contributions to the Payload AI Plugin! Please join us on [Discord](https://discord.com/channels/967097582721572934/1270873253581160499) for more details.

## 📄 License

Payload AI Plugin is [MIT licensed](link-to-license-file).
