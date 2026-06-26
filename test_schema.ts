import { GoogleGenAI, Type } from "@google/genai";

const key = "AIzaSyBfGyJbUx6yElQz1nTPhk3_81zGYhUgN1Y";
const ai = new GoogleGenAI({ apiKey: key });

const schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      index: { type: Type.INTEGER },
      type: { type: Type.STRING },
      caption: { type: Type.STRING }
    },
    required: ["index", "type", "caption"]
  }
};

async function testSchema(model: string) {
  console.log(`Testing schema on ${model}...`);
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: "Generate a list of 1 items. index=0, type='feed', caption='hello world'",
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    console.log(`-> ${model} SUCCESS:`, response.text);
  } catch (err: any) {
    console.log(`-> ${model} FAILED:`, err.message || err);
  }
}

async function main() {
  await testSchema("gemini-2.5-flash");
  await testSchema("gemini-3.1-flash-lite");
}

main();
