// =========================================================================
// BARRACUDA GAME CORE — FULL TACTICAL MILITARY SIMULATOR v7
// (Multi-Phase FPV, Enhanced SIGINT, Random Events, Achievements, Save)
// =========================================================================

export const DOSSIER_LORE = [
  {
    stage: 0, threshold: 0.0,
    title: "TOP-SECRET DOSSIER // DEPLOYMENT",
    timestamp: "03:14:22Z // BLACK SEA SECTOR 4",
    text: "Автономный надводный дрон «БАРРАКУДА» развёрнут под штормовым прикрытием. Задача: проникнуть сквозь радарный купол противника и перехватить боевые журналы."
  },
  {
    stage: 1, threshold: 25.0,
    title: "INTERCEPT // ENEMY RADAR 142.85 MHz",
    timestamp: "03:18:05Z // SIGINT RECORDING",
    text: "Береговой радар противника фиксирует быструю цель со скоростью 44 узла. Карбоновый стелс-корпус рассеивает отражение. Оптический сканер в режиме поиска."
  },
  {
    stage: 2, threshold: 50.0,
    title: "DECRYPT // NAVAL SATELLITE UPLINK",
    timestamp: "03:22:40Z // CIPHER KEY: ARES-9",
    text: "Идёт дешифровка спутникового канала ударной группы. Перехвачены координаты патрульного корвета. Буфер телеметрии заполняется на 50%."
  },
  {
    stage: 3, threshold: 75.0,
    title: "CRITICAL // WARSHIP TARGET VECTOR",
    timestamp: "03:27:12Z // FLIR THERMAL LOCK",
    text: "Корвет класса «Адмирал» обнаружен на дистанции 6.8 км. Пусковые стапели готовы к развёртыванию ударных FPV-дронов."
  },
  {
    stage: 4, threshold: 100.0,
    title: "AUTHORIZED // KINETIC STRIKE PROTOCOL",
    timestamp: "03:31:00Z // WAR ROOM OVERRIDE",
    text: "Буфер на 100% мощности. Санкция на удар получена. Запустите FPV-штурм, преодолейте эшелон ПВО и нанесите точечный кинетический удар!"
  }
];

export const SECTOR_INFO = {
  'sector-1': { name: 'АНТОНОВСКИЙ МОСТ', mult: 1.0, weather: 'storm' },
  'sector-2': { name: 'КАХОВСКАЯ ГЭС', mult: 1.8, weather: 'night' },
  'sector-3': { name: 'ХЕРСОНСКИЙ ПОРТ', mult: 2.5, weather: 'sunset' },
  'sector-4': { name: 'ДЕЛЬТА ДНЕПРА', mult: 3.2, weather: 'dawn' },
  'sector-5': { name: 'КИНБУРНСКАЯ КОСА', mult: 4.0, weather: 'sunset', isShallow: true }
};

// =========================================================================
// ACHIEVEMENTS DEFINITION
// =========================================================================
export const ACHIEVEMENTS_DEF = [
  { id: 'first_click', name: 'ПЕРВЫЙ КОНТАКТ', desc: 'Совершите первый клик по дрону', icon: '👆' },
  { id: 'first_assault', name: 'КРЕЩЕНИЕ ОГНЁМ', desc: 'Завершите первый FPV-штурм', icon: '🚀' },
  { id: 'first_prestige', name: 'ЭЛИТНЫЙ ЧЕРТЁЖ', desc: 'Получите первый чертёж престижа', icon: '📐' },
  { id: 'crit_master', name: 'СНАЙПЕР', desc: 'Нанесите 50 критических ударов', icon: '🎯' },
  { id: 'millionaire', name: 'ВОЕННЫЙ МАГНАТ', desc: 'Накопите 100,000 кредитов', icon: '💰' },
  { id: 'data_hoarder', name: 'ПЕРЕХВАТЧИК', desc: 'Соберите 10,000 МБ суммарно', icon: '📡' },
  { id: 'fleet_admiral', name: 'АДМИРАЛ ФЛОТА', desc: 'Потопите 10 кораблей', icon: '⚓' },
  { id: 'perfect_launch', name: 'ИДЕАЛЬНЫЙ СТАРТ', desc: 'Совершите идеальный запуск FPV', icon: '✨' },
  { id: 'rank_s', name: 'РАНГ S', desc: 'Получите рейтинг S в штурме', icon: '🏆' },
  { id: 'hacker', name: 'КИБЕРВЗЛОМЩИК', desc: 'Взломайте 10 радиоканалов', icon: '💻' },
  { id: 'all_sectors', name: 'КАРТОГРАФ', desc: 'Посетите все 4 сектора', icon: '🗺️' },
  { id: 'overclock_5', name: 'ФОРСАЖ', desc: 'Используйте разгон 5 раз', icon: '⚡' },
  { id: 'survivor', name: 'ЖИВУЧИЙ', desc: 'Выживите 3 раза после потери жизни в FPV', icon: '🛡️' },
  { id: 'no_damage', name: 'ФАНТОМ', desc: 'Пройдите FPV-штурм без урона', icon: '👻' },
  { id: 'speed_demon', name: 'ДЕМОН СКОРОСТИ', desc: 'Завершите штурм менее чем за 10 секунд', icon: '⏱️' },
  { id: 'boss_slayer', name: 'УБИЙЦА БОССОВ', desc: 'Уничтожьте первый босс-корабль', icon: '👑' },
  { id: 'daily_complete', name: 'ДИСЦИПЛИНА', desc: 'Выполните все 3 ежедневных задания', icon: '📋' },
  { id: 'campaign_act1', name: 'ТЕНЬ ЗМЕИНОГО', desc: 'Завершите Акт I кампании', icon: '🏝️' },
  { id: 'campaign_act2', name: 'ПРОРЫВ БОНОВ', desc: 'Завершите Акт II кампании', icon: '⚓' },
  { id: 'campaign_act3', name: 'ПРИЗРАЧНЫЙ ФЛОТ', desc: 'Завершите Акт III кампании', icon: '🚢' },
  { id: 'campaign_act4', name: 'КОД: ЛЕВИАФАН', desc: 'Уничтожьте флагман Левиафан', icon: '💀' },
  { id: 'salvage_master', name: 'ИНЖЕНЕР ФЛОТА', desc: 'Скрафтите модуль в Ангаре', icon: '💠' },
  { id: 'sonar_scan', name: 'ГИДРОАКУСТИК', desc: 'Просканируйте дно сонаром бокового обзора', icon: '📡' },
  { id: 'vsa_drift', name: 'МОРСКОЙ ДРИФТЕР', desc: 'Выполните вираж в режиме VSA OFF', icon: '🌊' },
  { id: 'ai_terminal_hit', name: 'НЕЙРО-НАВЕДЕНИЕ', desc: 'Уничтожьте цель при РЭБ с помощью ИИ Jetson', icon: '🧠' },
  { id: 'underwater_siphon', name: 'ГЛУБИННЫЙ СИФОН', desc: 'Подключите микро-ROV к подводному кабелю', icon: '🔮' }
];

