// import dotenv from 'dotenv';
// import TelegramBot from 'node-telegram-bot-api';
// import OpenAI from 'openai';
// import fs from 'fs';

// const USERS_FILE = 'users.json';

// function saveUser(userId) {
//   let users = [];

//   if (fs.existsSync(USERS_FILE)) {
//     users = JSON.parse(fs.readFileSync(USERS_FILE));
//   }

//   if (!users.includes(userId)) {
//     users.push(userId);
//     fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
//   }
// }
// dotenv.config();
// bot.on('message', (msg) => {
//   const chatId = msg.chat.id;

//   saveUser(chatId);
// });
// const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// if (!TELEGRAM_BOT_TOKEN) {
//   console.error('TELEGRAM_BOT_TOKEN topilmadi');
//   process.exit(1);
// }

// const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// const providers = [
//   {
//     name: "komilov's ai",
//     enabled: Boolean(process.env.GROQ_API_KEY),
//     model: 'llama-3.3-70b-versatile',
//     client: new OpenAI({
//       apiKey: process.env.GROQ_API_KEY,
//       baseURL: 'https://api.groq.com/openai/v1',
//     }),
//   },
//   {
//     name: 'openrouter',
//     enabled: Boolean(process.env.OPENROUTER_API_KEY),
//     model: 'meta-llama/llama-3.3-70b-instruct:free',
//     client: new OpenAI({
//       apiKey: process.env.OPENROUTER_API_KEY,
//       baseURL: 'https://openrouter.ai/api/v1',
//     }),
//   },
//   {
//     name: 'openai',
//     enabled: Boolean(process.env.OPENAI_API_KEY),
//     model: 'gpt-4.1-mini',
//     client: new OpenAI({
//       apiKey: process.env.OPENAI_API_KEY,
//     }),
//   },
// ];

// const activeProviders = providers.filter((item) => item.enabled);

// if (!activeProviders.length) {
//   console.error('Hech qanday API key topilmadi. .env faylni to‘ldiring.');
//   process.exit(1);
// }

// const userSessions = new Map();
// const userLocks = new Map();

// function getUserHistory(chatId) {
//   if (!userSessions.has(chatId)) {
//     userSessions.set(chatId, []);
//   }
//   return userSessions.get(chatId);
// }

// function pushMessage(chatId, role, content) {
//   const history = getUserHistory(chatId);
//   history.push({ role, content });

//   if (history.length > 12) {
//     history.splice(0, history.length - 12);
//   }

//   userSessions.set(chatId, history);
// }

// async function askProvider(provider, chatId, userText) {
//   const history = getUserHistory(chatId);

//   const messages = [
//     {
//       role: 'system',
//       content:
//         'Siz Komilovs AI siz. Foydalanuvchiga asosan o‘zbek tilida qisqa, aniq, foydali va tushunarli javob bering. Agar foydalanuvchi boshqa tilda yozsa, o‘sha tilda javob bering. Kod so‘rasa toza va ishlaydigan kod yozing.',
//     },
//     ...history,
//     {
//       role: 'user',
//       content: userText,
//     },
//   ];

//   const response = await provider.client.chat.completions.create({
//     model: provider.model,
//     messages,
//     temperature: 0.7,
//   });

//   const text = response?.choices?.[0]?.message?.content?.trim();

//   if (!text) {
//     throw new Error(`${provider.name} javob qaytarmadi`);
//   }

//   return text;
// }

// async function generateReply(chatId, userText) {
//   let lastError = null;

//   for (const provider of activeProviders) {
//     try {
//       const reply = await askProvider(provider, chatId, userText);
//       return { reply, provider: provider.name };
//     } catch (error) {
//       lastError = error;
//       console.error(`[${provider.name}]`, error?.message || error);
//     }
//   }

//   throw new Error(lastError?.message || 'Barcha providerlar ishlamadi');
// }

// bot.onText(/\/start/, async (msg) => {
//   const chatId = msg.chat.id;

//   const text = `
// Assalomu alekum 👨‍🎓
// Men Komilovs AI botman.

// Menga oddiy savol, kod, tarjima, idea yoki dars bo‘yicha savol yuborishingiz mumkin.

//   `.trim();

//   await bot.sendMessage(chatId, text);
// });

// bot.onText(/\/help/, async (msg) => {
//   const chatId = msg.chat.id;

//   const text = `
// Botdan foydalanish oson:

// 1) Menga xabar yozing
// 2) Men AI orqali javob beraman
// 3) Bitta servis ishlamasa, boshqasiga o‘taman

// Buyruqlar:
// /start
// /new
// /help
//   `.trim();

//   await bot.sendMessage(chatId, text);
// });

