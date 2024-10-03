import { openai } from '@ai-sdk/openai'
import { generateObject, streamObject } from 'ai'

import { createZodSchemaFromJson, reorganizeZodSchema } from '../../schemas/schemaBuilder.js'
import { exampleOutput } from '../example.js'
import { z } from "zod"

function printZodSchema(schema: z.ZodType<any>, depth = 0): string {
  const indent = '  '.repeat(depth);

  if (schema instanceof z.ZodObject) {
    const shape = schema._def.shape();
    const fields = Object.entries(shape)
      .map(([key, value]) => `${indent}  ${key}: ${printZodSchema(value, depth + 1)}`)
      .join(',\n');
    return `{\n${fields}\n${indent}}`;
  } else if (schema instanceof z.ZodArray) {
    return `[${printZodSchema(schema.element, depth + 1)}]`;
  } else if (schema instanceof z.ZodUnion) {
    const options = schema._def.options
      .map(option => printZodSchema(option, depth + 1))
      .join(' | ');
    return `(${options})`;
  } else if (schema instanceof z.ZodLiteral) {
    return `"${schema._def.value}"`;
  } else if (schema instanceof z.ZodEnum) {
    return schema._def.values.map(v => `"${v}"`).join(' | ');
  } else if (schema instanceof z.ZodOptional) {
    return `${printZodSchema(schema._def.innerType, depth)}?`;
  } else {
    return schema.constructor.name;
  }
}

export const generateRichText = async (text: string, options: any) => {
  const layoutSchema = createZodSchemaFromJson(options.layout)
  // console.log("layoutSchema : ", layoutSchema)

  console.log("layoutSchema:  ",printZodSchema(layoutSchema));

  const params = {
    model: openai(options.model),
    prompt: text,
    schema: layoutSchema || options.schema,
    system: `${options.system}

RULES:
- Strictly adhere to the specified layout and formatting instructions.

RICH TEXT EDITOR TOOLS:
- Use appropriate formatting tools such as bold, italic, or underline for emphasis where needed.
- Apply correct heading levels (h1, h2, h3) for hierarchical structure.
- Utilize bullet points or numbered lists as required by the layout.

SAMPLE OUTPUT OBJECT:
${JSON.stringify(exampleOutput)}`,
  }

  if (options.stream) {
    const streamResult = await streamObject(params)
    return streamResult.toTextStreamResponse()
  }

  const generateResult = await generateObject(params)
  return Response.json({ text: generateResult.object })
}
