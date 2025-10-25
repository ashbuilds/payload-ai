import type { GenerateImageParams } from '../../../types.js';
export declare const generateImage: (prompt: string, { images, size, style, version, }?: GenerateImageParams) => Promise<{
    alt: string | undefined;
    buffer: Buffer<ArrayBuffer>;
}>;
