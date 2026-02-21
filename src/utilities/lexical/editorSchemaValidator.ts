import ajvModule from 'ajv'

export const editorSchemaValidator = (schema: unknown) => {
  const modifiedSchema = JSON.parse(JSON.stringify(schema), function (key: string, value: any) {
    if (key === 'required' && Array.isArray(value)) {
      // Safely access properties from parent
      const parent = this as { properties?: Record<string, any> }
      const parentProperties = parent.properties

      if (parentProperties) {
        const requiredFields = ['type'] // type is always required

        // Check if this node has children property
        if ('children' in parentProperties) {
          requiredFields.push('children')
        }

        // Check if this node has text property
        if ('text' in parentProperties) {
          requiredFields.push('text')
        }

        const filteredRequired = value.filter((field) => requiredFields.includes(field))
        return filteredRequired.length ? filteredRequired : undefined
      }
    }
    return value
  })

  const Ajv = ajvModule.default
  const ajv = new Ajv()

  return ajv.compile(modifiedSchema)
}
