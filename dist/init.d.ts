import type { Payload } from 'payload';
import type { PluginConfig } from './types.js';
export declare const init: (payload: Payload, fieldSchemaPaths: Record<string, {
    label: string;
    relationTo?: string;
    type: string;
}>, pluginConfig: PluginConfig) => Promise<void>;
