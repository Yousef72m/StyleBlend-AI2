import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: "50mb" }));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in the environment. Please add it in your project settings.");
  }
  
  const ai = new GoogleGenAI({ apiKey: apiKey || "" });

  // API Routes
  app.post("/api/analyze", async (req, res) => {
    try {
      if (!apiKey) {
         return res.status(500).json({ error: "Missing Gemini API Key. Please add GEMINI_API_KEY in your settings." });
      }
      
      const { base64Data, mimeType } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
               inlineData: {
                 data: base64Data,
                 mimeType: mimeType,
               }
            },
            {
              text: "Analyze this reference image. Describe in high detail the lighting, color palette, mood, composition, texture, and overall visual aesthetic. Your response will be used as a style prompt to adapt another image. Do not describe the specific object in the image, just the environmental and stylistic qualities.",
            }
          ]
        }
      });
      res.json({ text: response.text || "" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  app.post("/api/generate", async (req, res) => {
    try {
      if (!apiKey) {
         return res.status(500).json({ error: "Missing Gemini API Key. Please add GEMINI_API_KEY in your settings." });
      }

      const { base64Data, mimeType, intensity, styleDescription } = req.body;
      const modifier = intensity > 70 ? "Completely transform" : intensity > 40 ? "Adapt" : "Subtly adjust";
      
      const prompt = `${modifier} the lighting, background, and visual aesthetic of this product image to match the following style description. Retain the core structure and identity of the main product, but apply the style seamlessly. Style description: ${styleDescription}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      let resultImage = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          const outMimeType = part.inlineData.mimeType || 'image/jpeg';
          resultImage = `data:${outMimeType};base64,${base64EncodeString}`;
          break;
        }
      }
      
      res.json({ image: resultImage });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
