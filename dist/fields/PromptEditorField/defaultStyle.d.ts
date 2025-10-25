export declare const defaultStyle: {
    control: {
        fontSize: number;
        fontWeight: string;
    };
    '&multiLine': {
        control: {
            fontFamily: string;
            minHeight: number;
        };
        highlighter: {
            border: string;
            padding: number;
        };
        input: {
            padding: number;
        };
    };
    '&singleLine': {
        display: string;
        width: number;
        highlighter: {
            border: string;
            padding: number;
        };
        input: {
            border: string;
            padding: number;
        };
    };
    suggestions: {
        item: {
            '&focused': {
                backgroundColor: string;
            };
            borderBottom: string;
            padding: string;
        };
        list: {
            backgroundColor: string;
            borderRadius: string;
            bottom: number;
            fontSize: number;
            maxHeight: number;
            overflow: string;
            position: string;
        };
    };
};
