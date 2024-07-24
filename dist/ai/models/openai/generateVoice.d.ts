import type { SpeechCreateParams } from 'openai/resources/audio/speech';
type OpenAITextToSpeechOptions = Exclude<SpeechCreateParams, 'input'>;
export declare const generateVoice: (text: string, options: OpenAITextToSpeechOptions) => Promise<{
    buffer: Buffer;
}>;
export {};
//# sourceMappingURL=generateVoice.d.ts.map