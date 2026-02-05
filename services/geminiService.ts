
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion, ChatMessage, Flashcard } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const formatLessonContent = async (rawContent: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Toma el siguiente texto de estudio y dale un formato profesional de Markdown. 
    ESTRICTAMENTE:
    1. Corrige errores de puntuación y saltos de línea.
    2. Usa títulos (##) para las secciones principales.
    3. Usa listas con viñetas para enumeraciones.
    4. Resalta términos clave en **negrita**.
    
    TEXTO ORIGINAL:
    ${rawContent}`,
  });
  return response.text || rawContent;
};

export const generateSummary = async (content: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Actúa como un tutor experto. Resume el siguiente material de estudio de forma EXTENSA y DETALLADA utilizando un lenguaje SENCILLO. Estructura con Markdown.

    Material:
    ${content}`,
  });
  return response.text || "No se pudo generar el resumen.";
};

export const generateFlashcards = async (content: string): Promise<Flashcard[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Genera 8 tarjetas de memoria (flashcards) para estudiar el siguiente contenido. Cada tarjeta debe tener una pregunta o concepto breve en el frente (front) y una respuesta clara en el reverso (back). Responde estrictamente en JSON.
    
    Contenido:
    ${content}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING }
          },
          required: ["front", "back"]
        }
      }
    }
  });

  try {
    const raw = JSON.parse(response.text || "[]");
    return raw.map((item: any) => ({ ...item, id: crypto.randomUUID() }));
  } catch (error) {
    return [];
  }
};

export const generateQuiz = async (content: string, numQuestions: number = 5): Promise<QuizQuestion[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Genera un cuestionario de exactamente ${numQuestions} preguntas de opción múltiple. Responde estrictamente en JSON.\n\nMaterial:\n${content}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctAnswerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswerIndex", "explanation"]
        }
      }
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return [];
  }
};

export const askQuestion = async (content: string, history: ChatMessage[], question: string): Promise<string> => {
  const formattedHistory = history.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    history: formattedHistory,
    config: {
      systemInstruction: `Eres un tutor personal experto y directo. Responde dudas sobre el CONTENIDO DE REFERENCIA adjunto. No saludes ni uses muletillas.
      CONTENIDO DE REFERENCIA: ${content}`,
      temperature: 0.1,
    }
  });

  const response = await chat.sendMessage({ message: question });
  return response.text || "No puedo responder a eso ahora.";
};
