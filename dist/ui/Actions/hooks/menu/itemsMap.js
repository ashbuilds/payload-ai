import React from 'react';
import { Compose, Expand, Proofread, Rephrase, Settings, Simplify, Summarize } from './items.js';
import { TranslateMenu } from './TranslateMenu.js';
export const menuItemsMap = [
    {
        name: 'Proofread',
        component: Proofread,
        excludedFor: [
            'upload'
        ],
        loadingText: 'Proofreading'
    },
    {
        name: 'Rephrase',
        component: Rephrase,
        excludedFor: [
            'upload'
        ],
        loadingText: 'Rephrasing'
    },
    {
        name: 'Translate',
        component: TranslateMenu,
        excludedFor: [
            'upload'
        ],
        loadingText: 'Translating'
    },
    {
        name: 'Expand',
        component: Expand,
        excludedFor: [
            'upload',
            'text'
        ],
        loadingText: 'Expanding'
    },
    {
        name: 'Summarize',
        component: Summarize,
        excludedFor: [
            'upload',
            'text'
        ],
        loadingText: 'Summarizing'
    },
    {
        name: 'Simplify',
        component: Simplify,
        excludedFor: [
            'upload'
        ],
        loadingText: 'Simplifying'
    },
    {
        name: 'Compose',
        component: Compose,
        loadingText: 'Composing'
    },
    {
        name: 'Settings',
        component: Settings
    }
];

//# sourceMappingURL=itemsMap.js.map