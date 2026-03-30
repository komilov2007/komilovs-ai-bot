import OpenAI from 'openai';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN topilmadi');
}
export default async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    message: "Bot route ishlayapti"
  });
}export default async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    message: "Bot route ishlayapti"
  });
}
const providers = [
  {
    name: 'groq',
    enabled: Boolean(process.env.GROQ_API_KEY),
    model: 'llama-3.3-70b-versatile',
    client: process.env.GROQ_API_KEY
      ? new OpenAI({
          apiKey: process.env.GROQ_API_KEY,
          baseURL: 'https://api.groq.com/openai/v1',
        })
      : null,
  },
  {
    name: 'openrouter',
    enabled: Boolean(process.env.OPENROUTER_API_KEY),
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    client: process.env.OPENROUTER_API_KEY
      ? new OpenAI({
          apiKey: process.env.OPENROUTER_API_KEY,
          baseURL: 'https://openrouter.ai/api/v1',
        })
      : null,
  },
  {
    name: 'openai',
    enabled: Boolean(process.env.OPENAI_API_KEY),
    model: 'gpt-4.1-mini',
    client: process.env.OPENAI_API_KEY
      ? new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        })
      : null,
  },
].filter((item) => item.enabled);

async function telegram(method, body) {
  const res = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();

  if (!data.ok) {
    throw new Error(data.description || 'Telegram API error');
  }

  return data;
}

async function sendMessage(chatId, text) {
  return telegram('sendMessage', {
    chat_id: chatId,
    text,
  });
}

async function sendTyping(chatId) {
  return telegram('sendChatAction', {
    chat_id: chatId,
    action: 'typing',
  });
}

async function askAI(userText) {
  if (!providers.length) {
    return {
      reply:
        'AI API key topilmadi. Vercel ichida TELEGRAM_BOT_TOKEN va kamida bitta AI key qo‘ying.',
      provider: 'none',
    };
  }

  let lastError = null;

  for (const provider of providers) {
    try {
      const response = await provider.client.chat.completions.create({
        model: provider.model,
        messages: [
          {
            role: 'system',
            content:
              'Siz Komilovs AI botsiz. Foydalanuvchiga asosan o‘zbek tilida aniq, foydali, sodda va qisqa javob bering. Kod so‘ralsa ishlaydigan toza kod yozing.',
          },
          {
            role: 'user',
            content: userText,
          },
        ],
        temperature: 0.7,
      });

      const text = response?.choices?.[0]?.message?.content?.trim();

      if (!text) {
        throw new Error(`${provider.name} bo‘sh javob qaytardi`);
      }

      return {
        reply: text,
        provider: provider.name,
      };
    } catch (error) {
      lastError = error;
      console.error(`${provider.name} error:`, error?.message || error);
    }
  }

  return {
    reply: 'Hozircha AI javob bermadi. Keyinroq yana urinib ko‘ring.',
    provider: lastError?.message || 'unknown',
  };
}

async function handleCommand(chatId, text) {
  if (text === '/start') {
    await sendMessage(
      chatId,
      `Salom 👋

Men Komilovs AI botman.

Buyruqlar:
/start - botni ishga tushirish
/help - yordam
/about - bot haqida

Savol, kod, tarjima yoki idea yozing.`
    );
    return true;
  }

  if (text === '/help') {
    await sendMessage(
      chatId,
      `Foydalanish oson:

1. Menga xabar yozing
2. Men AI orqali javob beraman

Misollar:
- React hook yozib ber
- Telegram bot qanday qilinadi
- Inglizchaga tarjima qil
- Tailwind card yozib ber`
    );
    return true;
  }

  if (text === '/about') {
    await sendMessage(
      chatId,
      `Komilovs AI — Telegram ichidagi AI yordamchi bot.

Imkoniyatlari:
- savol-javob
- kod yozish
- tarjima
- tushuntirish`
    );
    return true;
  }

  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({
      ok: true,
      message: 'Bot route ishlayapti',
    });
  }

  try {
    const update = req.body;

    if (!update?.message?.text) {
      return res.status(200).json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();

    const isCommand = await handleCommand(chatId, text);

    if (isCommand) {
      return res.status(200).json({ ok: true });
    }

    await sendTyping(chatId);

    const { reply, provider } = await askAI(text);

    await sendMessage(chatId, `${reply}\n\n— ${provider.toUpperCase()}`);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error?.message || error);

    return res.status(200).json({
      ok: true,
      handled: false,
    });
  }
}