// bot.onText(/\/new/, async (msg) => {
//   const chatId = msg.chat.id;
//   userSessions.set(chatId, []);
//   await bot.sendMessage(chatId, 'Yangi chat boshlandi ✅');
// });

// bot.on('message', async (msg) => {
//   const chatId = msg.chat.id;
//   const text = msg.text;

//   if (!text) return;
//   if (text.startsWith('/start')) return;
//   if (text.startsWith('/help')) return;
//   if (text.startsWith('/new')) return;

//   if (userLocks.get(chatId)) {
//     await bot.sendMessage(
//       chatId,
//       'Oldingi savolga javob tayyorlanmoqda. Bir oz kutib turing.'
//     );
//     return;
//   }

//   userLocks.set(chatId, true);

//   try {
//     await bot.sendChatAction(chatId, 'typing');

//     pushMessage(chatId, 'user', text);

//     const { reply, provider } = await generateReply(chatId, text);

//     pushMessage(chatId, 'assistant', reply);

//     const finalText = `${reply}\n\n— ${provider.toUpperCase()}`;
//     await bot.sendMessage(chatId, finalText);
//   } catch (error) {
//     console.error('Bot error:', error?.message || error);

//     await bot.sendMessage(
//       chatId,
//       'Hozircha javob olib bo‘lmadi. Keyinroq yana urinib ko‘ring.'
//     );
//   } finally {
//     userLocks.set(chatId, false);
//   }
// });

// console.log('Komilovs AI Telegram bot ishga tushdi ✅');
import dotenv from 'dotenv';
import fs from 'fs';
import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';

dotenv.config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_IDS || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean)
  .map(Number);

const USERS_FILE = 'users.json';

if (!TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN topilmadi');
  process.exit(1);
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const providers = [
  {
    name: 'groq',
    enabled: Boolean(process.env.GROQ_API_KEY),
    model: 'llama-3.3-70b-versatile',
    client: new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    }),
  },
  {
    name: 'openrouter',
    enabled: Boolean(process.env.OPENROUTER_API_KEY),
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    client: new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    }),
  },
  {
    name: 'openai',
    enabled: Boolean(process.env.OPENAI_API_KEY),
    model: 'gpt-4.1-mini',
    client: new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  },
];

const activeProviders = providers.filter((item) => item.enabled);

if (!activeProviders.length) {
  console.error('Hech bo‘lmasa bitta API key kerak');
  process.exit(1);
}

const userSessions = new Map();
const userLocks = new Map();

function isAdmin(userId) {
  return ADMIN_IDS.includes(userId);
}

function readUsers() {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function saveUser(msg) {
  const users = readUsers();

  const userData = {
    chatId: msg.chat.id,
    userId: msg.from?.id || null,
    firstName: msg.from?.first_name || '',
    lastName: msg.from?.last_name || '',
    username: msg.from?.username || '',
    isBot: msg.from?.is_bot || false,
    date: new Date().toISOString(),
  };

  const exists = users.some((user) => user.chatId === userData.chatId);

  if (!exists) {
    users.push(userData);
    writeUsers(users);
  }
}

function getUserHistory(chatId) {
  if (!userSessions.has(chatId)) {
    userSessions.set(chatId, []);
  }
  return userSessions.get(chatId);
}

function pushMessage(chatId, role, content) {
  const history = getUserHistory(chatId);
  history.push({ role, content });

  if (history.length > 12) {
    history.splice(0, history.length - 12);
  }

  userSessions.set(chatId, history);
}

async function askProvider(provider, chatId, userText) {
  const history = getUserHistory(chatId);

  const messages = [
    {
      role: 'system',
      content:
        'Siz Komilovs AI botsiz. Asosan o‘zbek tilida aniq, foydali, tushunarli javob bering. Kod so‘ralsa toza va ishlaydigan kod yozing. Juda uzun va keraksiz javob bermang.',
    },
    ...history,
    {
      role: 'user',
      content: userText,
    },
  ];

  const response = await provider.client.chat.completions.create({
    model: provider.model,
    messages,
    temperature: 0.7,
  });

  const text = response?.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error(`${provider.name} javob qaytarmadi`);
  }

  return text;
}

