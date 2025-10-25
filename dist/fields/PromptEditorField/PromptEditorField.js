'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Mention, MentionsInput } from 'react-mentions/dist/react-mentions.cjs.js';
import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js';
import { defaultStyle } from './defaultStyle.js';
export const PromptEditorField = (props)=>{
    const { field, path: pathFromContext } = props;
    const { setValue, value: payloadValue } = useField({
        path: pathFromContext
    });
    const [localValue, setLocalValue] = useState(payloadValue || '');
    const hasInitialized = useRef(false);
    const { promptEditorSuggestions } = useInstructions();
    const suggestions = useMemo(()=>promptEditorSuggestions.map((suggestion)=>({
                id: suggestion,
                display: suggestion
            })), [
        promptEditorSuggestions
    ]);
    useEffect(()=>{
        if (!hasInitialized.current || payloadValue === '') {
            setLocalValue(payloadValue || '');
            hasInitialized.current = true;
        }
    }, [
        payloadValue
    ]);
    const handleChange = useCallback((e)=>{
        setLocalValue(e.target.value);
    }, []);
    const handleBlur = useCallback(()=>{
        setValue(localValue);
    }, [
        localValue,
        setValue
    ]);
    const displayTransform = useCallback((id)=>`{{ ${id} }}`, []);
    return /*#__PURE__*/ _jsxs("div", {
        className: "field-type textarea",
        children: [
            /*#__PURE__*/ _jsx(FieldLabel, {
                label: field.label
            }),
            /*#__PURE__*/ _jsx(MentionsInput, {
                onBlur: handleBlur,
                onChange: handleChange,
                placeholder: "Type your prompt using {{ fieldName }} variables...",
                style: defaultStyle,
                value: localValue,
                children: /*#__PURE__*/ _jsx(Mention, {
                    data: suggestions,
                    displayTransform: displayTransform,
                    markup: "{{__id__}}",
                    style: {
                        backgroundColor: 'var(--theme-elevation-100)',
                        padding: '2px 0'
                    },
                    trigger: "{"
                })
            }),
            /*#__PURE__*/ _jsx(FieldDescription, {
                description: field?.admin?.description,
                path: ""
            })
        ]
    });
};

//# sourceMappingURL=PromptEditorField.js.map