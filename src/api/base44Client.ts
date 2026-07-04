import { supabase, uploadImageToStorage } from '../lib/supabase';

export const base44 = {
  integrations: {
    Core: {
      UploadFile: async ({ file }: { file: File }): Promise<{ file_url: string }> => {
        const userId = (await supabase.auth.getSession()).data.session?.user?.id || 'anonymous';
        const ext = 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const path = `${userId}/${fileName}`;

        const blob = await compressImage(file);
        const publicUrl = await uploadImageToStorage(blob, path);

        console.log(`[Upload] ${file.name} → ${publicUrl} (${(blob.size / 1024).toFixed(1)}KB)`);
        return { file_url: publicUrl };
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

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      const MAX = 1200;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);

      const targetBytes = 200 * 1024;
      const tryQuality = (q: number): Blob | null => {
        const data = canvas.toDataURL('image/jpeg', q);
        return dataURLtoBlob(data);
      };

      let bestBlob: Blob | null = null;
      let low = 0.3, high = 0.85;
      for (let attempt = 0; attempt < 8; attempt++) {
        const mid = (low + high) / 2;
        const blob = tryQuality(mid);
        if (!blob) break;
        if (blob.size < targetBytes) {
          bestBlob = blob;
          low = mid;
        } else {
          high = mid;
        }
      }

      if (!bestBlob || bestBlob.size > 350 * 1024) {
        const scale = Math.min(800 / w, 800 / h);
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        bestBlob = tryQuality(0.7) || tryQuality(0.5) || tryQuality(0.3);
      }
      resolve(bestBlob || tryQuality(0.5)!);
    };
    img.onerror = reject;
    img.src = url;
  });
}

function dataURLtoBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)![1];
  const bin = atob(parts[1]);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}