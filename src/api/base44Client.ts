// Bridge component to simulate the base44 SDK used in the original snippets
// but proxies call to the backend to protect GEMINI_API_KEY.
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export const base44 = {
  integrations: {
    Core: {
      UploadFile: async ({ file }: { file: File }): Promise<{ file_url: string }> => {
        // Upload to Firebase Storage instead of base64
        const fileRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return { file_url: downloadURL };
      },
      InvokeLLM: async ({ prompt, file_urls, response_json_schema }: any) => {
        try {
          const res = await fetch("/api/llm/invoke", {
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
