type ImageData = {
    image: {
        name: string;
        type: string;
        url: string;
    };
}[];
export declare function extractImageData(input: string): ImageData;
export {};
