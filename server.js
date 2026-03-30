import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const providers = [
  {
    name: 'komilov',
    enabled: !!process.env.GROQ_API_KEY,
    client: new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    }),
    model: 'llama-3.3-70b-versatile',
  },
  {
    name: 'openrouter',
    enabled: !!process.env.OPENROUTER_API_KEY,
    client: new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
    model: 'meta-llama/llama-3.3-70b-instruct:free',
  },
  {
    name: 'openai',
    enabled: !!process.env.OPENAI_API_KEY,
    client: new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }),
    model: 'gpt-4.1-mini',
  },
];

async function askProvider(provider, message) {
  const response = await provider.client.chat.completions.create({
    model: provider.model,
    messages: [
      {
        role: 'system',
        content:
          'You are Komilovs AI. Answer briefly, clearly, and helpfully in Uzbek unless the user asks another language.',
      },
      {
        role: 'user',
        content: message,
      },
    ],
    temperature: 0.7,
  });

  return response?.choices?.[0]?.message?.content || 'Javob kelmadi.';
}

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        ok: false,
        reply: 'Message yuborilmadi.',
      });
    }

    const activeProviders = providers.filter((item) => item.enabled);

    if (!activeProviders.length) {
      return res.status(500).json({
        ok: false,
        reply: 'API key topilmadi. .env faylni to‘ldiring.',
      });
    }

    let lastError = null;

    for (const provider of activeProviders) {
      try {
        const reply = await askProvider(provider, message);

        return res.json({
          ok: true,
          provider: provider.name,
          reply,
        });
      } catch (error) {
        lastError = error;
        console.error(`${provider.name} error:`, error?.message || error);
      }
    }

    return res.status(500).json({
      ok: false,
      reply: 'Hozir barcha AI servislar javob bermadi.',
      error: lastError?.message || 'Unknown error',
    });
  } catch (error) {
    console.error('Server error:', error?.message || error);

    return res.status(500).json({
      ok: false,
      reply: 'Serverda xatolik bo‘ldi.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server ishladi: http://localhost:${PORT}`);
});
