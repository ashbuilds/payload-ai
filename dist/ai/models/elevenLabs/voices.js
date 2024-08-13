import { ElevenLabsClient } from 'elevenlabs';
let voicesState = {
    voices: []
};
export const getAllVoices = async ()=>{
    try {
        const elevenLabs = new ElevenLabsClient();
        if (!voicesState) {
            voicesState = await elevenLabs.voices.getAll({
                timeoutInSeconds: 10000
            });
        }
        return voicesState;
    } catch (error) {
        console.error('getAllVoices: ', error);
        return voicesState;
    }
};

//# sourceMappingURL=voices.js.map