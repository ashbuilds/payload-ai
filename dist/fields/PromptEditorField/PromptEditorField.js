'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { TextareaField as InputField, useField, useFieldProps, useForm } from '@payloadcms/ui';
import React, { useCallback, useEffect, useRef } from 'react';
import { useInstructions } from '../../providers/InstructionsProvider/hook.js';
import { Floatype } from '../../ui/Floatype/Floatype.js';
//TODO: Display the handlebarjs tips in description
export const PromptEditorField = (props)=>{
    const { name, path: pathFromProps, ...restProps } = props;
    const { path: pathFromContext } = useFieldProps();
    const elementRef = useRef(null);
    const { fields } = useInstructions({
        path: pathFromProps
    });
    const { path, setValue } = useField({
        path: pathFromContext || pathFromProps || name
    });
    const { formRef, initializing } = useForm();
    useEffect(()=>{
        if (!formRef.current || elementRef.current) return;
        const fieldId = `#field-${path.replace(/\./g, '__')}`;
        elementRef.current = formRef.current.querySelector(fieldId);
    }, [
        formRef,
        path
    ]);
    const handleQuery = useCallback((val)=>{
        if (val === '{{ ') return fields;
        return fields.filter((field)=>field.toLowerCase().includes(val.toLowerCase()));
    }, [
        fields
    ]);
    const handleSelect = useCallback((value, query)=>{
        if (query === '{{ ') return `${value} }}`;
        return fields.includes(value) ? value : undefined;
    }, [
        fields
    ]);
    const handleUpdate = useCallback((value)=>{
        if (value) setValue(value);
    }, [
        setValue
    ]);
    const CustomDescription = !initializing ? /*#__PURE__*/ _jsx(Floatype, {
        options: {
            onQuery: handleQuery,
            onSelect: handleSelect,
            onUpdate: handleUpdate
        },
        ref: elementRef
    }) : null;
    return /*#__PURE__*/ _jsx(InputField, {
        ...restProps,
        CustomDescription: CustomDescription,
        name: name,
        path: pathFromProps
    });
};

//# sourceMappingURL=PromptEditorField.js.map