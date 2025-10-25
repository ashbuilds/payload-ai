'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { SelectInput, useField } from '@payloadcms/ui';
import React, { useEffect, useState } from 'react';
// Use to filter model options in settings based on field types
export const SelectField = (props)=>{
    const { field, filterByField, options, path } = props;
    const { value: relatedField } = useField({
        path: filterByField
    });
    const [filterOptions, setFilterOptions] = useState([]);
    useEffect(()=>{
        if (!Array.isArray(options)) {
            return;
        }
        const opts = options.filter((option)=>{
            if (!relatedField || !option.fields) {
                return true;
            }
            if (Array.isArray(option.fields)) {
                return option.fields.includes(relatedField);
            }
        });
        setFilterOptions(opts);
    }, [
        relatedField,
        options
    ]);
    const { setValue, value: selectValue } = useField({
        path
    });
    return /*#__PURE__*/ _jsx(SelectInput, {
        label: field.label,
        name: path,
        onChange: (value)=>{
            console.log("value --- ", value);
            if (Array.isArray(value)) {
                setValue(value[0]?.value ?? '');
            } else if (value && typeof value === 'object' && 'value' in value) {
                setValue(value.value);
            } else {
                setValue('');
            }
        },
        options: filterOptions,
        path: path,
        value: selectValue
    });
};

//# sourceMappingURL=SelectField.js.map