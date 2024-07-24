/**
 * OG Creator: Kailash Nadh
 * Github: https://github.com/knadh/floatype.js
 *
 * Reacted By: Claude 3.5 Sonnet and Ashbuilds
 * Warning: May contain nonsensical code
 */
import React from 'react';
type Options<T> = {
    debounce?: number;
    onNavigate?: (direction: number, items: T[], currentIndex: number) => void;
    onQuery: (query: string) => T[];
    onRender?: (item: T) => React.ReactNode;
    onSelect?: (item: T, query: string) => string;
    onUpdate: (value: string) => void;
};
type FloatypeProps<T> = {
    inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
    options: Partial<Options<T>>;
};
export declare function Floatype<T>({ inputRef, options }: FloatypeProps<T>): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Floatype.d.ts.map