export const isPluginActivated = () => {
  return process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY
}
