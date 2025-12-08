type ImageData = {
  image: { name: string; type: string; url: string }
}[]

/**
 * Extracts hardcoded image URLs from text using regex.
 * 
 * NOTE: This only handles direct URLs in the text.
 * For @field references, use resolveImageReferences utility instead.
 * 
 * @param input - Text containing image URLs
 * @returns Array of extracted image data
 */
export function extractImageData(input: string): ImageData {
  const regex = /(?:https?:)?\/[\w%\-.,/]+\.(png|jpe?g|webp)/gi
  const matches = input.match(regex)
  console.log("input : ", input)
  if (!matches) {return []}

  return matches.map((url) => {
    const decodedUrl = decodeURIComponent(url)
    const parts = decodedUrl.split('/')
    const filename = parts[parts.length - 1]
    const name = filename.replace(/\.(png|jpe?g|webp)$/i, '')
    const typeMatch = filename.match(/\.(png|jpe?g|webp)$/i)
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'unknown'

    return {
      image: {
        name,
        type,
        url,
      },
    }
  })
}
