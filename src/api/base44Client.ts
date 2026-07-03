// Upload de imagem com compressão client-side para Firestore (gratuito, sem Storage)
// Comprime imagem para base64 < 1MB para caber no Firestore

export const base44 = {
  integrations: {
    Core: {
      UploadFile: async ({ file }: { file: File }): Promise<{ file_url: string }> => {
        const compressedDataUrl = await compressImageToBase64(file, 750 * 1024);
        return { file_url: compressedDataUrl };
      },
      InvokeLLM: async ({ prompt, file_urls, response_json_schema }: any) => {
        try {
          const res = await fetch("/api/llm/invoke", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt, file_urls, response_json_schema }),
          });
          if (!res.ok) {
            const errBody = await res.json().catch(() => ({}));
            throw new Error(errBody.error || `HTTP error ${res.status}`);
          }
          const result = await res.json();
          if (response_json_schema) return result;
          return typeof result.text !== "undefined" ? result.text : result;
        } catch (error: any) {
          console.error("[InvokeLLM Client Error]", error);
          throw error;
        }
      },
    },
  },
};

function compressImageToBase64(file: File, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;

          // Scale down to max 800px longest side (smaller = more compression)
          let w = img.naturalWidth;
          let h = img.naturalHeight;
          const maxDim = 800;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);

          // Try quality levels from low to high, pick highest that fits
          let result = "";
          for (const q of [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]) {
            const candidate = canvas.toDataURL("image/jpeg", q);
            if (candidate.length <= maxBytes) {
              result = candidate;
            }
          }

          // If nothing fit, force lowest quality at 400px
          if (!result || result.length > maxBytes) {
            canvas.width = 400;
            canvas.height = Math.round((h * 400) / w);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            result = canvas.toDataURL("image/jpeg", 0.3);
          }

          console.log(
            `[UploadFile] ${file.name}: ${Math.round(file.size / 1024)}KB -> ${Math.round(result.length / 1024)}KB base64`
          );
          resolve(result);
        } catch (e) {
          reject(e);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
