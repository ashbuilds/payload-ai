import React, { memo } from 'react'

import styles from './menu.module.scss'

export const Item: React.FC<any> = memo(({ children, disabled, isActive, onClick, ...rest }) => (
  <span
    className={styles.generate_button + ' ' + (isActive ? styles.active : '')}
    data-disabled={disabled}
    onClick={!disabled ? onClick : null}
    onKeyDown={!disabled ? onClick : null}
    role="presentation"
    {...rest}
  >
    {children}
  </span>
))
