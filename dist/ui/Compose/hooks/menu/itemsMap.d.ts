import type React from 'react';
import type { ActionMenuItems, BaseItemProps } from '../../../../types.js';
type MenuItemsMapType = {
    component: React.FC<BaseItemProps>;
    excludedFor?: string[];
    loadingText?: string;
    name: ActionMenuItems;
};
export declare const menuItemsMap: MenuItemsMapType[];
export {};
