import type { ClientField } from 'payload';
import React from 'react';
type ComposeFieldProps = {
    [key: string]: any;
    field: ClientField;
    path?: string;
    schemaPath?: string;
};
export declare const ComposeField: (props: ComposeFieldProps) => React.JSX.Element;
export {};
