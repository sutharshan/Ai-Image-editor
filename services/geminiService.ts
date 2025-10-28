
import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const fileToGenerativePart = (base64Data: string, mimeType: string) => {
    return {
        inlineData: {
            data: base64Data,
            mimeType,
        },
    };
};

export const editImageWithGemini = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    try {
        const imagePart = fileToGenerativePart(base64Image, mimeType);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    imagePart,
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }

        throw new Error("No image data found in the response.");

    } catch (error) {
        console.error("Error editing image with Gemini:", error);
        if (error instanceof Error) {
           throw new Error(`Failed to edit image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while editing the image.");
    }
};

export const regenerateImageToAspectRatio = async (
    base64Image: string, 
    mimeType: string, 
    aspectRatioLabel: string
): Promise<string> => {
    try {
        const imagePart = fileToGenerativePart(base64Image, mimeType);
        const prompt = `This image needs to be adjusted to a ${aspectRatioLabel} aspect ratio. Please intelligently extend the image to fit these new dimensions. The generated areas should seamlessly blend with the original image in terms of style, lighting, and content. Do not crop the original image; instead, add new visual information to the sides or top/bottom as needed.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    imagePart,
                    { text: prompt },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }

        throw new Error("No image data found in the response from regeneration.");

    } catch (error) {
        console.error("Error regenerating image with Gemini:", error);
        if (error instanceof Error) {
           throw new Error(`Failed to regenerate image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while regenerating the image.");
    }
};