async function generateReply(chatId, userText) {
  let lastError = null;

  for (const provider of activeProviders) {
    try {
      const reply = await askProvider(provider, chatId, userText);
      return { reply, provider: provider.name };
    } catch (error) {
      lastError = error;
      console.error(`[${provider.name}]`, error?.message || error);
    }
  }

  throw new Error(lastError?.message || 'Barcha providerlar ishlamadi');
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  saveUser(msg);

  const text = `
Salom 👋
Men Komilovs AI botman.

Men quyidagilarda yordam bera olaman:
- savollarga javob
- kod yozish
- tarjima
- tushuntirish
- idea va maslahat

Buyruqlar:
/start - botni ishga tushirish
/help - yordam
/new - yangi chat
/about - bot haqida
  `.trim();

  await bot.sendMessage(chatId, text);
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  saveUser(msg);

  const text = `
Foydalanish juda oson:

1. Savolingizni yozing
2. Bot AI orqali javob beradi
3. Yangi suhbat kerak bo‘lsa /new bosing

Oddiy buyruqlar:
/start
/help
/new
/about
  `.trim();

  await bot.sendMessage(chatId, text);
});

bot.onText(/\/about/, async (msg) => {
  const chatId = msg.chat.id;
  saveUser(msg);

  const text = `
Komilovs AI — sun'iy intellekt yordamchi bot.

Imkoniyatlari:
- savol-javob
- kod yozish
- tarjima
- tushuntirish
- o‘qish va ishda yordam
  `.trim();

  await bot.sendMessage(chatId, text);
});

bot.onText(/\/new/, async (msg) => {
  const chatId = msg.chat.id;
  saveUser(msg);

  userSessions.set(chatId, []);
  await bot.sendMessage(chatId, 'Yangi chat boshlandi ✅');
});

bot.onText(/\/users/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    return bot.sendMessage(chatId, 'Bu buyruq faqat admin uchun.');
  }

  const users = readUsers();
  await bot.sendMessage(chatId, `Botdagi userlar soni: ${users.length}`);
});

bot.onText(/\/listusers/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    return bot.sendMessage(chatId, 'Bu buyruq faqat admin uchun.');
  }

  const users = readUsers();

  if (!users.length) {
    return bot.sendMessage(chatId, 'Hali userlar yo‘q.');
  }

  const text = users
    .map((user, index) => {
      return `${index + 1}. ID: ${user.chatId}
Name: ${user.firstName} ${user.lastName}
Username: ${user.username ? '@' + user.username : 'yo‘q'}
Sana: ${user.date}`;
    })
    .join('\n\n');

  const chunks = text.match(/[\s\S]{1,3500}/g) || [];

  for (const chunk of chunks) {
    await bot.sendMessage(chatId, chunk);
  }
});

bot.onText(/\/clearusers/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    return bot.sendMessage(chatId, 'Bu buyruq faqat admin uchun.');
  }

  writeUsers([]);
  await bot.sendMessage(chatId, 'Barcha userlar ro‘yxati tozalandi ✅');
});

bot.onText(/\/sendall (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  if (!isAdmin(userId)) {
    return bot.sendMessage(chatId, 'Bu buyruq faqat admin uchun.');
  }

  const messageText = match?.[1]?.trim();

  if (!messageText) {
    return bot.sendMessage(chatId, 'Yuboriladigan xabar yozilmagan.');
  }

  const users = readUsers();

  if (!users.length) {
    return bot.sendMessage(chatId, 'Userlar topilmadi.');
  }

  let success = 0;
  let failed = 0;

  for (const user of users) {
    try {
      await bot.sendMessage(user.chatId, messageText);
      success++;
    } catch (error) {
      failed++;
      console.error(
        `Xabar yuborilmadi: ${user.chatId}`,
        error?.message || error
      );
    }
  }

  await bot.sendMessage(
    chatId,
    `Broadcast tugadi ✅\n\nYuborildi: ${success}\nXato: ${failed}`
  );
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  saveUser(msg);

  if (!text) return;
  if (text.startsWith('/start')) return;
  if (text.startsWith('/help')) return;
  if (text.startsWith('/new')) return;
  if (text.startsWith('/about')) return;
  if (text.startsWith('/users')) return;
  if (text.startsWith('/listusers')) return;
  if (text.startsWith('/clearusers')) return;
  if (text.startsWith('/sendall')) return;

  if (userLocks.get(chatId)) {
    await bot.sendMessage(
      chatId,
      'Oldingi savolga javob tayyorlanmoqda. Biroz kuting.'
    );
    return;
  }

  userLocks.set(chatId, true);

  try {
    await bot.sendChatAction(chatId, 'typing');

    pushMessage(chatId, 'user', text);

    const { reply, provider } = await generateReply(chatId, text);

    pushMessage(chatId, 'assistant', reply);

    await bot.sendMessage(chatId, `${reply}\n\n— ${provider.toUpperCase()}`);
  } catch (error) {
    console.error('Bot error:', error?.message || error);

    await bot.sendMessage(
      chatId,
      'Hozircha javob olib bo‘lmadi. Keyinroq yana urinib ko‘ring.'
    );
  } finally {
    userLocks.set(chatId, false);
  }
});

console.log('Komilovs AI bot ishga tushdi ✅');
