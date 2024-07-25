'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useEffect, useState } from 'react';
const initialContext = {
    instructions: undefined
};
const InstructionsContext = /*#__PURE__*/ createContext(initialContext);
export const InstructionsProvider = ({ children })=>{
    const [instructions, setInstructionsState] = useState({});
    useEffect(()=>{
        fetch('/api/globals/ai-plugin__instructions_map').then((res)=>{
            res.json().then((data)=>{
                setInstructionsState(data.map);
            });
        }).catch((err)=>{
            console.error('err:', err);
        });
    }, []);
    return /*#__PURE__*/ _jsx(InstructionsContext.Provider, {
        value: {
            instructions
        },
        children: children
    });
};
export const useInstructions = ({ path })=>{
    const context = useContext(InstructionsContext);
    return {
        id: context.instructions[path],
        map: context.instructions
    };
};

//# sourceMappingURL=index.js.map