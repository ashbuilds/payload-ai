# Guide to Personalizing the Payload AI Plugin

By default, the Payload AI Plugin comes with minimal settings to get you started quickly. However, you can unlock its full potential by personalizing various fields and configurations. Follow the steps below for proper setup and personalization.

> **📝 Note: This guide is based on the default settings and configurations of the Payload AI Plugin. You have the flexibility to customize these settings to suit your specific needs. More on this below...**

---

## **1. Title Field**
Titles are essential as they form the foundation for other fields. Users must input an initial phrase or wording, based on which the AI model will suggest or refine the title.

Open the **Title Field** and enter a phrase or idea for the title. For example:  
  `"A funny blog title"`. Then, click the Compose button.

  ![Title Field](assets/guide/title-field.png)

Use the **Title Menu** to refine your title by proofreading, rephrasing, or translating for better clarity or engagement.  

  ![Title Menu](assets/guide/title-menu.png)

Explore the **Title Settings** to configure how the AI generates or refines titles. For instance:  
  `"Suggest a title based on {{ title }}"`.  

  ![Title Settings](assets/guide/title-settings.png)

---

## **2. Banner Field**
The Banner Field depends on the Title Field for meaningful output. If the title is empty, this field might produce random results or fail entirely. Ensure the title is set before working on the banner.

Access the **Banner Field** and see how it dynamically generates content based on the title input.  
  
![Banner Field](assets/guide/banner-field.png)

Use the **Banner Settings** to define AI behavior and tone. For example:
    ```
    You are a professional designer. Create a visually appealing banner for {{ title }}.
    ```

![Banner Settings](assets/guide/banner-settings1.png)

Customize the style, size, and other settings to match your requirements.  

  ![Banner Settings](assets/guide/banner-settings2.png)

---

### Understanding Prompts and System Prompts
The **Prompt** and **System Prompt** fields let you provide clear context to the AI model, tailoring its output to your needs.

For example:
- In the **Prompt** field, you can include product details and dynamic fields like:  
  *"This post is about a product {{ title }}. Features include {{ featureA }} and {{ featureB }}, with benefits like {{ benefitsA }} and {{ benefitsB }}."*

- In the **System Prompt**, you can define instructions such as:  
  **"Write a quirky and fun blog post that highlights the key features and makes it sound like a must-have. Use playful comparisons and emphasize its unique selling points."**

This combination ensures the AI's output is personalized and aligned with your content goals.

Now, let’s explore how to apply this in the **Content Field** section.

## **3. Content Field**
The Content Field is the core of blog/article generation. Like the Banner Field, it relies on the Title Field for context. Always ensure the title is provided before triggering the "Compose" action.

### **Key Features**
1. **Prompt Tab**:
- Add specific prompts such as:  
  `"Write a blog on: {{ title }}"`.
- You can include multiple fields from your schema, like `{{ title }}` or `{{ myField }}`.  
  
![RichText Prompt](assets/guide/richtext-prompt.png)

2. **System Prompt Tab**:
- Define the AI’s behavior and tone. For example:
  ```
  INSTRUCTIONS:
  You are a professional blog writer. Craft captivating and well-organized articles.
  ```  
  ![RichText System Prompt](assets/guide/richtext-system-prompt.png)

3. **Layout Tab**:
Customize the structure of your content by adding headings, paragraphs, or lists.  
  Example: Include introductory paragraphs, headings, and quotes for consistency.
![RichText Layout](assets/guide/richtext-layout.png)
---

## **4. Voice Over Field**
The Voice Over Field transforms your content into audio, powered by OpenAI or ElevenLabs voice models. This field depends on the Content Field, so generate content first.

### **Setup Instructions**
1. Provide an OpenAI or ElevenLabs API key in your `.env` file for advanced voice capabilities.
2. Use the **Prompt Field** to convert the content into HTML, as both models support HTML input for voice generation. For example: `"{{ toHTML content }}"`.


   ![Voice Over Settings](assets/guide/voice-over-settings1.png)

3. Configure voice settings for the selected model to fine-tune the output.  


   ![Voice Over Settings](assets/guide/voice-over-settings2.png)

### **Key Features**
- Generate audio from the composed content, with options for different voice styles.
- Choose between OpenAI voice models or ElevenLabs for enhanced quality.

---

### Final Note
Follow the correct sequence for optimal results:
Title → Banner → Content → Voice Over

This order ensures smooth generation and avoids errors. Personalize each field to align with your requirements, and test thoroughly for the best outcomes.

This guide is just the beginning – a starting point to inspire your creativity. We can’t wait to see the incredible things you’ll build with it. Let your imagination lead the way!

Enjoy creating amazing content with the Payload AI Plugin 🚀💫

---
### Support This Project
Building and maintaining this plugin takes time and effort. If you’ve found it helpful and want to support future updates, please consider sponsoring the project. Your support means the world! 🌟

[Buy Me a Coffee ☕](https://www.buymeacoffee.com/ashbuilds)
---
