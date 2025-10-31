import { GoogleGenAI, Modality, GenerateContentResponse } from "@google/genai";

const getAiClient = (): GoogleGenAI => {
  // The API key is injected by the platform environment.
  // A new client is created for each request to ensure the latest key is used.
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

interface ProcessedImageResult {
  base64: string | null;
  text: string | null;
}

export const describeImage = async (
  base64ImageData: string,
  mimeType: string
): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Use a fast model for text generation
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: `Analyze this image in detail. Describe its background, setting, lighting, color palette, textures, and overall artistic style. Focus on the elements that would be needed to realistically reconstruct a part of the scene if an object were removed. Provide a concise but comprehensive description. For example: "A fine-art campaign set with a pastel green wall, organic curved tree branches, lush leaves, and colorful birds in soft natural light. The style is high-end editorial with a velvet texture rendering and cinematic balance."`
                    }
                ]
            },
        });

        const description = response.text;
        if (!description) {
            throw new Error("AI không thể tạo mô tả cho hình ảnh.");
        }
        return description;

    } catch(error) {
        console.error("Lỗi khi gọi API Gemini để mô tả:", error);
        // Rethrow the original error to be handled by the UI component
        throw error;
    }
}

export const processImage = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  maskBase64Data?: string
): Promise<ProcessedImageResult> => {
  try {
    const ai = getAiClient();
    const parts: ({ text: string } | { inlineData: { data: string, mimeType: string } })[] = [
      {
        inlineData: {
          data: base64ImageData,
          mimeType: mimeType,
        },
      },
    ];

    if (maskBase64Data) {
      parts.push({
        inlineData: {
          data: maskBase64Data,
          mimeType: 'image/png', // The mask from canvas is always a PNG
        },
      });
    }

    parts.push({ text: prompt });

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const result: ProcessedImageResult = { base64: null, text: null };

    // The response can contain multiple parts, we need to find the image part.
    if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                result.base64 = part.inlineData.data;
            } else if (part.text) {
                // The model might return text explaining why it can't fulfill the request.
                result.text = part.text;
            }
        }
    }

    if (!result.base64) {
      const refusalText = result.text ? ` Lý do từ AI: "${result.text}"` : "";
      throw new Error(`AI không trả về hình ảnh. Yêu cầu có thể đã bị từ chối.${refusalText}`);
    }
    
    return result;

  } catch (error) {
    console.error("Lỗi khi gọi API Gemini:", error);
    // Rethrow the original error to be handled by the UI component
    throw error;
  }
};
