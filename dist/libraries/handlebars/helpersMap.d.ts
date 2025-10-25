type SupportedHelpers = 'toHTML' | 'toText';
interface HelperFieldConfig {
    field: string;
    name: string;
}
type HandlebarsHelpers = {
    [K in SupportedHelpers]: HelperFieldConfig;
};
export declare const handlebarsHelpersMap: HandlebarsHelpers;
export declare const handlebarsHelpers: string[];
export {};
