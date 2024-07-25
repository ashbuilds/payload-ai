'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FieldDescription, Popup, useDocumentDrawer, useField, useFieldProps } from '@payloadcms/ui';
import React, { useEffect, useRef, useState } from 'react';
import { PromptContext } from '../../providers/Prompt/index.js';
import { useDotFields } from '../../utilities/useDotFields.js';
import { useGenerate } from '../../utilities/useGenerate.js';
import styles from './actions.module.scss';
import { PluginIcon } from './icons.js';
import { useMenu } from './useMenu.js';
function findParentWithClass(element, className) {
    // Base case: if the element is null or we've reached the top of the DOM
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
//TODO: Add undo/redo to the actions toolbar
export const Actions = ({ descriptionProps, instructionId })=>{
    const [DocumentDrawer, DocumentDrawerToggler, { closeDrawer, openDrawer }] = useDocumentDrawer({
        id: instructionId,
        collectionSlug: 'instructions'
    });
    const { dotFields } = useDotFields();
    const fieldProps = useFieldProps();
    const { path: pathFromContext, schemaPath, type: fieldType } = fieldProps;
    const currentField = useField({
        path: pathFromContext
    });
    const [fieldsInfo, setFieldsInfo] = useState(null);
    useEffect(()=>{
        if (!dotFields) return;
        setFieldsInfo({
            fields: Object.keys(dotFields),
            selectedField: {
                field: currentField,
                //TODO: Why props need to be passed?
                props: fieldProps
            }
        });
    }, [
        dotFields,
        currentField,
        fieldProps
    ]);
    const [input, setInput] = useState(null);
    const [lexicalEditor, setLexicalEditor] = useState();
    const actionsRef = useRef(null);
    // Used to show the actions menu on active input fields
    useEffect(()=>{
        const fieldId = `field-${pathFromContext.replace(/\./g, '__')}`;
        let inputElement = document.getElementById(fieldId);
        if (!actionsRef.current) return;
        actionsRef.current.setAttribute('for', fieldId);
        if (!inputElement) {
            if (fieldType === 'richText') {
                const editorWrapper = findParentWithClass(actionsRef.current, 'field-type');
                //TODO: Find a better way get rich-text field instance
                setTimeout(()=>{
                    inputElement = editorWrapper.querySelector('div[contenteditable="true"]');
                    // @ts-expect-error
                    setLexicalEditor(inputElement.__lexicalEditor);
                    setInput(inputElement);
                }, 0);
            }
        } else {
            setInput(inputElement);
        }
    }, [
        pathFromContext,
        schemaPath,
        actionsRef
    ]);
    useEffect(()=>{
        if (!input || !actionsRef.current) return;
        actionsRef.current.classList.add(styles.actions_hidden);
        input.addEventListener('click', (event)=>{
            document.querySelectorAll('.ai-plugin-active')?.forEach((element)=>{
                element.querySelector(`.${styles.actions}`).classList.add(styles.actions_hidden);
                element.classList.remove('ai-plugin-active');
            });
            actionsRef.current.classList.remove(styles.actions_hidden);
            const parentWithClass = findParentWithClass(event.target, 'field-type');
            parentWithClass.classList.add('ai-plugin-active');
        });
    }, [
        input,
        actionsRef
    ]);
    const [isProcessing, setIsProcessing] = useState(false);
    const generate = useGenerate({
        lexicalEditor
    });
    const { ActiveComponent, Menu } = useMenu({
        lexicalEditor
    }, {
        onCompose: async ()=>{
            console.log('Composing...');
            setIsProcessing(true);
            await generate({
                action: 'Compose'
            }).finally(()=>{
                setIsProcessing(false);
            });
        },
        onProofread: async ()=>{
            console.log('Proofreading...');
            setIsProcessing(true);
            await generate({
                action: 'Proofread'
            }).finally(()=>{
                setIsProcessing(false);
            });
        },
        onRephrase: async ()=>{
            console.log('Rephrasing...', !isProcessing);
            setIsProcessing(true);
            await generate({
                action: 'Rephrase'
            }).finally(()=>{
                setIsProcessing(false);
            });
        },
        onExpand: async ()=>{
            setIsProcessing(true);
            await generate({
                action: 'Expand'
            }).finally(()=>{
                setIsProcessing(false);
            });
        },
        onSimplify: async ()=>{
            setIsProcessing(true);
            await generate({
                action: 'Simplify'
            }).finally(()=>{
                setIsProcessing(false);
            });
        },
        onSettings: openDrawer
    });
    return /*#__PURE__*/ _jsxs(React.Fragment, {
        children: [
            /*#__PURE__*/ _jsxs("label", {
                className: `${styles.actions}`,
                ref: actionsRef,
                children: [
                    /*#__PURE__*/ _jsx(PromptContext.Provider, {
                        value: fieldsInfo,
                        children: /*#__PURE__*/ _jsx(DocumentDrawer, {
                            onSave: ()=>{
                                closeDrawer();
                            }
                        })
                    }),
                    /*#__PURE__*/ _jsx(Popup, {
                        button: /*#__PURE__*/ _jsx(PluginIcon, {
                            isLoading: isProcessing
                        }),
                        verticalAlign: 'bottom',
                        render: ({ close })=>{
                            return /*#__PURE__*/ _jsx(Menu, {
                                onClose: close
                            });
                        }
                    }),
                    /*#__PURE__*/ _jsx(ActiveComponent, {})
                ]
            }),
            /*#__PURE__*/ _jsx("div", {
                children: /*#__PURE__*/ _jsx(FieldDescription, {
                    ...descriptionProps
                })
            })
        ]
    });
};

//# sourceMappingURL=Actions.js.map