import type { ModelMessage } from 'ai'

// URLs are inputs to the application's storage resolver, never SDK download targets.
export async function extractPromptAttachments(
  prompt: string,
  resolveImage?: (url: string) => Promise<Blob>,
): Promise<ModelMessage[]> {
  const urls = [...new Set(prompt.match(/https:\/\/\S+\.(?:png|jpe?g|webp)/gi) || [])]
  if (urls.length && !resolveImage) {
    throw new Error('Prompt attachments require a configured reference image resolver.')
  }
  const messages: ModelMessage[] = []
  for (const url of urls) {
    const blob = await resolveImage!(url)
    messages.push({
      content: [
        { type: 'image', image: new Uint8Array(await blob.arrayBuffer()), mediaType: blob.type },
      ],
      role: 'user',
    })
  }
  messages.push({ content: prompt, role: 'user' })
  return messages
}
