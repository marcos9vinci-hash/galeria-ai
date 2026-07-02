// Bridge component to simulate the base44 SDK used in the original snippets
// but proxies call to the backend to protect GEMINI_API_KEY.
// Client-side image compression to keep base64 under 1MB Firestore limit (FREE - no Storage needed)
export const base44 = {
  integrations: {
    Core: {
      UploadFile: async ({ file }: { file: File }): Promise<{ file_url: string }> => {
        // Compress image client-side to stay under 1MB Firestore limit
        const compressedDataUrl = await compressImageToBase64(file, 1024 * 1024); // 1MB target
        return { file_url: compressedDataUrl };
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

// Compress image to base64 under maxBytes (default 1MB for Firestore)
function compressImageToBase64(file: File, maxBytes: number = 1024 * 1024): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target?.result as string; };
    reader.readAsDataURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Calculate initial dimensions (max 1920px on longest side)
      let { width, height } = img;
      const maxDim = 1920;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Binary search quality to fit under maxBytes
      let quality = 0.8;
      let minQ = 0.1, maxQ = 0.9;
      let bestDataUrl = '';
      
      function tryQuality(q: number) {
        return canvas.toDataURL('image/jpeg', q);
      }
      
      // Quick check at max quality
      let dataUrl = tryQuality(quality);
      if (dataUrl.length <= maxBytes) { resolve(dataUrl); return; }
      
      // Binary search for quality
      for (let i = 0; i < 10; i++) {
        quality = (minQ + maxQ) / 2;
        dataUrl = tryQuality(quality);
        if (dataUrl.length <= maxBytes) {
          bestDataUrl = dataUrl;
          minQ = quality;
        } else {
          maxQ = quality;
        }
        if (maxQ - minQ < 0.02) break;
      }
      
      // If still too large, downscale further
      if (!bestDataUrl || bestDataUrl.length > maxBytes) {
        const scale = Math.sqrt(maxBytes / dataUrl.length) * 0.9;
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        bestDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      }
      
      resolve(bestDataUrl || dataUrl);
    };
  });
}
