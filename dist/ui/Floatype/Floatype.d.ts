/**
 * OG Creator: Kailash Nadh
 * Github: https://github.com/knadh/floatype.js
 *
 * Reacted By: Claude 3.5 Sonnet and Ashbuilds
 */
import React from 'react';
type Options = {
    debounce?: number;
    onNavigate?: (direction: number, items: any[], currentIndex: number) => void;
    onQuery: (query: string) => any[];
    onRender?: (item: any) => React.ReactNode;
    onSelect?: (item: any, query: string) => string;
    onUpdate: (value: string) => void;
};
type FloatypeProps = {
    options: Partial<Options>;
};
export declare const Floatype: React.ForwardRefExoticComponent<FloatypeProps & React.RefAttributes<HTMLTextAreaElement>>;
export {};
//# sourceMappingURL=Floatype.d.ts.map