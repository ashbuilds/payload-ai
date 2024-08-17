'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useField, useFieldProps } from '@payloadcms/ui';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { DocsAddOnIcon, EditNoteIcon, SegmentIcon, SpellCheckIcon, StylusNoteIcon, SummarizeIcon, TranslateIcon, TuneIcon } from '../../Icons/Icons.js';
import styles from '../actions.module.css';
const Item = /*#__PURE__*/ memo(({ children, disabled, onClick = ()=>{} })=>/*#__PURE__*/ _jsx("span", {
        className: styles.generate_button,
        "data-disabled": disabled,
        onClick: !disabled ? onClick : null,
        onKeyDown: !disabled ? onClick : null,
        role: "presentation",
        children: children
    }));
const createMenuItem = (IconComponent, initialText)=>/*#__PURE__*/ memo(({ children, disabled, hideIcon, onClick })=>/*#__PURE__*/ _jsxs(Item, {
            disabled: disabled,
            onClick: onClick,
            children: [
                hideIcon || /*#__PURE__*/ _jsx(IconComponent, {
                    size: 18
                }),
                children || initialText
            ]
        }));
const Proofread = createMenuItem(SpellCheckIcon, 'Proofread');
const Rephrase = createMenuItem(EditNoteIcon, 'Rephrase');
const Translate = createMenuItem(TranslateIcon, 'Translate');
const Expand = createMenuItem(DocsAddOnIcon, 'Expand');
const Summarize = createMenuItem(SummarizeIcon, 'Summarize');
const Simplify = createMenuItem(SegmentIcon, 'Simplify');
const Compose = createMenuItem(StylusNoteIcon, 'Compose');
const Settings = createMenuItem(TuneIcon, 'Settings');
const MenuItemsMap = [
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
        component: Translate,
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
const getActiveComponent = (ac)=>{
    switch(ac){
        case 'Proofread':
            return Proofread;
        case 'Rephrase':
            return Rephrase;
        case 'Compose':
            return Compose;
        default:
            return Rephrase;
    }
};
export const useMenu = ({ lexicalEditor }, menuEvents)=>{
    const { type: fieldType, path: pathFromContext } = useFieldProps();
    const field = useField({
        path: pathFromContext
    });
    const [activeComponent, setActiveComponent] = useState('Rephrase');
    const { initialValue, value } = field;
    useEffect(()=>{
        if (!value) {
            setActiveComponent('Compose');
            return;
        }
        if (MenuItemsMap.some((i)=>i.excludedFor?.includes(fieldType))) {
            setActiveComponent('Compose');
            return;
        }
        if (typeof value === 'string' && value !== initialValue) {
            setActiveComponent('Proofread');
        } else {
            setActiveComponent('Rephrase');
        }
    }, [
        initialValue,
        value,
        fieldType,
        lexicalEditor
    ]);
    const MemoizedActiveComponent = useMemo(()=>{
        return ({ isLoading })=>{
            const ActiveComponent = getActiveComponent(activeComponent);
            const activeItem = MenuItemsMap.find((i)=>i.name === activeComponent);
            return /*#__PURE__*/ _jsx(ActiveComponent, {
                disabled: isLoading,
                hideIcon: true,
                onClick: menuEvents[`on${activeComponent}`],
                children: isLoading && activeItem.loadingText
            });
        };
    }, [
        activeComponent,
        menuEvents
    ]);
    const filteredMenuItems = useMemo(()=>MenuItemsMap.filter((i)=>i.name !== activeComponent && !i.excludedFor?.includes(fieldType)), [
        activeComponent,
        fieldType
    ]);
    const MemoizedMenu = useMemo(()=>{
        return ({ isLoading, onClose })=>/*#__PURE__*/ _jsx("div", {
                className: styles.menu,
                children: filteredMenuItems.map((i)=>{
                    const Item = i.component;
                    return /*#__PURE__*/ _jsx(Item, {
                        disabled: isLoading,
                        onClick: ()=>{
                            if (i.name !== 'Settings') {
                                setActiveComponent(i.name);
                            }
                            menuEvents[`on${i.name}`]();
                            onClose();
                        },
                        children: isLoading && i.loadingText
                    }, i.name);
                })
            });
    }, [
        filteredMenuItems,
        menuEvents
    ]);
    // Simply return the object without additional useMemo
    return {
        ActiveComponent: MemoizedActiveComponent,
        Menu: MemoizedMenu
    };
};

//# sourceMappingURL=useMenu.js.map