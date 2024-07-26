'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { TextareaField as InputField, useField, useFieldProps, useForm } from '@payloadcms/ui';
import React, { useContext, useEffect, useRef } from 'react';
import { PromptContext } from '../../providers/Prompt/index.js';
import { Floatype } from '../../ui/Floatype/Floatype.js';
export const PromptTextareaField = (props)=>{
    const { name, path: pathFromProps } = props;
    const { path: pathFromContext } = useFieldProps();
    const { path, setValue } = useField({
        path: pathFromContext || pathFromProps || name
    });
    const formInfo = useForm();
    const { formRef } = formInfo;
    const fieldsInfo = useContext(PromptContext);
    const elementRef = useRef(null);
    useEffect(()=>{
        if (!formRef.current || elementRef.current) {
            return;
        }
        const fieldId = `#field-${path.replace(/\./g, '__')}`;
        const textareaElement = formRef.current.querySelector(fieldId);
        if (textareaElement) {
            elementRef.current = textareaElement;
        }
    }, [
        formRef,
        path,
        fieldsInfo,
        elementRef
    ]);
    return /*#__PURE__*/ _jsx(React.Fragment, {
        children: /*#__PURE__*/ _jsx(InputField, {
            ...props,
            CustomDescription: /*#__PURE__*/ _jsx(Floatype, {
                inputRef: elementRef,
                options: {
                    onQuery: (val)=>{
                        const filteredItems = fieldsInfo.fields.filter((field)=>{
                            return field.toLowerCase().includes(val.toLowerCase());
                        });
                        if (val === '{{ ') {
                            return fieldsInfo.fields;
                        }
                        return filteredItems;
                    },
                    onSelect: (value, query)=>{
                        if (query === '{{ ') {
                            return `${value} }}`;
                        }
                        if (fieldsInfo.fields.includes(value)) {
                            return value;
                        }
                    },
                    onUpdate: (value)=>{
                        if (value) {
                            setValue(value);
                        }
                    }
                }
            })
        })
    });
};

//# sourceMappingURL=TextareaField.js.map