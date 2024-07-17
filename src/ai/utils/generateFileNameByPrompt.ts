export function generateFileNameByPrompt(prompt) {
  // Helper function to get a random integer between min and max (inclusive)
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // Define the desired length of the filename part from the prompt
  const maxLength = 30
  const promptLength = prompt.length

  // Determine the start position for the random substring
  const startPos = getRandomInt(0, Math.max(0, promptLength - maxLength))

  // Get the random substring and truncate it if necessary
  let randomSubstring = prompt.substring(startPos, startPos + maxLength)

  // Replace invalid filename characters with an underscore
  randomSubstring = randomSubstring.replace(/[^a-z\d]/gi, '_').toLowerCase()

  // Add a timestamp for uniqueness
  const timestamp = new Date().toISOString().replace(/[:.-]/g, '')

  // Combine the truncated prompt and timestamp to form the filename
  return `${randomSubstring}_${timestamp}`
}
