import { useFieldProps, useForm } from '@payloadcms/ui';
import dot from 'dot-object';
import { useCallback, useEffect, useState } from 'react';
import { arraysHaveSameStrings } from './arraysHaveSameStrings.js';
// TODO: Refactor this to be a generic way of getting merged data of sibling fields and its keys with dot notation
export const useDotFields = ()=>{
    const { getData, getFields, getSiblingData } = useForm();
    const { path } = useFieldProps();
    const [fieldsInfo, setFieldsInfo] = useState({
        dotFields: null,
        fields: null,
        getDotFields: ()=>({})
    });
    // TODO: I think this needs to be disabled for rich text fields, its currently throwing error in vercel
    const getDotFields = useCallback(()=>{
        if (typeof getData !== 'function') return {
            dotFields: {},
            fields: {}
        };
        const data = getData();
        if (Object.keys(data).length === 0) return {
            dotFields: {},
            fields: {}
        };
        const siblingData = getSiblingData(path);
        console.log('siblingData : ', siblingData);
        console.log('data : ', data);
        const dataDot = dot.dot(data);
        const siblingDataDot = dot.dot(siblingData);
        if (arraysHaveSameStrings(Object.keys(dataDot), Object.keys(siblingDataDot))) {
            return {
                dotFields: {
                    ...dataDot
                },
                fields: {
                    ...data
                }
            };
        } else {
            const siblingDataDot = dot.dot({
                sibling: siblingData
            });
            return {
                dotFields: {
                    ...dataDot,
                    ...siblingDataDot
                },
                fields: {
                    ...data,
                    sibling: siblingData
                }
            };
        }
    }, [
        getFields,
        getSiblingData,
        path,
        getData,
        fieldsInfo
    ]);
    useEffect(()=>{
        if (fieldsInfo.dotFields) {
            return;
        }
        const updatedFields = getDotFields();
        setFieldsInfo({
            dotFields: updatedFields.dotFields,
            fields: updatedFields.fields,
            getDotFields
        });
    }, [
        getDotFields,
        fieldsInfo
    ]);
    return {
        ...fieldsInfo,
        getDotFields
    };
};

//# sourceMappingURL=useDotFields.js.map