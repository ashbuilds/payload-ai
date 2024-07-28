'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useField, useFieldProps } from '@payloadcms/ui';
import React, { memo, useEffect, useMemo, useState } from 'react';
import { DocsAddOnIcon, EditNoteIcon, SegmentIcon, SpellCheckIcon, StylusNoteIcon, SummarizeIcon, TranslateIcon, TuneIcon } from '../Icons.js';
import styles from '../actions.module.scss';
const Item = /*#__PURE__*/ memo(({ children, onClick = ()=>{} })=>/*#__PURE__*/ _jsx("span", {
        className: styles.generate_button,
        onClick: onClick,
        onKeyDown: onClick,
        role: "presentation",
        children: children
    }));
const createMenuItem = (IconComponent, text)=>/*#__PURE__*/ memo(({ hideIcon, onClick })=>/*#__PURE__*/ _jsxs(Item, {
            onClick: onClick,
            children: [
                hideIcon || /*#__PURE__*/ _jsx(IconComponent, {
                    size: 18
                }),
                text
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
        ]
    },
    {
        name: 'Rephrase',
        component: Rephrase,
        excludedFor: [
            'upload'
        ]
    },
    {
        name: 'Translate',
        component: Translate,
        excludedFor: [
            'upload'
        ]
    },
    {
        name: 'Expand',
        component: Expand,
        excludedFor: [
            'upload',
            'text'
        ]
    },
    {
        name: 'Summarize',
        component: Summarize,
        excludedFor: [
            'upload',
            'text'
        ]
    },
    {
        name: 'Simplify',
        component: Simplify,
        excludedFor: [
            'upload'
        ]
    },
    {
        name: 'Compose',
        component: Compose
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
        return ({ disabled = false })=>{
            const ActiveComponent = getActiveComponent(activeComponent);
            return /*#__PURE__*/ _jsx(ActiveComponent, {
                hideIcon: true,
                onClick: menuEvents[`on${activeComponent}`]
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
        return ({ disabled = false, onClose })=>/*#__PURE__*/ _jsx("div", {
                className: styles.menu,
                children: filteredMenuItems.map((i)=>{
                    const Item = i.component;
                    return /*#__PURE__*/ _jsx(Item, {
                        onClick: ()=>{
                            menuEvents[`on${i.name}`]();
                            onClose();
                        }
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