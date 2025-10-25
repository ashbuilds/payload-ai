'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FieldDescription, useDocumentInfo } from '@payloadcms/ui';
import React from 'react';
import { FieldProvider } from '../../providers/FieldProvider/FieldProvider.js';
import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js';
import { Compose } from '../../ui/Compose/Compose.js';
export const ComposeField = (props)=>{
    const { collectionSlug } = useDocumentInfo();
    const finalSchemaPath = props?.schemaPath ?? (collectionSlug ? `${collectionSlug}.${props?.path ?? ''}` : props?.path ?? '');
    const { id: instructionId, disabled, hasInstructions, isConfigAllowed } = useInstructions({
        schemaPath: finalSchemaPath
    });
    return /*#__PURE__*/ _jsxs(FieldProvider, {
        context: {
            type: props?.field.type,
            path: props?.path ?? '',
            schemaPath: finalSchemaPath
        },
        children: [
            hasInstructions && instructionId && !disabled ? /*#__PURE__*/ _jsx(Compose, {
                descriptionProps: {
                    ...props,
                    field: props?.field,
                    path: props?.path ?? '',
                    schemaPath: finalSchemaPath
                },
                instructionId: instructionId,
                isConfigAllowed: isConfigAllowed
            }) : null,
            /*#__PURE__*/ _jsx("div", {
                children: /*#__PURE__*/ _jsx(FieldDescription, {
                    path: props?.path ?? '',
                    ...props
                })
            })
        ]
    });
};

//# sourceMappingURL=ComposeField.js.map