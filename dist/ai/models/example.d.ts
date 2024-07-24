export declare const exampleOutput: {
    root: {
        type: string;
        children: ({
            type: string;
            children: {
                type: string;
                format: number;
                text: string;
            }[];
            listType?: undefined;
            start?: undefined;
            tag?: undefined;
        } | {
            type: string;
            children: ({
                type: string;
                children: {
                    type: string;
                    text: string;
                }[];
                value: number;
                checked?: undefined;
            } | {
                type: string;
                checked: boolean;
                children: {
                    type: string;
                    text: string;
                }[];
                value: number;
            })[];
            listType: string;
            start: number;
            tag: string;
        } | {
            type: string;
            children: {
                type: string;
                text: string;
            }[];
            tag: string;
            listType?: undefined;
            start?: undefined;
        } | {
            type: string;
            children: ({
                type: string;
                text: string;
                id?: undefined;
                children?: undefined;
                fields?: undefined;
            } | {
                id: string;
                type: string;
                children: {
                    type: string;
                    text: string;
                }[];
                fields: {
                    linkType: string;
                    newTab: boolean;
                    url: string;
                };
                text?: undefined;
            })[];
            listType?: undefined;
            start?: undefined;
            tag?: undefined;
        })[];
    };
};
//# sourceMappingURL=example.d.ts.map