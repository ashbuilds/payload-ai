import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useEffect } from 'react';
const initialContext = {
    type: undefined,
    path: '',
    schemaPath: ''
};
export const FieldContext = /*#__PURE__*/ createContext(initialContext);
export const FieldProvider = ({ children, context })=>{
    const [type, setType] = React.useState();
    const [path, setPath] = React.useState();
    const [schemaPath, setSchemaPath] = React.useState();
    useEffect(()=>{
        if (schemaPath !== context.schemaPath) {
            setType(context.type);
            setPath(context.path);
            setSchemaPath(context.schemaPath);
        }
    }, [
        schemaPath,
        context
    ]);
    return /*#__PURE__*/ _jsx(FieldContext.Provider, {
        value: {
            type,
            path,
            schemaPath
        },
        children: children
    });
};

//# sourceMappingURL=FieldProvider.js.map