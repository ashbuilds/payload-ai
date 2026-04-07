# Payload AI Plugin

<p align="center">
  <img alt="Payload AI Plugin" src="assets/payload-ai-intro.gif" width="100%" />
</p>

<p align="center">
  <strong>Transform content creation with intelligent automation — your models, your way</strong>
</p>

<p align="center">
  <img alt="Supported AI Providers" src="assets/providers.png" width="100%" />
</p>

---

## 🚀 What is this?

The Payload AI Plugin is your secret weapon for turbocharged content creation. It seamlessly integrates cutting-edge AI capabilities directly into [Payload CMS](https://payloadcms.com), turning your content workflow from tedious to tremendous.

### 🎥 See It in Action

- **[Quick Demo](https://youtu.be/qaYukeGpuu4)** - Watch the magic happen
- **[Extended Demo](https://youtu.be/LEsuHbKalNY)** - Deep dive into all features
- **[Customization Guide](guide.md)** - Make it your own

---

## ⚠️ Beta Notice

This plugin is actively evolving. We're constantly shipping improvements and new features. Tested with Payload v3.38.0.

**Quick Start Tip:** Try it out with [Payload's website template](https://github.com/payloadcms/payload/tree/main/templates/website) for the smoothest experience.

---

## ✨ Features

### 📝 Text & RichText Fields

**Content Generation Magic:**
- ✅ **Compose** - Generate content from scratch
- ✅ **Proofread** - Polish your prose (Beta)
- ✅ **Translate** - Break language barriers
- ✅ **Rephrase** - Find better ways to say it (Beta)
- 🔜 **Expand** - Elaborate on ideas
- 🔜 **Summarize** - Distill the essence
- 🔜 **Simplify** - Make complex things clear

### 🎨 Upload Fields

- 🎙️ **Voice Generation** - Powered by ElevenLabs & OpenAI
- 🖼️ **Image Generation** - Powered by OpenAI (DALL-E & GPT-Image-1)

### 🔧 Power User Features

- 🔌 **Bring Your Own Model** - Not limited to our defaults
- 🎛️ **Field-Level Prompts** - Customize AI behavior per field
- 🔐 **Access Control** - Lock down who can use AI features
- 🧠 **Prompt Editor** - Fine-tune AI instructions
- 🌍 **i18n Support** - Works with your multilingual setup
- 🎨 **Custom Components** - Extend with your own UI

### 🔜 Coming Soon

- 📊 Document Analyzer
- ✅ Fact Checking
- 🔄 Automated Workflows
- 💡 Editor Suggestions
- 💬 AI Chat Assistant

---

## 📦 Installation

```bash
pnpm add @ai-stack/payloadcms
```

That's it! Now let's configure it.

---

## 🛠️ Quick Setup

### Step 1: Configure the Plugin

Add to `src/payload.config.ts`:

```typescript
import { payloadAiPlugin } from '@ai-stack/payloadcms'

export default buildConfig({
  plugins: [
    payloadAiPlugin({
      collections: {
        [Posts.slug]: true,
      },
      debugging: false,
    }),
  ],
  // ... rest of your config
})
```

### Step 2: Enable AI in Your Fields

Add to your RichText fields (e.g., `src/collections/Posts/index.ts`):

```typescript
import { PayloadAiPluginLexicalEditorFeature } from '@ai-stack/payloadcms'

fields: [
  {
    name: 'content',
    type: 'richText',
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [
          HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
          // Add this line:
          PayloadAiPluginLexicalEditorFeature(),
        ]
      },
    }),
  },
]
```

### Step 3: Add Your API Keys

Create a `.env` file in your project root. Add the keys for the providers you want to use:
```env
# Text Generation - Choose your provider(s)
OPENAI_API_KEY=your-openai-api-key           # OpenAI models (GPT-4, etc.)
ANTHROPIC_API_KEY=your-anthropic-api-key     # Claude models
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key # Gemini models
MINIMAX_API_KEY=your-minimax-api-key         # MiniMax M2.7 / M2.5 models

# Image Generation - Choose your provider(s)
OPENAI_API_KEY=your-openai-api-key           # DALL-E (uses same key as above)
# OPENAI_ORG_ID=your-org-id                  # Required only for GPT-Image-1 model
GOOGLE_GENERATIVE_AI_API_KEY=your-google-key # Imagen (uses same key as above)

# Audio/Voice Generation - Choose your provider(s)
ELEVENLABS_API_KEY=your-elevenlabs-api-key   # ElevenLabs voices
OPENAI_API_KEY=your-openai-api-key           # OpenAI TTS (uses same key as above)

# Optional: Use custom OpenAI-compatible endpoint
# OPENAI_BASE_URL=https://api.openai.com/v1
```

**You only need the keys for the providers you plan to use.** Mix and match based on your preferences!


**Important:** Restart your server after updating `.env` or plugin settings!

You may also need to regenerate the import map:
```bash
payload generate:importmap
```

---

## ⚙️ Advanced Configuration

<details>
<summary><strong>🔐 Access Control & Multi-Tenant Setup</strong></summary>

```typescript
import { payloadAiPlugin } from '@ai-stack/payloadcms'

export default buildConfig({
  plugins: [
    payloadAiPlugin({
      collections: {
        [Posts.slug]: true,
      },
      
      // Enable AI for globals too
      globals: {
        [Home.slug]: true,
      },

      // Development helpers
      debugging: false,
      disableSponsorMessage: false,
      generatePromptOnInit: process.env.NODE_ENV !== 'production',

      // Specify media collection for GPT-Image-1
      uploadCollectionSlug: "media",

      // Lock down AI features
      access: {
        generate: ({ req }) => req.user?.role === 'admin',
        settings: ({ req }) => req.user?.role === 'admin',
      },

      // Customize language options
      options: {
        enabledLanguages: ["en-US", "zh-SG", "zh-CN", "en"],
      },

      // Reference additional fields in prompts
      promptFields: [
        {
          name: 'url',
          collections: ['images'],
        },
        {
          name: 'markdown',
          async getter(doc, {collection}) {
            return docToMarkdown(collection, doc)
          }
        }
      ],

      // Control initial prompt generation
      seedPrompts: ({path}) => {
        if (path.endsWith('.meta.description')) {
          return {
            data: {
              prompt: 'Generate SEO-friendly meta description: {{markdown}}',
            }
          }
        }
        if (path.endsWith('.slug')) return false // Disable for slugs
        return undefined // Use defaults
      },

      // Custom media upload (useful for multi-tenant)
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

<details>
<summary><strong>🎨 Custom Components & Fields</strong></summary>

Custom fields don't automatically inherit AI capabilities. If your AI-enabled fields don't show Compose settings, manually add this component path:

```
@ai-stack/payloadcms/fields#ComposeField
```

**Debug Tip:** Enable `debugging: true` in your plugin config to see which fields have AI enabled.

</details>

---

## 📚 Documentation

Need more details? Check out the **[Complete Setup Guide](guide.md)** for:
- Custom model configuration
- Advanced prompt engineering
- Field-specific customization
- Troubleshooting tips

---

## 🤝 Support This Project

Built with ❤️ in my free time. If this plugin saves you hours of work, consider fueling future development!

<a href="https://www.buymeacoffee.com/ashbuilds" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="60" width="217" />
</a>

Every coffee keeps the AI models running and new features shipping. Thank you! 🙏

---

## 👥 Contributing

We love contributors! Whether you're fixing typos, suggesting features, or building new capabilities, all contributions are welcome.

### Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest features
- 📖 Improve documentation
- 🔧 Submit pull requests

Join the conversation on [Payload's Discord](https://discord.com/channels/967097582721572934/1264949995656843345) and let's build something amazing together!

### Local Development

Want to hack on the plugin? Here's how:

#### Prerequisites

- Node.js (version in `.nvmrc`)
- pnpm
- Database connection (Postgres or MongoDB)
- Optional: AI provider API keys

#### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp dev/.env.example dev/.env
# Edit dev/.env with your DATABASE_URI, PAYLOAD_SECRET, and API keys

# 3. Start development server
pnpm dev
# Admin UI available at http://localhost:3000

# 4. Generate types/importmap if needed
pnpm generate:importmap
pnpm generate:types
```

#### Development Workflow

- Plugin source: `src/`
- Test app: `dev/`
- Edit files in `src/` and refresh to see changes

#### Testing & Quality

```bash
pnpm test                    # Run all tests
pnpm lint                    # ESLint
pnpm prettier --write .      # Format code
pnpm build                   # Build plugin
```

#### Test in Another Project

```bash
pnpm pack
# In your other project:
pnpm add /path/to/ai-plugin-*.tgz
```

#### Project Structure

```
├── src/              # Plugin source code
├── dev/              # Test Payload app
│   ├── int.spec.ts   # Integration tests
│   └── e2e.spec.ts   # E2E tests
└── README.md         # You are here!
```

---

<p align="center">
  Made with ❤️ and ☕ by the community
</p>

<p align="center">
  <a href="https://github.com/ashbuilds/payload-ai">Star on GitHub</a> •
  <a href="https://discord.com/channels/967097582721572934/1264949995656843345">Join Discord</a> •
  <a href="guide.md">Read the Guide</a>
</p>