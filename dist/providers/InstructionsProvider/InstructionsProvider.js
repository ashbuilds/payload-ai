'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useAuth, useConfig } from '@payloadcms/ui';
import React, { useEffect, useState } from 'react';
import { PLUGIN_FETCH_FIELDS_ENDPOINT } from '../../defaults.js';
import { InstructionsContext } from './context.js';
export const InstructionsProvider = ({ children })=>{
    const [instructions, setInstructionsState] = useState({});
    const [promptFields, setPromptFields] = useState([]);
    const [activeCollection, setActiveCollection] = useState('');
    const [isConfigAllowed, setIsConfigAllowed] = useState(false);
    const [enabledLanguages, setEnabledLanguages] = useState();
    const [debugging, setDebugging] = useState(false);
    const { user } = useAuth();
    const { config } = useConfig();
    const { routes: { api }, serverURL } = config;
    // This is here because each field have separate instructions and
    // their ID is needed to edit them for Drawer
    useEffect(()=>{
        fetch(`${serverURL}${api}${PLUGIN_FETCH_FIELDS_ENDPOINT}`).then(async (res)=>{
            await res.json().then((data)=>{
                setIsConfigAllowed(data?.isConfigAllowed || false);
                setEnabledLanguages(data?.enabledLanguages || []);
                setInstructionsState(data?.fields || {});
                setPromptFields(data?.promptFields || []);
                setDebugging(data?.debugging || false);
            });
        }).catch((err)=>{
            console.error('InstructionsProvider:', err);
        });
    }, [
        api,
        serverURL,
        user
    ]);
    return /*#__PURE__*/ _jsx(InstructionsContext.Provider, {
        value: {
            activeCollection,
            debugging,
            enabledLanguages,
            hasInstructions: instructions && Object.keys(instructions).length > 0,
            instructions,
            isConfigAllowed,
            promptFields,
            setActiveCollection
        },
        children: children
    });
};

//# sourceMappingURL=InstructionsProvider.js.map