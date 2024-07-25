import { ElevenLabsClient } from 'elevenlabs';
export const generateVoice = async (text, options)=>{
    const elevenLabs = new ElevenLabsClient({
        apiKey: process.env.ELEVENLABS_API_KEY
    });
    const response = await elevenLabs.textToSpeech.convertWithTimstamps(options.voice_id, {
        ...options,
        text
    });
    if (response?.audio_base64) {
        const audioBuffer = Buffer.from(response.audio_base64, 'base64');
        // const transcript = convertToTranscript(mp3Audio.alignment)
        return {
            alignment: response.alignment,
            buffer: audioBuffer
        };
    }
};

//# sourceMappingURL=generateVoice.js.map