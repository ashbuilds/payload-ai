import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useRef, useEffect, useState } from 'react';
import styles from './actions.module.scss';
const LottieAnimation = ({ isLoading = false })=>{
    const svgRef = useRef(null);
    const [animations, setAnimations] = useState([]);
    useEffect(()=>{
        const svg = svgRef.current;
        if (!svg) return;
        const animateTransform = (element, keyframes)=>{
            const animation = element.animate(keyframes, {
                duration: 1000,
                iterations: Infinity,
                direction: 'alternate',
                easing: 'ease-in-out'
            });
            return animation;
        };
        // Animate Group 2 (Rectangle)
        const rectangle = svg.querySelector('#group2');
        const rectangleAnimation = animateTransform(rectangle, [
            {
                transform: 'translate(0, 0) scale(1)'
            },
            {
                transform: 'translate(0, 0) scale(2.54)'
            },
            {
                transform: 'translate(0, 0) scale(1)'
            }
        ]);
        // Animate Group 3 (Triangle)
        const triangle = svg.querySelector('#group3');
        const triangleAnimation = animateTransform(triangle, [
            {
                transform: 'translate(-69.5px, 77.5px) scale(1)'
            },
            {
                transform: 'translate(-70px, 73px) scale(0.36)'
            },
            {
                transform: 'translate(-69.5px, 77.5px) scale(1)'
            }
        ]);
        setAnimations([
            rectangleAnimation,
            triangleAnimation
        ]);
        // Clean up animations on unmount
        return ()=>{
            rectangleAnimation.cancel();
            triangleAnimation.cancel();
        };
    }, []);
    useEffect(()=>{
        if (isLoading) {
            animations.forEach((animation)=>animation.play());
        } else {
            animations.forEach((animation)=>animation.pause());
        }
    }, [
        isLoading,
        animations
    ]);
    return /*#__PURE__*/ _jsx("span", {
        style: {
            position: 'relative',
            top: '-6px',
            left: '3px'
        },
        children: /*#__PURE__*/ _jsxs("svg", {
            ref: svgRef,
            width: "41",
            height: "41",
            viewBox: "-250 -250 500 500",
            children: [
                /*#__PURE__*/ _jsx("g", {
                    id: "group2",
                    children: /*#__PURE__*/ _jsx("rect", {
                        x: "-20.5",
                        y: "-20.5",
                        width: "41",
                        height: "41",
                        className: styles.color_fill
                    })
                }),
                /*#__PURE__*/ _jsx("g", {
                    id: "group3",
                    children: /*#__PURE__*/ _jsx("path", {
                        d: "M48.5 57.5L48.5 -57.5L-49.5 -1.093L48.5 57.5Z",
                        className: styles.color_fill
                    })
                })
            ]
        })
    });
};
export default LottieAnimation;

//# sourceMappingURL=LottieAnimation.js.map