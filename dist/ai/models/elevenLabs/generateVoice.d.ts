import type * as ElevenLabs from 'elevenlabs/api';
type ElevenLabsTextToSpeechOptions = {
    voice_id: string;
} & Pick<ElevenLabs.TextToSpeechWithTimstampsRequest, 'model_id' | 'next_text' | 'previous_text' | 'seed' | 'voice_settings'>;
export declare const generateVoice: (text: string, options: ElevenLabsTextToSpeechOptions) => Promise<{
    alignment: string[];
    buffer: Buffer;
}>;
export {};
//# sourceMappingURL=generateVoice.d.ts.map