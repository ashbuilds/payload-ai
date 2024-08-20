import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useHistory } from './hooks/useHistory.js';
import React, { useCallback } from 'react';
export const UndoRedoActions = ({ onChange })=>{
    const { canRedo, canUndo, redo, undo } = useHistory();
    const redoHistoryValue = useCallback(()=>{
        const val = redo();
        if (val) {
            onChange(val);
        }
    }, [
        redo
    ]);
    const undoHistoryValue = useCallback(()=>{
        const val = undo();
        if (val) {
            onChange(val);
        }
    }, [
        undo
    ]);
    if (!canUndo && !canRedo) return null;
    return /*#__PURE__*/ _jsxs(_Fragment, {
        children: [
            /*#__PURE__*/ _jsx("button", {
                onClick: undoHistoryValue,
                type: "button",
                disabled: !canUndo,
                children: "Undo"
            }),
            /*#__PURE__*/ _jsx("button", {
                onClick: redoHistoryValue,
                type: "button",
                disabled: !canRedo,
                children: "Redo"
            })
        ]
    });
};

//# sourceMappingURL=UndoRedoActions.js.map