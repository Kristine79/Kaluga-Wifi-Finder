export type Language = "ru" | "en";

const translations = {
  ru: {
    tabs: {
      map: "Карта",
      list: "Список",
      settings: "Настройки",
    },

    map: {
      searchPlaceholder: "Поиск Wi-Fi точек...",
      spots: "точек",
      loadingMap: "Загрузка карты...",
      details: "Подробнее →",
      openNetwork: "🔓 Открытая сеть",
      network: "СЕТЬ",
      verified: "Проверено",
      unverified: "Не проверено",
      outdated: "Устарело",
    },

    list: {
      searchPlaceholder: "Поиск по названию, адресу, сети...",
      all: "Все",
      favorites: "Избранное",
      verified: "Проверено",
      noResults: "Ничего не найдено",
      noResultsSub: "Попробуйте другой запрос или фильтр",
      noSpots: "Пока нет Wi-Fi точек",
      noSpotsSub: "Добавьте первую точку!",
      addSpot: "Добавить точку",
      spots: "точек",
      open: "Открытая",
    },

    categories: {
      all: "Все",
      cafe: "Кафе",
      restaurant: "Ресторан",
      bar: "Бар",
      hotel: "Отель",
      library: "Библиотека",
      gym: "Спортзал",
      mall: "ТЦ",
      other: "Другое",
    },

    categoryShort: {
      all: "Все",
      cafe: "Кафе",
      restaurant: "Еда",
      bar: "Бары",
      hotel: "Отели",
      library: "Библ.",
      gym: "Спорт",
      mall: "ТЦ",
      other: "Другое",
    },

    speed: {
      slow: "Медленный",
      slowShort: "Медл.",
      moderate: "Средний",
      moderateShort: "Средн.",
      fast: "Быстрый",
      fastShort: "Быстр.",
      ultra_fast: "Ультра быстрый",
      ultra_fastShort: "Ультра",
    },

    spot: {
      notFound: "Точка не найдена",
      back: "Назад",
      connection: "ПОДКЛЮЧЕНИЕ",
      network: "Сеть",
      password: "Пароль",
      noPassword: "Без пароля",
      copy: "Скопировать",
      copied: "Скопировано!",
      votes: "ГОЛОСА",
      upvote: "Точная информация",
      downvote: "Неверная",
      reportTitle: "Отметить как устаревшее",
      reportMsg: "Вы хотите сообщить, что информация об этой точке устарела?",
      reportConfirm: "Да, сообщить",
      cancel: "Отмена",
      addedBy: "Добавлено",
      yourSpot: "Вами",
      community: "Сообщество",
    },

    add: {
      title: "Добавить Wi-Fi",
      done: "Готово",
      saving: "...",
      basic: "ОСНОВНОЕ",
      wifiSection: "WI-FI",
      categorySection: "КАТЕГОРИЯ",
      speedSection: "СКОРОСТЬ",
      namePlaceholder: "Название заведения",
      addressPlaceholder: "Адрес (необязательно)",
      ssidPlaceholder: "Название сети (SSID)",
      passwordPlaceholder: "Пароль",
      openNetwork: "Открытая сеть (без пароля)",
      hasPassword: "Есть пароль",
      errorTitle: "Ошибка",
      errorName: "Введите название заведения",
      errorSsid: "Введите название сети (SSID)",
    },

    faq: {
      title: "Справка",
      sections: [
        {
          title: "Основы",
          items: [
            {
              q: "Что такое Wi-Fi Калуга?",
              a: "Краудсорсинговое приложение для поиска Wi-Fi точек в Калуге. Все точки добавляются самими пользователями — кафе, рестораны, библиотеки, торговые центры и другие заведения.",
            },
            {
              q: "Как найти ближайшую Wi-Fi точку?",
              a: "Откройте вкладку «Карта» — все доступные точки отображаются на карте. Нажмите на маркер, чтобы увидеть название сети и пароль. В вкладке «Список» можно искать по названию, адресу или сети.",
            },
            {
              q: "Как скопировать пароль?",
              a: "Нажмите на точку на карте или в списке, чтобы открыть её детали. Затем нажмите кнопку «Скопировать» рядом с паролем — он будет добавлен в буфер обмена.",
            },
          ],
        },
        {
          title: "Добавление точек",
          items: [
            {
              q: "Как добавить новую Wi-Fi точку?",
              a: "Нажмите кнопку «+» на карте или в списке. Заполните название заведения, адрес (необязательно), название сети (SSID) и пароль. Выберите категорию и примерную скорость — нажмите «Готово».",
            },
            {
              q: "Что значит «Проверено»?",
              a: "Точка считается проверенной, если набирает 5 или более голосов «Точная информация» от других пользователей. Проверенные точки отображаются зелёным маркером на карте.",
            },
            {
              q: "Что значит «Устарело»?",
              a: "Пользователи могут отметить точку как устаревшую, если сеть больше не работает или пароль изменился. Такие точки отображаются жёлтым маркером.",
            },
          ],
        },
        {
          title: "Голосование",
          items: [
            {
              q: "Как проголосовать за точку?",
              a: "Откройте детали точки и нажмите кнопку «Точная информация» (палец вверх) если сеть работает и пароль верный, или «Неверная» (палец вниз) если информация устарела.",
            },
            {
              q: "Как сообщить об устаревшей информации?",
              a: "В деталях точки нажмите кнопку с флажком в правом верхнем углу. Подтвердите репорт — точка будет помечена как устаревшая.",
            },
          ],
        },
        {
          title: "Настройки и приватность",
          items: [
            {
              q: "Собираются ли мои данные?",
              a: "Нет. Приложение не собирает никаких персональных данных. Добавленные Wi-Fi точки хранятся анонимно. Избранное и настройки хранятся только на вашем устройстве.",
            },
            {
              q: "Как изменить язык интерфейса?",
              a: "Перейдите в «Настройки» → раздел «Язык» и выберите 🇷🇺 Русский или 🇬🇧 English. Язык меняется мгновенно.",
            },
            {
              q: "Как изменить тему оформления?",
              a: "В разделе «Внешний вид» в настройках выберите один из вариантов: Системная (следует теме устройства), Светлая, Тёмная или OLED (чистый чёрный фон для AMOLED-экранов).",
            },
          ],
        },
      ],
    },

    settings: {
      title: "Настройки",
      appearance: "ВНЕШНИЙ ВИД",
      map: "КАРТА",
      general: "ОБЩИЕ",
      myContributions: "МОИ ВКЛАДЫ",
      language: "ЯЗЫК",
      about: "О ПРИЛОЖЕНИИ",

      themeSystem: "Системная",
      themeLight: "Светлая",
      themeDark: "Тёмная",
      themeOled: "OLED",

      verifiedOnly: "Только проверенные",
      verifiedOnlySub: "Показывать точки с 5+ голосами",
      distanceUnits: "Единицы расстояния",
      distanceUnitsSub: "Километры или мили",
      autoOpen: "Авто-открытие Wi-Fi",
      autoOpenSub: "Показывать детали при переходе с карты",
      haptic: "Тактильный отклик",
      hapticSub: "Вибрация при нажатиях",
      categoryFilter: "Фильтр категорий",
      categoryFilterSub: "Показывать чипы на карте и в списке",

      langRu: "Русский",
      langEn: "English",

      faqSub: "Вопросы и ответы о приложении",

      statSpotsAdded: "Точек добавлено",
      statVotes: "Голосов отдано",
      statReports: "Репортов",
      statSpeedTests: "Тестов скорости",

      aboutTitle: "Wi-Fi Калуга",
      aboutText: "Краудсорсинговое приложение для поиска Wi-Fi точек в Калуге. Никаких данных не собирается. Делитесь паролями, помогайте сообществу.",
      version: "Версия 1.0.0",
    },
  },

  en: {
    tabs: {
      map: "Map",
      list: "List",
      settings: "Settings",
    },

    map: {
      searchPlaceholder: "Search Wi-Fi spots...",
      spots: "spots",
      loadingMap: "Loading map...",
      details: "Details →",
      openNetwork: "🔓 Open network",
      network: "NETWORK",
      verified: "Verified",
      unverified: "Unverified",
      outdated: "Outdated",
    },

    list: {
      searchPlaceholder: "Search by name, address, network...",
      all: "All",
      favorites: "Favorites",
      verified: "Verified",
      noResults: "Nothing found",
      noResultsSub: "Try a different query or filter",
      noSpots: "No Wi-Fi spots yet",
      noSpotsSub: "Add the first spot!",
      addSpot: "Add spot",
      spots: "spots",
      open: "Open",
    },

    categories: {
      all: "All",
      cafe: "Cafe",
      restaurant: "Restaurant",
      bar: "Bar",
      hotel: "Hotel",
      library: "Library",
      gym: "Gym",
      mall: "Mall",
      other: "Other",
    },

    categoryShort: {
      all: "All",
      cafe: "Cafe",
      restaurant: "Food",
      bar: "Bars",
      hotel: "Hotels",
      library: "Library",
      gym: "Gym",
      mall: "Mall",
      other: "Other",
    },

    speed: {
      slow: "Slow",
      slowShort: "Slow",
      moderate: "Moderate",
      moderateShort: "Mod.",
      fast: "Fast",
      fastShort: "Fast",
      ultra_fast: "Ultra fast",
      ultra_fastShort: "Ultra",
    },

    spot: {
      notFound: "Spot not found",
      back: "Back",
      connection: "CONNECTION",
      network: "Network",
      password: "Password",
      noPassword: "No password",
      copy: "Copy",
      copied: "Copied!",
      votes: "VOTES",
      upvote: "Accurate info",
      downvote: "Incorrect",
      reportTitle: "Mark as outdated",
      reportMsg: "Do you want to report that the information about this spot is outdated?",
      reportConfirm: "Yes, report",
      cancel: "Cancel",
      addedBy: "Added by",
      yourSpot: "You",
      community: "Community",
    },

    add: {
      title: "Add Wi-Fi",
      done: "Done",
      saving: "...",
      basic: "BASIC INFO",
      wifiSection: "WI-FI",
      categorySection: "CATEGORY",
      speedSection: "SPEED",
      namePlaceholder: "Place name",
      addressPlaceholder: "Address (optional)",
      ssidPlaceholder: "Network name (SSID)",
      passwordPlaceholder: "Password",
      openNetwork: "Open network (no password)",
      hasPassword: "Has password",
      errorTitle: "Error",
      errorName: "Enter the place name",
      errorSsid: "Enter the network name (SSID)",
    },

    faq: {
      title: "Help",
      sections: [
        {
          title: "Basics",
          items: [
            {
              q: "What is Wi-Fi Kaluga?",
              a: "A crowdsourced app for finding Wi-Fi spots in Kaluga. All spots are added by users — cafes, restaurants, libraries, shopping centres and other venues.",
            },
            {
              q: "How do I find a nearby Wi-Fi spot?",
              a: "Open the Map tab — all available spots are shown on the map. Tap a marker to see the network name and password. In the List tab you can search by name, address or network.",
            },
            {
              q: "How do I copy a password?",
              a: "Tap a spot on the map or in the list to open its details. Then press the Copy button next to the password — it will be added to your clipboard.",
            },
          ],
        },
        {
          title: "Adding spots",
          items: [
            {
              q: "How do I add a new Wi-Fi spot?",
              a: "Press the «+» button on the map or in the list. Fill in the place name, address (optional), network name (SSID) and password. Choose a category and approximate speed, then press Done.",
            },
            {
              q: "What does «Verified» mean?",
              a: "A spot is considered verified when it receives 5 or more «Accurate info» votes from other users. Verified spots appear with a green marker on the map.",
            },
            {
              q: "What does «Outdated» mean?",
              a: "Users can mark a spot as outdated if the network no longer works or the password has changed. Outdated spots appear with a yellow marker.",
            },
          ],
        },
        {
          title: "Voting",
          items: [
            {
              q: "How do I vote for a spot?",
              a: "Open the spot details and press «Accurate info» (thumbs up) if the network works and the password is correct, or «Incorrect» (thumbs down) if the information is wrong.",
            },
            {
              q: "How do I report outdated information?",
              a: "In the spot details press the flag button in the top right corner. Confirm the report — the spot will be marked as outdated.",
            },
          ],
        },
        {
          title: "Settings & privacy",
          items: [
            {
              q: "Is my data collected?",
              a: "No. The app does not collect any personal data. Added Wi-Fi spots are stored anonymously. Favourites and settings are stored only on your device.",
            },
            {
              q: "How do I change the interface language?",
              a: "Go to Settings → Language section and choose 🇷🇺 Русский or 🇬🇧 English. The language changes instantly.",
            },
            {
              q: "How do I change the theme?",
              a: "In the Appearance section in Settings choose one of: System (follows device theme), Light, Dark or OLED (pure black background for AMOLED screens).",
            },
          ],
        },
      ],
    },

    settings: {
      title: "Settings",
      appearance: "APPEARANCE",
      map: "MAP",
      general: "GENERAL",
      myContributions: "MY CONTRIBUTIONS",
      language: "LANGUAGE",
      about: "ABOUT",

      themeSystem: "System",
      themeLight: "Light",
      themeDark: "Dark",
      themeOled: "OLED",

      verifiedOnly: "Verified only",
      verifiedOnlySub: "Show spots with 5+ votes",
      distanceUnits: "Distance units",
      distanceUnitsSub: "Kilometres or miles",
      autoOpen: "Auto-open Wi-Fi",
      autoOpenSub: "Show details when switching from map",
      haptic: "Haptic feedback",
      hapticSub: "Vibration on press",
      categoryFilter: "Category filter",
      categoryFilterSub: "Show chips on map and in list",

      langRu: "Русский",
      langEn: "English",

      faqSub: "Questions and answers about the app",

      statSpotsAdded: "Spots added",
      statVotes: "Votes cast",
      statReports: "Reports filed",
      statSpeedTests: "Speed tests",

      aboutTitle: "Wi-Fi Kaluga",
      aboutText: "A crowdsourced app for finding Wi-Fi spots in Kaluga. No data is collected. Share passwords, help the community.",
      version: "Version 1.0.0",
    },
  },
} as const;

export type Translations = typeof translations.ru;
export default translations;
