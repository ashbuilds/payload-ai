import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { memo } from 'react';
import { ArrowIcon } from '../../../Icons/Icons.js';
import styles from './menu.module.scss';
export const Item = /*#__PURE__*/ memo(({ children, disabled, isActive, onClick, ...rest })=>/*#__PURE__*/ _jsx("span", {
        className: styles.generate_button + ' ' + (isActive ? styles.active : ''),
        "data-disabled": disabled,
        onClick: !disabled && typeof onClick === 'function' ? onClick : undefined,
        onKeyDown: !disabled && typeof onClick === 'function' ? onClick : undefined,
        role: "presentation",
        ...rest,
        children: children
    }));
export const createMenuItem = (IconComponent, initialText)=>/*#__PURE__*/ memo(({ children, disabled, hideIcon, isMenu, onClick, ...rest })=>/*#__PURE__*/ _jsxs(Item, {
            disabled: disabled,
            onClick: onClick,
            ...rest,
            children: [
                hideIcon || /*#__PURE__*/ _jsx(IconComponent, {
                    size: 18
                }),
                children || /*#__PURE__*/ _jsx("span", {
                    className: styles.text,
                    children: initialText
                }),
                isMenu && /*#__PURE__*/ _jsx(ArrowIcon, {
                    size: 18
                })
            ]
        }));

//# sourceMappingURL=Item.js.map