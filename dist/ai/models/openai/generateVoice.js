import OpenAI from 'openai';
export const generateVoice = async (text, options)=>{
    const openai = new OpenAI();
    const mp3 = await openai.audio.speech.create({
        input: text,
        model: options.model,
        response_format: options.response_format,
        speed: options.speed,
        voice: options.voice
    });
    if (mp3.ok) {
        const audioBuffer = Buffer.from(await mp3.arrayBuffer());
        return {
            buffer: audioBuffer
        };
    }
};

//# sourceMappingURL=generateVoice.js.map