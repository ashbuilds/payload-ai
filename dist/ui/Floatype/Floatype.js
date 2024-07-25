/**
 * OG Creator: Kailash Nadh
 * Github: https://github.com/knadh/floatype.js
 *
 * Reacted By: Claude 3.5 Sonnet and Ashbuilds
 * Warning: May contain nonsensical code
 */ import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './floatype.module.scss';
export function Floatype({ inputRef, options }) {
    const [items, setItems] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [query, setQuery] = useState(null);
    const boxRef = useRef(null);
    const shadowRef = useRef(null);
    const [coords, setCoords] = useState(null);
    const opt = {
        debounce: 100,
        onNavigate: undefined,
        onQuery: ()=>[],
        onRender: undefined,
        onSelect: undefined,
        onUpdate: ()=>{},
        ...options
    };
    const destroy = useCallback(()=>{
        setItems([]);
        setCurrentIndex(0);
        setQuery(null);
    }, []);
    const getLastWord = useCallback((el)=>{
        const text = el.value.substring(0, el.selectionStart ?? 0);
        const match = text.match(/\S+\s*$/);
        return match ? match[0] : null;
    }, []);
    const handleBlur = useCallback(()=>{
        // Uncomment the following line if you want to destroy on blur
        destroy();
    }, []);
    useEffect(()=>{
        const fetchItems = ()=>{
            if (!query) return;
            const newItems = opt.onQuery(query);
            setItems(newItems);
        };
        const timeoutId = setTimeout(fetchItems, opt.debounce);
        return ()=>clearTimeout(timeoutId);
    }, [
        query,
        opt.onQuery,
        opt.debounce
    ]);
    useEffect(()=>{
        if (opt.onNavigate) {
            opt.onNavigate(1, items, currentIndex);
        }
    }, [
        currentIndex,
        items,
        opt
    ]);
    useEffect(()=>{
        if (!shadowRef.current || !inputRef.current) return;
        const shadow = shadowRef.current;
        const el = inputRef.current;
        const stylesCss = window.getComputedStyle(el);
        for (const p of stylesCss){
            shadow.style[p] = stylesCss[p];
        }
        shadow.style.position = 'absolute';
        shadow.style.padding = '0.9rem 1.4rem';
        shadow.style.minHeight = 'calc(5.8rem + 32px)';
        shadow.style.visibility = 'hidden';
    }, [
        inputRef
    ]);
    const getCaret = useCallback(()=>{
        if (!inputRef.current || !shadowRef.current) return null;
        const el = inputRef.current;
        const shadow = shadowRef.current;
        const txt = el.value.substring(0, el.selectionStart ?? 0);
        const start = Math.max(txt.lastIndexOf('\n'), txt.lastIndexOf(' ')) + 1;
        const cl = 'floatype-caret';
        shadow.innerHTML = el.value.substring(0, start) + `<span id="${cl}" style="display: inline-block;">${el.value.substring(start)}</span>`;
        const m = shadow.querySelector(`#${cl}`);
        const rect = el.getBoundingClientRect();
        const rectM = m?.getBoundingClientRect();
        let top = rect.top + (rect.top - rectM.top);
        let left = rectM.left - 32 * 2 + rectM.width;
        if (boxRef.current && currentIndex) {
            const box = boxRef.current;
            const selected = box.children[currentIndex];
            if (selected) {
                top -= selected.offsetTop + (selected.clientHeight / 2 - 5);
            }
        }
        if (boxRef.current) {
            const box = boxRef.current;
            if (box.clientWidth + left + 50 > window.innerWidth) {
                left = left - box.offsetWidth - 50;
            }
        }
        return {
            x: left,
            y: top
        };
    }, [
        inputRef,
        shadowRef,
        boxRef,
        currentIndex
    ]);
    const insertWord = useCallback((el, val)=>{
        const start = Math.max(el.value.lastIndexOf(' ', (el.selectionStart ?? 0) - 1), el.value.lastIndexOf('\n', (el.selectionStart ?? 0) - 1)) + 1;
        el.value = el.value.substring(0, start) + val + (el.value[el.selectionStart ?? 0] !== ' ' ? ' ' : '') + el.value.substring(el.selectionStart ?? 0);
        el.setSelectionRange(start + val.length + 1, start + val.length + 1);
        opt.onUpdate(el.value);
    }, [
        opt
    ]);
    const handleInput = useCallback(()=>{
        if (!inputRef.current) return;
        const w = getLastWord(inputRef.current);
        if (!w) {
            destroy();
            return;
        }
        setQuery(w);
    }, [
        inputRef,
        getLastWord,
        destroy
    ]);
    const handleKeyDown = useCallback((e)=>{
        if (!boxRef.current) return;
        switch(e.keyCode){
            case 38:
                e.preventDefault();
                setCurrentIndex((prev)=>(prev - 1 + items.length) % items.length);
                break;
            case 40:
                e.preventDefault();
                setCurrentIndex((prev)=>(prev + 1) % items.length);
                break;
            case 9:
            case 32:
                break;
            case 13:
                e.preventDefault();
                if (inputRef.current) {
                    const selectedItem = items[currentIndex];
                    const newVal = opt.onSelect ? opt.onSelect(selectedItem, query) : selectedItem;
                    insertWord(inputRef.current, newVal);
                }
                destroy();
                break;
            case 27:
                destroy();
                break;
        }
    }, [
        boxRef,
        items,
        currentIndex,
        inputRef,
        opt.onSelect,
        insertWord,
        destroy,
        query
    ]);
    useEffect(()=>{
        if (!inputRef.current) return;
        const el = inputRef.current;
        el.addEventListener('input', handleInput);
        el.addEventListener('keydown', handleKeyDown);
        el.addEventListener('blur', handleBlur);
        return ()=>{
            el.removeEventListener('input', handleInput);
            el.removeEventListener('keydown', handleKeyDown);
            el.removeEventListener('blur', handleBlur);
        };
    }, [
        inputRef,
        handleInput,
        handleKeyDown,
        handleBlur
    ]);
    useEffect(()=>{
        const fetchItems = ()=>{
            if (!query) return;
            const newItems = opt.onQuery(query);
            setItems(newItems);
            // Calculate coordinates after items are fetched
            const newCoords = getCaret();
            setCoords(newCoords);
        };
        const timeoutId = setTimeout(fetchItems, opt.debounce);
        return ()=>clearTimeout(timeoutId);
    }, [
        query,
        opt.onQuery,
        opt.debounce,
        getCaret,
        currentIndex
    ]);
    useEffect(()=>{
        if (boxRef.current && coords) {
            const box = boxRef.current;
            box.style.position = 'fixed';
            box.style.left = `${coords.x}px`;
            box.style.top = `${coords.y}px`;
            box.style.width = inputRef.current ? window.getComputedStyle(inputRef.current).width : 'auto';
            box.style.display = items.length > 0 ? 'block' : 'none';
        }
    }, [
        coords,
        items,
        inputRef
    ]);
    // TODO: Fix the display issue
    return /*#__PURE__*/ _jsxs("div", {
        className: "field-type textarea",
        style: {
            // display: items.length > 0 ? 'block' : 'none',
            // margin: items.length > 0 ? 'block' : 'none',
            position: 'relative'
        },
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "textarea-outer",
                ref: shadowRef,
                style: {
                    position: 'absolute'
                }
            }),
            items.length > 0 ? /*#__PURE__*/ _jsx("div", {
                className: styles.floatype,
                ref: boxRef,
                children: items.map((item, idx)=>/*#__PURE__*/ _jsx("div", {
                        className: `${styles.floatype_item} ${idx === currentIndex ? styles.floatype_sel : ''}`,
                        "data-selected": idx === currentIndex,
                        onMouseDown: ()=>{
                            if (inputRef.current) {
                                const newVal = opt.onSelect ? opt.onSelect(item, query) : item;
                                insertWord(inputRef.current, newVal);
                            }
                            destroy();
                        },
                        children: opt.onRender ? opt.onRender(item) : item
                    }, idx))
            }) : null
        ]
    });
}

//# sourceMappingURL=Floatype.js.map