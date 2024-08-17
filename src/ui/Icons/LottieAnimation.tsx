import React, { useEffect, useRef, useState } from 'react'

import styles from './icons.module.css'

const LottieAnimation = ({ isLoading = false }) => {
  const svgRef = useRef(null)
  const [animations, setAnimations] = useState([])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const animateTransform = (element, keyframes) => {
      const animation = element.animate(keyframes, {
        direction: 'alternate',
        duration: 1000,
        easing: 'ease-in-out',
        iterations: Infinity,
      })
      return animation
    }

    // Animate Group 2 (Rectangle)
    const rectangle = svg.querySelector('#group2')
    const rectangleAnimation = animateTransform(rectangle, [
      { transform: 'translate(0, 0) scale(1)' },
      { transform: 'translate(0, 0) scale(2.54)' },
      { transform: 'translate(0, 0) scale(1)' },
    ])

    // Animate Group 3 (Triangle)
    const triangle = svg.querySelector('#group3')
    const triangleAnimation = animateTransform(triangle, [
      { transform: 'translate(-69.5px, 77.5px) scale(1)' },
      { transform: 'translate(-70px, 73px) scale(0.36)' },
      { transform: 'translate(-69.5px, 77.5px) scale(1)' },
    ])

    setAnimations([rectangleAnimation, triangleAnimation])

    // Clean up animations on unmount
    return () => {
      rectangleAnimation.cancel()
      triangleAnimation.cancel()
    }
  }, [])

  useEffect(() => {
    if (isLoading) {
      animations.forEach((animation) => animation.play())
    } else {
      animations.forEach((animation) => animation.pause())
    }
  }, [isLoading, animations])

  return (
    <span
      style={{
        left: '3px',
        position: 'relative',
        top: '-6px',
      }}
    >
      <svg height="41" ref={svgRef} viewBox="-250 -250 500 500" width="41">
        <g id="group2">
          <rect className={styles.color_fill} height="41" width="41" x="-20.5" y="-20.5" />
        </g>
        <g id="group3">
          <path className={styles.color_fill} d="M48.5 57.5L48.5 -57.5L-49.5 -1.093L48.5 57.5Z" />
        </g>
      </svg>
    </span>
  )
}

export default LottieAnimation
