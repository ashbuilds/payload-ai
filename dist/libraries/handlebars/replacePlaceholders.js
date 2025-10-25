import { asyncHandlebars } from './asyncHandlebars.js';
export const replacePlaceholders = (prompt, values)=>{
    return asyncHandlebars.compile(prompt, {
        trackIds: true
    })(values);
};

//# sourceMappingURL=replacePlaceholders.js.map