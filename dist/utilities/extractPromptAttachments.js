// Converts prompt into messages, extracting images in the process
export function extractPromptAttachments(prompt) {
    // Regex to match absolute HTTPS URLs with image extensions
    const imageUrlRegex = /https:\/\/\S+\.(?:png|jpe?g|webp)/gi;
    const messages = [];
    const imageUrls = [];
    // Find all image URLs in the prompt
    let match;
    while((match = imageUrlRegex.exec(prompt)) !== null){
        imageUrls.push(match[0]);
    }
    // Create image messages first
    for (const imageUrl of imageUrls){
        messages.push({
            content: [
                {
                    type: 'image',
                    image: new URL(imageUrl)
                }
            ],
            role: 'user'
        });
    }
    // Add the text prompt as a regular user message if there's any text left
    messages.push({
        content: prompt,
        role: 'user'
    });
    return messages;
}

//# sourceMappingURL=extractPromptAttachments.js.map