'use client';
import { createClientFeature } from '@payloadcms/richtext-lexical/client';
import { TextNode } from 'lexical';
import { ComposeFeatureComponent } from './ComposeFeatureComponent.js';
export const LexicalEditorFeatureClient = createClientFeature((props)=>{
    return {
        nodes: [
            TextNode
        ],
        plugins: [
            {
                Component: ComposeFeatureComponent,
                position: 'belowContainer'
            }
        ],
        sanitizedClientFeatureProps: {
            field: props.field,
            path: props.field?.name,
            schemaPath: props.schemaPath,
            ...props?.props
        }
    };
});

//# sourceMappingURL=feature.client.js.map