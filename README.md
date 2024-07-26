# Payload AI Plugin

![Payload AI Plugin](https://via.placeholder.com/800x400?text=Payload+AI+Plugin)

### Payload AI Plugin is a powerful extension for the Payload CMS, integrating advanced AI capabilities to enhance content creation and management.

## 🌟 Features

- [x] Rich text generation using Anthropic and OpenAI models
- [x] Voice generation with ElevenLabs
- [x] Image generation with OpenAI
- [x] Field level prompt customization
- [ ] Analyse documents 
- [ ] Automation of content creation workflows
- [ ] Internationalization support

## 📋 Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

## 🚀 Installation

To install the Payload AI Plugin, run the following command in your Payload project:

```bash
npm install @ashbuilds/payload-ai
```

or if you're using pnpm:

```bash
pnpm add @ashbuilds/payload-ai
```

## 🔧 Usage

To use the Payload AI Plugin in your Payload config:

```javascript
import { buildConfig } from 'payload/config';
import aiPlugin from '@ashbuilds/payload-ai';

export default buildConfig({
  plugins: [
    aiPlugin(),
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

## 📚 API Reference

For detailed API documentation, please refer to our [API Reference](link-to-api-reference).

## 🤝 Contributing

We welcome contributions to the Payload AI Plugin! Please see our [Contributing Guide](link-to-contributing-guide) for more details.

## 📄 License

Payload AI Plugin is [MIT licensed](link-to-license-file).
