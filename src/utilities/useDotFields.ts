import { useCallback, useEffect, useState } from 'react'
import { useFieldProps, useForm } from '@payloadcms/ui'
import dot from 'dot-object'

import { arraysHaveSameStrings } from './arraysHaveSameStrings.js'

interface DotFields {
  dotFields: Record<string, unknown>
  fields: Record<string, unknown>
  getDotFields: () => Record<string, unknown>
}

// TODO: Refactor this to be a generic way of getting merged data of sibling fields and its keys with dot notation
export const useDotFields = (): DotFields => {
  const { getData, getFields, getSiblingData } = useForm()
  const { path } = useFieldProps()

  const [fieldsInfo, setFieldsInfo] = useState<DotFields>({
    dotFields: null,
    fields: null,
    getDotFields: () => ({}),
  })

  const getDotFields = useCallback((): {
    dotFields: Record<string, unknown>
    fields: Record<string, unknown>
  } => {
    if (typeof getData !== 'function') return { dotFields: {}, fields: {} }

    const data = getData()
    const siblingData = getSiblingData(path)
    // console.log('siblingData: ', siblingData)
    const dataDot = dot.dot(data)
    const siblingDataDot = dot.dot(siblingData)

    if (arraysHaveSameStrings(Object.keys(dataDot), Object.keys(siblingDataDot))) {
      return {
        dotFields: { ...dataDot },
        fields: { ...data },
      }
    } else {
      const siblingDataDot = dot.dot({ sibling: siblingData })
      return {
        dotFields: { ...dataDot, ...siblingDataDot },
        fields: { ...data, sibling: siblingData },
      }
    }
  }, [getFields, getSiblingData, path, getData, fieldsInfo])

  useEffect(() => {
    if (fieldsInfo.dotFields) {
      return
    }

    const updatedFields = getDotFields()
    setFieldsInfo({
      dotFields: updatedFields.dotFields,
      fields: updatedFields.fields,
      getDotFields,
    })
  }, [getDotFields, fieldsInfo])

  return { ...fieldsInfo, getDotFields }
}
