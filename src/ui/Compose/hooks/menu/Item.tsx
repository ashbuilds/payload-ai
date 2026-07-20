import React, { memo } from 'react'

import type { BaseItemProps } from '../../../../types.js'

import { ArrowIcon } from '../../../Icons/Icons.js'
import styles from './menu.module.scss'

export const Item: React.FC<BaseItemProps> = memo(
  ({ children, disabled, isActive, onClick, ...rest }) => (
    <span
      className={styles.generate_button + ' ' + (isActive ? styles.active : '')}
      data-disabled={disabled}
      onClick={
        !disabled && typeof onClick === 'function'
          ? (onClick as React.MouseEventHandler<HTMLSpanElement>)
          : undefined
      }
      onKeyDown={
        !disabled && typeof onClick === 'function'
          ? (onClick as React.KeyboardEventHandler<HTMLSpanElement>)
          : undefined
      }
      role="presentation"
      {...rest}
    >
      {children}
    </span>
  ),
)

export const createMenuItem = (IconComponent: React.ComponentType<{ size?: number }>) =>
  memo(({ children, disabled, hideIcon, isMenu, onClick, ...rest }: BaseItemProps) => (
    <Item disabled={disabled} onClick={onClick} {...rest}>
      {hideIcon || <IconComponent size={18} />}
      {children}
      {isMenu && <ArrowIcon size={18} />}
    </Item>
  ))
