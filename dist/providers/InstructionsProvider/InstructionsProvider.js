'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useEffect, useState } from 'react';
import { PLUGIN_INSTRUCTIONS_MAP_GLOBAL } from '../../defaults.js';
const initialContext = {
    instructions: undefined
};
export const InstructionsContext = /*#__PURE__*/ createContext(initialContext);
export const InstructionsProvider = ({ children })=>{
    const [instructions, setInstructionsState] = useState({});
    // This is here because each field have separate instructions and
    // their ID is needed to edit them for Drawer, so instead of fetching it
    // one by one its map is saved in globals during build
    useEffect(()=>{
        fetch(`/api/globals/${PLUGIN_INSTRUCTIONS_MAP_GLOBAL}`).then((res)=>{
            res.json().then((data)=>{
                setInstructionsState(data.map);
            });
        }).catch((err)=>{
            console.error('InstructionsProvider:', err);
        });
    }, []);
    return /*#__PURE__*/ _jsx(InstructionsContext.Provider, {
        value: {
            instructions
        },
        children: children
    });
};

//# sourceMappingURL=InstructionsProvider.js.map