// =========================================================================
// NAVAL SHIP CLASSES & SCALING
// =========================================================================
export const ENEMY_SHIP_CLASSES = [
  { level: 1, name: 'Патрульный катер «Раптор»', hp: 3500, armor: 0.10, lootMult: 1.0, icon: '🚤' },
  { level: 2, name: 'Сторожевой катер «Гриф»', hp: 8000, armor: 0.15, lootMult: 1.2, icon: '🚤' },
  { level: 3, name: 'Бронекатер «Шмель»', hp: 18000, armor: 0.20, lootMult: 1.5, icon: '🚤' },
  { level: 4, name: 'МРК «Буян-М» (Калибр)', hp: 45000, armor: 0.30, lootMult: 2.0, icon: '🚢' },
  { level: 5, name: 'Ракетный корвет «Каракурт»', hp: 100000, armor: 0.40, lootMult: 3.5, icon: '🚢' },
  { level: 6, name: 'Корвет ПВО «Стерегущий»', hp: 250000, armor: 0.45, lootMult: 5.0, icon: '🚢' },
  { level: 7, name: 'СКР «Ладный»', hp: 550000, armor: 0.50, lootMult: 7.0, icon: '⚓' },
  { level: 8, name: 'Фрегат УРО «Адмирал Эссен»', hp: 1200000, armor: 0.60, lootMult: 10.0, icon: '⚓' },
  { level: 9, name: 'Фрегат ПВО «Адмирал Макаров»', hp: 2500000, armor: 0.65, lootMult: 15.0, icon: '⚓' },
  { level: 10, name: 'РК «Москва» [ГВАРДЕЙСКИЙ ФЛАГМАН]', hp: 6000000, armor: 0.75, lootMult: 30.0, icon: '👑' }
];

export function getEnemyShipData(level) {
  if (level <= ENEMY_SHIP_CLASSES.length) {
    return ENEMY_SHIP_CLASSES[level - 1];
  }
  const extra = level - ENEMY_SHIP_CLASSES.length;
  return {
    level,
    name: `Флагманский крейсер Тип-УРО (Ранг ${extra})`,
    hp: Math.floor(6000000 * Math.pow(1.65, extra)),
    armor: Math.min(0.85, 0.75 + extra * 0.02),
    lootMult: 30.0 + extra * 10.0,
    icon: '👑'
  };
}

