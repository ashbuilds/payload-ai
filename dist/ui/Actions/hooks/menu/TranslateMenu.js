import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import locales from 'locale-codes';
import { Translate } from './items.js';
import { Item } from './Item.js';
import styles from './menu.module.scss';
export const TranslateMenu = ({ onClick })=>{
    const [show, setShow] = useState(false);
    const filteredLocales = locales.all.filter((a)=>{
        return a.tag && a.location;
    });
    const [languages, setLanguages] = useState(filteredLocales);
    const [inputFocus, setInputFocus] = useState(false);
    return /*#__PURE__*/ _jsxs("div", {
        className: styles.menu,
        onMouseLeave: ()=>{
            if (!inputFocus) {
                setShow(false);
            }
        },
        children: [
            /*#__PURE__*/ _jsx(Translate, {
                onClick: ()=>{
                    setShow(!show);
                },
                onMouseEnter: ()=>setShow(true),
                isMenu: true,
                isActive: show
            }),
            /*#__PURE__*/ _jsx("div", {
                className: styles.hoverMenu,
                "data-show": show,
                children: /*#__PURE__*/ _jsxs("div", {
                    className: `${styles.menu} ${styles.subMenu}`,
                    children: [
                        /*#__PURE__*/ _jsx(Item, {
                            onClick: ()=>{},
                            style: {
                                position: 'sticky',
                                top: 0,
                                padding: '0 0 5px 0',
                                background: 'transparent'
                            },
                            children: /*#__PURE__*/ _jsx("input", {
                                className: styles.menuInput,
                                placeholder: 'Search...',
                                onFocus: ()=>setInputFocus(true),
                                onBlur: ()=>setInputFocus(false),
                                onChange: (event)=>{
                                    const value = event.target.value;
                                    setLanguages(filteredLocales.filter((l)=>{
                                        const lowerCaseValue = value.toLowerCase();
                                        return l.name.toLowerCase().startsWith(lowerCaseValue) || l.location.toLowerCase().startsWith(lowerCaseValue) || l.tag.toLowerCase().startsWith(lowerCaseValue);
                                    }));
                                }
                            })
                        }),
                        languages.map((locale)=>{
                            return /*#__PURE__*/ _jsx(Item, {
                                onClick: ()=>{
                                    onClick({
                                        locale: locale.tag
                                    });
                                },
                                children: /*#__PURE__*/ _jsx("span", {
                                    className: styles.ellipsis,
                                    children: `${locale.location} (${locale.tag})`
                                })
                            }, locale.tag);
                        })
                    ]
                })
            })
        ]
    });
};

//# sourceMappingURL=TranslateMenu.js.map