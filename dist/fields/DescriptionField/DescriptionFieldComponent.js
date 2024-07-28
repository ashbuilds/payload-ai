'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useFieldProps } from '@payloadcms/ui';
import React from 'react';
import { useInstructions } from '../../providers/InstructionsProvider/hook.js';
import { Actions } from '../../ui/Actions/Actions.js';
export const DescriptionFieldComponent = (props)=>{
    const { schemaPath } = useFieldProps();
    const { id: instructionId } = useInstructions({
        path: schemaPath
    });
    return /*#__PURE__*/ _jsx(Actions, {
        descriptionProps: props,
        instructionId: instructionId
    });
};

//# sourceMappingURL=DescriptionFieldComponent.js.map