import React from 'react'

import styles from './actions.module.scss'
export const AiIcon1 = ({ color = 'white' }) => {
  return (
    <span
      style={{
        maxWidth: '20px',
      }}
    >
      <svg
        fill="none"
        height="100%"
        viewBox="0 0 98 67"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M-2.17126e-06 67L77 67L39.2319 0L-2.17126e-06 67Z" fill={color} />
        <path
          clipRule="evenodd"
          d="M59.9005 0.0592651H43.3762L49.9602 11.6239H66.4845L59.9005 0.0592651ZM68.8909 15.8507H52.3666L81.4868 67L89.7434 66.9902L98 66.9804L68.8909 15.8507Z"
          fill={color}
          fillRule="evenodd"
        />
      </svg>
    </span>
  )
}

export const AiIcon2 = ({ color = 'white' }) => {
  return (
    <span
      style={{
        maxWidth: '20px',
      }}
    >
      <svg
        fill="none"
        height="100%"
        viewBox="0 0 284 181"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M-2.89508e-06 180.49L207.429 180.49L105.686 0L-2.89508e-06 180.49Z" fill={color} />
        <path
          clipRule="evenodd"
          d="M181.365 0.159653H136.85L154.408 31H198.923L181.365 0.159653ZM212.586 55H168.072L239.515 180.49L261.758 180.463L284 180.437L212.586 55Z"
          fill={color}
          fillRule="evenodd"
        />
      </svg>
    </span>
  )
}

export const AiIcon3 = ({ color = 'white' }) => {
  return (
    <span className={styles.icon}>
      <svg
        fill="none"
        height="100%"
        style={{
          verticalAlign: 'top',
        }}
        viewBox="0 0 183 183"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g clipPath="url(#clip0_5_22)">
          <path className={styles.color_fill} d="M120 169V54L22 110.407L120 169Z" />
          <rect className={styles.color_fill} height="41" width="41" x="120" y="13" />
        </g>
        <defs>
          <clipPath id="clip0_5_22">
            <rect className={styles.color_fill} height="183" width="183" />
          </clipPath>
        </defs>
      </svg>
    </span>
  )
}
