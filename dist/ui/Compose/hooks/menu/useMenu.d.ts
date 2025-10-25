import React from 'react';
import type { UseMenuEvents, UseMenuOptions } from '../../../../types.js';
export declare const useMenu: (menuEvents: UseMenuEvents, options: UseMenuOptions) => {
    ActiveComponent: ({ isLoading, stop }: {
        isLoading: boolean;
        stop: () => void;
    }) => React.JSX.Element;
    Menu: ({ isLoading, onClose }: {
        isLoading: boolean;
        onClose: () => void;
    }) => React.JSX.Element;
};
