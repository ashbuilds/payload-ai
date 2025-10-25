import type { Config } from 'payload';
import type { PluginConfig } from './types.js';
declare const payloadAiPlugin: (pluginConfig: PluginConfig) => (incomingConfig: Config) => Config;
export { payloadAiPlugin };
