import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useCallback, useEffect, useState } from 'react';
import { useHistory } from './hooks/useHistory.js';
export const UndoRedoActions = ({ onChange })=>{
    const { canRedo, canUndo, redo, undo } = useHistory();
    const redoHistoryValue = useCallback((event)=>{
        event.stopPropagation();
        const value = redo();
        if (value) {
            onChange(value);
        }
    }, [
        redo
    ]);
    const undoHistoryValue = useCallback((event)=>{
        event.stopPropagation();
        const value = undo();
        if (value) {
            onChange(value);
        }
    }, [
        undo
    ]);
    // Delay rendering until the client-side hydration is complete
    const [isMounted, setIsMounted] = useState(false);
    useEffect(()=>{
        setIsMounted(true);
    }, []);
    if (!isMounted || !canUndo && !canRedo) return null;
    return /*#__PURE__*/ _jsxs(React.Fragment, {
        children: [
            /*#__PURE__*/ _jsx("button", {
                className: `btn btn--size-small btn--style-secondary ${!canUndo && 'btn--disabled'}`,
                disabled: !canUndo,
                onClick: undoHistoryValue,
                style: {
                    marginBlock: 0
                },
                type: "button",
                children: "Undo"
            }),
            /*#__PURE__*/ _jsx("button", {
                className: `btn btn--size-small btn--style-secondary ${!canRedo && 'btn--disabled'}`,
                disabled: !canRedo,
                onClick: redoHistoryValue,
                style: {
                    marginBlock: 0
                },
                type: "button",
                children: "Redo"
            })
        ]
    });
};

//# sourceMappingURL=UndoRedoActions.js.map