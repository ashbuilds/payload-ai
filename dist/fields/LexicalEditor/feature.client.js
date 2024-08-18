'use client';
import { createClientFeature } from '@payloadcms/richtext-lexical/client';
import { ActionsFeatureComponent } from './ActionsFeatureComponent.js';
export const LexicalEditorFeatureClient = createClientFeature({
    plugins: [
        {
            Component: ActionsFeatureComponent,
            position: 'belowContainer'
        }
    ]
});

//# sourceMappingURL=feature.client.js.map