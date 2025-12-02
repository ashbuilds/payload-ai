'use client'

import type { ArrayFieldLabelClientComponent } from 'payload'

import { useRowLabel } from '@payloadcms/ui'
import React from 'react'

type ModelRow = {
  id?: string
  name?: string
}

export const GoogleModelRowLabel: ArrayFieldLabelClientComponent = () => {
  const { data, rowNumber } = useRowLabel<ModelRow>()

  const label =
    data?.name?.trim() || data?.id?.trim() || `Model ${String(rowNumber).padStart(2, '0')}`

  return <div>{label}</div>
}
