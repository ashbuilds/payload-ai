import type { Endpoint, Field, GroupField } from 'payload';
import { CSSProperties, MouseEventHandler } from 'react';
export interface PluginConfig {
    collections?: string[];
    fields?: Field[];
    globals?: string[];
    interfaceName?: string;
}
export interface GenerationModel {
    fields: string[];
    handler?: (payload: any, options: any) => Promise<any>;
    id: string;
    name: string;
    output: 'audio' | 'file' | 'image' | 'json' | 'text' | 'video';
    settings?: GroupField;
    supportsPromptOptimization?: boolean;
}
export interface GenerationConfig {
    models: GenerationModel[];
    provider: string;
}
export type GenerateTextarea<T = any> = (args: {
    doc: T;
    locale?: string;
    options?: any;
}) => Promise<string> | string;
export interface Instructions {
    'collection-slug': string;
    id: string;
    'model-id': string;
    prompt: string;
}
export interface Endpoints {
    textarea: Omit<Endpoint, 'root'>;
    upload: Omit<Endpoint, 'root'>;
}
export type ActionMenuItems = 'Compose' | 'Expand' | 'Proofread' | 'Rephrase' | 'Settings' | 'Simplify' | 'Summarize' | 'Tone' | 'Translate';
export type ActionMenuEvents = 'onCompose' | 'onExpand' | 'onProofread' | 'onRephrase' | 'onSettings' | 'onSimplify' | 'onSummarize' | 'onTone' | 'onTranslate';
export type UseMenuEvents = {
    [key in ActionMenuEvents]?: (data?: unknown) => void;
};
export type BaseItemProps<T = any> = {
    children?: React.ReactNode;
    disabled?: boolean;
    hideIcon?: boolean;
    onClick: (data?: unknown) => void;
    onMouseEnter?: MouseEventHandler<T> | undefined;
    onMouseLeave?: MouseEventHandler<T> | undefined;
    style?: CSSProperties | undefined;
    isMenu?: boolean;
    isActive?: boolean;
};
//# sourceMappingURL=types.d.ts.map