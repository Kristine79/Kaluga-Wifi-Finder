import TelegramBot from "node-telegram-bot-api";
import { SEED_SPOTS, WifiSpot, WifiCategory, WifiSpeed } from "./spots-data";

const CATEGORY_EMOJI: Record<WifiCategory | string, string> = {
  cafe: "☕",
  restaurant: "🍽️",
  bar: "🍺",
  hotel: "🏨",
  library: "📚",
  gym: "💪",
  mall: "🛍️",
  other: "📡",
};

const SPEED_LABEL: Record<WifiSpeed | string, string> = {
  slow: "Медленный 🐢",
  moderate: "Средний ⚡",
  fast: "Быстрый 🚀",
  ultra_fast: "Очень быстрый 🚀🚀",
};

const CATEGORY_NAME: Record<string, string> = {
  cafe: "Кофейни и кафе ☕",
  restaurant: "Рестораны 🍽️",
  bar: "Бары 🍺",
  hotel: "Отели 🏨",
  library: "Библиотеки 📚",
  gym: "Спортзалы 💪",
  mall: "Торговые центры 🛍️",
};

export let botSpots: WifiSpot[] = [...SEED_SPOTS];

export function addSpotToBot(spot: WifiSpot) {
  botSpots.unshift(spot);
}

function formatSpot(spot: WifiSpot): string {
  const emoji = CATEGORY_EMOJI[spot.category] || "📡";
  const status = spot.isOutdated
    ? "⚠️ Устаревшее"
    : spot.verified
      ? "✅ Проверено"
      : "🔄 Не проверено";
  const password = spot.password ? `\`${spot.password}\`` : "_Открытая сеть_";

  return (
    `${emoji} *${escapeMarkdown(spot.name)}*\n` +
    `📍 ${escapeMarkdown(spot.address)}\n` +
    `📶 Сеть: \`${spot.ssid}\`\n` +
    `🔑 Пароль: ${password}\n` +
    `⚡ Скорость: ${SPEED_LABEL[spot.speed] || spot.speed}\n` +
    `${status} · 👍 ${spot.upvotes} · 👎 ${spot.downvotes}`
  );
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}

function sendLongMessage(
  bot: TelegramBot,
  chatId: number,
  items: string[],
  header: string
) {
  const SEPARATOR = "\n\n─────────────────\n\n";
  const MAX_LEN = 4000;

  let currentBatch = header + "\n\n";
  let isFirst = true;

  for (const item of items) {
    const addition = isFirst ? item : SEPARATOR + item;
    if (currentBatch.length + addition.length > MAX_LEN) {
      bot.sendMessage(chatId, currentBatch, { parse_mode: "Markdown" });
      currentBatch = item;
      isFirst = false;
    } else {
      currentBatch += addition;
      isFirst = false;
    }
  }

  if (currentBatch) {
    bot.sendMessage(chatId, currentBatch, { parse_mode: "Markdown" });
  }
}

