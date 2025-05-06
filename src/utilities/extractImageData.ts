type ImageData = {
  image: { name: string; type: string; url: string }
}[]

export function extractImageData(input: string): ImageData {
  const regex = /\/[\w%\-./]+\.(png|jpe?g|webp)/gi
  const matches = input.match(regex)

  if (!matches) return []

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
