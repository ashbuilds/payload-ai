import React, { memo } from 'react'

import type { BaseItemProps } from '../../../../types.js'

import { ArrowIcon } from '../../../Icons/Icons.js'
import styles from './menu.module.scss'

export const Item: React.FC<BaseItemProps> = memo(
  ({ children, disabled, isActive, onClick, ...rest }) => (
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
  ),
)

export const createMenuItem = (IconComponent, initialText) =>
  memo(({ children, disabled, hideIcon, isMenu, onClick, ...rest }: BaseItemProps) => (
    <Item disabled={disabled} onClick={onClick} {...rest}>
      {hideIcon || <IconComponent size={18} />}
      {children || <span className={styles.text}>{initialText}</span>}
      {isMenu && <ArrowIcon size={18} />}
    </Item>
  ))
