import type { SelectFieldClientProps } from 'payload';
import React from 'react';
export declare const SelectField: (props: {
    filterByField: string;
    options: {
        fields: string[];
        label: string;
        value: string;
    }[];
    path: string;
} & SelectFieldClientProps) => React.JSX.Element;
