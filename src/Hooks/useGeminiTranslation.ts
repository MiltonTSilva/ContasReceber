import { useState, useCallback } from "react";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
  }>;
}

export const useGeminiTranslation = () => {
  const [translatedText, setTranslatedText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(
    async (text: string, targetLanguage: string) => {
      if (!text.trim()) {
        setTranslatedText("");
        return;
      }

      setLoading(true);
      setError(null);
      setTranslatedText("");

      try {
        const prompt = `Traduza o seguinte texto para ${targetLanguage}: "${text}", mostre apenas uma resposta, e retire a terminologia técnica e o contexto de banco de dados`;

        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });

        if (!response.ok) {
          throw new Error(`Erro na API: ${response.statusText}`);
        }

        const data: GeminiResponse = await response.json();
        const translation =
          data.candidates?.[0]?.content?.parts?.[0]?.text ??
          "Tradução não encontrada.";
        setTranslatedText(translation);
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Ocorreu um erro desconhecido."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { translate, translatedText, loading, error };
};
