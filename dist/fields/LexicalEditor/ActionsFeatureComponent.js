import { jsx as _jsx } from "react/jsx-runtime";
import { useFieldProps } from '@payloadcms/ui';
import { useInstructions } from '../../providers/InstructionsProvider/hook.js';
import { Actions } from '../../ui/Actions/Actions.js';
export const ActionsFeatureComponent = ()=>{
    const { schemaPath } = useFieldProps();
    const { id: instructionId } = useInstructions({
        path: schemaPath
    });
    return /*#__PURE__*/ _jsx(Actions, {
        instructionId: instructionId
    });
};

//# sourceMappingURL=ActionsFeatureComponent.js.map