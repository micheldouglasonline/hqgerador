import { GoogleGenAI, Type } from "@google/genai";
import type { ScriptData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const scriptSchema = {
    type: Type.OBJECT,
    properties: {
        sceneDescription: {
            type: Type.STRING,
            description: "Uma descrição vívida da cena em português para o ilustrador, focando em ação, emoção e enquadramento. Ex: 'Um herói cibernético, com armadura cromada e olhos brilhantes, salta de um prédio em uma cidade futurista chuvosa à noite.'",
        },
        panelText: {
            type: Type.STRING,
            description: "O texto que aparecerá no painel em português. Pode ser um diálogo curto (use aspas) ou uma narração (use 'NARRAÇÃO:'). Máximo de 20 palavras. Ex: '\"Justiça será feita!\"' ou 'NARRAÇÃO: Enquanto isso, nas sombras...'",
        },
    },
    required: ["sceneDescription", "panelText"],
};

async function generateScript(prompt: string): Promise<ScriptData> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                systemInstruction: "Você é um roteirista especialista em quadrinhos da Marvel dos anos 80. Seu estilo é dramático, direto e cheio de ação. Crie roteiros curtos e impactantes para painéis de HQs, sempre em português do Brasil.",
                responseMimeType: "application/json",
                responseSchema: scriptSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const scriptData = JSON.parse(jsonText) as ScriptData;
        
        if (!scriptData.sceneDescription || !scriptData.panelText) {
            throw new Error("Resposta da IA inválida. Faltando dados do roteiro.");
        }

        return scriptData;

    } catch (error) {
        console.error("Erro ao gerar roteiro:", error);
        throw new Error("Falha ao gerar o roteiro. A IA pode estar sobrecarregada. Tente novamente.");
    }
}

async function generateImage(sceneDescription: string): Promise<string> {
    const imagePrompt = `${sceneDescription}, in the dynamic and gritty style of a 1980s Marvel comic book, bold ink lines, vibrant but slightly aged color palette, ben-day dots, action lines, dramatic lighting.`;

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: imagePrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("Nenhuma imagem foi gerada.");
        }
    } catch (error) {
        console.error("Erro ao gerar imagem:", error);
        throw new Error("Falha ao gerar a imagem. A IA pode ter recusado o prompt. Tente uma ideia diferente.");
    }
}


export async function generateScriptAndImage(userPrompt: string, context: string = ""): Promise<ScriptData & { imageUrl: string }> {
    const fullPrompt = context 
        ? `CONTEXTO: A história até agora é sobre ${context}. ROTEIRO DO ÚLTIMO PAINEL: ${userPrompt}. Baseado nisso, crie o roteiro para o PRÓXIMO painel, continuando a ação.`
        : `Crie o roteiro para o PRIMEIRO painel de uma HQ sobre: "${userPrompt}".`;

    const { sceneDescription, panelText } = await generateScript(fullPrompt);
    const imageUrl = await generateImage(sceneDescription);

    return { sceneDescription, panelText, imageUrl };
}

export async function suggestContinuation(context: string): Promise<string> {
    const prompt = `CONTEXTO DA HQ: ${context}. Baseado nisso, sugira uma continuação ou um final surpreendente em UMA frase curta e impactante para o próximo painel. Seja criativo e no estilo Marvel anos 80. Exemplo: 'O vilão revela ser seu irmão perdido!' ou 'Uma nave alienígena surge nos céus.'`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "Você é um roteirista de quadrinhos especialista em criar reviravoltas e momentos de alta tensão.",
            },
        });
        return response.text.trim().replace(/['"]+/g, '');
    } catch (error) {
        console.error("Erro ao sugerir continuação:", error);
        throw new Error("Não foi possível gerar uma sugestão. Tente novamente.");
    }
}