export function createTelegramBot(token: string): TelegramBot {
  const bot = new TelegramBot(token, { polling: true });

  bot.onText(/\/start/, msg => {
    bot.sendMessage(
      msg.chat.id,
      `👋 Привет\\! Я бот *Wi\\-Fi Калуга* — помогаю найти точки бесплатного Wi\\-Fi в Калуге\\.\n\n` +
        `*Команды:*\n` +
        `🔍 /поиск \\[название\\] — поиск по названию\n` +
        `📋 /список — все точки\n` +
        `☕ /кафе — кофейни и кафе\n` +
        `🍽️ /рестораны — рестораны\n` +
        `🍺 /бары — бары\n` +
        `📚 /библиотеки — библиотеки\n` +
        `🛍️ /тц — торговые центры\n` +
        `🏨 /отели — отели\n` +
        `💪 /спорт — спортзалы\n` +
        `✅ /проверенные — только проверенные\n` +
        `ℹ️ /помощь — справка`,
      { parse_mode: "MarkdownV2" }
    );
  });

  bot.onText(/\/помощь|\/help/, msg => {
    bot.sendMessage(
      msg.chat.id,
      `*Wi\\-Fi Калуга — справка*\n\n` +
        `Используйте команды для поиска Wi\\-Fi:\n\n` +
        `🔍 /поиск McDonald — найти по названию\n` +
        `📋 /список — список всех точек\n` +
        `☕ /кафе · 🍽️ /рестораны · 🍺 /бары\n` +
        `📚 /библиотеки · 🛍️ /тц · 🏨 /отели · 💪 /спорт\n` +
        `✅ /проверенные — подтверждённые пользователями\n\n` +
        `_Данные краудсорсинговые\\. Для добавления точек используйте веб\\-приложение\\._`,
      { parse_mode: "MarkdownV2" }
    );
  });

  bot.onText(/\/список/, msg => {
    const chatId = msg.chat.id;
    const items = botSpots.slice(0, 15).map((s, i) => {
      const emoji = CATEGORY_EMOJI[s.category] || "📡";
      const status = s.verified ? "✅" : "🔄";
      return `${i + 1}\\. ${emoji} ${status} *${escapeMarkdown(s.name)}*\n    📍 ${escapeMarkdown(s.address)}`;
    });

    bot.sendMessage(
      chatId,
      `📋 *Wi\\-Fi точки Калуги \\(${botSpots.length} всего\\):*\n\n` +
        items.join("\n\n") +
        `\n\n_Используйте /поиск для детального поиска_`,
      { parse_mode: "MarkdownV2" }
    );
  });

  bot.onText(/\/поиск(?:\s+(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const query = match?.[1]?.trim().toLowerCase();

    if (!query) {
      bot.sendMessage(chatId, "🔍 Введите название после команды:\n/поиск McDonald");
      return;
    }

    const results = botSpots.filter(
      s =>
        s.name.toLowerCase().includes(query) ||
        s.address.toLowerCase().includes(query) ||
        s.ssid.toLowerCase().includes(query)
    );

    if (results.length === 0) {
      bot.sendMessage(
        chatId,
        `❌ По запросу "${query}" ничего не найдено.\n\nПопробуйте другой запрос или используйте /список`
      );
      return;
    }

    const items = results.slice(0, 5).map(s => formatSpot(s));
    sendLongMessage(bot, chatId, items, `🔍 *Результаты поиска "${query}" (${results.length}):*`);
  });

  const categoryHandlers: Array<[RegExp, WifiCategory]> = [
    [/\/кафе/, "cafe"],
    [/\/рестораны/, "restaurant"],
    [/\/бары/, "bar"],
    [/\/отели/, "hotel"],
    [/\/библиотеки/, "library"],
    [/\/спорт/, "gym"],
    [/\/тц/, "mall"],
  ];

  for (const [pattern, category] of categoryHandlers) {
    bot.onText(pattern, msg => {
      const chatId = msg.chat.id;
      const results = botSpots.filter(s => s.category === category);

      if (results.length === 0) {
        bot.sendMessage(chatId, `По этой категории точек не найдено.`);
        return;
      }

      const items = results.map(s => formatSpot(s));
      sendLongMessage(
        bot,
        chatId,
        items,
        `*${CATEGORY_NAME[category]} (${results.length}):*`
      );
    });
  }

  bot.onText(/\/проверенные/, msg => {
    const chatId = msg.chat.id;
    const results = botSpots.filter(s => s.verified && !s.isOutdated);

    if (results.length === 0) {
      bot.sendMessage(chatId, "Проверенных точек пока нет.");
      return;
    }

    const items = results.slice(0, 10).map(s => formatSpot(s));
    sendLongMessage(
      bot,
      chatId,
      items,
      `✅ *Проверенные точки (${results.length}):*`
    );
  });

  bot.on("message", msg => {
    if (!msg.text?.startsWith("/")) return;
    const known = [
      "/start",
      "/помощь",
      "/help",
      "/список",
      "/поиск",
      "/кафе",
      "/рестораны",
      "/бары",
      "/отели",
      "/библиотеки",
      "/спорт",
      "/тц",
      "/проверенные",
    ];
    const cmd = msg.text.split(" ")[0].toLowerCase();
    if (!known.some(k => cmd === k || cmd.startsWith(k + "@"))) {
      bot.sendMessage(
        msg.chat.id,
        `Неизвестная команда. Используйте /помощь для списка команд.`
      );
    }
  });

  bot.on("polling_error", error => {
    console.error("[TelegramBot] Polling error:", (error as any).message || error);
  });

  console.log("[TelegramBot] Bot started successfully");
  return bot;
}
