
# YOUAI Chat - AI-Powered Assistant

YOUAI Chat is a responsive and feature-rich AI chat application built with React and TypeScript. It supports multiple Large Language Model (LLM) backends, allowing users to interact with powerful AI models, get assistance with coding and writing tasks, utilize quick actions for common prompts, and even upload images for multimodal interactions with supported models.

## ✨ Features

*   **Multi-LLM Support:** Flexibly connect to different AI providers. Currently supports:
    *   Google Gemini (`gemini-2.5-flash-preview-04-17`)
    *   A Placeholder LLM (for demonstration and as a template for adding others)
*   **Model Selection:** Choose your preferred AI provider via a dropdown in the UI.
*   **Intelligent Chat:** Engage in dynamic conversations with the selected AI model.
*   **Streaming Responses:** Receive AI responses word-by-word for a more interactive experience.
*   **Markdown Support:** AI responses are rendered with Markdown, supporting code blocks, lists, and other formatting.
*   **Image Uploads:** Attach images to your prompts for multimodal input (feature support depends on the selected LLM).
*   **Quick Actions:** Pre-defined prompts for common tasks like explaining code, refactoring, writing unit tests, etc.
*   **Responsive UI:** Clean and modern interface built with Tailwind CSS.
*   **Error Handling:** Graceful error messages for API issues or other problems.
*   **Source Display:** When supported by the AI (e.g., Gemini with Google Search grounding), displays source URLs.
*   **Client-Side:** Runs entirely in the browser once loaded.

## 🛠️ Tech Stack

*   **Frontend:** React 19, TypeScript
*   **AI Models:**
    *   Google Gemini API (`@google/genai` SDK)
    *   Placeholder/Other LLMs via a common service interface
*   **Styling:** Tailwind CSS
*   **Markdown Rendering:** `react-markdown` with `remark-gfm`
*   **Build/Dev:** Uses esm.sh for module resolution in the browser (as per `index.html` importmap).

## 🚀 Getting Started

### Prerequisites

*   A modern web browser.
*   **API Keys:** The application **requires** API keys for the LLM providers you wish to use. These keys **must** be set as environment variables.
    *   **For Google Gemini:** Set `GEMINI_API_KEY`.
        ```bash
        export GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
        ```
    *   **For Placeholder LLM (Example):** Set `PLACEHOLDER_API_KEY` (can be any non-empty string for testing).
        ```bash
        export PLACEHOLDER_API_KEY="ANY_STRING_WORKS_FOR_PLACEHOLDER"
        ```
    *   **Important:** You do not need to modify the application code to insert API keys. Ensure the environment variables are available in the environment where you are serving or building the application. The application **will not** prompt you to enter them.

### Setup & Running Locally

This project is set up to run directly from `index.html` leveraging ES modules and an import map.

1.  **Clone the repository (if applicable) or download the files.**
2.  **Set up your API Key(s) as environment variables** (see Prerequisites).
3.  **Serve the `index.html` file:**
    *   Use a simple HTTP server. If you have Node.js: `npx serve .` in the project's root.
    *   `process.env.YOUR_API_KEY` is expected to be substituted or made available by the serving environment.

4.  **Open the application in your browser.** (e.g., `http://localhost:3000` if using `npx serve`)

## 📁 Project Structure

```
.
├── README.md                 # This documentation file
├── index.html                # Main HTML entry point
├── index.tsx                 # React application root
├── App.tsx                   # Main application component
├── metadata.json             # Application metadata
├── types.ts                  # Global TypeScript type definitions
├── constants.tsx             # Application constants (quick actions, LLM providers)
├── services/
│   └── llm/
│       ├── types.ts                  # LLM Service interfaces and types
│       ├── llmServiceFactory.ts      # Factory to get specific LLM service
│       └── providers/
│           ├── geminiProvider.ts     # Gemini LLM service implementation
│           └── placeholderProvider.ts# Placeholder LLM service implementation
└── components/
    ├── ChatInput.tsx         # Component for user input
    ├── ChatMessage.tsx       # Component to display a chat message
    ├── QuickActionsPanel.tsx # Sidebar with quick actions & LLM selector
    ├── QuickActionButton.tsx # Individual quick action button
    ├── LoadingSpinner.tsx    # Loading animation
    └── icons.tsx             # SVG icon components
```

##  How to Use

1.  **Select AI Provider:**
    *   Use the dropdown in the left panel to choose your desired AI model (e.g., "Gemini", "Placeholder LLM").
    *   The chat will reset, and the application will use the selected provider. Ensure its API key is configured in your environment.

2.  **Chat Interface:**
    *   Type your message in the input field at the bottom.
    *   Press Enter or click the send button.

3.  **File Upload (if supported by selected LLM):**
    *   Click the paperclip icon to select an image.
    *   Add a text prompt if desired, and send.

4.  **Quick Actions:**
    *   Click an action in the left panel to populate the input with a template prompt.
    *   Modify and send.

## 🤝 Contributing

Contributions are welcome!

## 📄 License

This project is open source.
