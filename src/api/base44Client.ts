import { GoogleGenAI } from "@google/genai";

// Bridge component to simulate the base44 SDK used in the original snippets
// but actually uses the Gemini SDK available in this environment.
export const base44 = {
  integrations: {
    Core: {
      UploadFile: async ({ file }: { file: File }): Promise<{ file_url: string }> => {
        // In AI Studio, we'd normally upload to a server or handle locally.
        // For this preview, we'll return a data URL as the "uploaded url"
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({ file_url: reader.result as string });
          };
          reader.readAsDataURL(file);
        });
      },
      InvokeLLM: async ({ prompt, file_urls, response_json_schema }: any) => {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const contents: any[] = [{ text: prompt }];

        if (file_urls && file_urls.length > 0) {
          for (const url of file_urls) {
            if (url.startsWith("data:")) {
              const [header, data] = url.split(",");
              const mimeType = header.split(":")[1].split(";")[0];
              contents.push({
                inlineData: {
                  data,
                  mimeType,
                },
              });
            }
          }
        }

        const result = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: { parts: contents },
          config: response_json_schema ? {
            responseMimeType: "application/json"
          } : undefined
        });

        const text = result.text || "";

        if (response_json_schema) {
          try {
            // Attempt to extract JSON from markdown if present or if the model returned raw JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            return JSON.parse(jsonMatch ? jsonMatch[0] : text);
          } catch (e) {
            console.error("Failed to parse AI response as JSON", text);
            return { error: "Parse Error", raw: text };
          }
        }

        return text;
      },
    },
  },
};