// =========================================================================
// DRONE PROTOTYPES DEFINITION
// =========================================================================
export const DRONE_PROTOTYPES_DEF = {
  phantom: {
    id: 'phantom',
    name: 'BARRACUDA «PHANTOM»',
    role: 'Стелс-разведка и диверсии',
    desc: 'Корпус с пониженным радарным сечением. Увеличивает генерацию данных, снижает плотность ПВО.',
    badge: 'MK-1 // СТЕЛС',
    clickMult: 1.25,
    passiveMult: 1.0,
    dataGainMult: 1.5,
    fpvObstacleDensity: 0.6,
    fpvDamageMult: 1.0,
    fpvExtraLives: 0,
    rebTimeBonus: 8,
    costUSD: 0
  },
  strike: {
    id: 'strike',
    name: 'BARRACUDA «STRIKE»',
    role: 'Тяжёлый ударный ракетоносец',
    desc: 'Сдвоенные направляющие для FPV. Наносит сокрушительный урон кораблям и боссам.',
    badge: 'MK-2 // ШТУРМОВИК',
    clickMult: 1.6,
    passiveMult: 0.9,
    dataGainMult: 1.0,
    fpvObstacleDensity: 1.0,
    fpvDamageMult: 2.5,
    fpvExtraLives: 0,
    rebTimeBonus: 0,
    reqShips: 5,
    reqSalvage: { box: 5, chips: 4 },
    costUSD: 125000
  },
  aegis: {
    id: 'aegis',
    name: 'BARRACUDA «AEGIS»',
    role: 'Комплекс РЭБ и Роевой ИИ',
    desc: 'Оснащён куполом радиоэлектронного подавления и ведомым роем дронов сопровождения.',
    badge: 'MK-3 // ФЛАГМАН РЭБ',
    clickMult: 1.2,
    passiveMult: 2.2,
    dataGainMult: 1.3,
    fpvObstacleDensity: 0.85,
    fpvDamageMult: 1.5,
    fpvExtraLives: 2,
    rebTimeBonus: 15,
    reqShips: 12,
    reqSalvage: { box: 12, titanium: 15, aicore: 2 },
    costUSD: 550000
  },
  coaxial_vtol: {
    id: 'coaxial_vtol',
    name: 'BARRACUDA «COAXIAL-VTOL»',
    role: 'Соосный тяжелый ракетоносец прорыва',
    desc: 'Соосная двухмоторная схема с тандемной кумулятивной БЧ. Неуязвим к штормовому ветру и качке при взлете. +220% урон по броне кораблей.',
    badge: 'MK-4 // ТЯЖЕЛЫЙ VTOL',
    clickMult: 1.4,
    passiveMult: 1.6,
    dataGainMult: 1.25,
    fpvObstacleDensity: 0.75,
    fpvDamageMult: 3.2,
    fpvExtraLives: 1,
    rebTimeBonus: 6,
    reqShips: 8,
    reqSalvage: { box: 8, titanium: 10, chips: 8 },
    costUSD: 280000
  }
};

// =========================================================================
// SALVAGE CRAFTING RECIPES
// =========================================================================
export const SALVAGE_CRAFT_RECIPES = [
  {
    id: 'armor_titan',
    name: 'БРОНЕПЛИТЫ «ТИТАН-М»',
    desc: '+50% к прочности корпуса и +2 дополнительные жизни во всех FPV-штурмах.',
    cost: { titanium: 15, box: 8 },
    tier: 1,
    unlocked: false
  },
  {
    id: 'quantum_booster',
    name: 'КВАНТОВЫЙ ДЕШИФРАТОР РЭБ',
    desc: '+12 секунд ко времени взлома частот и +25% к шансу критического сбора.',
    cost: { chips: 18, box: 10 },
    tier: 1,
    unlocked: false
  },
  {
    id: 'non_magnetic_hull',
    name: 'НЕМАГНИТНЫЙ КОРПУС «CARBON-STEALTH»',
    desc: '9.5-метровый цельнокарбоновый композит. Обнуляет магнитную сигнатуру (0 nT), позволяя безопасно проходить над умными донными минами.',
    cost: { titanium: 25, chips: 20, box: 15 },
    tier: 2,
    unlocked: false
  },
  {
    id: 'ai_jetson_module',
    name: 'ИИ-МОДУЛЬ «NVIDIA JETSON ORIN»',
    desc: 'Оптический NPU терминального наведения. При подавлении РЭБ (0% RSSI) автоматически доводит FPV-дрон в уязвимые отсеки цели.',
    cost: { aicore: 4, chips: 35, box: 20 },
    tier: 2,
    unlocked: false
  },
  {
    id: 'plasma_warhead',
    name: 'ПЛАЗМЕННАЯ БОЕГОЛОВКА «X-9»',
    desc: '+150% к урону штурмовых FPV-дронов и x2.5 к наградам за потопление боссов.',
    cost: { titanium: 30, chips: 25, aicore: 5 },
    tier: 2,
    unlocked: false
  },
  {
    id: 'escort_wingman',
    name: 'АВТОНОМНЫЙ ВЕДОМЫЙ ДРОН',
    desc: 'Постоянный рой эскорта в 3D: удваивает весь пассивный доход $ и МБ.',
    cost: { aicore: 8, chips: 40, titanium: 45 },
    tier: 3,
    unlocked: false
  }
];

