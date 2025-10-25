type ElevenLabsTextToSpeechOptions = {
    voice_id: string;
};
export declare const generateVoice: (text: string, options: ElevenLabsTextToSpeechOptions) => Promise<{
    alignment: string[];
    buffer: Buffer<ArrayBuffer>;
} | undefined>;
export {};
