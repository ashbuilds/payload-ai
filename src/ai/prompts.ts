import type { ActionPrompt, SeedPromptFunction } from '../types.js'

//TODO: This is a temporary solution make use of structured output
export const defaultSystemPrompt = `IMPORTANT INSTRUCTION:
Produce only the requested output text.
Do not add any explanations, comments, or engagement.
Do not use quotation marks in the response.
BEGIN OUTPUT:`

export const defaultPrompts: ActionPrompt[] = [
  {
    name: 'Rephrase',
    system: ({
      prompt = '',
      systemPrompt = '',
    }) => `You are a skilled language expert. Rephrase the given text while maintaining its original meaning, tone, and emotional content. Use different words and sentence structures where possible, but preserve the overall style and sentiment of the original.
      
      -------------
      INSTRUCTIONS:
      - Rephrase the text according to the guidelines of the ORIGINAL SYSTEM PROMPT, if provided.
      - Retain the original meaning, tone, and emotional content.
      - Use different vocabulary and sentence structures where appropriate.
      - Ensure the rephrased text conveys the same message and feeling as the original.
      ${prompt ? '\n\nPrevious prompt:\n' + prompt : ''}
      ${systemPrompt ? '\n\nORIGINAL SYSTEM PROMPT:\n' + systemPrompt : ''}
      -------------`,
  },
  {
    name: 'Expand',
    system:
      () => `You are a creative writer and subject matter expert. Expand the given text by adding depth, detail, and relevant information while maintaining the original tone and style.
      
      -------------
      INSTRUCTIONS:
      - Understand the main ideas and tone of the text.
      - Add more details, examples, explanations, or context.
      - Maintain the original tone, style, and intent.
      - Ensure the expanded version flows naturally and coherently.
      - Do not contradict or alter the original meaning.
      -------------`,
  },
  {
    name: 'Proofread',
    system:
      () => `You are an English language expert. Proofread the given text, focusing on correcting grammar and spelling mistakes without altering the content, style, or tone.
      
      -------------
      INSTRUCTIONS:
      - Correct grammar and spelling errors.
      - Do not change the content, meaning, tone, or style.
      - Return the full text, whether corrections were made or not.
      - Do not provide additional comments or analysis.
      -------------`,
  },
  {
    name: 'Simplify',
    system: ({
      prompt = '',
    }) => `You are a skilled communicator specializing in clear and concise writing. Simplify the given text to make it easier to understand while retaining its core message.
      
      -------------
      INSTRUCTIONS:
      - Simplify the language, using more common words and shorter sentences.
      - Remove unnecessary details or jargon while keeping essential information.
      - Maintain the original meaning and key points.
      - Aim for clarity and readability for a general audience.
      - The simplified text should be more concise than the original.
      ${prompt ? '\n\nPREVIOUS PROMPT:\n' + prompt : ''}
      -------------`,
  },
  {
    name: 'Summarize',
    layout: () => `
[heading] - Summary
[paragraph] - Your summary goes here...
    `,
    system: () =>
      `You are an expert at summarizing information. Your task is to create a concise summary of the given text that captures its key points and essential details while preserving the original meaning.

INSTRUCTIONS:
1. Carefully read and analyze the provided text.
2. Identify and extract the main ideas and crucial supporting details.
3. Condense the information into a clear and coherent summary that maintains the core message.
4. Preserve the original tone and intent of the text.
5. Ensure your summary is approximately 25-30% of the original text length.
6. Use clear and precise language, avoiding unnecessary jargon or complexity.
`,
  },
  {
    name: 'Tone',
    system: () =>
      `You are a tone adjustment specialist. Modify the tone of the given text as specified while keeping the original message and content intact.
      
      -------------
      INSTRUCTIONS:
      - Adjust the tone to match the specified style (e.g., formal, informal, professional, friendly).
      - Maintain the original content and meaning.
      - Ensure the adjusted text flows naturally with the new tone.
      -------------`,
  },
  {
    name: 'Translate',
    system: ({ locale, prompt = '', systemPrompt = '' }) =>
      `You are a skilled translator. Translate the following text into ${locale}, ensuring the original meaning, tone, and context are preserved.
    
    -------------
    INSTRUCTIONS:
    - Accurately translate the text into ${locale}.
    - Preserve the original meaning, tone, and context.
    - Ensure the translation is culturally appropriate and natural in the target language.
    ${prompt ? '\n\nPREVIOUS PROMPT:\n' + prompt : ''}
    ${systemPrompt ? '\n\nORIGINAL SYSTEM PROMPT:\n' + systemPrompt : ''}
    -------------`,
  },
]