// =========================================================================
// CAMPAIGN ACTS & STORY MISSIONS DEFINITIONS
// Theater: Dnipro River, Kherson region
// Mission types: 'recon' (scout), 'rew' (EW hack), 'strike' (boat+FPV assault)
// =========================================================================
export const CAMPAIGN_ACTS_DEF = [
  {
    act: 1,
    title: '🌉 ТЕНЬ АНТОНОВСКОГО',
    sector: 'sector-1',
    desc: 'Разведка и первые удары в районе разрушенного Антоновского моста через Днепр.',
    missions: [
      {
        id: 'm1_1',
        code: 'OP-101 // РАЗВЕДКА РУСЛА',
        title: 'Первичная аэроразведка',
        desc: 'Запустите FPV-дрон и проведите аэроразведку участка Днепра. Обнаружьте и сфотографируйте 3 вражеских позиции на левом берегу.',
        missionType: 'recon',
        reqData: 40,
        reconTargets: 3,
        reconTimeLimit: 240,
        phases: ['Запуск дрона', 'Поиск маркеров', 'Фото-фиксация', 'Возврат'],
        reward: { usd: 4500, mb: 120, bp: 0, salvage: { box: 1, chips: 1 } },
        enemies: [
          { type: 'patrol_boat', name: 'Патрульный катер «Раптор»', count: 2 },
          { type: 'shore_mg', name: 'Береговой пулемёт ДШК', count: 3 }
        ],
        targetName: 'Позиции левого берега',
        commsIntro: {
          speaker: 'ШТАБ [МАЯК]', role: 'HQ',
          text: 'Барракуда, говорит «Маяк». Проведите аэроразведку! Летите к светящимся маркерам целей на северном берегу, подлетайте на расстояние <45м и делайте снимки на [ПРОБЕЛ].'
        }
      },
      {
        id: 'm1_2',
        code: 'OP-102 // СЛЕПОЕ ПЯТНО',
        title: 'Уничтожение 3 опорных пунктов',
        desc: 'По данным разведки, нанесите удар по трём обнаруженным опорникам (ОП) вдоль берега.',
        missionType: 'strike',
        reqData: 100,
        strikeTargets: 3,
        phases: ['Выход на маршрут', 'Подход к ОП-1', 'FPV-удар', 'Перемещение к ОП-2', 'Финальный удар'],
        reward: { usd: 7000, mb: 250, bp: 1, salvage: { box: 1, titanium: 2 } },
        enemies: [
          { type: 'shore_battery', name: 'Береговая батарея 2А65', count: 3 },
          { type: 'ew_station', name: 'Станция РЭБ «Поле-21»', count: 1 },
          { type: 'patrol_boat', name: 'Патрульный катер «Раптор»', count: 1 }
        ],
        targetName: 'Опорные пункты левого берега',
        commsIntro: {
          speaker: 'ЛЕЙТЕНАНТ [ВЕКТОР]', role: 'EW',
          text: 'Данные разведки получены! Координаты 3 опорников загружены в навигацию. Выдвигайтесь на штурм!'
        }
      },
      {
        id: 'm1_3',
        code: 'OP-103 // ОХОТА НА «ГРОМ» [БОСС]',
        title: 'Уничтожение бронекатера «Гром»',
        desc: 'Бронированный патрульный катер блокирует фарватер у опор моста. Нанесите точечный FPV-удар в рубку.',
        missionType: 'strike',
        reqData: 200,
        isBoss: true,
        bossId: 'corvette',
        phases: ['Маскировка в камышах', 'Обход патруля', 'FPV-штурм рубки', 'Сбор трофеев'],
        reward: { usd: 18000, mb: 600, bp: 2, salvage: { box: 2, titanium: 3, chips: 2 } },
        enemies: [
          { type: 'armored_boat', name: 'Бронекатер «Гром» [БОСС]', count: 1 },
          { type: 'patrol_boat', name: 'Катер охранения', count: 2 },
          { type: 'shore_mg', name: 'ЗУ-23 на берегу', count: 2 }
        ],
        targetName: 'Бронекатер «Гром»',
        commsIntro: {
          speaker: 'АДМИРАЛ ВОРОНОВ', role: 'ENEMY',
          text: 'Внимание всем бортам! В акватории обнаружен неопознанный надводный аппарат! Артиллерии — огонь по фарватеру!'
        }
      },
      {
        id: 'm1_4',
        code: 'OP-104 // ТАКТИКА: СИФОН КАБЕЛЯ',
        title: 'Подводная диверсия микро-ROV',
        desc: 'Спустите привязной подводный аппарат «Спрут-1», найдите оптоволоконный кабель связи по магнитометру и подключите сифон данных.',
        missionType: 'rov',
        reqData: 250,
        phases: ['Спуск ROV', 'Сканирование (nT)', 'Подключение сифона', 'Перехват данных'],
        reward: { usd: 25000, mb: 850, bp: 2, salvage: { box: 2, chips: 3, aicore: 1 } },
        enemies: [],
        targetName: 'Подводный кабель связи',
        commsIntro: {
          speaker: 'ШТАБ [МАЯК]', role: 'HQ',
          text: 'Спецоперация! Подводный кабель противника лежит на дне русла. Спустите микро-ROV, ориентируйтесь по шкале магнитометра и активируйте сифон!'
        }
      }
    ]
  },
  {
    act: 2,
    title: '🌙 НОЧЬ НАД КАХОВКОЙ',
    sector: 'sector-2',
    desc: 'Ночные операции в районе разрушенной Каховской ГЭС и затопленных территорий.',
    missions: [
      {
        id: 'm2_1',
        code: 'OP-201 // ПРИЗРАКИ КАХОВКИ',
        title: 'Ночная разведка затопленных позиций',
        desc: 'Исследуйте затопленные территории ниже дамбы. Обнаружьте скрытые артиллерийские позиции в руинах.',
        missionType: 'recon',
        reqData: 350,
        reconTargets: 4,
        reconTimeLimit: 220,
        phases: ['Стелс-подход', 'Тепловизор FLIR', 'Маркировка целей', 'Эвакуация'],
        reward: { usd: 15000, mb: 500, bp: 1, salvage: { box: 1, chips: 3 } },
        enemies: [
          { type: 'shore_battery', name: 'Гаубица Д-30 в укрытии', count: 4 },
          { type: 'ew_station', name: 'Комплекс РЭБ «Мурманск-БН»', count: 1 },
          { type: 'sniper_post', name: 'Наблюдательный пост', count: 3 }
        ],
        targetName: 'Скрытые позиции у дамбы',
        commsIntro: {
          speaker: 'ШТАБ [МАЯК]', role: 'HQ',
          text: 'Ночной вылет. Ищите световые маркеры целей в затопленной зоне. Подлетайте вплотную и фиксируйте позиции!'
        }
      },
      {
        id: 'm2_2',
        code: 'OP-202 // СИСТЕМА «ПОЛЕ»',
        title: 'Саботаж станции РЭБ',
        desc: 'Станция «Поле-21» подавляет наши каналы связи. Подойдите к ней по реке и уничтожьте антенны.',
        missionType: 'rew',
        reqData: 600,
        rewChannels: 4,
        rewTimePerChannel: 8,
        phases: ['Частотный перехват', 'Взлом канала 1-2', 'Взлом канала 3-4', 'Физическое уничтожение'],
        reward: { usd: 28000, mb: 900, bp: 2, salvage: { box: 2, titanium: 4 } },
        enemies: [
          { type: 'ew_station', name: 'Комплекс РЭБ «Поле-21»', count: 1 },
          { type: 'shore_mg', name: 'Охрана позиции', count: 4 },
          { type: 'patrol_boat', name: 'Катер реагирования', count: 1 }
        ],
        targetName: 'Станция РЭБ «Поле-21»',
        commsIntro: {
          speaker: 'ЛЕЙТЕНАНТ [ВЕКТОР]', role: 'EW',
          text: 'Перехватываю частоты «Поле-21». Подавите 4 канала последовательно!'
        }
      },
      {
        id: 'm2_3',
        code: 'OP-203 // БАРЖА «ВОЛГА» [БОСС]',
        title: 'Потопление десантной баржи',
        desc: 'Тяжёлая десантная баржа готовит переправу. Уничтожьте баржу и груз вместе с охранением.',
        missionType: 'strike',
        reqData: 1000,
        isBoss: true,
        bossId: 'frigate',
        phases: ['Обход минных постановок', 'Уничтожение охранения', 'FPV-удар в трюм', 'Захват документов'],
        reward: { usd: 45000, mb: 1500, bp: 3, salvage: { box: 3, chips: 4, titanium: 4, aicore: 1 } },
        enemies: [
          { type: 'barge', name: 'Десантная баржа «Волга» [БОСС]', count: 1 },
          { type: 'patrol_boat', name: 'Катер охранения БК-16', count: 3 },
          { type: 'shore_battery', name: 'ЗУ-23-2 на барже', count: 2 }
        ],
        targetName: 'Десантная баржа «Волга»',
        commsIntro: {
          speaker: 'АДМИРАЛ ВОРОНОВ', role: 'ENEMY',
          text: '«Волга», зенитный огонь! Не подпускать брандер к борту!'
        }
      },
      {
        id: 'm2_4',
        code: 'OP-204 // ТАКТИКА: ПРОРЫВ ПО СОНАРУ',
        title: 'Проход минного поля по эхолоту',
        desc: 'Активируйте 3D-сонар бокового обзора [X], найдите безопасный фарватер сквозь якорные мины и поразите катер охраны.',
        missionType: 'sonar',
        reqData: 1200,
        phases: ['Включение сонара', 'Проход минного поля', 'Сканирование дна', 'Удар по цели'],
        reward: { usd: 50000, mb: 1800, bp: 3, salvage: { box: 3, titanium: 5 } },
        enemies: [
          { type: 'patrol_boat', name: 'Катер минного дозора', count: 2 }
        ],
        targetName: 'Минное поле фарватера',
        commsIntro: {
          speaker: 'ШТАБ [МАЯК]', role: 'HQ',
          text: 'Фарватер заминирован! Включите 3D-сонар клавишей [X], держите умеренную скорость для чистого скана и обойдите красные отклики мин!'
        }
      }
    ]
  },
  {
    act: 3,
    title: '⚓ ХЕРСОНСКИЙ РУБЕЖ',
    sector: 'sector-3',
    desc: 'Операции в акватории Херсонского порта. Нейтрализация логистической базы противника.',
    missions: [
      {
        id: 'm3_1',
        code: 'OP-301 // ГЛАЗА ПОРТА',
        title: 'Разведка портовой инфраструктуры',
        desc: 'Проведите детальную разведку акватории порта: склады, краны, причалы. Обнаружьте 5 ключевых объектов.',
        missionType: 'recon',
        reqData: 1500,
        reconTargets: 5,
        reconTimeLimit: 200,
        phases: ['Вход в акваторию', 'Съёмка складов', 'Маркировка техники', 'Разведка ПВО', 'Выход'],
        reward: { usd: 55000, mb: 2000, bp: 2, salvage: { box: 2, titanium: 6 } },
        enemies: [
          { type: 'shore_battery', name: 'ЗРК «Стрела-10» на причале', count: 2 },
          { type: 'patrol_boat', name: 'Катер портовой охраны', count: 3 },
          { type: 'shore_mg', name: 'Пост наблюдения', count: 4 }
        ],
        targetName: 'Портовая инфраструктура',
        commsIntro: {
          speaker: 'ШТАБ [МАЯК]', role: 'HQ',
          text: 'Херсонский порт — ключевой узел. Фиксируйте склады, краны и позиции ПВО!'
        }
      },
      {
        id: 'm3_2',
        code: 'OP-302 // ПЕРЕХВАТ КОНВОЯ',
        title: 'Уничтожение речного конвоя',
        desc: 'Конвой из 3 барж везёт боеприпасы по Днепру к порту. Перехватите и потопите все 3.',
        missionType: 'strike',
        reqData: 2500,
        strikeTargets: 3,
        phases: ['Перехват маршрута', 'Удар по барже-1', 'Удар по барже-2', 'Удар по барже-3'],
        reward: { usd: 90000, mb: 3500, bp: 3, salvage: { box: 3, chips: 6, aicore: 1 } },
        enemies: [
          { type: 'supply_barge', name: 'Баржа-снаряд №1', count: 1 },
          { type: 'supply_barge', name: 'Баржа-снаряд №2', count: 1 },
          { type: 'supply_barge', name: 'Баржа-снаряд №3', count: 1 }
        ],
        targetName: 'Речной конвой снабжения',
        commsIntro: {
          speaker: 'ЛЕЙТЕНАНТ [ВЕКТОР]', role: 'EW',
          text: 'Конвой с боеприпасами на перехвате. Потопите все три баржи!'
        }
      },
      {
        id: 'm3_3',
        code: 'OP-303 // «ПОРТОВЫЙ ШАХ» [БОСС]',
        title: 'Уничтожение портового крана и склада',
        desc: 'Главный грузовой кран и склад ГСМ — сердце логистики. Один удар решит исход кампании.',
        missionType: 'strike',
        reqData: 4500,
        isBoss: true,
        bossId: 'cruiser',
        phases: ['Прорыв ПВО', 'Уничтожение ЗРК', 'Удар по крану', 'Подрыв склада ГСМ'],
        reward: { usd: 150000, mb: 6000, bp: 5, salvage: { box: 4, chips: 8, titanium: 8, aicore: 2 } },
        enemies: [
          { type: 'port_crane', name: 'Портовый кран [ГЛАВНАЯ ЦЕЛЬ]', count: 1 },
          { type: 'fuel_depot', name: 'Склад ГСМ', count: 1 },
          { type: 'shore_battery', name: 'ЗРК «Бук-М1» мобильный', count: 2 }
        ],
        targetName: 'Портовый комплекс',
        commsIntro: {
          speaker: 'АДМИРАЛ ВОРОНОВ', role: 'ENEMY',
          text: 'Активировать все комплексы ПВО! Порт не должен быть потерян!'
        }
      },
      {
        id: 'm3_4',
        code: 'OP-304 // ТАКТИКА: ДРИФТ В ПЛАВНЯХ',
        title: 'Испытание маневренности VSA OFF',
        desc: 'Отключите курсовую стабилизацию [V], пустите катер в управляемый гидродинамический занос и пройдите сквозь плотный перекрестный огонь.',
        missionType: 'drift',
        reqData: 5000,
        phases: ['Отключение VSA', 'Дрифт на волнах', 'Уклонение от прожекторов', 'Эвакуация'],
        reward: { usd: 120000, mb: 4500, bp: 4, salvage: { box: 3, titanium: 8 } },
        enemies: [
          { type: 'shore_mg', name: 'Прожекторные посты', count: 4 }
        ],
        targetName: 'Слалом в протоках',
        commsIntro: {
          speaker: 'ШТАБ [МАЯК]', role: 'HQ',
          text: 'Противник простреливает русло прямой наводкой! Отключите VSA тумблером [V] и используйте боковой дрифт для резких виражей!'
        }
      }
    ]
  },
  {
    act: 4,
    title: '💀 ДЕЛЬТА РАССВЕТА',
    sector: 'sector-4',
    desc: 'Финальный штурм командного пункта противника в дельте Днепра — среди островов, камышей и проток.',
    missions: [
      {
        id: 'm4_1',
        code: 'OP-401 // ЛАБИРИНТ ПРОТОК',
        title: 'Разведка островного архипелага',
        desc: 'В дельте Днепра десятки малых островов. На одном из них — замаскированный командный пункт. Найдите 5 ключевых узлов.',
        missionType: 'recon',
        reqData: 7000,
        reconTargets: 5,
        reconTimeLimit: 180,
        phases: ['Картографирование', 'Термосканирование', 'Обнаружение КП', 'Передача координат'],
        reward: { usd: 200000, mb: 10000, bp: 4, salvage: { box: 4, chips: 10, aicore: 2 } },
        enemies: [
          { type: 'patrol_boat', name: 'Скоростной катер «Мангуст»', count: 4 },
          { type: 'shore_mg', name: 'Замаскированный пост', count: 6 }
        ],
        targetName: 'Командный пункт в дельте',
        commsIntro: {
          speaker: 'ИИ [БАРРАКУДА]', role: 'AI',
          text: 'Сканирование архипелага дельты. Летите к маякам и проведите фотофиксацию.'
        }
      },
      {
        id: 'm4_2',
        code: 'OP-402 // МЁРТВАЯ ЗОНА',
        title: 'Подавление радиолокационного зонта',
        desc: 'КП защищён эшелонированной РЭБ. Подавите все передатчики чтобы открыть окно для финального удара.',
        missionType: 'rew',
        reqData: 12000,
        rewChannels: 6,
        rewTimePerChannel: 6,
        phases: ['Перехват частот', 'Взлом эшелона-1', 'Взлом эшелона-2', 'Взлом эшелона-3', 'Окно прорыва'],
        reward: { usd: 350000, mb: 18000, bp: 6, salvage: { box: 5, chips: 12, titanium: 10, aicore: 3 } },
        enemies: [
          { type: 'ew_station', name: 'Передатчик РЭБ «Красуха-4»', count: 3 }
        ],
        targetName: 'Эшелонированная РЭБ-система',
        commsIntro: {
          speaker: 'ЛЕЙТЕНАНТ [ВЕКТОР]', role: 'EW',
          text: 'Подавите передатчики «Красуха-4»!'
        }
      },
      {
        id: 'm4_3',
        code: 'OP-403 // ФИНАЛЬНЫЙ ШТУРМ [СУПЕР-БОСС]',
        title: 'Ликвидация командного пункта «ЦИТАДЕЛЬ»',
        desc: 'Генеральный штурм бункерного КП на острове в дельте. Уничтожьте антенное поле, генераторы и сам бункер!',
        missionType: 'strike',
        reqData: 25000,
        isBoss: true,
        bossId: 'cruiser',
        strikeTargets: 3,
        phases: ['Прорыв зенитного огня', 'Удар по генераторам', 'Разрушение антенн', 'Удар в бункер'],
        reward: { usd: 1000000, mb: 50000, bp: 15, salvage: { box: 10, chips: 25, titanium: 25, aicore: 10 } },
        enemies: [
          { type: 'bunker', name: 'КП «Цитадель» [СУПЕР-БОСС]', count: 1 }
        ],
        targetName: 'Бункерный КП «Цитадель»',
        commsIntro: {
          speaker: 'ШТАБ [МАЯК]', role: 'HQ',
          text: 'Решающий удар кампании! Уничтожьте «Цитадель»!'
        }
      },
      {
        id: 'm4_4',
        code: 'OP-404 // ТАКТИКА: НЕЙРО-ШТУРМ В РЭБ',
        title: 'Терминальный оптический AI-захват',
        desc: 'При 100% глушении видеоканала нейросетевой модуль Nvidia Jetson перехватывает управление и поражает уязвимый отсек цели.',
        missionType: 'ai_strike',
        reqData: 30000,
        phases: ['Вход в зону РЭБ', 'Потеря видеосвязи (0% RSSI)', 'ИИ-автозахват оптического потока', 'Точное попадание'],
        reward: { usd: 800000, mb: 40000, bp: 10, salvage: { box: 6, chips: 15, aicore: 5 } },
        enemies: [
          { type: 'ew_station', name: 'Комплекс «Красуха-4»', count: 2 }
        ],
        targetName: 'Защищенный командный радар',
        commsIntro: {
          speaker: 'ИИ [БАРРАКУДА]', role: 'AI',
          text: 'Видеоканал подавлен (RSSI 0%). Активирован терминальный NPU модуль Jetson. Оптическое наведение захватило контур цели!'
        }
      }
    ]
  },
  {
    act: 5,
    title: '🏝️ КИНБУРНСКАЯ КОСА',
    sector: 'sector-5',
    desc: 'Мелководный театр военных действий Днепровско-Бугского лимана. Песчаные отмели, диверсии и патрули.',
    missions: [
      {
        id: 'm5_1',
        code: 'OP-501 // МЕЛКОВОДНЫЙ ПРОРЫВ',
        title: 'Навигация по эхолоту глубин',
        desc: 'Пройдите по узкому фарватеру песчаных кос, маневрируя по глубиномеру (DEPTH > 1.0м), и уничтожьте береговую РЛС.',
        missionType: 'kinburn',
        reqData: 40000,
        phases: ['Вход в лиман', 'Контроль глубин эхолота', 'Обход песчаных отмелей', 'Удар по РЛС'],
        reward: { usd: 1500000, mb: 75000, bp: 20, salvage: { box: 8, chips: 20, titanium: 20, aicore: 8 } },
        enemies: [
          { type: 'shore_battery', name: 'Береговая РЛС «Мыс»', count: 1 },
          { type: 'patrol_boat', name: 'Катер береговой охраны', count: 3 }
        ],
        targetName: 'Береговая РЛС Кинбурна',
        commsIntro: {
          speaker: 'ШТАБ [МАЯК]', role: 'HQ',
          text: 'Добро пожаловать на Кинбурнскую косу! Следите за показаниями эхолота на HUD — если глубина упадет ниже 1.2м, водомет захватит песок!'
        }
      }
    ]
  }
];

