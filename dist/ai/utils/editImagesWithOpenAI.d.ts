import type { ImageReference } from '../../types.js';
/**
 * Send multiple images as `image[]` to OpenAI's image edit endpoint using gpt-image-1.
 * @param images
 * @param prompt Prompt to guide the image edit
 * @param model
 * @returns base64 string of the edited image
 * @note: Remove this function, once https://github.com/openai/openai-node/issues/1492 is fixed.
 */
export declare function editImagesWithOpenAI(images: ImageReference[], prompt: string, model?: string): Promise<any>;
