// import Anthropic from '@anthropic-ai/sdk'
// import { StreamingTextResponse } from 'ai'
// import { zodToJsonSchema } from 'zod-to-json-schema'
//
// import { DocumentSchema } from '../../RichTextSchema.js'
//
// const DEFAULT_SCHEMA_PREFIX = 'JSON schema:'
// const DEFAULT_SCHEMA_SUFFIX =
//   'You MUST answer with a JSON object that matches the JSON schema above.'
//
// function transformStream(readableStream) {
//   const reader = readableStream.getReader()
//   const encoder = new TextEncoder()
//   let buffer = ''
//   let jsonBuffer = ''
//   let jsonDepth = 0
//   let inRoot = false
//
//   return new ReadableStream({
//     async start(controller) {
//       while (true) {
//         const { done, value } = await reader.read()
//         if (done) break
//
//         buffer += new TextDecoder().decode(value)
//         const lines = buffer.split('\n')
//         buffer = lines.pop()
//
//         for (const line of lines) {
//           try {
//             const parsed = JSON.parse(line)
//             console.log('parsed', parsed)
//             if (parsed.type === 'content_block_delta' && parsed.delta.type === 'text_delta') {
//               controller.enqueue(encoder.encode(parsed.delta.text))
//             }
//           } catch (error) {
//             // If it's not a valid JSON, it might be part of the article content
//             jsonBuffer += line + '\n'
//           }
//         }
//       }
//
//       // Process the remaining jsonBuffer to extract the structured content
//       for (const char of jsonBuffer) {
//         if (char === '{') {
//           if (jsonDepth === 0) inRoot = true
//           jsonDepth++
//         } else if (char === '}') {
//           jsonDepth--
//           if (jsonDepth === 0 && inRoot) {
//             try {
//               const parsedContent = JSON.parse(jsonBuffer)
//               const formattedContent = JSON.stringify(parsedContent, null, 2)
//               controller.enqueue(encoder.encode(formattedContent))
//             } catch (error) {
//               console.error('Error parsing final JSON:', error)
//             }
//             break
//           }
//         }
//       }
//
//       controller.close()
//     },
//   })
// }
//
// const client = new Anthropic()
//
// const s = zodToJsonSchema(DocumentSchema)
// // console.log('schema', JSON.stringify(s, null, 2))
//
// const stream = client.messages.stream({
//   // max_tokens: 400,
//   max_tokens: 4000,
//   messages: [
//     {
//       content: text,
//       role: 'user',
//     },
//   ],
//   model: options.model,
//   system: `${options.system}
//
//     LAYOUT:
//     ${options.layout}
//
//     ${DEFAULT_SCHEMA_PREFIX},
//     ${JSON.stringify(s, null, 2)},
//     ${DEFAULT_SCHEMA_SUFFIX},
//
//     JSON OUTPUT:
//        `,
//   // tool_choice: { name: 'write_blog_article', type: 'tool' },
//   // tools: [
//   //   {
//   //     name: 'write_blog_article',
//   //     description: 'A rich text editor for blog posts, articles, and other long-form content.',
//   //   },
//   // ],
// })
// // Once a content block is fully streamed, this event will fire
// // .on('contentBlock', (content) => console.log('contentBlock', content))
// // Once a message is fully streamed, this event will fire
// // .on('message', (message) => console.log('message', message))
// // .on('inputJson', (inputJson) => console.log('inputJson', inputJson))
// // .on('streamEvent', (streamEvent) => console.log('outputJson', streamEvent))
//
// // const streamInfor = AnthropicStream(stream.toReadableStream())
//
// // const stream = AnthropicStream(response);
//
// // Respond with the stream
// const transformedStream = transformStream(stream.toReadableStream())
// // return new StreamingTextResponse(transformedStream)
//
// // return stream.toReadableStream()
//
// // let resultStrObject = ''
// // for await (const event of stream) {
// //   console.log('event', event)
// //
// //   if (event.type === 'content_block_delta') {
// //     if (event.delta.type === 'text_delta') {
// //       resultStrObject += event.delta.text
// //     }
// //   }
// // }
// // console.log('resultStrObject', resultStrObject)
// //
// // const message = await stream.finalMessage()
// // console.log('finalMessage', message)
