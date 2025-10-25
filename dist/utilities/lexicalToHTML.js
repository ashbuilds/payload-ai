import { consolidateHTMLConverters, convertLexicalToHTML } from '@payloadcms/richtext-lexical';
export async function lexicalToHTML(editorData, editorConfig) {
    return await convertLexicalToHTML({
        converters: consolidateHTMLConverters({
            editorConfig
        }),
        data: editorData
    });
}

//# sourceMappingURL=lexicalToHTML.js.map