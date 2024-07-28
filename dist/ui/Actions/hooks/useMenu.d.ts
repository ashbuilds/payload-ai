import type { LexicalEditor } from 'lexical';
import type { UseMenuEvents } from '../../../types.js';
type UseMenuProps = {
    lexicalEditor: LexicalEditor;
};
export declare const useMenu: ({ lexicalEditor }: UseMenuProps, menuEvents: UseMenuEvents) => {
    ActiveComponent: ({ disabled }: {
        disabled?: boolean;
    }) => import("react/jsx-runtime").JSX.Element;
    Menu: ({ disabled, onClose }: {
        disabled?: boolean;
        onClose: any;
    }) => import("react/jsx-runtime").JSX.Element;
};
export {};
//# sourceMappingURL=useMenu.d.ts.map