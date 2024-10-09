import React, { useEffect, useState } from 'react'

import { playPaths } from './paths.js'

const AnimatedPlay = ({ play }) => {
  const [pathIndex, setPathIndex] = useState(0)
  const paths = playPaths

  useEffect(() => {
    let currentPathIndex = play ? 0 : paths.length - 1

    const updatePathIndex = () => {
      setPathIndex(currentPathIndex)
    }

    const intervalId = setInterval(() => {
      if (play && currentPathIndex < paths.length - 1) {
        requestAnimationFrame(updatePathIndex)
        currentPathIndex++
      } else if (!play && currentPathIndex > 0) {
        requestAnimationFrame(updatePathIndex)
        currentPathIndex--
      } else {
        clearInterval(intervalId)
      }
    }, 10)

    return () => clearInterval(intervalId) // Clean up on component unmount or dependency change
  }, [play])

  return (
    <svg height="1em" viewBox="-12 -13 24 26" width="1em" xmlns="http://www.w3.org/2000/svg">
      <path d={paths[pathIndex]} fill="currentColor" strokeWidth="0.2" />
    </svg>
  )
}

export default AnimatedPlay