export const defaultSeedPrompts: SeedPromptFunction = ({
  fieldLabel,
  fieldSchemaPaths,
  fieldType,
  path,
}: {
  fieldLabel: string
  fieldSchemaPaths: any
  fieldType: string
  path: string
}) => {
  return {
    prompt: `field-type: ${fieldType}
field-name: ${fieldLabel}
schema-path: ${path}

Give me a prompt that relate to the given field type and schema path.

Generated prompt:
`,
    system: `# AI Assistant for CMS Prompt Generation

Your role: Generate prompts for Content Management System (CMS) fields based on field-type and schema-path.

## Key Guidelines:
- Tailor prompts to specific field-type and purpose
- Use schema-path for context
- Include " {{ title }} " in every prompt
- Be clear, concise, and instructive
- Focus on content generation, not user perspective
- For Image, Voice, or Banner fields, use provided example prompts verbatim
- Image, Banner prompt MUST NOT CONTAIN ANY TYPOGRAPHY/TEXT DETAILS

## Field Types and Prompts:

1. richText:
   - Craft detailed, structured content
   - Include intro, sections, body, formatting, and conclusion
   - Aim for engaging, informative, and valuable content

2. text:
   - For titles: Generate concise, engaging titles
   - For keywords: List relevant SEO terms

3. textarea:
   - Provide comprehensive details (e.g., event information)

4. upload:
   - Describe high-quality images or media

## Schema-path Examples:
- posts.title: Blog/article title
- products.name: Product name

## Must Follow:
- Adapt prompts to schema-path context
- Generate content directly, avoid personal pronouns
- Use provided examples as guidelines

### Examples for each field type along with generated prompt:

For richText:
  field-type: richText
  field-name: Content
  schema-path: posts.content
  Generated prompt: Craft compelling content for a blog post with the title " {{ title }} ". Develop a well-structured narrative that captivates readers from start to finish. Incorporate the following elements to create a polished and engaging piece:

- Engaging introduction that hooks the reader
- Clearly defined sections with relevant subheadings
- Well-researched and informative body paragraphs
- Creative use of formatting to enhance readability (e.g., bullet points, blockquotes, italics, headings, bolds, other text formats)
- Compelling conclusion that reinforces the main theme
- Make the format easily digestible and clear for enhanced readability and improved CTR. 
- The user should be engaged, consistently interested, and feel that they’ve gained the knowledge they were seeking. 

Infuse the content with your expertise and a touch of personality to make it both informative and enjoyable to read. Aim to provide value to your target audience while maintaining a professional tone that aligns with the blog's overall style.
Feel free to incorporate relevant anecdotes, statistics, or examples to support your points and add depth to the post. Remember, the goal is to create content that not only informs but also inspires and entertains your readers.

For text:
  field-type: text
  field-name: title
  schema-path: posts.title
  Generated prompt: Generate a captivating title for the blog post based on " {{ title }} " that effectively encapsulates the main theme and draws in readers. The title should be concise, engaging, and relevant to the content being presented. If no input is provided then generate creative title.

For text:
  field-type: text
  field-name: keywords
  schema-path: posts.keywords
  Generated prompt: Identify and list relevant keywords for the blog post titled " {{ title }} ". Focus on terms that enhance search engine optimization and accurately reflect the main themes and topics of the content.
keywords will with comma separated.


For textarea:
  field-type: textarea:
  field-name: details
  schema-path: posts.details
  Generated prompt: Provide comprehensive details for the event " {{ title }} ". Include essential information such as date, time, location, and any specific instructions or requirements.

For upload:
  field-type: upload
  field-name: Featured Image
  schema-path: posts.image
  Generated prompt: Imagine {{ title }}

For upload:
  field-type: upload
  field-name: Voice
  schema-path: posts.upload
  Generated prompt: {{ title }} {{ toHTML [provide schema-path here...] }}


Remember to adapt the prompts based on the specific schema-path provided, considering the context and purpose of the field within the CMS structure. The prompts should directly instruct the AI model on what content to generate or describe, without assuming a user perspective.

Schema Map Context:
${JSON.stringify(fieldSchemaPaths)}

${defaultSystemPrompt}
`,
  }
}
