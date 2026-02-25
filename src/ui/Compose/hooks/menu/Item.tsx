import { useTranslation } from '@payloadcms/ui'
import React, { memo } from 'react'

import type { PluginAITranslationKeys, PluginAITranslations } from '../../../../translations/index.js'
import type { BaseItemProps } from './types.js'

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

export const createMenuItem = (
  IconComponent: React.ComponentType<{ size?: number }>,
  initialText: string,
) =>
  memo(({ children, disabled, hideIcon, isMenu, onClick, ...rest }: BaseItemProps) => {
    const { t } = useTranslation<PluginAITranslations, PluginAITranslationKeys>()
    return (
      <Item disabled={disabled} onClick={onClick} {...rest}>
        {hideIcon || <IconComponent size={18} />}
        {children || (
          <span className={styles.text}>
            {t(`ai-plugin:actions:${initialText.toLowerCase()}` as any)}
          </span>
        )}
        {isMenu && <ArrowIcon size={18} />}
      </Item>
    )
  })
