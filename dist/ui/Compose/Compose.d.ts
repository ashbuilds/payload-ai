import type { ClientField } from 'payload';
import type { FC } from 'react';
type ComposeProps = {
    descriptionProps?: {
        field: ClientField;
        path: string;
        schemaPath: string;
    };
    instructionId: string;
    isConfigAllowed: boolean;
};
export declare const Compose: FC<ComposeProps>;
export {};
