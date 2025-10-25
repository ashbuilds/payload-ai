import React from 'react';
import type { BaseItemProps } from '../../../../types.js';
export declare const Item: React.FC<BaseItemProps>;
export declare const createMenuItem: (IconComponent: React.ComponentType<{
    size?: number;
}>, initialText: string) => React.MemoExoticComponent<({ children, disabled, hideIcon, isMenu, onClick, ...rest }: BaseItemProps) => React.JSX.Element>;
