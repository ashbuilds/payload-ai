'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client';
import { Popup, useDocumentDrawer, useField } from '@payloadcms/ui';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PLUGIN_INSTRUCTIONS_TABLE } from '../../defaults.js';
import { setSafeLexicalState } from '../../utilities/setSafeLexicalState.js';
import { PluginIcon } from '../Icons/Icons.js';
import styles from './compose.module.css';
import { useMenu } from './hooks/menu/useMenu.js';
import { useGenerate } from './hooks/useGenerate.js';
import { UndoRedoActions } from './UndoRedoActions.js';
function findParentWithClass(element, className) {
    // Base case: if the element is null, or we've reached the top of the DOM
    if (!element || element === document.body) {
        return null;
    }
    // Check if the current element has the class we're looking for
    if (element.classList.contains(className)) {
        return element;
    }
    // Recursively call the function on the parent element
    return findParentWithClass(element.parentElement, className);
}
export const Compose = ({ descriptionProps, instructionId, isConfigAllowed })=>{
    const [DocumentDrawer, _, { closeDrawer, openDrawer }] = useDocumentDrawer({
        id: instructionId,
        collectionSlug: PLUGIN_INSTRUCTIONS_TABLE
    });
    const fieldType = descriptionProps?.field?.type;
    const pathFromContext = descriptionProps?.path;
    const schemaPath = descriptionProps?.schemaPath;
    const { editor: lexicalEditor, editorContainerRef } = useEditorConfigContext();
    // The below snippet is used to show/hide the action menu on AI-enabled fields
    const [input, setInput] = useState(null);
    const actionsRef = useRef(null);
    // Set input element for current field
    useEffect(()=>{
        if (!actionsRef.current) {
            return;
        }
        if (!pathFromContext) {
            return;
        }
        const fieldId = `field-${pathFromContext.replace(/\./g, '__')}`;
        const inputElement = document.getElementById(fieldId);
        if (!inputElement && fieldType === 'richText') {
            setInput(editorContainerRef.current);
        } else {
            actionsRef.current?.setAttribute('for', fieldId);
            setInput(inputElement);
        }
    }, [
        pathFromContext,
        schemaPath,
        actionsRef,
        editorContainerRef,
        fieldType
    ]);
    // Show or hide actions menu on field
    useEffect(()=>{
        if (!input || !actionsRef.current) {
            return;
        }
        actionsRef.current?.classList.add(styles.actions_hidden);
        // Create the handler function
        const clickHandler = (event)=>{
            document.querySelectorAll('.ai-plugin-active')?.forEach((element)=>{
                const actionElement = element.querySelector(`.${styles.actions}`);
                if (actionElement) {
                    actionElement.classList.add(styles.actions_hidden);
                    element.classList.remove('ai-plugin-active');
                }
            });
            actionsRef.current?.classList.remove(styles.actions_hidden);
            const parentWithClass = findParentWithClass(event.target, 'field-type');
            if (parentWithClass) {
                parentWithClass.classList.add('ai-plugin-active');
            }
        };
        // Add the event listener
        input?.addEventListener('click', clickHandler);
        // Clean up the event listener when the component unmounts or input changes
        return ()=>{
            input?.removeEventListener('click', clickHandler);
        };
    }, [
        input,
        actionsRef
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const { generate, isLoading, stop } = useGenerate({
        instructionId
    });
    const { ActiveComponent, Menu } = useMenu({
        onCompose: ()=>{
            console.log('Composing...');
            setIsProcessing(true);
            generate({
                action: 'Compose'
            }).catch((reason)=>{
                console.error("Compose : ", reason);
            }).finally(()=>{
                setIsProcessing(false);
            });
        },
        onExpand: ()=>{
            console.log('Expanding...');
            generate({
                action: 'Expand'
            }).catch((reason)=>{
                console.error("Compose : ", reason);
            }).finally(()=>{
                setIsProcessing(false);
            });
        },
        onProofread: ()=>{
            console.log('Proofreading...');
            generate({
                action: 'Proofread'
            }).catch((reason)=>{
                console.error("Compose : ", reason);
            }).finally(()=>{
                setIsProcessing(false);
            });
        },
        onRephrase: ()=>{
            console.log('Rephrasing...');
            generate({
                action: 'Rephrase'
            }).catch((reason)=>{
                console.error("Compose : ", reason);
            }).finally(()=>{
                setIsProcessing(false);
            });
        },
        onSettings: isConfigAllowed ? openDrawer : undefined,
        onSimplify: ()=>{
            console.log('Simplifying...');
            generate({
                action: 'Simplify'
            }).catch((reason)=>{
                console.error("Compose : ", reason);
            }).finally(()=>{
                setIsProcessing(false);
            });
        },
        onSummarize: ()=>{
            console.log('Summarizing...');
            generate({
                action: 'Summarize'
            }).catch((reason)=>{
                console.error("Compose : ", reason);
            }).finally(()=>{
                setIsProcessing(false);
            });
        },
        onTranslate: (data)=>{
            console.log('Translating...');
            generate({
                action: 'Translate',
                params: data
            }).catch((reason)=>{
                console.error("Compose : ", reason);
            }).finally(()=>{
                setIsProcessing(false);
            });
        }
    }, {
        isConfigAllowed
    });
    const { setValue } = useField({
        path: pathFromContext
    });
    const setIfValueIsLexicalState = useCallback((val)=>{
        if (val && typeof val === 'object' && 'root' in val && lexicalEditor) {
            setSafeLexicalState(JSON.stringify(val), lexicalEditor);
        }
    // DO NOT PROVIDE lexicalEditor as a dependency, it freaks out and does not update the editor after first undo/redo
    }, []);
    const popupRender = useCallback(({ close })=>{
        return /*#__PURE__*/ _jsx(Menu, {
            isLoading: isProcessing || isLoading,
            onClose: close
        });
    }, [
        isProcessing,
        isLoading,
        Menu
    ]);
    const memoizedPopup = useMemo(()=>{
        return /*#__PURE__*/ _jsx(Popup, {
            button: /*#__PURE__*/ _jsx(PluginIcon, {
                isLoading: isProcessing || isLoading
            }),
            render: popupRender,
            verticalAlign: "bottom"
        });
    }, [
        popupRender,
        isProcessing,
        isLoading
    ]);
    return /*#__PURE__*/ _jsxs("label", {
        className: `payloadai-compose__actions ${styles.actions}`,
        onClick: (e)=>e.preventDefault(),
        ref: actionsRef,
        role: "presentation",
        children: [
            /*#__PURE__*/ _jsx(DocumentDrawer, {
                onSave: ()=>{
                    closeDrawer();
                }
            }),
            memoizedPopup,
            /*#__PURE__*/ _jsx(ActiveComponent, {
                isLoading: isProcessing || isLoading,
                stop: stop
            }),
            /*#__PURE__*/ _jsx(UndoRedoActions, {
                onChange: (val)=>{
                    setValue(val);
                    setIfValueIsLexicalState(val);
                }
            })
        ]
    });
};

//# sourceMappingURL=Compose.js.map