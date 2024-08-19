'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useField, useFieldProps } from '@payloadcms/ui';
import React, { useEffect, useMemo, useState } from 'react';
import { Compose, Proofread, Rephrase } from './items.js';
import { menuItemsMap } from './itemsMap.js';
import styles from './menu.module.scss';
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
export const useMenu = (menuEvents)=>{
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
        if (menuItemsMap.some((i)=>i.excludedFor?.includes(fieldType))) {
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
        fieldType
    ]);
    const MemoizedActiveComponent = useMemo(()=>{
        return ({ isLoading })=>{
            const ActiveComponent = getActiveComponent(activeComponent);
            const activeItem = menuItemsMap.find((i)=>i.name === activeComponent);
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
    const filteredMenuItems = useMemo(()=>menuItemsMap.filter((i)=>i.name !== activeComponent && !i.excludedFor?.includes(fieldType)), [
        activeComponent,
        fieldType
    ]);
    const MemoizedMenu = useMemo(()=>{
        return ({ isLoading, onClose })=>/*#__PURE__*/ _jsx("div", {
                className: styles.menu,
                children: filteredMenuItems.map((i)=>{
                    const Action = i.component;
                    return /*#__PURE__*/ _jsx(Action, {
                        disabled: isLoading,
                        onClick: (data)=>{
                            if (i.name !== 'Settings') {
                                setActiveComponent(i.name);
                            }
                            menuEvents[`on${i.name}`](data);
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
    return {
        ActiveComponent: MemoizedActiveComponent,
        Menu: MemoizedMenu
    };
};

//# sourceMappingURL=useMenu.js.map