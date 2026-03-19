import { ApiError, GoogleGenAI, Type } from "@google/genai";

const TEXT_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "imagen-4.0-generate-001";

const normalizeApiKey = (value?: string) => {
  if (!value) return "";
  return value.trim().replace(/^['\"]+|['\"]+$/g, "").replace(/\s+/g, "");
};

const toApiErrorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return `Gemini 요청이 거부되었습니다. API 키 형식 또는 요청 파라미터를 확인해주세요. (${error.message})`;
    }
    if (error.status === 403) {
      return `API 키 권한이 없거나 현재 도메인이 허용되지 않았습니다. Google AI Studio 키 제한 설정을 확인해주세요. (${error.message})`;
    }
    if (error.status === 429) {
      return `요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요. (${error.message})`;
    }
    return `Gemini API 오류(${error.status}): ${error.message}`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Gemini API 호출 중 오류가 발생했습니다.";
};

const getEffectiveApiKey = (apiKey?: string) => {
  const inputKey = normalizeApiKey(apiKey);
  const envKey = normalizeApiKey((import.meta as any).env?.VITE_GEMINI_API_KEY || "");
  return inputKey || envKey;
};

const getAiClient = (apiKey?: string) => {
  const effectiveApiKey = getEffectiveApiKey(apiKey);
  if (!effectiveApiKey) {
    throw new Error("Gemini API 키가 필요합니다. 상단 입력칸에서 키를 입력해주세요.");
  }
  return new GoogleGenAI({ apiKey: effectiveApiKey });
};

export interface Character {
  name: string;
  description: string;
  traits: string[];
  visualPrompt: string;
  imageUrl?: string;
}

export interface Script {
  title: string;
  panels: {
    panelNumber: number;
    visualDescription: string;
    dialogue: string;
    narration: string;
  }[];
}

export const generateCharacter = async (prompt: string, apiKey?: string): Promise<Character> => {
  const ai = getAiClient(apiKey);
  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `인스타툰 캐릭터를 만들어줘. 사용자의 요청: ${prompt}. 
      캐릭터 이름, 성격/특징(배열), 외형 묘사, 그리고 이미지 생성을 위한 영어 프롬프트를 포함해서 JSON으로 응답해줘. 모든 텍스트 필드는 한국어로 작성해줘.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "캐릭터 이름 (한국어)" },
            description: { type: Type.STRING, description: "캐릭터 설명 (한국어)" },
            traits: { type: Type.ARRAY, items: { type: Type.STRING }, description: "캐릭터 특징 리스트 (한국어)" },
            visualPrompt: { type: Type.STRING, description: "이미지 생성을 위한 상세한 영어 프롬프트" },
          },
          required: ["name", "description", "traits", "visualPrompt"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    throw new Error(toApiErrorMessage(error));
  }
};

export const generateCharacterImage = async (visualPrompt: string, apiKey?: string): Promise<string> => {
  const ai = getAiClient(apiKey);
  try {
    const response = await ai.models.generateImages({
      model: IMAGE_MODEL,
      prompt: `Ultra-minimalist, primitive stick figure or basic doodle style character. Extremely simple lines, very few strokes, cute and expressive but very basic. Like a quick pen sketch on a napkin. Solid white background, no shading, no complex colors. ${visualPrompt}`,
      config: {
        numberOfImages: 1,
        aspectRatio: "1:1",
        outputMimeType: "image/png",
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (imageBytes) {
      return `data:image/png;base64,${imageBytes}`;
    }
    throw new Error("이미지 데이터를 받지 못했습니다.");
  } catch (error) {
    throw new Error(toApiErrorMessage(error));
  }
};

export const generateBackgroundImage = async (description: string, characterImageUrl?: string, apiKey?: string): Promise<string> => {
  const ai = getAiClient(apiKey);
  try {
    const response = await ai.models.generateImages({
      model: IMAGE_MODEL,
      prompt: `Ultra-minimalist, primitive doodle style. Very simple outlines, basic shapes, consistent with a quick pen sketch style. No shading, no complex textures, very few lines. 장면 설명: ${description}. ${characterImageUrl ? "기존 캐릭터와 어울리는 동일한 분위기의 장면으로 구성해줘." : ""}`,
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9",
        outputMimeType: "image/png",
      },
    });

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (imageBytes) {
      return `data:image/png;base64,${imageBytes}`;
    }
    throw new Error("배경 이미지 데이터를 받지 못했습니다.");
  } catch (error) {
    throw new Error(toApiErrorMessage(error));
  }
};

export const generateScript = async (character: Character, theme: string, panelCount: number = 4, apiKey?: string): Promise<Script> => {
  const ai = getAiClient(apiKey);
  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `캐릭터 '${character.name}'(${character.description})를 주인공으로 하는 ${panelCount}컷 인스타툰 대본을 작성해줘. 
      주제: ${theme}. 
      각 컷(panel)의 번호, 시각적 묘사, 대사, 나레이션을 포함해서 JSON으로 응답해줘. 모든 텍스트는 한국어로 작성해줘.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "에피소드 제목 (한국어)" },
            panels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  panelNumber: { type: Type.INTEGER },
                  visualDescription: { type: Type.STRING, description: "장면의 시각적 묘사 (한국어)" },
                  dialogue: { type: Type.STRING, description: "캐릭터 대사 (한국어)" },
                  narration: { type: Type.STRING, description: "나레이션 (한국어)" },
                },
                required: ["panelNumber", "visualDescription", "dialogue", "narration"],
              },
            },
          },
          required: ["title", "panels"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    throw new Error(toApiErrorMessage(error));
  }
};
