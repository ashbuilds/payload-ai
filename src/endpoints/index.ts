import type { Endpoints, PluginConfig } from '../types.js'

import {
  PLUGIN_API_ENDPOINT_GENERATE,
  PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
  PLUGIN_API_ENDPOINT_VIDEOGEN_WEBHOOK,
} from '../defaults.js'
import { promptMentionsEndpoint } from './promptMentions.js'
import { textareaHandler } from './textarea.js'
import { uploadHandler } from './upload.js'
import { videogenWebhookHandler } from './videogenWebhook.js'

export const endpoints: (pluginConfig: PluginConfig) => Endpoints = (pluginConfig) =>
  ({
    promptMentions: promptMentionsEndpoint,
    textarea: {
      handler: textareaHandler(pluginConfig),
      method: 'post',
      path: PLUGIN_API_ENDPOINT_GENERATE,
    },
    upload: {
      handler: uploadHandler(pluginConfig),
      method: 'post',
      path: PLUGIN_API_ENDPOINT_GENERATE_UPLOAD,
    },
    videogenWebhook: {
      handler: videogenWebhookHandler,
      method: 'post',
      path: PLUGIN_API_ENDPOINT_VIDEOGEN_WEBHOOK,
    },
  }) satisfies Endpoints
