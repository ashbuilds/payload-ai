'use client'

import type { FC } from 'react'

import {
  Button,
  useConfig,
  useForm,
  useFormModified,
  useOperation,
} from '@payloadcms/ui'
import React, { useCallback, useRef, useState } from 'react'

import AnimatedPlay from './AnimatedPlay.js'
import styles from './icon.module.scss'

export const RunButton: FC<any> = (props) => {
  const { config } = useConfig()
  const [loading, setLoading] = useState(false)
  const { submit } = useForm()
  const modified = useFormModified()
  const operation = useOperation()
  const {
    localization,
    routes: { api },
    serverURL,
  } = config

  const controller = useRef(new AbortController())

  const handleSubmit = useCallback(async () => {
    const shouldUpdate = operation === 'update' && !modified
    console.log('submitting...', shouldUpdate)
    if (shouldUpdate) {
      return submit()
    }
  }, [operation, modified, submit])

  const handleClick = useCallback(async () => {
    if (loading) {
      controller.current.abort('Cancelled by user!')
      setLoading(false)
      return
    }

    setLoading(true)
    await handleSubmit()

    await fetch(`${serverURL}${api}/trigger`, {
      credentials: 'include',
      signal: controller.current.signal,
    })

    setLoading(false)
  }, [loading, controller, handleSubmit])

  return (
    <Button
      buttonStyle="secondary"
      className={styles.icon}
      icon={<AnimatedPlay play={loading} />}
      iconPosition="left"
      onClick={handleClick}
    >
      Run
    </Button>
  )
}
