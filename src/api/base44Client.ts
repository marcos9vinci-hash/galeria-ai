// Bridge component to simulate the base44 SDK used in the original snippets
// but proxies call to the backend to protect GEMINI_API_KEY.
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
        try {
          const res = await fetch("https://galeria-ia-proxy.4f842090ed958ee94e2d24ee609292ae.workers.dev/llm/invoke", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ prompt, file_urls, response_json_schema }),
          });
          
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.error || `HTTP error ${res.status}`);
          }
          
          const result = await res.json();
          // If response_json_schema was requested, return the parsed JSON directly.
          if (response_json_schema) {
            return result;
          }
          return typeof result.text !== "undefined" ? result.text : result;
        } catch (error: any) {
          console.error("[InvokeLLM Client Error]", error);
          throw error;
        }
      },
    },
  },
};
