import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import styles from './icons.module.css';
import LottieAnimation from './LottieAnimation.js';
export const PluginIcon = ({ color = 'white', isLoading })=>{
    return /*#__PURE__*/ _jsx("span", {
        className: styles.actions_icon,
        children: /*#__PURE__*/ _jsx(LottieAnimation, {
            isLoading: isLoading
        })
    });
};
export const TuneIcon = ({ color = 'white', size = 24 })=>{
    return /*#__PURE__*/ _jsx("span", {
        className: styles.icon,
        children: /*#__PURE__*/ _jsx("svg", {
            height: size,
            viewBox: "0 -960 960 960",
            width: size,
            xmlns: "http://www.w3.org/2000/svg",
            children: /*#__PURE__*/ _jsx("path", {
                d: "M450-130v-220h60v80h320v60H510v80h-60Zm-320-80v-60h220v60H130Zm160-160v-80H130v-60h160v-80h60v220h-60Zm160-80v-60h380v60H450Zm160-160v-220h60v80h160v60H670v80h-60Zm-480-80v-60h380v60H130Z"
            })
        })
    });
};
export const LocalLibraryIcon = ({ color = 'white', size = 24 })=>{
    return /*#__PURE__*/ _jsx("span", {
        className: styles.icon,
        children: /*#__PURE__*/ _jsx("svg", {
            height: size,
            viewBox: "0 -960 960 960",
            width: size,
            xmlns: "http://www.w3.org/2000/svg",
            children: /*#__PURE__*/ _jsx("path", {
                d: "M480-115.38q-67.38-54.93-148.85-86.7Q249.69-233.85 160-240v-373.85q91.77 5.39 174.38 43.81Q417-531.62 480-474.92q63-56.7 145.62-95.12 82.61-38.42 174.38-43.81V-240q-89.92 6.15-171.27 37.92-81.35 31.77-148.73 86.7Zm0-50.16q63-46.23 134-74.56 71-28.33 146-37.44v-291.38q-78.38 13-149.65 50.57-71.27 37.58-130.35 96.66-59.08-59.08-130.35-96.66-71.27-37.57-149.65-50.57v291.38q75 9.11 146 37.44t134 74.56Zm0-451.38q-53.31 0-91.27-37.96-37.96-37.97-37.96-91.27 0-53.31 37.96-91.27 37.96-37.96 91.27-37.96 53.31 0 91.27 37.96 37.96 37.96 37.96 91.27 0 53.3-37.96 91.27-37.96 37.96-91.27 37.96Zm.03-40q36.82 0 63.01-26.22 26.19-26.22 26.19-63.04t-26.22-63.01q-26.22-26.19-63.04-26.19t-63.01 26.21q-26.19 26.22-26.19 63.04t26.22 63.01q26.22 26.2 63.04 26.2Zm-.03-89.23Zm0 324.46Z"
            })
        })
    });
};
export const SpellCheckIcon = ({ color = 'white', size = 24 })=>{
    return /*#__PURE__*/ _jsx("span", {
        className: styles.icon,
        children: /*#__PURE__*/ _jsx("svg", {
            height: size,
            viewBox: "0 -960 960 960",
            width: size,
            xmlns: "http://www.w3.org/2000/svg",
            children: /*#__PURE__*/ _jsx("path", {
                d: "M564-93.85 407.85-250 450-292.15l114 114 226.77-226.77 42.15 42.15L564-93.85ZM135.39-320l191.69-520h69.38l190.92 520h-68.92l-49.07-142H250.92l-49.84 142h-65.69ZM272-518h178.31L362-765.54h-3.23L272-518Z"
            })
        })
    });
};
export const TranslateIcon = ({ color = 'white', size = 24 })=>{
    return /*#__PURE__*/ _jsx("span", {
        className: styles.icon,
        children: /*#__PURE__*/ _jsx("svg", {
            height: size,
            viewBox: "0 -960 960 960",
            width: size,
            xmlns: "http://www.w3.org/2000/svg",
            children: /*#__PURE__*/ _jsx("path", {
                d: "m476-100 178.15-460h62.46l178.16 460h-63.62l-45.3-122H584.92l-45.31 122H476ZM160.38-217.69l-42.15-42.16 198.92-199.3q-34.61-35-65.8-83.08Q220.15-590.31 200-640h63.61q17.31 36.31 42.12 72.62 24.81 36.3 53.58 66.07 42.61-43 80.61-104.42T493.62-720H67.69v-60H330v-64.61h60V-780h262.31v60h-97.93q-19.46 67.38-62.03 140.88-42.58 73.5-90.89 121.2l98.69 101.07-22.69 61.62-118.15-121.16-198.93 198.7Zm443.77-57.39h162.46l-81.23-218.23-81.23 218.23Z"
            })
        })
    });
};
export const DocsAddOnIcon = ({ color = 'white', size = 24 })=>{
    return /*#__PURE__*/ _jsx("span", {
        className: styles.icon,
        children: /*#__PURE__*/ _jsx("svg", {
            height: size,
            viewBox: "0 -960 960 960",
            width: size,
            xmlns: "http://www.w3.org/2000/svg",
            children: /*#__PURE__*/ _jsx("path", {
                d: "M650-131v-120H530v-60h120v-120h60v120h120v60H710v120h-60ZM170-250v-60h281.85q-1.85 15.8-1.35 30.09t2.35 29.91H170Zm0-160v-60h379.08q-17.23 12.15-31.5 27.15-14.27 15-25.96 32.85H170Zm0-160v-60h580v60H170Zm0-160v-60h580v60H170Z"
            })
        })
    });
};
export const SummarizeIcon = ({ color = 'white', size = 24 })=>{
    return /*#__PURE__*/ _jsx("span", {
        className: styles.icon,
        children: /*#__PURE__*/ _jsx("svg", {
            height: size,
            viewBox: "0 -960 960 960",
            width: size,
            xmlns: "http://www.w3.org/2000/svg",
            children: /*#__PURE__*/ _jsx("path", {
                d: "M320-603.85q15.08 0 25.62-10.53 10.53-10.54 10.53-25.62 0-15.08-10.53-25.62-10.54-10.53-25.62-10.53-15.08 0-25.62 10.53-10.53 10.54-10.53 25.62 0 15.08 10.53 25.62 10.54 10.53 25.62 10.53Zm0 160q15.08 0 25.62-10.53 10.53-10.54 10.53-25.62 0-15.08-10.53-25.62-10.54-10.53-25.62-10.53-15.08 0-25.62 10.53-10.53 10.54-10.53 25.62 0 15.08 10.53 25.62 10.54 10.53 25.62 10.53Zm0 160q15.08 0 25.62-10.53 10.53-10.54 10.53-25.62 0-15.08-10.53-25.62-10.54-10.53-25.62-10.53-15.08 0-25.62 10.53-10.53 10.54-10.53 25.62 0 15.08 10.53 25.62 10.54 10.53 25.62 10.53ZM212.31-140Q182-140 161-161q-21-21-21-51.31v-535.38Q140-778 161-799q21-21 51.31-21h419.23L820-631.54v419.23Q820-182 799-161q-21 21-51.31 21H212.31Zm0-60h535.38q5.39 0 8.85-3.46t3.46-8.85V-600H600v-160H212.31q-5.39 0-8.85 3.46t-3.46 8.85v535.38q0 5.39 3.46 8.85t8.85 3.46ZM200-760v160-160V-200v-560Z"
            })
        })
    });
};
export const SegmentIcon = ({ color = 'white', size = 24 })=>{
    return /*#__PURE__*/ _jsx("span", {
        className: styles.icon,
        children: /*#__PURE__*/ _jsx("svg", {
            height: size,
            viewBox: "0 -960 960 960",
            width: size,
            xmlns: "http://www.w3.org/2000/svg",
            children: /*#__PURE__*/ _jsx("path", {
                d: "M380-254.62v-59.99h440v59.99H380ZM380-450v-60h440v60H380ZM140-645.39v-59.99h680v59.99H140Z"
            })
        })
    });
};
export const StylusNoteIcon = ({ color = 'white', size = 24 })=>{
    return /*#__PURE__*/ _jsx("span", {
        className: styles.icon,
        children: /*#__PURE__*/ _jsx("svg", {
            height: size,
            viewBox: "0 -960 960 960",
            width: size,
            xmlns: "http://www.w3.org/2000/svg",
            children: /*#__PURE__*/ _jsx("path", {
                d: "m487.46-283.15 332.31-332.31q2.69-2.69 2.69-6.54t-2.69-6.54l-38.92-38.92q-2.7-2.69-6.54-2.69-3.85 0-6.54 2.69L435.46-335.15l52 52Zm-251 72.38q-89.23-5-134-39.69-44.77-34.69-44.77-98.16 0-60.76 51-98.57 51-37.81 141.77-45.81 43.62-3.77 65.43-15.77 21.8-12 21.8-33.23 0-29.46-29.5-44.96t-96.73-22.27l5.46-59.62q92.23 8.77 136.5 39.77 44.27 31 44.27 87.08 0 47.61-36.57 75.5-36.58 27.88-106.2 33.5-68.61 5.77-102.92 26.77t-34.31 57.61q0 37.31 28.58 55.51 28.58 18.19 92.65 22.34l-2.46 60Zm260.38 3.15L359.92-344.54l373.54-373.15q17.69-17.69 41.35-17.5 23.65.19 41.34 17.5L870-663.85q17.69 17.7 17.69 41.54 0 23.85-17.69 41.54L496.84-207.62ZM363.23-180q-13.54 3.23-23.84-7.08-10.31-10.31-7.08-23.84l27.61-133.62 136.92 136.92L363.23-180Z"
            })
        })
    });
};
export const EditNoteIcon = ({ color = 'white', size = 24 })=>{
    return /*#__PURE__*/ _jsx("span", {
        className: styles.icon,
        children: /*#__PURE__*/ _jsx("svg", {
            height: size,
            viewBox: "0 -960 960 960",
            width: size,
            xmlns: "http://www.w3.org/2000/svg",
            children: /*#__PURE__*/ _jsx("path", {
                d: "M180-400v-60h280v60H180Zm0-160v-60h440v60H180Zm0-160v-60h440v60H180Zm344.62 540v-105.69l217.15-216.16q7.46-7.46 16.11-10.5 8.65-3.03 17.3-3.03 9.43 0 18.25 3.53 8.82 3.54 16.03 10.62l37 37.38q6.46 7.47 10 16.16Q860-439 860-430.31t-3.23 17.69q-3.23 9-10.31 16.46L630.31-180H524.62Zm287.69-250.31-37-37.38 37 37.38Zm-240 202.62h38l129.84-130.47-18.38-19-18.62-18.76-130.84 130.23v38Zm149.46-149.47-18.62-18.76 37 37.76-18.38-19Z"
            })
        })
    });
};
export const ArrowIcon = ({ color = 'white', size = 24 })=>{
    return /*#__PURE__*/ _jsx("span", {
        className: styles.icon,
        children: /*#__PURE__*/ _jsx("svg", {
            height: size,
            viewBox: "0 -960 960 960",
            width: size,
            xmlns: "http://www.w3.org/2000/svg",
            children: /*#__PURE__*/ _jsx("path", {
                d: "m531.69-480-184-184L376-692.31 588.31-480 376-267.69 347.69-296l184-184Z"
            })
        })
    });
};

//# sourceMappingURL=Icons.js.map