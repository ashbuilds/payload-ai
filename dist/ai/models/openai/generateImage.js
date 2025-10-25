import OpenAI from 'openai';
import { editImagesWithOpenAI } from '../../utils/editImagesWithOpenAI.js';
export const generateImage = async (prompt, { images = [], size = '1024x1024', style = 'natural', version = 'dall-e-3' } = {})=>{
    const openaiAPI = new OpenAI();
    const options = {};
    if (version?.startsWith('dall')) {
        options['response_format'] = 'b64_json';
        options['style'] = style;
    }
    let response;
    const safeVersion = version ?? undefined;
    if (images?.length) {
        response = await editImagesWithOpenAI(images, prompt, safeVersion);
    } else {
        response = await openaiAPI.images.generate({
            model: safeVersion,
            n: 1,
            prompt,
            size,
            ...options
        });
    }
    const dataArr = response?.data ?? [];
    const { b64_json, revised_prompt } = dataArr[0] || {};
    return {
        alt: revised_prompt,
        buffer: Buffer.from(b64_json ?? '', 'base64')
    };
};

//# sourceMappingURL=generateImage.js.map