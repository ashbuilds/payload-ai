export type Voice = {
    [key: string]: any;
    name?: string;
    voice_id: string;
};
export declare const getAllVoices: () => Promise<{
    voices: Voice[];
}>;
