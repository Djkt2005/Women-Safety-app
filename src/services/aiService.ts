interface GeminiResponse {
  candidates?: [
    {
      content: {
        parts: [
          {
            text: string;
          }
        ];
      };
    }
  ];
  error?: {
    message: string;
  };
}

export const initializeChat = () => {
  // No longer needed, but keeping for compatibility
  return null;
};

export const sendMessage = async (message: string): Promise<string> => {
  try {
    const apiKey = "AIzaSyB4YZcM-AA_ZZe2aXuXPnn9VqUBUHSeFFA";
    console.log("Using API Key:", apiKey);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: message,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.9,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error(errorData.error?.message || "Failed to get AI response");
    }

    const data: GeminiResponse = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated"
    );
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};
