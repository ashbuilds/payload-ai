import type { ImageGenerateParams } from 'openai/resources/images';
export declare const generateImage: (prompt: string, { size, style, version, }?: {
    size?: ImageGenerateParams["size"];
    style?: ImageGenerateParams["style"];
    version?: ImageGenerateParams["model"];
}) => Promise<{
    alt: string;
    buffer: Buffer;
}>;
//# sourceMappingURL=generateImage.d.ts.map