// =========================================================================
// BOSS SHIPS DEFINITION
// =========================================================================
export const BOSS_SHIPS = [
  { id: 'corvette', name: '🚤 БРОНЕКАТЕР «ГРОМ»', hpMult: 2.0, rewardMult: 3.0, evadeMult: 1.5, desc: 'Бронированный речной катер с 30-мм пушкой' },
  { id: 'frigate', name: '🚢 БАРЖА «ВОЛГА»', hpMult: 3.0, rewardMult: 5.0, evadeMult: 2.0, desc: 'Тяжёлая десантная баржа с зенитным вооружением' },
  { id: 'cruiser', name: '💀 КП «ЦИТАДЕЛЬ»', hpMult: 4.5, rewardMult: 8.0, evadeMult: 2.5, desc: 'Бункерный командный пункт — высшая цель' }
];

// Fisher-Yates shuffle utility
export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


// =========================================================================
// RANDOM EVENTS DEFINITION
// =========================================================================
export const RANDOM_EVENTS = [
  {
    id: 'patrol',
    name: '⚠️ ВРАЖЕСКИЙ ПАТРУЛЬ',
    desc: 'Обнаружен вражеский катер! Кликните 20 раз за 12 секунд или потеряете 30% данных!',
    type: 'click_challenge',
    duration: 12,
    requirement: 20,
    penalty: 0.3,
    reward: { mb: 25, usd: 2000 }
  },
  {
    id: 'cable',
    name: '📡 ПОДВОДНЫЙ КАБЕЛЬ',
    desc: 'Обнаружен незащищённый подводный кабель связи! Бесплатные разведданные!',
    type: 'bonus',
    reward: { mb: 60, usd: 3000 }
  },
  {
    id: 'emp_storm',
    name: '⚡ ЭМ-ПОМЕХА',
    desc: 'Электромагнитный шторм! Пассив отключён на 8с, затем x3 на 5с!',
    type: 'emp',
    downDuration: 8,
    boostDuration: 5,
    boostMultiplier: 3
  },
  {
    id: 'recon',
    name: '✈️ РАЗВЕДСАМОЛЁТ',
    desc: 'Вражеский самолёт-разведчик! Нажмите кнопку за 6 секунд!',
    type: 'quick_action',
    duration: 6,
    penalty: { mb: -20, usd: -1500 },
    reward: { mb: 40, usd: 5000 }
  },
  {
    id: 'supply_drop',
    name: '📦 СБРОС СНАБЖЕНИЯ',
    desc: 'Союзный вертолёт сбрасывает запас разведданных!',
    type: 'bonus',
    reward: { mb: 35, usd: 8000 }
  }
];

// ==============================================
// FPV DRONE MULTI-PHASE MINIGAME ENGINE v2
// ==============================================


// =========================================================================
// DAILY QUEST TEMPLATES
// =========================================================================
export const DAILY_QUEST_TEMPLATES = [
  { id: 'dq_clicks', type: 'clicks', target: 500, rewardUSD: 500, rewardMB: 100, desc: 'Выполнить 500 кликов (SIGINT)' },
  { id: 'dq_hacks', type: 'hacks', target: 10, rewardUSD: 800, rewardMB: 150, desc: 'Успешно взломать 10 частот РЭБ' },
  { id: 'dq_fpv', type: 'fpv', target: 3, rewardUSD: 1000, rewardMB: 200, desc: 'Успешно завершить 3 FPV-штурма' },
  { id: 'dq_boss', type: 'boss', target: 1, rewardUSD: 2000, rewardMB: 500, desc: 'Потопить 1 корабль класса БОСС' },
  { id: 'dq_craft', type: 'craft', target: 1, rewardUSD: 600, rewardMB: 50, desc: 'Скрафтить любой модуль в Ангаре' }
];
