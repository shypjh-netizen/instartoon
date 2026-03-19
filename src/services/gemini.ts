import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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

export const generateCharacter = async (prompt: string): Promise<Character> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
};

export const generateCharacterImage = async (visualPrompt: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          text: `Ultra-minimalist, primitive stick figure or basic doodle style character. Extremely simple lines, very few strokes, cute and expressive but very basic. Like a quick pen sketch on a napkin. Solid white background, no shading, no complex colors. ${visualPrompt}`,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Image generation failed");
};

export const generateBackgroundImage = async (description: string, characterImageUrl?: string): Promise<string> => {
  const parts: any[] = [
    {
      text: `Ultra-minimalist, primitive doodle style. Very simple outlines, basic shapes, consistent with a quick pen sketch style. No shading, no complex textures, very few lines. 
      장면 설명: ${description}
      ${characterImageUrl ? "중요: 제공된 캐릭터 이미지를 참고하여 이 장면에 자연스럽게 포함시켜줘. 캐릭터의 특징과 스타일을 유지해야 해." : ""}`,
    },
  ];

  if (characterImageUrl && characterImageUrl.startsWith('data:')) {
    const base64Data = characterImageUrl.split(',')[1];
    parts.push({
      inlineData: {
        data: base64Data,
        mimeType: "image/png",
      },
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: { parts },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Background generation failed");
};

export const generateScript = async (character: Character, theme: string, panelCount: number = 4): Promise<Script> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
};
