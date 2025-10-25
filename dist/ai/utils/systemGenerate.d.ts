export declare const systemGenerate: (data: {
    prompt: string;
    system: string;
}, generateTextFn?: (prompt: string, system: string) => Promise<string>) => Promise<string>;
