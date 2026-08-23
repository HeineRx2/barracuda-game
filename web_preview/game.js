// =========================================================================
// BARRACUDA GAME CORE — FULL TACTICAL MILITARY SIMULATOR v7
// (Multi-Phase FPV, Enhanced SIGINT, Random Events, Achievements, Save)
// =========================================================================

const DOSSIER_LORE = [
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

const SECTOR_INFO = {
  'sector-1': { name: 'О. ЗМЕИНЫЙ', mult: 1.0, weather: 'storm' },
  'sector-2': { name: 'СЕВАСТОПОЛЬ', mult: 1.8, weather: 'night' },
  'sector-3': { name: 'НОВОРОССИЙСК', mult: 2.5, weather: 'sunset' },
  'sector-4': { name: 'КЕРЧЬ', mult: 3.2, weather: 'dawn' }
};

// =========================================================================
// ACHIEVEMENTS DEFINITION
// =========================================================================
const ACHIEVEMENTS_DEF = [
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
  { id: 'salvage_master', name: 'ИНЖЕНЕР ФЛОТА', desc: 'Скрафтите модуль в Ангаре', icon: '💠' }
];

// =========================================================================
// =========================================================================
// NAVAL SHIP CLASSES & SCALING
// =========================================================================
const ENEMY_SHIP_CLASSES = [
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

function getEnemyShipData(level) {
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
const DRONE_PROTOTYPES_DEF = {
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
    reqSalvage: { box: 2, chips: 2 },
    costUSD: 45000
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
    reqSalvage: { box: 4, titanium: 6, aicore: 1 },
    costUSD: 180000
  }
};

// =========================================================================
// SALVAGE CRAFTING RECIPES
// =========================================================================
const SALVAGE_CRAFT_RECIPES = [
  {
    id: 'armor_titan',
    name: 'БРОНЕПЛИТЫ «ТИТАН-М»',
    desc: '+50% к прочности корпуса и +2 дополнительные жизни во всех FPV-штурмах.',
    cost: { titanium: 4, box: 2 },
    tier: 1,
    unlocked: false
  },
  {
    id: 'quantum_booster',
    name: 'КВАНТОВЫЙ ДЕШИФРАТОР РЭБ',
    desc: '+12 секунд ко времени взлома частот и +25% к шансу критического сбора.',
    cost: { chips: 5, box: 2 },
    tier: 1,
    unlocked: false
  },
  {
    id: 'plasma_warhead',
    name: 'ПЛАЗМЕННАЯ БОЕГОЛОВКА «X-9»',
    desc: '+150% к урону штурмовых FPV-дронов и x2.5 к наградам за потопление боссов.',
    cost: { titanium: 6, chips: 4, aicore: 2 },
    tier: 2,
    unlocked: false
  },
  {
    id: 'escort_wingman',
    name: 'АВТОНОМНЫЙ ВЕДОМЫЙ ДРОН',
    desc: 'Постоянный рой эскорта в 3D: удваивает весь пассивный доход $ и МБ.',
    cost: { aicore: 3, chips: 6, titanium: 8 },
    tier: 3,
    unlocked: false
  }
];

// =========================================================================
// CAMPAIGN ACTS & STORY MISSIONS DEFINITIONS
// =========================================================================
const CAMPAIGN_ACTS_DEF = [
  {
    act: 1,
    title: '🏝️ ТЕНЬ НАД ЗМЕИНЫМ',
    sector: 'sector-1',
    desc: 'Вскрытие эшелона наблюдения противника в районе острова Змеиный.',
    missions: [
      {
        id: 'm1_1',
        code: 'OP-101 // ЗОВ ГОРИЗОНТА',
        title: 'Первичный радиоперехват',
        desc: 'Проникните в зону действия берегового поста РЛС и дешифруйте несущую частоту 142.5 МГц.',
        reqData: 40,
        phases: ['Сканирование', 'Взлом РЭБ', 'FPV-Удар', 'Сбор данных'],
        reward: { usd: 3500, mb: 100, bp: 0, salvage: { box: 1, chips: 1 } },
        targetName: 'Патрульный катер «Раптор»',
        commsIntro: {
          speaker: 'ШТАБ [МАЯК]', role: 'HQ',
          text: 'Барракуда, говорит «Маяк». В квадрате 4 зафиксирована аномальная активность РЛС. Перехватите сигнал и вскройте фарватер.'
        }
      },
      {
        id: 'm1_2',
        code: 'OP-102 // СЛЕПОЕ ПЯТНО',
        title: 'Ослепление РЛС-купола',
        desc: 'Подавите береговой ретранслятор и уничтожьте эскортный тральщик до передачи тревоги.',
        reqData: 100,
        phases: ['Радиомаскировка', 'Саботаж частот', 'FPV-Прорыв', 'Эвакуация'],
        reward: { usd: 7000, mb: 250, bp: 1, salvage: { box: 1, titanium: 2 } },
        targetName: 'Тральщик дивизиона',
        commsIntro: {
          speaker: 'ЛЕЙТЕНАНТ [ВЕКТОР]', role: 'EW',
          text: 'Вижу частотную модуляцию радара. Если заглушим несущую волну за 25 секунд — они ослепнут!'
        }
      },
      {
        id: 'm1_3',
        code: 'OP-103 // ОХОТА НА «ГРОМ» [БОСС]',
        title: 'Ликвидация корвета «Гром»',
        desc: 'Финальный удар по флагману патрульного дивизиона. Нанесите точечный кинетический удар в склад боекомплекта.',
        reqData: 200,
        isBoss: true,
        bossId: 'corvette',
        phases: ['Вскрытие ордера', 'РЭБ-прорыв', 'Штурм FLIR', 'Подъем ящика'],
        reward: { usd: 18000, mb: 600, bp: 2, salvage: { box: 2, titanium: 3, chips: 2 } },
        targetName: 'Корвет «Гром»',
        commsIntro: {
          speaker: 'АДМИРАЛ ВОРОНОВ', role: 'ENEMY',
          text: 'Внимание всем бортам! В секторе неопознанный надводный дрон! Артиллерии открыть заградительный огонь!'
        }
      }
    ]
  },
  {
    act: 2,
    title: '⚓ СЕВАСТОПОЛЬСКИЙ ПРОРЫВ',
    sector: 'sector-2',
    desc: 'Ночной рейд сквозь боновые заграждения и береговую систему ПВО Севастополя.',
    missions: [
      {
        id: 'm2_1',
        code: 'OP-201 // НОЧНОЙ КИЛЬВАТЕР',
        title: 'Прорыв подводных гидрофонов',
        desc: 'Обойдите рубеж гидроакустических буев на сверхмалой скорости под покровом ночи.',
        reqData: 350,
        phases: ['Стелс-маневр', 'Взлом буев', 'FPV-атака', 'Сбор трофеев'],
        reward: { usd: 15000, mb: 500, bp: 1, salvage: { box: 1, chips: 3 } },
        targetName: 'Сторожевой катер охраны водного района',
        commsIntro: {
          speaker: 'ШТАБ [МАЯК]', role: 'HQ',
          text: 'Вход в бухту заминирован и перекрыт бонами. Действуйте в режиме полного радиомолчания.'
        }
      },
      {
        id: 'm2_2',
        code: 'OP-202 // СИСТЕМА «БАЛ»',
        title: 'Саботаж берегового комплекса',
        desc: 'Перехватите телеметрию наведения берегового ракетного дивизиона и сорвите пуск.',
        reqData: 600,
        phases: ['Спутниковый перехват', 'Дешифровка ключа', 'Точечный удар', 'Эвакуация данных'],
        reward: { usd: 28000, mb: 900, bp: 2, salvage: { box: 2, titanium: 4 } },
        targetName: 'Командный пункт наведения',
        commsIntro: {
          speaker: 'ЛЕЙТЕНАНТ [ВЕКТОР]', role: 'EW',
          text: 'Перехватываю телекодовую связь батареи «Бал». Внедрим троян в их систему наведения!'
        }
      },
      {
        id: 'm2_3',
        code: 'OP-203 // ФРЕГАТ «БУРЯ» [БОСС]',
        title: 'Потопление ракетного фрегата',
        desc: 'Удар по тяжелому ракетоносцу с активной защитой. Пробейте ходовой мостик.',
        reqData: 1000,
        isBoss: true,
        bossId: 'frigate',
        phases: ['Преодоление ПВО', 'РЭБ-подавление', 'Удар в мостик', 'Захват ящика'],
        reward: { usd: 45000, mb: 1500, bp: 3, salvage: { box: 3, chips: 4, titanium: 4, aicore: 1 } },
        targetName: 'Фрегат «Буря»',
        commsIntro: {
          speaker: 'АДМИРАЛ ВОРОНОВ', role: 'ENEMY',
          text: '«Буря», активировать комплекс активной защиты! Сбить дрон любыми средствами!'
        }
      }
    ]
  },
  {
    act: 3,
    title: '🚢 ПРИЗРАЧНЫЙ КОНВОЙ',
    sector: 'sector-3',
    desc: 'Охота на конвой снабжения, перевозящий квантовые вычислители проекта «Левиафан».',
    missions: [
      {
        id: 'm3_1',
        code: 'OP-301 // ТЕНЬ В ТЕРМИНАЛЕ',
        title: 'Удар по танкеру снабжения',
        desc: 'Отрежьте эскадру противника от поставок топлива в акватории терминала.',
        reqData: 1500,
        phases: ['Разведка ордера', 'Взлом шифра', 'Удар в машинное', 'Сбор трофеев'],
        reward: { usd: 55000, mb: 2000, bp: 2, salvage: { box: 2, titanium: 6 } },
        targetName: 'Танкер флота',
        commsIntro: {
          speaker: 'ШТАБ [МАЯК]', role: 'HQ',
          text: 'Конвой вошел в зону поражения. Без топлива их корабли станут легкой мишенью.'
        }
      },
      {
        id: 'm3_2',
        code: 'OP-302 // КВАНТОВЫЙ КЛЮЧ',
        title: 'Перехват глубоководного ретранслятора',
        desc: 'Подключитесь к оптоволоконной магистрали и скачайте исходные коды системы «Омега».',
        reqData: 2500,
        phases: ['Глубоководный поиск', 'Взлом 3 каналов', 'FPV-эскорт', 'Сбор ИИ-ядра'],
        reward: { usd: 90000, mb: 3500, bp: 3, salvage: { box: 3, chips: 6, aicore: 1 } },
        targetName: 'Эскортный корвет «Штиль»',
        commsIntro: {
          speaker: 'ЛЕЙТЕНАНТ [ВЕКТОР]', role: 'EW',
          text: 'Невероятно... В подводном кабеле передаются терабайты данных ИИ-нейросети!'
        }
      },
      {
        id: 'm3_3',
        code: 'OP-303 // КРЕЙСЕР «НЕМЕЗИС» [БОСС]',
        title: 'Уничтожение флагманского крейсера',
        desc: 'Тяжелый ракетный крейсер — опора обороны сектора. Нанесите скоординированный FPV-удар.',
        reqData: 4500,
        isBoss: true,
        bossId: 'cruiser',
        phases: ['Прорыв эскорта', 'Тотальный РЭБ', 'FLIR-удар в погреб', 'Подъем архивов'],
        reward: { usd: 150000, mb: 6000, bp: 5, salvage: { box: 4, chips: 8, titanium: 8, aicore: 2 } },
        targetName: 'Крейсер «Немезис»',
        commsIntro: {
          speaker: 'АДМИРАЛ ВОРОНОВ', role: 'ENEMY',
          text: 'Как этот дрон проник сквозь внешнее кольцо?! Всем боевым постам — тревога нулевого уровня!'
        }
      }
    ]
  },
  {
    act: 4,
    title: '💀 КОД: ЛЕВИАФАН [ФИНАЛ]',
    sector: 'sector-4',
    desc: 'Штурм автономного плавучего командного центра «Левиафан-01» в Керченском проливе.',
    missions: [
      {
        id: 'm4_1',
        code: 'OP-401 // СИГНАЛ ИЗ БЕЗДНЫ',
        title: 'Триангуляция ИИ-хаба',
        desc: 'Определите точные координаты автономного флагмана сквозь плотную стену помех.',
        reqData: 7000,
        phases: ['Поиск несущей', 'Взлом квантового шифра', 'Удар по ретрансляторам', 'Анализ'],
        reward: { usd: 200000, mb: 10000, bp: 4, salvage: { box: 4, chips: 10, aicore: 2 } },
        targetName: 'Авангардный дрон-страж',
        commsIntro: {
          speaker: 'ИИ [БАРРАКУДА]', role: 'AI',
          text: 'ВНИМАНИЕ. Обнаружен встречный машинный сигнал ИИ «Левиафан». Инициализация боевых протоколов.'
        }
      },
      {
        id: 'm4_2',
        code: 'OP-402 // ОМЕГА-СЕТЬ',
        title: 'Коллапс защитного периметра',
        desc: 'Перегрузите генераторы помех и откройте коридор для генерального штурма.',
        reqData: 12000,
        phases: ['Саботаж генераторов', 'Кибер-удар', 'Уничтожение стражей', 'Подготовка прорыва'],
        reward: { usd: 350000, mb: 18000, bp: 6, salvage: { box: 5, chips: 12, titanium: 10, aicore: 3 } },
        targetName: 'Энергетический барбет',
        commsIntro: {
          speaker: 'ЛЕЙТЕНАНТ [ВЕКТОР]', role: 'EW',
          text: 'Их защита трещит по швам! Еще один синхронный импульс — и ядро Левиафана будет открыто!'
        }
      },
      {
        id: 'm4_3',
        code: 'OP-403 // БИТВА ЗА ЧЁРНОЕ МОРЕ [СУПЕР-БОСС]',
        title: 'Ликвидация Дредноута «Левиафан-01»',
        desc: 'Генеральное сражение с автономным дредноутом. Уничтожьте все 3 контура ИИ-серверов!',
        reqData: 25000,
        isBoss: true,
        bossId: 'cruiser',
        phases: ['Прорыв импульсного щита', 'Квантовый взлом ядра', 'Кинетический гипер-удар', 'Захват протокола'],
        reward: { usd: 1000000, mb: 50000, bp: 15, salvage: { box: 10, chips: 25, titanium: 25, aicore: 10 } },
        targetName: 'Автономный Дредноут «Левиафан-01»',
        commsIntro: {
          speaker: 'ШТАБ [МАЯК]', role: 'HQ',
          text: 'Оператор! Судьба всего морского театра в ваших руках! Нанесите решающий удар!'
        }
      }
    ]
  }
];

// =========================================================================
// BOSS SHIPS DEFINITION
// =========================================================================
const BOSS_SHIPS = [
  { id: 'corvette', name: '🚢 КОРВЕТ «ГРОМ»', hpMult: 2.0, rewardMult: 3.0, evadeMult: 1.5, desc: 'Лёгкий корвет с усиленным ПВО' },
  { id: 'frigate', name: '⚓ ФРЕГАТ «БУРЯ»', hpMult: 3.0, rewardMult: 5.0, evadeMult: 2.0, desc: 'Ракетный фрегат с активной защитой' },
  { id: 'cruiser', name: '💀 КРЕЙСЕР «НЕМЕЗИС»', hpMult: 4.5, rewardMult: 8.0, evadeMult: 2.5, desc: 'Тяжёлый крейсер — высшая цель' }
];

// Fisher-Yates shuffle utility
function shuffleArray(arr) {
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
const RANDOM_EVENTS = [
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
class FPVMinigame {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.active = false;

    // Phases: 'launch' -> 'obstacle' -> 'strike' -> 'explosion' -> 'rating'
    this.phase = 'launch';
    this.phaseTimer = 0;
    this.totalTime = 0;

    // Launch phase
    this.launchProgress = 0;
    this.launchQTE = { active: false, marker: 0, speed: 1.8, hit: false, zone: 0.15 };

    // Obstacle phase
    this.drone = { x: 100, y: 250, vy: 0, size: 16, alive: true };
    this.gravity = 650;
    this.flapPower = -290;
    this.lives = 1;
    this.maxLives = 1;
    this.invincibleTimer = 0;

    this.obstacles = [];
    this.obstacleSpeed = 200;
    this.baseGap = 150;
    this.obstacleGap = 150;
    this.obstacleWidth = 50;
    this.spawnTimer = 0;
    this.spawnInterval = 1.7;
    this.passed = 0;
    this.requiredPass = 5;

    // Radar beams (horizontal toggling barriers)
    this.radarBeams = [];
    this.radarBeamTimer = 0;

    // Interceptor missiles
    this.interceptors = [];

    // Data pickups
    this.dataPickups = [];
    this.collectedData = 0;

    // Drone trail particles
    this.trailParticles = [];

    // Strike phase
    this.target = { x: 0, y: 0, w: 80, h: 45, hit: false, vx: 0, vy: 0 };
    this.crosshair = { x: 400, y: 250 };
    this.lockTimer = 0;
    this.requiredLockTime = 2.0;
    this.lockRadius = 55;
    this.countermeasureTimer = 0;
    this.staticNoise = 0;

    // Pre-generated noise canvas for static effect (avoids getImageData)
    this._noiseCanvas = null;
    this._noiseCtx = null;

    // Explosion phase
    this.explosionParticles = [];
    this.shockwaveRadius = 0;
    this.shockwaveAlpha = 1;

    // Rating
    this.rating = 'C';
    this.ratingTimer = 0;
    this.score = { time: 0, accuracy: 0, bonus: 0, noDamage: true, perfectLaunch: false };

    // Background stars/clouds
    this.bgStars = [];
    this.bgClouds = [];

    // Boss mode
    this.isBoss = false;
    this.bossData = null;

    // Difficulty multiplier (increases with prestige)
    this.difficultyMod = 1.0;
  }

  setDifficulty(prestigeLevel, armorLevel, ghostProtocol) {
    this.difficultyMod = 1.0 + prestigeLevel * 0.15;
    if (ghostProtocol) this.difficultyMod *= 0.6; // -40% obstacle density
    this.maxLives = 1 + Math.min(2, Math.floor(armorLevel / 2));
    this.lives = this.maxLives;
    this.requiredPass = Math.min(8, 5 + Math.floor(prestigeLevel / 2));
    if (ghostProtocol) this.requiredPass = Math.max(3, this.requiredPass - 2);
  }

  start(canvas) {
    this.canvas = canvas;
    this.active = true;
    this.phase = 'launch';
    this.phaseTimer = 0;
    this.totalTime = 0;

    // Match canvas pixel buffer to CSS display size for crisp rendering
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x for performance
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    this.ctx = canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);

    // Use CSS pixel dimensions for all drawing calculations
    this._drawW = rect.width;
    this._drawH = rect.height;

    const W = this._drawW;
    const H = this._drawH;

    // Reset launch
    this.launchProgress = 0;
    this.launchQTE = { active: true, marker: 0, speed: 1.8 * this.difficultyMod, hit: false, zone: 0.15 };

    // Reset drone
    this.drone = { x: 100, y: H / 2, vy: 0, size: 16, alive: true };
    this.lives = this.maxLives;
    this.invincibleTimer = 0;
    this.obstacles = [];
    this.spawnTimer = 0;
    this.passed = 0;
    this.trailParticles = [];
    this.radarBeams = [];
    this.radarBeamTimer = 0;
    this.interceptors = [];
    this.dataPickups = [];
    this.collectedData = 0;

    // Reset strike
    this.target = { x: W - 160, y: H / 2, w: 80, h: 45, hit: false, vx: 0, vy: 0 };
    this.crosshair = { x: W / 2, y: H / 2 };
    this.lockTimer = 0;
    this.countermeasureTimer = 0;
    this.staticNoise = 0;

    // Generate noise canvas once for static effect
    this._generateNoiseCanvas(Math.round(rect.width * dpr), Math.round(rect.height * dpr));

    // Reset explosion
    this.explosionParticles = [];
    this.shockwaveRadius = 0;
    this.shockwaveAlpha = 1;

    // Reset rating
    this.ratingTimer = 0;
    this.score = { time: 0, accuracy: 0, bonus: 0, noDamage: true, perfectLaunch: false };

    // Obstacle gap scales with difficulty
    this.obstacleGap = Math.max(100, this.baseGap - this.difficultyMod * 8);
    this.obstacleSpeed = 200 + this.difficultyMod * 30;

    // Generate background stars
    this.bgStars = [];
    for (let i = 0; i < 60; i++) {
      this.bgStars.push({ x: Math.random() * W, y: Math.random() * H, s: 0.5 + Math.random() * 2, speed: 50 + Math.random() * 100 });
    }
    this.bgClouds = [];
    for (let i = 0; i < 5; i++) {
      this.bgClouds.push({ x: W + Math.random() * W, y: 30 + Math.random() * (H - 60), w: 80 + Math.random() * 120, h: 20 + Math.random() * 30, speed: 30 + Math.random() * 40 });
    }

    // Input handlers
    this.onKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        this.handleAction();
      }
    };

    this.onAction = (e) => {
      if (e) e.preventDefault();
      this.handleAction();
    };

    this.onPointerMove = (e) => {
      if (this.phase === 'strike') {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        this.crosshair.x = (clientX - rect.left);
        this.crosshair.y = (clientY - rect.top);
      }
    };

    window.addEventListener('keydown', this.onKeyDown);
    this.canvas.addEventListener('click', this.onAction);
    this.canvas.addEventListener('touchstart', this.onAction, { passive: false });
    this.canvas.addEventListener('mousemove', this.onPointerMove);
    this.canvas.addEventListener('touchmove', this.onPointerMove, { passive: true });
  }

  handleAction() {
    if (this.phase === 'launch' && this.launchQTE.active && !this.launchQTE.hit) {
      const dist = Math.abs(this.launchQTE.marker - 0.5);
      if (dist < this.launchQTE.zone) {
        this.launchQTE.hit = true;
        this.score.perfectLaunch = (dist < this.launchQTE.zone * 0.4);
        if (this.score.perfectLaunch) {
          window.tacticalAudio.playPerfectLaunch();
        } else {
          window.tacticalAudio.playPing();
        }
      }
    } else if (this.phase === 'obstacle' && this.drone.alive) {
      this.drone.vy = this.flapPower;
      window.tacticalAudio.playPing();
    } else if (this.phase === 'strike') {
      // Strike is lock-based now, no single-click
    }
  }

  stop() {
    this.active = false;
    if (this.onKeyDown) window.removeEventListener('keydown', this.onKeyDown);
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.onAction);
      this.canvas.removeEventListener('touchstart', this.onAction);
      this.canvas.removeEventListener('mousemove', this.onPointerMove);
      this.canvas.removeEventListener('touchmove', this.onPointerMove);
    }
  }

  update(dt) {
    if (!this.active) return null;
    this.totalTime += dt;

    // Update background
    const W = this._drawW || this.canvas.width;
    const H = this._drawH || this.canvas.height;
    this.bgStars.forEach(s => { s.x -= s.speed * dt; if (s.x < 0) { s.x = W; s.y = Math.random() * H; } });
    this.bgClouds.forEach(c => { c.x -= c.speed * dt; if (c.x + c.w < 0) { c.x = W + 50; c.y = 30 + Math.random() * (H - 60); } });

    // ======================== LAUNCH PHASE ========================
    if (this.phase === 'launch') {
      this.phaseTimer += dt;

      if (this.launchQTE.active && !this.launchQTE.hit) {
        this.launchQTE.marker += this.launchQTE.speed * dt;
        if (this.launchQTE.marker > 1.0) this.launchQTE.marker -= 1.0;
      }

      this.launchProgress = Math.min(1.0, this.phaseTimer / 2.5);

      if (this.phaseTimer > 2.5 || (this.launchQTE.hit && this.phaseTimer > 1.0)) {
        this.phase = 'obstacle';
        this.phaseTimer = 0;
        // Give drone an initial upward velocity so it doesn't immediately drop
        this.drone.vy = this.flapPower * 0.5;
        // Grace period: invincible for first 1.2 seconds
        this.invincibleTimer = 1.2;
        window.tacticalAudio.playFPVLaunch();
        if (this.score.perfectLaunch) {
          this.obstacleSpeed *= 0.85; // Slightly slower obstacles as bonus
        }
        // Delay first obstacle spawn
        this.spawnTimer = -0.8;
      }
      return null;
    }

    // ======================== OBSTACLE PHASE ========================
    if (this.phase === 'obstacle') {
      this.phaseTimer += dt;
      if (this.invincibleTimer > 0) this.invincibleTimer -= dt;

      // Clamp dt for consistent physics (prevent huge jumps)
      const pdt = Math.min(dt, 0.033);

      // Gravity and movement
      this.drone.vy += this.gravity * pdt;
      this.drone.y += this.drone.vy * pdt;

      // Ceiling clamp
      if (this.drone.y < this.drone.size) { this.drone.y = this.drone.size; this.drone.vy = 0; }
      // Floor: bounce gently instead of instant death (gives player a chance)
      if (this.drone.y > H - this.drone.size) {
        this.drone.y = H - this.drone.size;
        this.drone.vy = -Math.abs(this.drone.vy) * 0.3; // Bounce up
        if (this.invincibleTimer <= 0) {
          const result = this.takeDamage();
          if (result) return result;
        }
      }

      // Trail particles
      if (this.drone.alive && Math.random() > 0.3) {
        this.trailParticles.push({
          x: this.drone.x - this.drone.size,
          y: this.drone.y + (Math.random() - 0.5) * 4,
          vx: -40 - Math.random() * 60,
          vy: (Math.random() - 0.5) * 20,
          life: 0.4 + Math.random() * 0.3,
          maxLife: 0.4 + Math.random() * 0.3,
          color: Math.random() > 0.6 ? '#ffcc00' : '#ff6600'
        });
      }

      // Update trail
      for (let i = this.trailParticles.length - 1; i >= 0; i--) {
        const p = this.trailParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life <= 0) this.trailParticles.splice(i, 1);
      }

      // Spawn obstacles
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        const gapY = 70 + Math.random() * (H - 140);
        this.obstacles.push({ x: W, gapY: gapY, passed: false, type: 'wall' });

        // Spawn data pickups with obstacles (40% chance)
        if (Math.random() < 0.4) {
          this.dataPickups.push({
            x: W + this.obstacleWidth / 2,
            y: gapY + (Math.random() - 0.5) * (this.obstacleGap * 0.4),
            collected: false,
            pulse: 0
          });
        }

        // After 3 obstacles, add radar beams (25% chance)
        if (this.passed >= 2 && Math.random() < 0.25 * this.difficultyMod) {
          const beamY = 60 + Math.random() * (H - 120);
          this.radarBeams.push({
            x: W + 100,
            y: beamY,
            active: true,
            toggleTimer: 0,
            toggleInterval: 0.8 + Math.random() * 0.6,
            width: 200
          });
        }

        // After 2 obstacles, spawn interceptors (20% chance)
        if (this.passed >= 1 && Math.random() < 0.2 * this.difficultyMod) {
          this.interceptors.push({
            x: W + 50,
            y: Math.random() * H,
            vy: (Math.random() > 0.5 ? 1 : -1) * (100 + Math.random() * 100),
            size: 8
          });
        }

        // Progressive difficulty
        this.obstacleGap = Math.max(90, this.baseGap - this.passed * 5 - this.difficultyMod * 6);
        this.obstacleSpeed = Math.min(400, 200 + this.passed * 15 + this.difficultyMod * 25);
        this.spawnInterval = Math.max(0.9, 1.7 - this.passed * 0.08);
      }

      // Move obstacles
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.x -= this.obstacleSpeed * dt;

        if (!obs.passed && obs.x + this.obstacleWidth < this.drone.x) {
          obs.passed = true;
          this.passed++;
          window.tacticalAudio.playPVOFlyby();
          if (this.passed >= this.requiredPass) {
            this.phase = 'strike';
            this.phaseTimer = 0;
            window.tacticalAudio.playPhaseTransition();
            return null;
          }
        }

        // Collision check
        if (this.invincibleTimer <= 0 &&
            this.drone.x + this.drone.size > obs.x && this.drone.x - this.drone.size < obs.x + this.obstacleWidth) {
          if (this.drone.y - this.drone.size < obs.gapY - this.obstacleGap / 2 ||
              this.drone.y + this.drone.size > obs.gapY + this.obstacleGap / 2) {
            const result = this.takeDamage();
            if (result) return result;
          }
        }

        if (obs.x < -this.obstacleWidth) this.obstacles.splice(i, 1);
      }

      // Move data pickups
      for (let i = this.dataPickups.length - 1; i >= 0; i--) {
        const dp = this.dataPickups[i];
        dp.x -= this.obstacleSpeed * dt;
        dp.pulse += dt * 4;

        if (!dp.collected) {
          const distToDrone = Math.hypot(dp.x - this.drone.x, dp.y - this.drone.y);
          if (distToDrone < 25) {
            dp.collected = true;
            this.collectedData++;
            window.tacticalAudio.playDataPickup();
          }
        }

        if (dp.x < -20) this.dataPickups.splice(i, 1);
      }

      // Move radar beams
      for (let i = this.radarBeams.length - 1; i >= 0; i--) {
        const rb = this.radarBeams[i];
        rb.x -= this.obstacleSpeed * 0.7 * dt;
        rb.toggleTimer += dt;
        if (rb.toggleTimer >= rb.toggleInterval) {
          rb.toggleTimer = 0;
          rb.active = !rb.active;
        }

        // Collision with active beam
        if (rb.active && this.invincibleTimer <= 0 &&
            this.drone.x > rb.x && this.drone.x < rb.x + rb.width &&
            Math.abs(this.drone.y - rb.y) < 12) {
          const result = this.takeDamage();
          if (result) return result;
        }

        if (rb.x + rb.width < -20) this.radarBeams.splice(i, 1);
      }

      // Move interceptors
      for (let i = this.interceptors.length - 1; i >= 0; i--) {
        const ic = this.interceptors[i];
        ic.x -= this.obstacleSpeed * 0.5 * dt;
        ic.y += ic.vy * dt;
        if (ic.y < 20 || ic.y > H - 20) ic.vy *= -1;

        if (this.invincibleTimer <= 0) {
          const dist = Math.hypot(ic.x - this.drone.x, ic.y - this.drone.y);
          if (dist < this.drone.size + ic.size) {
            const result = this.takeDamage();
            if (result) return result;
            this.interceptors.splice(i, 1);
            continue;
          }
        }

        if (ic.x < -20) this.interceptors.splice(i, 1);
      }

      // Timeout fail
      if (this.phaseTimer > 25) return 'fail';
      return null;
    }

    // ======================== STRIKE PHASE ========================
    if (this.phase === 'strike') {
      this.phaseTimer += dt;

      // Target evasive movement (AI-driven dodging)
      const evadeIntensity = 60 * this.difficultyMod;
      this.target.vx = Math.sin(this.phaseTimer * 2.5) * evadeIntensity + Math.cos(this.phaseTimer * 4.1) * evadeIntensity * 0.5;
      this.target.vy = Math.cos(this.phaseTimer * 1.8) * evadeIntensity * 0.8 + Math.sin(this.phaseTimer * 3.7) * evadeIntensity * 0.3;

      this.target.x += this.target.vx * dt;
      this.target.y += this.target.vy * dt;
      this.target.x = Math.max(W * 0.3, Math.min(W - 120, this.target.x));
      this.target.y = Math.max(60, Math.min(H - 80, this.target.y));

      // Countermeasures (visual interference)
      this.countermeasureTimer += dt;
      if (this.countermeasureTimer > 3.0 + Math.random() * 4.0) {
        this.countermeasureTimer = 0;
        this.staticNoise = 1.0;
        window.tacticalAudio.playCountermeasure();
      }
      if (this.staticNoise > 0) this.staticNoise -= dt * 2.5;

      // Check lock-on
      const dx = this.crosshair.x - (this.target.x + this.target.w / 2);
      const dy = this.crosshair.y - (this.target.y + this.target.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const isLocked = dist < this.lockRadius && this.staticNoise <= 0.3;

      if (isLocked) {
        this.lockTimer += dt;
        if (this.lockTimer % 0.15 < dt) {
          window.tacticalAudio.playLockOnTone(true);
        }
      } else {
        this.lockTimer = Math.max(0, this.lockTimer - dt * 0.5);
        if (this.lockTimer > 0.1 && this.phaseTimer % 0.3 < dt) {
          window.tacticalAudio.playLockOnTone(false);
        }
      }

      // Lock complete → strike!
      if (this.lockTimer >= this.requiredLockTime) {
        this.target.hit = true;
        this.score.accuracy = Math.min(100, (this.lockTimer / this.requiredLockTime) * 80 + (1 - dist / this.lockRadius) * 20);
        this.phase = 'explosion';
        this.phaseTimer = 0;
        window.tacticalAudio.playShockwave();

        // Generate explosion particles
        const cx = this.target.x + this.target.w / 2;
        const cy = this.target.y + this.target.h / 2;
        for (let i = 0; i < 60; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 80 + Math.random() * 300;
          this.explosionParticles.push({
            x: cx, y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.6 + Math.random() * 0.8,
            maxLife: 0.6 + Math.random() * 0.8,
            size: 2 + Math.random() * 6,
            color: ['#ff4400', '#ffcc00', '#ff8800', '#ffffff', '#ff2200'][Math.floor(Math.random() * 5)]
          });
        }
        this.shockwaveRadius = 0;
        this.shockwaveAlpha = 1;

        return null;
      }

      // Timeout
      if (this.phaseTimer > 12) return 'fail';
      return null;
    }

    // ======================== EXPLOSION PHASE ========================
    if (this.phase === 'explosion') {
      this.phaseTimer += dt;

      // Shockwave expansion
      this.shockwaveRadius += 600 * dt;
      this.shockwaveAlpha = Math.max(0, 1.0 - this.phaseTimer / 1.2);

      // Update explosion particles
      for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
        const p = this.explosionParticles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 80 * dt; // gravity
        p.vx *= 0.98;
        p.life -= dt;
        if (p.life <= 0) this.explosionParticles.splice(i, 1);
      }

      if (this.phaseTimer > 2.0) {
        this.phase = 'rating';
        this.phaseTimer = 0;
        this.calculateRating();
        window.tacticalAudio.playRatingReveal(this.rating);
      }
      return null;
    }

    // ======================== RATING PHASE ========================
    if (this.phase === 'rating') {
      this.ratingTimer += dt;
      if (this.ratingTimer > 3.0) {
        return 'success';
      }
      return null;
    }

    return null;
  }

  takeDamage() {
    this.lives--;
    this.score.noDamage = false;
    if (this.lives <= 0) {
      this.drone.alive = false;
      return 'fail';
    }
    // Shield absorb
    this.invincibleTimer = 1.5;
    window.tacticalAudio.playShieldHit();
    return null;
  }

  calculateRating() {
    let points = 0;
    // Time bonus (faster = better)
    this.score.time = this.totalTime;
    if (this.totalTime < 10) points += 40;
    else if (this.totalTime < 15) points += 30;
    else if (this.totalTime < 20) points += 20;
    else points += 10;

    // Accuracy
    points += Math.floor(this.score.accuracy * 0.3);

    // Data pickups
    this.score.bonus = this.collectedData;
    points += this.collectedData * 5;

    // Perfect launch bonus
    if (this.score.perfectLaunch) points += 10;

    // No damage bonus
    if (this.score.noDamage) points += 15;

    if (points >= 80) this.rating = 'S';
    else if (points >= 55) this.rating = 'A';
    else if (points >= 35) this.rating = 'B';
    else this.rating = 'C';
  }

  _generateNoiseCanvas(w, h) {
    this._noiseCanvas = document.createElement('canvas');
    this._noiseCanvas.width = w;
    this._noiseCanvas.height = h;
    this._noiseCtx = this._noiseCanvas.getContext('2d');
    const imageData = this._noiseCtx.createImageData(w, h);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const v = Math.floor(Math.random() * 255);
      data[i] = v; data[i+1] = v; data[i+2] = v; data[i+3] = 255;
    }
    this._noiseCtx.putImageData(imageData, 0, 0);
  }

  // =========================================================================
  // DRAW — Cinematic Multi-Phase Rendering
  // =========================================================================
  draw() {
    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const W = this._drawW || this.canvas.width;
    const H = this._drawH || this.canvas.height;

    // Background
    ctx.fillStyle = '#060e0a';
    ctx.fillRect(0, 0, W, H);

    // Stars parallax
    ctx.fillStyle = 'rgba(180, 220, 200, 0.6)';
    this.bgStars.forEach(s => {
      ctx.globalAlpha = 0.3 + Math.sin(this.totalTime * 2 + s.x) * 0.2;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    });
    ctx.globalAlpha = 1;

    // Clouds
    this.bgClouds.forEach(c => {
      ctx.fillStyle = 'rgba(30, 60, 45, 0.25)';
      ctx.beginPath();
      ctx.ellipse(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, c.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Military grid (subtle)
    ctx.strokeStyle = 'rgba(0, 255, 102, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Scanlines
    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, y, W, 1);
    }

    // ======================== DRAW LAUNCH ========================
    if (this.phase === 'launch') {
      // Drone on catapult
      const droneY = H / 2;
      const launchX = 60 + this.launchProgress * 200;

      // Catapult rail
      ctx.strokeStyle = '#334433';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(30, droneY + 15);
      ctx.lineTo(280, droneY + 15);
      ctx.stroke();

      // Drone body
      ctx.save();
      ctx.translate(launchX, droneY);
      ctx.fillStyle = '#00ff66';
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.lineTo(-12, -10);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-12, 10);
      ctx.closePath();
      ctx.fill();
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // QTE bar
      const barX = W / 2 - 200;
      const barY = H - 100;
      const barW = 400;
      const barH = 30;

      ctx.fillStyle = '#0a1a10';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.strokeStyle = '#1a3a20';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barW, barH);

      // Perfect zone (center)
      const zoneW = barW * this.launchQTE.zone;
      ctx.fillStyle = this.launchQTE.hit ? 'rgba(0, 255, 102, 0.4)' : 'rgba(255, 204, 0, 0.3)';
      ctx.fillRect(barX + barW / 2 - zoneW, barY, zoneW * 2, barH);

      // Moving marker
      if (!this.launchQTE.hit) {
        const markerX = barX + this.launchQTE.marker * barW;
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(markerX - 3, barY - 5, 6, barH + 10);
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 10;
        ctx.fillRect(markerX - 3, barY - 5, 6, barH + 10);
        ctx.shadowBlur = 0;
      }

      // Instructions
      ctx.fillStyle = this.launchQTE.hit ? '#00ff66' : '#ffcc00';
      ctx.font = 'bold 18px "Rajdhani", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.launchQTE.hit ? (this.score.perfectLaunch ? '✨ ИДЕАЛЬНЫЙ ЗАПУСК! БОНУС СКОРОСТИ!' : '✓ ЗАПУСК ПОДТВЕРЖДЁН') : '>>> НАЖМИ [ПРОБЕЛ] В ЗЕЛЁНОЙ ЗОНЕ ДЛЯ ЗАПУСКА <<<', W / 2, barY - 20);

      ctx.fillStyle = '#557766';
      ctx.font = '14px monospace';
      ctx.fillText('ФАЗА 1/4: КАТАПУЛЬТА FPV-ДРОНА', W / 2, 30);
      ctx.textAlign = 'left';
      return;
    }

    // ======================== DRAW OBSTACLE ========================
    if (this.phase === 'obstacle') {
      // Trail particles
      this.trailParticles.forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, 2 + (1 - p.life / p.maxLife) * 3), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Radar beams
      this.radarBeams.forEach(rb => {
        if (rb.active) {
          const pulseAlpha = 0.3 + Math.sin(this.totalTime * 8) * 0.15;
          ctx.fillStyle = `rgba(255, 40, 40, ${pulseAlpha})`;
          ctx.fillRect(rb.x, rb.y - 6, rb.width, 12);
          ctx.strokeStyle = '#ff2a2a';
          ctx.lineWidth = 1;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(rb.x, rb.y - 6, rb.width, 12);
          ctx.setLineDash([]);

          ctx.fillStyle = '#ff4444';
          ctx.font = 'bold 9px monospace';
          ctx.fillText('РАДАР', rb.x + 5, rb.y - 10);
        } else {
          ctx.fillStyle = 'rgba(100, 40, 40, 0.15)';
          ctx.fillRect(rb.x, rb.y - 3, rb.width, 6);
        }
      });

      // Obstacles (PVO walls)
      for (const obs of this.obstacles) {
        // Top wall
        const topH = obs.gapY - this.obstacleGap / 2;
        const grad = ctx.createLinearGradient(obs.x, 0, obs.x + this.obstacleWidth, 0);
        grad.addColorStop(0, '#0a1f18');
        grad.addColorStop(0.5, '#132820');
        grad.addColorStop(1, '#0a1f18');
        ctx.fillStyle = grad;
        ctx.fillRect(obs.x, 0, this.obstacleWidth, topH);

        // Bottom wall
        const botY = obs.gapY + this.obstacleGap / 2;
        ctx.fillRect(obs.x, botY, this.obstacleWidth, H - botY);

        // Red border glow
        ctx.strokeStyle = '#ff2a2a';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, 0, this.obstacleWidth, topH);
        ctx.strokeRect(obs.x, botY, this.obstacleWidth, H - botY);

        // Hazard stripes
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(obs.x, topH - 4, this.obstacleWidth, 4);
        ctx.fillRect(obs.x, botY, this.obstacleWidth, 4);

        // Label
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 10px monospace';
        ctx.fillText('ПВО', obs.x + 8, topH - 10);
      }

      // Data pickups
      this.dataPickups.forEach(dp => {
        if (!dp.collected) {
          const pulseScale = 1 + Math.sin(dp.pulse) * 0.2;
          ctx.save();
          ctx.translate(dp.x, dp.y);
          ctx.scale(pulseScale, pulseScale);

          ctx.fillStyle = '#00e5ff';
          ctx.shadowColor = '#00e5ff';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          ctx.fillStyle = '#001a22';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('MB', 0, 3);
          ctx.textAlign = 'left';
          ctx.restore();
        }
      });

      // Interceptors
      this.interceptors.forEach(ic => {
        ctx.save();
        ctx.translate(ic.x, ic.y);
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.moveTo(-ic.size, 0);
        ctx.lineTo(ic.size, -ic.size * 0.5);
        ctx.lineTo(ic.size, ic.size * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
      });

      // FPV Drone
      if (this.drone.alive) {
        ctx.save();
        ctx.translate(this.drone.x, this.drone.y);
        const tilt = Math.min(0.4, this.drone.vy * 0.001);
        ctx.rotate(tilt);

        // Invincibility flash
        if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 10) % 2 === 0) {
          ctx.globalAlpha = 0.5;
        }

        // Body
        ctx.fillStyle = '#00ff66';
        ctx.beginPath();
        ctx.moveTo(this.drone.size, 0);
        ctx.lineTo(-this.drone.size * 0.6, -this.drone.size * 0.7);
        ctx.lineTo(-this.drone.size * 0.3, 0);
        ctx.lineTo(-this.drone.size * 0.6, this.drone.size * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Engine flame
        const flameLen = 8 + Math.random() * 10;
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.moveTo(-this.drone.size * 0.3, -3);
        ctx.lineTo(-this.drone.size * 0.3 - flameLen, 0);
        ctx.lineTo(-this.drone.size * 0.3, 3);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // HUD overlay
      ctx.fillStyle = '#557766';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`ФАЗА 2/4: ПРОРЫВ ПВО — ${this.passed} / ${this.requiredPass} ЗОН`, W / 2, 30);
      ctx.textAlign = 'left';

      // Lives display
      ctx.fillStyle = '#00ff66';
      ctx.font = '14px monospace';
      for (let i = 0; i < this.maxLives; i++) {
        ctx.fillText(i < this.lives ? '♥' : '♡', 15 + i * 22, 30);
      }

      // Data collected
      if (this.collectedData > 0) {
        ctx.fillStyle = '#00e5ff';
        ctx.fillText(`📡 +${this.collectedData * 15} МБ`, W - 130, 30);
      }
      return;
    }

    // ======================== DRAW STRIKE ========================
    if (this.phase === 'strike') {
      // Static noise overlay — optimized (pre-generated noise canvas)
      if (this.staticNoise > 0 && this._noiseCanvas) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.6, this.staticNoise * 0.5);
        ctx.globalCompositeOperation = 'overlay';
        // Shift noise position each frame for variety
        const ox = (Math.random() * 100 - 50) | 0;
        const oy = (Math.random() * 100 - 50) | 0;
        ctx.drawImage(this._noiseCanvas, ox, oy);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Target ship
      if (!this.target.hit) {
        ctx.save();
        ctx.translate(this.target.x, this.target.y);

        // Ship hull
        ctx.fillStyle = '#3a4a55';
        ctx.beginPath();
        ctx.moveTo(this.target.w, this.target.h / 2);
        ctx.lineTo(this.target.w * 0.75, 0);
        ctx.lineTo(0, 2);
        ctx.lineTo(-12, this.target.h / 2);
        ctx.lineTo(0, this.target.h - 2);
        ctx.lineTo(this.target.w * 0.75, this.target.h);
        ctx.closePath();
        ctx.fill();

        // Superstructure
        ctx.fillStyle = '#2a3a44';
        ctx.fillRect(this.target.w * 0.2, -8, this.target.w * 0.35, 12);

        // Target reticle
        ctx.strokeStyle = '#ff2a2a';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(this.target.w / 2, this.target.h / 2, 50, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.target.w / 2, this.target.h / 2, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
      }

      // Crosshair
      const lockProgress = Math.min(1, this.lockTimer / this.requiredLockTime);
      const cx = this.crosshair.x;
      const cy = this.crosshair.y;

      ctx.save();
      ctx.translate(cx, cy);

      // Lock arc
      if (lockProgress > 0) {
        ctx.strokeStyle = '#ff2a2a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 32, -Math.PI / 2, -Math.PI / 2 + lockProgress * Math.PI * 2);
        ctx.stroke();
      }

      // Crosshair outer
      ctx.strokeStyle = lockProgress > 0.8 ? '#ff2a2a' : '#00ff66';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair lines
      ctx.beginPath();
      ctx.moveTo(-40, 0); ctx.lineTo(-14, 0);
      ctx.moveTo(14, 0); ctx.lineTo(40, 0);
      ctx.moveTo(0, -40); ctx.lineTo(0, -14);
      ctx.moveTo(0, 14); ctx.lineTo(0, 40);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = lockProgress > 0.8 ? '#ff2a2a' : '#00ff66';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Phase label
      ctx.fillStyle = '#557766';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ФАЗА 3/4: ТЕРМАЛЬНЫЙ ЗАХВАТ ЦЕЛИ', W / 2, 30);

      // Lock status
      ctx.fillStyle = lockProgress > 0.8 ? '#ff2a2a' : '#00ff66';
      ctx.font = 'bold 16px "Rajdhani", monospace';
      const lockPct = Math.floor(lockProgress * 100);
      ctx.fillText(lockProgress > 0.8 ? `>>> ЗАХВАТ: ${lockPct}% — УДЕРЖИВАЙ ПРИЦЕЛ! <<<` : `НАВЕДИ ПРИЦЕЛ НА ЦЕЛЬ (${lockPct}%)`, W / 2, H - 30);
      ctx.textAlign = 'left';

      // RWR warning flashes
      if (this.staticNoise > 0.3) {
        ctx.fillStyle = `rgba(255, 40, 40, ${this.staticNoise * 0.3})`;
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ КОНТРМЕРЫ ПРОТИВНИКА ⚠', W / 2, H / 2 - 40);
        ctx.textAlign = 'left';
      }
      return;
    }

    // ======================== DRAW EXPLOSION ========================
    if (this.phase === 'explosion') {
      // White flash
      const flashAlpha = Math.max(0, 1.0 - this.phaseTimer / 0.4);
      if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.8})`;
        ctx.fillRect(0, 0, W, H);
      }

      // Shockwave ring
      if (this.shockwaveAlpha > 0) {
        const cx = this.target.x + this.target.w / 2;
        const cy = this.target.y + this.target.h / 2;
        ctx.strokeStyle = `rgba(255, 200, 100, ${this.shockwaveAlpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0, this.shockwaveRadius), 0, Math.PI * 2);
        ctx.stroke();

        // Inner shockwave
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.shockwaveAlpha * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0, this.shockwaveRadius * 0.6), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Explosion particles
      this.explosionParticles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0, p.size * (p.life / p.maxLife)), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Title
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 32px "Rajdhani", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 20;
      ctx.fillText('💥 КИНЕТИЧЕСКИЙ УДАР ПОДТВЕРЖДЁН!', W / 2, H / 2);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#557766';
      ctx.font = '14px monospace';
      ctx.fillText('ФАЗА 4/4: УДАР И УНИЧТОЖЕНИЕ', W / 2, 30);
      ctx.textAlign = 'left';
      return;
    }

    // ======================== DRAW RATING ========================
    if (this.phase === 'rating') {
      // Dark cinematic background
      ctx.fillStyle = 'rgba(5, 10, 8, 0.95)';
      ctx.fillRect(0, 0, W, H);

      // Rating letter with glow
      const colors = { S: '#ffcc00', A: '#00ff66', B: '#00bfff', C: '#888888' };
      const ratingColor = colors[this.rating] || '#888888';

      ctx.textAlign = 'center';
      ctx.fillStyle = ratingColor;
      ctx.shadowColor = ratingColor;
      ctx.shadowBlur = 40;
      ctx.font = `bold ${Math.min(120, 60 + this.ratingTimer * 30)}px "Rajdhani", sans-serif`;
      ctx.fillText(this.rating, W / 2, H / 2 - 20);
      ctx.shadowBlur = 0;

      // Details
      ctx.font = '16px monospace';
      ctx.fillStyle = '#ccddcc';
      const statY = H / 2 + 40;
      ctx.fillText(`ВРЕМЯ: ${this.score.time.toFixed(1)}с`, W / 2, statY);
      ctx.fillText(`ТОЧНОСТЬ ЗАХВАТА: ${Math.floor(this.score.accuracy)}%`, W / 2, statY + 25);
      ctx.fillText(`БОНУСНЫЕ ДАННЫЕ: +${this.collectedData * 15} МБ`, W / 2, statY + 50);

      if (this.score.perfectLaunch) {
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('✨ ИДЕАЛЬНЫЙ ЗАПУСК', W / 2, statY + 75);
      }
      if (this.score.noDamage) {
        ctx.fillStyle = '#00ff66';
        ctx.fillText('👻 БЕЗ ПОВРЕЖДЕНИЙ', W / 2, statY + (this.score.perfectLaunch ? 100 : 75));
      }

      ctx.textAlign = 'left';
    }
  }
}

// =========================================================================
// DAILY QUEST TEMPLATES
// =========================================================================
const DAILY_QUEST_TEMPLATES = [
  {
    id: 'clicks',
    desc: 'Произвести {n} тактических кликов/разведок',
    icon: '🎯',
    getN: (p) => 50 + p * 25,
    check: (g, target) => (g.dailyClicks || 0) >= target
  },
  {
    id: 'data',
    desc: 'Собрать {n} МБ разведывательных данных',
    icon: '📡',
    getN: (p) => 200 + p * 150,
    check: (g, target) => (g.dailyDataCollected || 0) >= target
  },
  {
    id: 'credits',
    desc: 'Заработать ${n} на контрактах и потоках',
    icon: '💰',
    getN: (p) => 5000 + p * 5000,
    check: (g, target) => (g.dailyCreditsEarned || 0) >= target
  },
  {
    id: 'crits',
    desc: 'Выполнить {n} критических перехватов данных',
    icon: '⚡',
    getN: (p) => 10 + p * 5,
    check: (g, target) => (g.dailyCrits || 0) >= target
  },
  {
    id: 'hacks',
    desc: 'Успешно завершить {n} взломов РЭБ врага',
    icon: '📻',
    getN: (p) => 2 + p,
    check: (g, target) => (g.dailyHacks || 0) >= target
  },
  {
    id: 'overclock',
    desc: 'Использовать боевой разгон {n} раз(а)',
    icon: '🚀',
    getN: (p) => 3 + p,
    check: (g, target) => (g.dailyOverclocks || 0) >= target
  }
];

// ==============================================
// MAIN BARRACUDA GAME CLASS v8
// (Optimized + Boss Ships + Daily Quests + Offline Income + Campaign + Hangar)
// ==============================================
class BarracudaGame {
  constructor() {
    this.dataMB = 0.0;
    this.totalDataMB = 0.0;
    this.creditsUSD = 500;
    this.blueprintsBP = 0;
    this.sunkenShips = 0;
    this.totalClicks = 0;
    this.totalCrits = 0;
    this.totalHacks = 0;
    this.overclockUses = 0;
    this.visitedSectors = new Set(['sector-1']);
    this.shieldSaves = 0;

    // Drone Prototype & Hangar
    this.selectedPrototype = 'phantom';
    this.unlockedPrototypes = new Set(['phantom']);
    this.salvage = { box: 0, chips: 0, titanium: 0, aicore: 0 };
    this.craftedModules = new Set();

    // Story Campaign & Mission System
    this.campaignAct = 1;
    this.completedMissions = new Set();
    this.activeMission = null;
    this.missionPhase = 0; // 0: Idle, 1: SIGINT Scan, 2: EW Jam, 3: FPV Strike, 4: Extraction

    // Tactical Radio Comms Terminal
    this.commsActive = false;
    this.commsQueue = [];
    this.commsTypewriterInterval = null;

    // Assault charge — separate progressive counter
    this.assaultCharge = 0;
    this.assaultChargeMax = 500;

    this.currentSector = 'sector-1';

    this.hw = { satcom: 0, optics: 0, armor: 0, waterjets: 0, missiles: 0 };
    this.cyber = { sniffer: 0, quantum: 0, autosiphon: 0 };
    this.tech = { swarmAI: false };

    // Ship HP system
    this.shipHP = 100;
    this.shipMaxHP = 100;
    this.shipLevel = 1;

    // Weapon cooldown
    this.weaponCooldown = 0;
    this.weaponCooldownMax = 1.5; // seconds

    // Settings
    this.soundEnabled = true;
    this.musicVolume = 0.7;
    this.sfxVolume = 1.0;

    this.isOverclocked = false;
    this.overclockTimer = 0;
    this.overclockCooldown = 0;

    // Dynamic contracts
    this.contractPool = this.generateContracts();
    this.activeContracts = this.contractPool.slice(0, 3);
    this.contractGenCounter = 0;

    this.currentDossierStage = 0;
    this.dossierHasUnread = false;
    this.typewriterTimer = null;

    // SIGINT Spectrum Hack — enhanced
    this.targetFreq = 142.5;
    this.targetAmp = 1.2;
    this.currentFreq = 100.0;
    this.currentAmp = 0.5;
    this.cyberHackTimer = 30;
    this.cyberHackActive = false;
    this.cyberInterferenceTimer = 0;
    this.cyberInterferenceActive = false;
    this.cyberComboChannel = 0;

    this.fpvGame = new FPVMinigame();
    this.minigameActive = false;
    this.lastAssaultRating = '';
    this.lastAssaultNoDamage = false;
    this.lastAssaultPerfectLaunch = false;
    this.lastAssaultSpeedDemon = false;

    // Random events
    this.eventTimer = 15 + Math.random() * 30;
    this.activeEvent = null;
    this.eventClickCount = 0;
    this.eventCountdown = 0;
    this.empState = null; // { phase: 'down'|'boost', timer: 0 }

    // Achievements
    this.unlockedAchievements = new Set();
    this.achievementQueue = [];

    // Notification queue
    this.notifications = [];

    // === PERFORMANCE: UI throttle timers ===
    this._uiDirty = true;
    this._uiThrottleAccum = 0;
    this._achieveCheckAccum = 0;

    // === BOSS SHIPS ===
    this.bossActive = false;
    this.currentBoss = null;
    this.bossesDefeated = 0;

    // === DAILY QUESTS ===
    this.dailyQuests = [];
    this.dailyQuestDate = '';
    this.dailyClicks = 0;
    this.dailyDataCollected = 0;
    this.dailyCreditsEarned = 0;
    this.dailyAssaults = 0;
    this.dailyHacks = 0;
    this.dailyCrits = 0;
    this.dailyOverclocks = 0;

    this.loadGame();
    this.processOfflineIncome();
    this.initDailyQuests();
    this.init3D();
    this.initDOM();
    this.initCampaignAndHangar();
    this.initEvents();
    this.startLoop();
    this.updateDossier(DOSSIER_LORE[0], false);
    this._uiDirty = true;

    // Auto-show help or initial Comms transmission for new players
    if (!localStorage.getItem('barracuda_intro_seen')) {
      setTimeout(() => {
        this.showCommsTransmission({
          speaker: 'ШТАБ [МАЯК]',
          role: 'HQ',
          text: 'Оператор! Вас приветствует Центр Морских Спецопераций. Автономный дрон «Барракуда» спущен на воду в квадрате 4. Ваша первоочередная задача — начать перехват данных РЛС противника и провести первую разведку в меню ОПЕРАЦИИ.',
          choices: [
            { text: '«Вас понял, штаб. Начинаю операцию.»', action: () => { this.addNotification('📡 СВЯЗЬ УСТАНОВЛЕНА', 'Штаб подтвердил радиоканал.'); } },
            { text: '«Запросить тактическую справку.»', action: () => { const h = document.getElementById('help-modal'); if (h) h.classList.add('active'); } }
          ]
        });
        localStorage.setItem('barracuda_intro_seen', '1');
      }, 1200);
    }
  }

  // =========================================================================
  // DYNAMIC CONTRACT GENERATION
  // =========================================================================
  generateContracts() {
    const templates = [
      { base: 'ПОДВОДНЫЙ КАБЕЛЬ', costMB: 30, costUSD: 0, rewardUSD: 1500, rewardMB: 80, duration: 6 },
      { base: 'РАДАРНАЯ ЛОВУШКА', costMB: 150, costUSD: 500, rewardUSD: 6000, rewardMB: 300, duration: 12 },
      { base: 'КОНВОЙ СНАБЖЕНИЯ', costMB: 80, costUSD: 1000, rewardUSD: 8000, rewardMB: 200, duration: 8 },
      { base: 'ПЕРЕХВАТ СПУТНИКА', costMB: 200, costUSD: 2000, rewardUSD: 15000, rewardMB: 500, duration: 15 },
      { base: 'ДЕСАНТНАЯ ОПЕРАЦИЯ', costMB: 120, costUSD: 1500, rewardUSD: 10000, rewardMB: 350, duration: 10 },
      { base: 'МИННОЕ ЗАГРАЖДЕНИЕ', costMB: 60, costUSD: 300, rewardUSD: 4000, rewardMB: 150, duration: 7 },
    ];

    const scale = 1 + this.contractGenCounter * 0.3;
    const contracts = [];
    const shuffled = shuffleArray(templates).slice(0, 3);

    shuffled.forEach((t, i) => {
      contracts.push({
        id: `c${this.contractGenCounter * 10 + i}`,
        name: `ОП: ${t.base}`,
        costMB: Math.floor(t.costMB * scale),
        costUSD: Math.floor(t.costUSD * scale),
        rewardUSD: Math.floor(t.rewardUSD * scale),
        rewardMB: Math.floor(t.rewardMB * scale),
        rewardBP: 0,
        progress: 0,
        duration: t.duration,
        active: false,
        completed: false
      });
    });

    return contracts;
  }

  refreshContracts() {
    const allDone = this.activeContracts.every(c => c.completed);
    if (allDone) {
      this.contractGenCounter++;
      this.activeContracts = this.generateContracts();
      this.rebuildContractDOM();
      this.addNotification('📜 НОВЫЕ КОНТРАКТЫ', 'Доступны новые спецоперации!');
    }
  }

  // =========================================================================
  // SAVE / LOAD (localStorage)
  // =========================================================================
  saveGame() {
    try {
      const data = {
        dataMB: this.dataMB,
        totalDataMB: this.totalDataMB,
        maxCapacityMB: this.assaultChargeMax,
        assaultCharge: this.assaultCharge,
        assaultChargeMax: this.assaultChargeMax,
        creditsUSD: this.creditsUSD,
        blueprintsBP: this.blueprintsBP,
        sunkenShips: this.sunkenShips,
        totalClicks: this.totalClicks,
        totalCrits: this.totalCrits,
        totalHacks: this.totalHacks,
        overclockUses: this.overclockUses,
        visitedSectors: [...this.visitedSectors],
        shieldSaves: this.shieldSaves,
        currentSector: this.currentSector,
        selectedPrototype: this.selectedPrototype,
        unlockedPrototypes: [...this.unlockedPrototypes],
        salvage: this.salvage,
        craftedModules: [...this.craftedModules],
        campaignAct: this.campaignAct,
        completedMissions: [...this.completedMissions],
        hw: this.hw,
        cyber: this.cyber,
        tech: this.tech,
        contractGenCounter: this.contractGenCounter,
        currentDossierStage: this.currentDossierStage,
        unlockedAchievements: [...this.unlockedAchievements],
        bossesDefeated: this.bossesDefeated,
        dailyQuestDate: this.dailyQuestDate,
        dailyQuests: this.dailyQuests,
        shipHP: this.shipHP,
        shipMaxHP: this.shipMaxHP,
        shipLevel: this.shipLevel,
        soundEnabled: this.soundEnabled,
        savedAt: Date.now()
      };
      localStorage.setItem('barracuda_save', JSON.stringify(data));
    } catch (e) {
      console.warn('Save failed:', e);
    }
  }

  loadGame() {
    try {
      const raw = localStorage.getItem('barracuda_save');
      if (!raw) return;
      const data = JSON.parse(raw);

      this.dataMB = data.dataMB || 0;
      this.totalDataMB = data.totalDataMB || 0;
      this.assaultCharge = data.assaultCharge || 0;
      this.assaultChargeMax = Math.max(500, Math.floor(500 * (1.0 + (data.blueprintsBP || 0) * 0.4)));
      this.creditsUSD = data.creditsUSD || 500;
      this.blueprintsBP = data.blueprintsBP || 0;
      this.sunkenShips = data.sunkenShips || 0;
      this.totalClicks = data.totalClicks || 0;
      this.totalCrits = data.totalCrits || 0;
      this.totalHacks = data.totalHacks || 0;
      this.overclockUses = data.overclockUses || 0;
      this.visitedSectors = new Set(data.visitedSectors || ['sector-1']);
      this.shieldSaves = data.shieldSaves || 0;
      this.currentSector = data.currentSector || 'sector-1';

      this.selectedPrototype = data.selectedPrototype || 'phantom';
      this.unlockedPrototypes = new Set(data.unlockedPrototypes || ['phantom']);
      this.salvage = Object.assign({ box: 0, chips: 0, titanium: 0, aicore: 0 }, data.salvage || {});
      this.craftedModules = new Set(data.craftedModules || []);
      this.campaignAct = data.campaignAct || 1;
      this.completedMissions = new Set(data.completedMissions || []);

      this.hw = data.hw || this.hw;
      this.cyber = data.cyber || this.cyber;
      this.tech = data.tech || this.tech;
      this.contractGenCounter = data.contractGenCounter || 0;
      this.currentDossierStage = data.currentDossierStage || 0;
      this.unlockedAchievements = new Set(data.unlockedAchievements || []);
      this.bossesDefeated = data.bossesDefeated || 0;
      this.dailyQuestDate = data.dailyQuestDate || '';
      this.dailyQuests = data.dailyQuests || [];
      this.shipHP = data.shipHP || 100;
      this.shipMaxHP = data.shipMaxHP || 100;
      this.shipLevel = data.shipLevel || 1;
      this.soundEnabled = data.soundEnabled !== false;
      this._savedAt = data.savedAt || 0;

      // Regenerate contracts for current tier
      this.activeContracts = this.generateContracts();

      // Re-apply persistent tech effects
      if (this.tech.ecm_suite) this.weaponCooldownMax = Math.max(0.5, 1.5 * 0.5);
      if (this.tech.swarmAI && this.engine3D) this.engine3D.updateSwarmEscorts(true);
      if (this.engine3D) this.engine3D.setDronePrototype(this.selectedPrototype);
    } catch (e) {
      console.warn('Load failed:', e);
    }
  }

  // =========================================================================
  // OFFLINE INCOME — award passive income for time away (capped at 4 hours)
  // =========================================================================
  processOfflineIncome() {
    if (!this._savedAt) return;
    const elapsed = (Date.now() - this._savedAt) / 1000;
    if (elapsed < 30) return; // less than 30 seconds away — skip

    const maxOffline = 4 * 3600; // 4 hours cap
    const offlineSec = Math.min(elapsed, maxOffline);
    const passiveMB = this.getPassiveRate();
    const passiveUSD = this.getUSDPassiveRate();

    // Apply at 50% efficiency (offline penalty)
    const gainMB = passiveMB * offlineSec * 0.5;
    const gainUSD = passiveUSD * offlineSec * 0.5;

    if (gainMB > 0 || gainUSD > 0) {
      this.dataMB += gainMB;
      this.totalDataMB += gainMB;
      this.creditsUSD += gainUSD;

      const hours = Math.floor(elapsed / 3600);
      const mins = Math.floor((elapsed % 3600) / 60);
      const timeStr = hours > 0 ? `${hours}ч ${mins}м` : `${mins}м`;

      setTimeout(() => {
        this.addNotification('🌙 ОФЛАЙН ДОХОД', `За ${timeStr} отсутствия: +${Math.floor(gainMB)} МБ, +$${Math.floor(gainUSD).toLocaleString()}`);
      }, 2000);
    }
  }

  // =========================================================================
  // DAILY QUESTS
  // =========================================================================
  initDailyQuests() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.dailyQuestDate !== today) {
      // New day — generate new quests, reset counters
      this.dailyQuestDate = today;
      this.dailyClicks = 0;
      this.dailyDataCollected = 0;
      this.dailyCreditsEarned = 0;
      this.dailyAssaults = 0;
      this.dailyHacks = 0;
      this.dailyCrits = 0;
      this.dailyOverclocks = 0;

      const prestige = this.blueprintsBP;
      const shuffled = shuffleArray(DAILY_QUEST_TEMPLATES).slice(0, 3);
      this.dailyQuests = shuffled.map((tmpl, i) => {
        const n = tmpl.getN(prestige);
        return {
          id: tmpl.id,
          desc: tmpl.desc.replace('{n}', n),
          icon: tmpl.icon,
          target: n,
          completed: false,
          reward: { mb: 20 + prestige * 10, usd: 3000 + prestige * 1500 }
        };
      });
      this.saveGame();
    }
  }

  checkDailyQuests() {
    if (!this.dailyQuests || this.dailyQuests.length === 0) return;

    let allDone = true;
    this.dailyQuests.forEach(q => {
      if (q.completed) return;

      const tmpl = DAILY_QUEST_TEMPLATES.find(t => t.id === q.id);
      if (tmpl && tmpl.check(this, q.target)) {
        q.completed = true;
        this.dataMB += q.reward.mb;
        this.totalDataMB += q.reward.mb;
        this.creditsUSD += q.reward.usd;
        this.addNotification(`${q.icon} КВЕСТ ВЫПОЛНЕН`, `${q.desc} — +${q.reward.mb} МБ, +$${q.reward.usd}`);
        window.tacticalAudio.playContractSfx();
      }

      if (!q.completed) allDone = false;
    });

    if (allDone && this.dailyQuests.every(q => q.completed)) {
      this.checkAchievement('daily_complete');
    }
  }

  // =========================================================================
  // BOSS SHIPS — triggered every 5 sunk ships
  // =========================================================================
  shouldTriggerBoss() {
    return this.sunkenShips > 0 && this.sunkenShips % 5 === 0 && !this.bossActive;
  }

  getBossForLevel() {
    const idx = Math.min(BOSS_SHIPS.length - 1, Math.floor(this.bossesDefeated / 2));
    return BOSS_SHIPS[idx];
  }

  // =========================================================================
  // ACHIEVEMENTS
  // =========================================================================
  checkAchievement(id) {
    if (this.unlockedAchievements.has(id)) return;
    const def = ACHIEVEMENTS_DEF.find(a => a.id === id);
    if (!def) return;

    this.unlockedAchievements.add(id);
    this.addNotification(`${def.icon} ДОСТИЖЕНИЕ`, def.name);
    window.tacticalAudio.playAchievementUnlock();
    this.saveGame();
  }

  checkAllAchievements() {
    if (this.totalClicks >= 1) this.checkAchievement('first_click');
    if (this.totalCrits >= 50) this.checkAchievement('crit_master');
    if (this.creditsUSD >= 100000) this.checkAchievement('millionaire');
    if (this.totalDataMB >= 10000) this.checkAchievement('data_hoarder');
    if (this.sunkenShips >= 10) this.checkAchievement('fleet_admiral');
    if (this.totalHacks >= 10) this.checkAchievement('hacker');
    if (this.visitedSectors.size >= 4) this.checkAchievement('all_sectors');
    if (this.overclockUses >= 5) this.checkAchievement('overclock_5');
    if (this.shieldSaves >= 3) this.checkAchievement('survivor');
    if (this.bossesDefeated >= 1) this.checkAchievement('boss_slayer');
  }

  // =========================================================================
  // NOTIFICATIONS
  // =========================================================================
  addNotification(title, text) {
    const notif = { title, text, timer: 4.0, id: Date.now() + Math.random() };
    this.notifications.push(notif);
    this.renderNotifications();
  }

  renderNotifications() {
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      document.body.appendChild(container);
    }

    // Only add newest one
    const latest = this.notifications[this.notifications.length - 1];
    if (!latest) return;

    const el = document.createElement('div');
    el.className = 'tactical-notification';
    el.innerHTML = `<div class="notif-title">${latest.title}</div><div class="notif-text">${latest.text}</div>`;
    container.appendChild(el);

    // Animate in
    requestAnimationFrame(() => el.classList.add('show'));

    // Auto remove
    setTimeout(() => {
      el.classList.remove('show');
      el.classList.add('hide');
      setTimeout(() => el.remove(), 400);
    }, 4000);
  }

  // =========================================================================
  // RANDOM EVENTS
  // =========================================================================
  updateRandomEvents(dt) {
    if (this.minigameActive) return;

    this.eventTimer -= dt;
    if (this.eventTimer <= 0 && !this.activeEvent) {
      this.eventTimer = 30 + Math.random() * 45;
      this.triggerRandomEvent();
    }

    // Active event processing
    if (this.activeEvent) {
      this.eventCountdown -= dt;

      if (this.activeEvent.type === 'click_challenge') {
        if (this.eventClickCount >= this.activeEvent.requirement) {
          // Success!
          this.addData(this.activeEvent.reward.mb * this.getGlobalMultiplier());
          this.addCredits(this.activeEvent.reward.usd * this.getGlobalMultiplier());
          this.addNotification('✅ ПАТРУЛЬ ОТБИТ', `+${this.activeEvent.reward.mb} МБ, +$${this.activeEvent.reward.usd}`);
          this.clearActiveEvent();
          return;
        }
        if (this.eventCountdown <= 0) {
          // Failed — penalty
          this.dataMB = Math.max(0, this.dataMB * (1 - this.activeEvent.penalty));
          this.addNotification('❌ ДАННЫЕ ПЕРЕХВАЧЕНЫ', `Потеряно ${Math.floor(this.activeEvent.penalty * 100)}% данных!`);
          this.clearActiveEvent();
          return;
        }
      }

      if (this.activeEvent.type === 'quick_action') {
        if (this.eventCountdown <= 0) {
          this.dataMB = Math.max(0, this.dataMB + this.activeEvent.penalty.mb);
          this.creditsUSD = Math.max(0, this.creditsUSD + this.activeEvent.penalty.usd);
          this.addNotification('❌ ОБНАРУЖЕНЫ', 'Разведсамолёт зафиксировал координаты!');
          this.clearActiveEvent();
          return;
        }
      }
    }

    // EMP state machine
    if (this.empState) {
      this.empState.timer -= dt;
      if (this.empState.phase === 'down' && this.empState.timer <= 0) {
        this.empState = { phase: 'boost', timer: this.empState.boostDuration || 5 };
        this.addNotification('⚡ РЕЗОНАНС', 'Пассивный доход x3 на 5 секунд!');
      } else if (this.empState.phase === 'boost' && this.empState.timer <= 0) {
        this.empState = null;
      }
    }
  }

  triggerRandomEvent() {
    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    window.tacticalAudio.playEventAlert();

    if (event.type === 'bonus') {
      this.addData(event.reward.mb * this.getGlobalMultiplier());
      this.addCredits(event.reward.usd * this.getGlobalMultiplier());
      this.addNotification(event.name, `${event.desc} +${event.reward.mb} МБ, +$${event.reward.usd}`);
      return;
    }

    if (event.type === 'emp') {
      this.empState = { phase: 'down', timer: event.downDuration, boostDuration: event.boostDuration };
      this.addNotification(event.name, event.desc);
      return;
    }

    // Interactive events
    this.activeEvent = { ...event };
    this.eventCountdown = event.duration;
    this.eventClickCount = 0;
    this.showEventBanner();
  }

  clearActiveEvent() {
    this.activeEvent = null;
    const banner = document.getElementById('event-banner');
    if (banner) banner.classList.remove('show');
  }

  handleEventAction() {
    if (!this.activeEvent) return;
    if (this.activeEvent.type === 'quick_action') {
      this.addData(this.activeEvent.reward.mb * this.getGlobalMultiplier());
      this.addCredits(this.activeEvent.reward.usd * this.getGlobalMultiplier());
      this.addNotification('✅ РАЗВЕДЧИК НЕЙТРАЛИЗОВАН', `+${this.activeEvent.reward.mb} МБ, +$${this.activeEvent.reward.usd}`);
      this.clearActiveEvent();
    }
  }

  showEventBanner() {
    let banner = document.getElementById('event-banner');
    if (!banner) return;

    const ev = this.activeEvent;
    document.getElementById('event-banner-title').textContent = ev.name;
    document.getElementById('event-banner-desc').textContent = ev.desc;
    document.getElementById('event-banner-timer').textContent = `${Math.ceil(ev.duration)}с`;

    const actionBtn = document.getElementById('event-banner-action');
    if (ev.type === 'quick_action') {
      actionBtn.style.display = 'block';
      actionBtn.textContent = '🎯 НЕЙТРАЛИЗОВАТЬ';
    } else if (ev.type === 'click_challenge') {
      actionBtn.style.display = 'none';
    }

    banner.classList.add('show');
  }

  updateEventBannerUI() {
    if (!this.activeEvent) return;
    const timerEl = document.getElementById('event-banner-timer');
    if (timerEl) timerEl.textContent = `${Math.max(0, this.eventCountdown).toFixed(1)}с`;

    if (this.activeEvent.type === 'click_challenge') {
      const progEl = document.getElementById('event-banner-progress');
      if (progEl) progEl.textContent = `КЛИКОВ: ${this.eventClickCount} / ${this.activeEvent.requirement}`;
    }
  }

  // =========================================================================
  // ENGINE INIT & MULTIPLIERS
  // =========================================================================
  init3D() {
    try {
      this.engine3D = new Barracuda3DEngine('drone-3d-viewport', (x, y) => {
        this.handleClick(x, y);
      });
    } catch (e) {
      console.error('[BARRACUDA 3D] Engine initialization error:', e);
    }
  }

  getMaxBufferMB() {
    if (this.tech && this.tech.data_nexus) return Infinity;
    const base = 5000; // 5.0 GB default capacity
    const satcomBonus = (this.hw.satcom || 0) * 2500;
    const snifferBonus = (this.cyber.sniffer || 0) * 5000;
    const quantumBonus = (this.craftedModules && this.craftedModules.has('quantum_booster') ? 25000 : 0);
    const prestigeBonus = (this.blueprintsBP || 0) * 10000;
    return base + satcomBonus + snifferBonus + quantumBonus + prestigeBonus;
  }

  getGlobalMultiplier() {
    const sectorMult = SECTOR_INFO[this.currentSector]?.mult || 1.0;
    return (1.0 + this.blueprintsBP * 0.5) * sectorMult;
  }

  getClickPower() {
    let base = 4.0 + (this.hw.satcom * 6.0) + (this.hw.optics * 12.0);
    if (this.isOverclocked) base *= 3.0;
    const proto = DRONE_PROTOTYPES_DEF[this.selectedPrototype] || DRONE_PROTOTYPES_DEF.phantom;
    base *= (proto.clickMult || 1.0);
    return base * this.getGlobalMultiplier();
  }

  getClickCashGain() {
    let base = 25 + this.hw.optics * 50 + this.cyber.autosiphon * 100;
    const proto = DRONE_PROTOTYPES_DEF[this.selectedPrototype] || DRONE_PROTOTYPES_DEF.phantom;
    base *= (proto.clickMult || 1.0);
    return Math.floor(base * this.getGlobalMultiplier());
  }

  getCritChance() {
    let base = 0.05 + this.hw.optics * 0.08 + this.cyber.quantum * 0.12;
    if (this.craftedModules && this.craftedModules.has('quantum_booster')) base += 0.20;
    return Math.min(0.85, base);
  }

  getPassiveRate() {
    let rate = (this.hw.armor * 3.0) + (this.hw.waterjets * 8.0) + (this.cyber.sniffer * 10.0);
    const proto = DRONE_PROTOTYPES_DEF[this.selectedPrototype] || DRONE_PROTOTYPES_DEF.phantom;
    rate *= (proto.passiveMult || 1.0);
    if (this.craftedModules && this.craftedModules.has('escort_wingman')) rate *= 2.0;
    if (this.tech.swarmAI) rate *= 2.0;
    if (this.isOverclocked) rate *= 2.0;

    // EMP states
    if (this.empState) {
      if (this.empState.phase === 'down') return 0;
      if (this.empState.phase === 'boost') rate *= 3.0;
    }

    return rate * this.getGlobalMultiplier();
  }

  getUSDPassiveRate() {
    let rate = 50 + this.cyber.autosiphon * 150;
    const proto = DRONE_PROTOTYPES_DEF[this.selectedPrototype] || DRONE_PROTOTYPES_DEF.phantom;
    rate *= (proto.passiveMult || 1.0);
    if (this.craftedModules && this.craftedModules.has('escort_wingman')) rate *= 2.0;
    rate *= this.getGlobalMultiplier();
    if (this.empState && this.empState.phase === 'down') return 0;
    if (this.empState && this.empState.phase === 'boost') rate *= 3.0;
    return rate;
  }

  getHWCost(type) {
    const basesMB = { satcom: 100, optics: 250, armor: 500, waterjets: 1000, missiles: 2500 };
    const basesUSD = { satcom: 250, optics: 600, armor: 1200, waterjets: 2500, missiles: 6000 };
    const scales = { satcom: 2.1, optics: 2.15, armor: 2.2, waterjets: 2.25, missiles: 2.3 };
    const lvl = this.hw[type] || 0;
    return {
      mb: Math.floor(basesMB[type] * Math.pow(scales[type], lvl)),
      usd: Math.floor(basesUSD[type] * Math.pow(scales[type], lvl)),
      isMax: lvl >= 10
    };
  }

  getCyberCost(type) {
    const basesMB = { sniffer: 300, quantum: 1200, autosiphon: 2500 };
    const basesUSD = { sniffer: 500, quantum: 3000, autosiphon: 7500 };
    const scales = { sniffer: 2.15, quantum: 2.25, autosiphon: 2.35 };
    const lvl = this.cyber[type] || 0;
    return {
      mb: Math.floor(basesMB[type] * Math.pow(scales[type], lvl)),
      usd: Math.floor(basesUSD[type] * Math.pow(scales[type], lvl)),
      isMax: lvl >= 10
    };
  }

  // =========================================================================
  // TACTICAL RADIO COMMS TERMINAL
  // =========================================================================
  showCommsTransmission({ speaker = 'ШТАБ [МАЯК]', role = 'HQ', text = '', choices = [] }) {
    this.commsActive = true;
    const modal = document.getElementById('comms-terminal-modal');
    if (!modal) return;

    modal.style.display = 'flex';
    const speakerEl = document.getElementById('comms-speaker-title');
    const subEl = document.getElementById('comms-speaker-sub');
    const bodyEl = document.getElementById('comms-dialogue-text');
    const choicesEl = document.getElementById('comms-choices-container');
    const avatarEl = document.getElementById('comms-avatar-icon');

    if (speakerEl) speakerEl.textContent = speaker;

    let avatarIcon = '📡';
    let subTitle = 'ГЕНЕРАЛЬНЫЙ ОПЕРАТИВНЫЙ ЦЕНТР';
    if (role === 'HQ') { avatarIcon = '📡'; subTitle = 'КОМАНДОВАНИЕ ОПЕРАЦИИ'; }
    else if (role === 'EW') { avatarIcon = '💻'; subTitle = 'ОФИЦЕР КИБЕРРАЗВЕДКИ И РЭБ'; }
    else if (role === 'ENEMY') { avatarIcon = '💀'; subTitle = 'ЭШЕЛОН ОБОРОНЫ ПРОТИВНИКА'; }
    else if (role === 'AI') { avatarIcon = '🤖'; subTitle = 'БОРТОВОЙ ИИ «БАРРАКУДА»'; }

    if (avatarEl) avatarEl.innerHTML = `${avatarIcon}<span class="comms-avatar-badge" id="comms-speaker-role">${role}</span>`;
    if (subEl) subEl.textContent = subTitle;

    if (window.tacticalAudio) {
      window.tacticalAudio.playRadioStatic(0.18);
      setTimeout(() => window.tacticalAudio.playCommsChirp(), 150);
    }

    if (this.commsTypewriterInterval) clearInterval(this.commsTypewriterInterval);
    if (bodyEl) {
      bodyEl.textContent = '';
      let i = 0;
      this.commsTypewriterInterval = setInterval(() => {
        i++;
        bodyEl.textContent = text.slice(0, i) + '█';
        if (Math.random() > 0.4 && window.tacticalAudio) window.tacticalAudio.playTeletypeChar();
        if (i >= text.length) {
          bodyEl.textContent = text;
          clearInterval(this.commsTypewriterInterval);
        }
      }, 18);
    }

    if (choicesEl) {
      choicesEl.innerHTML = '';
      if (!choices || choices.length === 0) {
        choices = [{ text: '«Принято. Продолжаю выполнение.»', action: () => this.closeCommsTransmission() }];
      }

      choices.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'comms-choice-btn';
        btn.innerHTML = `<span class="comms-choice-tag">ОТВЕТ</span><span>${ch.text}</span>`;
        btn.addEventListener('click', () => {
          if (window.tacticalAudio) window.tacticalAudio.playPing();
          if (ch.action) ch.action();
          this.closeCommsTransmission();
        });
        choicesEl.appendChild(btn);
      });
    }
  }

  closeCommsTransmission() {
    this.commsActive = false;
    if (this.commsTypewriterInterval) clearInterval(this.commsTypewriterInterval);
    const modal = document.getElementById('comms-terminal-modal');
    if (modal) modal.style.display = 'none';
  }

  // =========================================================================
  // STORY CAMPAIGN & MISSIONS SYSTEM
  // =========================================================================
  initCampaignAndHangar() {
    const btnOpenCampaign = document.getElementById('btn-open-campaign');
    const btnCloseCampaign = document.getElementById('btn-close-campaign');
    const campaignModal = document.getElementById('campaign-modal');

    if (btnOpenCampaign) {
      btnOpenCampaign.addEventListener('click', (e) => {
        e.stopPropagation();
        this.renderCampaignDOM();
        if (campaignModal) campaignModal.classList.add('active');
      });
    }
    if (btnCloseCampaign) {
      btnCloseCampaign.addEventListener('click', () => {
        if (campaignModal) campaignModal.classList.remove('active');
      });
    }

    document.querySelectorAll('.campaign-act-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const act = parseInt(tab.getAttribute('data-act'), 10);
        this.selectCampaignAct(act);
      });
    });

    const btnOpenHangar = document.getElementById('btn-open-hangar');
    const btnCloseHangar = document.getElementById('btn-close-hangar');
    const hangarModal = document.getElementById('hangar-modal');

    if (btnOpenHangar) {
      btnOpenHangar.addEventListener('click', (e) => {
        e.stopPropagation();
        this.renderHangarDOM();
        if (hangarModal) hangarModal.classList.add('active');
      });
    }
    if (btnCloseHangar) {
      btnCloseHangar.addEventListener('click', () => {
        if (hangarModal) hangarModal.classList.remove('active');
      });
    }

    const btnCloseComms = document.getElementById('btn-close-comms');
    if (btnCloseComms) {
      btnCloseComms.addEventListener('click', () => this.closeCommsTransmission());
    }

    this.renderCampaignDOM();
    this.renderHangarDOM();
  }

  selectCampaignAct(actNum) {
    this.campaignAct = actNum;
    document.querySelectorAll('.campaign-act-tab').forEach(t => {
      const a = parseInt(t.getAttribute('data-act'), 10);
      t.classList.toggle('active', a === actNum);
    });
    this.renderCampaignDOM();
    if (window.tacticalAudio) window.tacticalAudio.playPing();
  }

  renderCampaignDOM() {
    const list = document.getElementById('campaign-missions-list');
    if (!list) return;

    const actData = CAMPAIGN_ACTS_DEF.find(a => a.act === this.campaignAct) || CAMPAIGN_ACTS_DEF[0];
    list.innerHTML = '';

    actData.missions.forEach((m, idx) => {
      const isCompleted = this.completedMissions.has(m.id);
      const isActive = this.activeMission && this.activeMission.id === m.id;
      const isUnlocked = idx === 0 || this.completedMissions.has(actData.missions[idx - 1].id) || isCompleted;

      const card = document.createElement('div');
      card.className = `campaign-mission-card ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;

      let statusPill = isCompleted
        ? '<span class="mission-status-pill done">✓ ВЫПОЛНЕНО</span>'
        : (isActive
            ? '<span class="mission-status-pill ready">▶ В ПРОЦЕССЕ</span>'
            : (isUnlocked ? '<span class="mission-status-pill ready">ГОТОВО К ПУСКУ</span>' : '<span class="mission-status-pill locked">🔒 ЗАБЛОКИРОВАНО</span>'));

      let phaseTrack = '';
      if (m.phases) {
        phaseTrack = `<div class="mission-phases-track">` + m.phases.map((p, pIdx) => {
          let stepClass = '';
          if (isCompleted) stepClass = 'done';
          else if (isActive) {
            if (this.missionPhase > pIdx + 1) stepClass = 'done';
            else if (this.missionPhase === pIdx + 1) stepClass = 'active';
          }
          return `<div class="mission-phase-step ${stepClass}"><span>${pIdx + 1}</span><span>${p}</span></div>`;
        }).join('') + `</div>`;
      }

      let salvageText = '';
      if (m.reward.salvage) {
        const parts = [];
        if (m.reward.salvage.box) parts.push(`📦 x${m.reward.salvage.box}`);
        if (m.reward.salvage.chips) parts.push(`💎 x${m.reward.salvage.chips}`);
        if (m.reward.salvage.titanium) parts.push(`🛡️ x${m.reward.salvage.titanium}`);
        if (m.reward.salvage.aicore) parts.push(`🔮 x${m.reward.salvage.aicore}`);
        salvageText = parts.join(' ');
      }

      card.innerHTML = `
        <div>
          <div class="mission-header-row">
            <span class="mission-code-badge">${m.code}</span>
            ${statusPill}
          </div>
          <div class="mission-title-text">${m.title}</div>
          <div class="mission-desc-text">${m.desc}</div>
          ${phaseTrack}
          <div class="mission-rewards-row">
            <span>НАГРАДЫ: <strong>+$${m.reward.usd.toLocaleString()}</strong></span>
            <span><strong>+${m.reward.mb} МБ</strong></span>
            ${m.reward.bp > 0 ? `<span>+${m.reward.bp} ЧЖ</span>` : ''}
            ${salvageText ? `<span style="color:#00f0ff;">${salvageText}</span>` : ''}
          </div>
        </div>
        <button class="btn-launch-mission" data-mission-id="${m.id}" ${!isUnlocked ? 'disabled' : ''}>
          ${isCompleted ? 'ПОВТОРИТЬ ОПЕРАЦИЮ' : (isActive ? 'ПРОДОЛЖИТЬ ШТУРМ' : 'НАЧАТЬ ОПЕРАЦИЮ')}
        </button>
      `;

      card.querySelector('[data-mission-id]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.startCampaignMission(m.id);
      });

      list.appendChild(card);
    });
  }

  startCampaignMission(missionId) {
    let found = null;
    let foundAct = null;
    for (const act of CAMPAIGN_ACTS_DEF) {
      const m = act.missions.find(item => item.id === missionId);
      if (m) { found = m; foundAct = act; break; }
    }
    if (!found) return;

    this.activeMission = found;
    this.missionPhase = 1;

    if (foundAct.sector && this.currentSector !== foundAct.sector) {
      this.changeSector(foundAct.sector);
    }

    const campaignModal = document.getElementById('campaign-modal');
    if (campaignModal) campaignModal.classList.remove('active');

    if (found.commsIntro) {
      this.showCommsTransmission({
        speaker: found.commsIntro.speaker,
        role: found.commsIntro.role,
        text: found.commsIntro.text,
        choices: [
          {
            text: '«Тактику понял. Перехожу к Фазе 1: Сканирование и Взлом РЭБ!»',
            action: () => {
              this.addNotification('🎯 МИССИЯ АКТИВИРОВАНА', `${found.title} — Фаза 1: Взлом РЭБ`);
              if (this.btnOpenCyber) this.btnOpenCyber.click();
            }
          },
          {
            text: '«Подготовить ударные FPV-комплексы!»',
            action: () => {
              this.addNotification('🛸 ОРУЖИЕ НАИЗГОТОВКУ', 'Приготовьтесь к прорыву эшелона.');
            }
          }
        ]
      });
    } else {
      this.addNotification('🎯 МИССИЯ АКТИВИРОВАНА', `${found.title} — Фаза 1`);
    }

    this.renderCampaignDOM();
  }

  advanceMissionPhase() {
    if (!this.activeMission) return;
    this.missionPhase++;

    if (this.missionPhase === 2) {
      this.addNotification('⚡ ФАЗА 2: САБОТАЖ ПВО', 'Радиоканал взломан! ПВО подавлено на 40%!');
      this.showCommsTransmission({
        speaker: 'ЛЕЙТЕНАНТ [ВЕКТОР]',
        role: 'EW',
        text: 'Отличная работа! Частоты перехвачены. Запускайте FPV-штурмовик для прорыва к кораблю!',
        choices: [{ text: '«Запуск FPV!»', action: () => { this.startAssault(); } }]
      });
    } else if (this.missionPhase === 3) {
      this.addNotification('🚀 ФАЗА 3: ТОЧЕЧНЫЙ УДАР', 'Зафиксируйте прицел FLIR на уязвимом отсеке судна!');
    } else if (this.missionPhase >= 4) {
      this.completeCampaignMission();
    }

    this.renderCampaignDOM();
  }

  completeCampaignMission() {
    if (!this.activeMission) return;
    const m = this.activeMission;
    this.completedMissions.add(m.id);

    this.creditsUSD += m.reward.usd;
    this.addData(m.reward.mb);
    if (m.reward.bp > 0) this.blueprintsBP += m.reward.bp;

    if (m.reward.salvage) {
      this.awardSalvage(m.reward.salvage);
    }

    if (window.tacticalAudio) window.tacticalAudio.playMissionVictory();

    if (this.completedMissions.has('m1_3')) this.checkAchievement('campaign_act1');
    if (this.completedMissions.has('m2_3')) this.checkAchievement('campaign_act2');
    if (this.completedMissions.has('m3_3')) this.checkAchievement('campaign_act3');
    if (this.completedMissions.has('m4_3')) this.checkAchievement('campaign_act4');

    this.addNotification('🏆 ОПЕРАЦИЯ ЗАВЕРШЕНА', `${m.title} — УСПЕХ! +$${m.reward.usd.toLocaleString()}`);

    setTimeout(() => {
      this.showCommsTransmission({
        speaker: 'ШТАБ [МАЯК]',
        role: 'HQ',
        text: `Отличная работа, оператор! Операция «${m.title}» успешно завершена. Трофеи подняты на борт и доставлены в Ангар для крафта.`,
        choices: [
          { text: '«Открыть Ангар и изучить трофеи.»', action: () => { const h = document.getElementById('hangar-modal'); if (h) h.classList.add('active'); this.renderHangarDOM(); } },
          { text: '«Продолжить патрулирование сектора.»', action: () => {} }
        ]
      });
    }, 1500);

    this.activeMission = null;
    this.missionPhase = 0;
    this.renderCampaignDOM();
    this.renderHangarDOM();
    this.saveGame();
    this._uiDirty = true;
  }

  // =========================================================================
  // DRONE HANGAR & SALVAGE FORGE
  // =========================================================================
  renderHangarDOM() {
    const boxEl = document.getElementById('val-salvage-box');
    const chipsEl = document.getElementById('val-salvage-chips');
    const titEl = document.getElementById('val-salvage-titanium');
    const aiEl = document.getElementById('val-salvage-aicore');

    if (boxEl) boxEl.textContent = `${this.salvage.box || 0} шт`;
    if (chipsEl) chipsEl.textContent = `${this.salvage.chips || 0} шт`;
    if (titEl) titEl.textContent = `${this.salvage.titanium || 0} шт`;
    if (aiEl) aiEl.textContent = `${this.salvage.aicore || 0} шт`;

    document.querySelectorAll('.proto-card').forEach(card => {
      const pid = card.getAttribute('data-proto');
      const isSelected = this.selectedPrototype === pid;
      const isUnlocked = this.unlockedPrototypes.has(pid);
      const proto = DRONE_PROTOTYPES_DEF[pid];

      card.classList.toggle('selected', isSelected);
      const selectBtn = card.querySelector('.btn-proto-select');
      if (selectBtn) {
        if (isSelected) {
          selectBtn.textContent = '✓ ВЫБРАН КОРПУС';
          selectBtn.style.background = '#00ff88';
          selectBtn.style.color = '#000';
          selectBtn.disabled = true;
        } else if (isUnlocked) {
          selectBtn.textContent = 'АКТИВИРОВАТЬ';
          selectBtn.style.background = 'rgba(0, 240, 255, 0.2)';
          selectBtn.style.color = '#00f0ff';
          selectBtn.disabled = false;
        } else {
          let reqParts = [`$${proto.costUSD.toLocaleString()}`];
          if (proto.reqShips) reqParts.push(`${proto.reqShips} Вымпелов`);
          if (proto.reqSalvage) {
            for (const [res, amt] of Object.entries(proto.reqSalvage)) {
              reqParts.push(`${amt} ${res}`);
            }
          }
          selectBtn.textContent = `РАЗБЛОКИРОВАТЬ (${reqParts.join(' | ')})`;
          
          let canUnlock = this.creditsUSD >= proto.costUSD && (!proto.reqShips || this.sunkenShips >= proto.reqShips);
          if (proto.reqSalvage) {
            for (const [res, amt] of Object.entries(proto.reqSalvage)) {
              if ((this.salvage[res] || 0) < amt) canUnlock = false;
            }
          }
          selectBtn.style.background = canUnlock ? 'rgba(255, 204, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)';
          selectBtn.style.color = canUnlock ? '#ffcc00' : '#8da4af';
          selectBtn.disabled = !canUnlock;
        }

        selectBtn.onclick = (e) => {
          e.stopPropagation();
          this.selectDronePrototype(pid);
        };
      }
    });

    const craftGrid = document.getElementById('crafting-recipes-grid');
    if (craftGrid) {
      craftGrid.innerHTML = '';
      SALVAGE_CRAFT_RECIPES.forEach(r => {
        const isCrafted = this.craftedModules.has(r.id);
        const card = document.createElement('div');
        card.className = 'craft-card';

        let costParts = [];
        let canAfford = true;
        if (r.cost.box) {
          costParts.push(`📦 ${r.cost.box} ящ`);
          if ((this.salvage.box || 0) < r.cost.box) canAfford = false;
        }
        if (r.cost.chips) {
          costParts.push(`💎 ${r.cost.chips} чип`);
          if ((this.salvage.chips || 0) < r.cost.chips) canAfford = false;
        }
        if (r.cost.titanium) {
          costParts.push(`🛡️ ${r.cost.titanium} титан`);
          if ((this.salvage.titanium || 0) < r.cost.titanium) canAfford = false;
        }
        if (r.cost.aicore) {
          costParts.push(`🔮 ${r.cost.aicore} ядро`);
          if ((this.salvage.aicore || 0) < r.cost.aicore) canAfford = false;
        }

        card.innerHTML = `
          <div>
            <div class="craft-card-header">
              <span class="craft-card-title">${r.name}</span>
              <span class="craft-card-cost">${costParts.join(' // ')}</span>
            </div>
            <div class="craft-card-effect">${r.desc}</div>
          </div>
          <button class="btn-craft-action" ${isCrafted ? 'disabled' : (!canAfford ? 'disabled' : '')}>
            ${isCrafted ? '✓ СКРАФЧЕНО (АКТИВНО)' : (canAfford ? '🛠️ СОБРАТЬ МОДУЛЬ' : 'НЕДОСТАТОЧНО ТРОФЕЕВ')}
          </button>
        `;

        card.querySelector('.btn-craft-action').addEventListener('click', (e) => {
          e.stopPropagation();
          this.craftModule(r.id);
        });

        craftGrid.appendChild(card);
      });
    }
  }

  selectDronePrototype(protoId) {
    const proto = DRONE_PROTOTYPES_DEF[protoId];
    if (!proto) return;

    if (!this.unlockedPrototypes.has(protoId)) {
      if (proto.reqShips && this.sunkenShips < proto.reqShips) {
        this.addNotification('🔒 ЗАБЛОКИРОВАНО', `Требуется потопить ${proto.reqShips} вымпелов (Ваш счет: ${this.sunkenShips})`);
        return;
      }
      if (proto.reqSalvage) {
        for (const [res, amt] of Object.entries(proto.reqSalvage)) {
          if ((this.salvage[res] || 0) < amt) {
            this.addNotification('❌ НЕДОСТАТОЧНО ТРОФЕЕВ', `Требуется ${amt} шт. ${res.toUpperCase()}`);
            return;
          }
        }
      }
      if (this.creditsUSD < proto.costUSD) {
        this.addNotification('❌ НЕДОСТАТОЧНО КРЕДИТОВ', `Требуется $${proto.costUSD.toLocaleString()}`);
        return;
      }

      this.creditsUSD -= proto.costUSD;
      if (proto.reqSalvage) {
        for (const [res, amt] of Object.entries(proto.reqSalvage)) {
          this.salvage[res] -= amt;
        }
      }

      this.unlockedPrototypes.add(protoId);
      this.addNotification('⚓ НОВЫЙ КОРПУС', `Разблокирован: ${proto.name}!`);
      if (window.tacticalAudio) window.tacticalAudio.playMountingSfx();
    }

    this.selectedPrototype = protoId;
    if (this.engine3D) {
      this.engine3D.setDronePrototype(protoId);
    }
    if (window.tacticalAudio) window.tacticalAudio.playUpgradeSfx();
    this.addNotification('⚡ КОРПУС АКТИВИРОВАН', `Выбран дрон: ${proto.name}`);
    this.renderHangarDOM();
    this.saveGame();
    this._uiDirty = true;
  }

  craftModule(recipeId) {
    const r = SALVAGE_CRAFT_RECIPES.find(item => item.id === recipeId);
    if (!r || this.craftedModules.has(recipeId)) return;

    if (r.cost.box && (this.salvage.box || 0) < r.cost.box) return;
    if (r.cost.chips && (this.salvage.chips || 0) < r.cost.chips) return;
    if (r.cost.titanium && (this.salvage.titanium || 0) < r.cost.titanium) return;
    if (r.cost.aicore && (this.salvage.aicore || 0) < r.cost.aicore) return;

    if (r.cost.box) this.salvage.box -= r.cost.box;
    if (r.cost.chips) this.salvage.chips -= r.cost.chips;
    if (r.cost.titanium) this.salvage.titanium -= r.cost.titanium;
    if (r.cost.aicore) this.salvage.aicore -= r.cost.aicore;

    this.craftedModules.add(recipeId);
    if (window.tacticalAudio) window.tacticalAudio.playSalvagePickup();
    this.addNotification('🛠️ МОДУЛЬ СОБРАН', `${r.name}\n${r.desc}`);
    this.checkAchievement('salvage_master');
    this.renderHangarDOM();
    this.saveGame();
    this._uiDirty = true;
  }

  awardSalvage(lootObj = {}) {
    const parts = [];
    if (lootObj.box) {
      this.salvage.box = (this.salvage.box || 0) + lootObj.box;
      parts.push(`📦 +${lootObj.box} Черный ящик`);
    }
    if (lootObj.chips) {
      this.salvage.chips = (this.salvage.chips || 0) + lootObj.chips;
      parts.push(`💎 +${lootObj.chips} GaN-чип`);
    }
    if (lootObj.titanium) {
      this.salvage.titanium = (this.salvage.titanium || 0) + lootObj.titanium;
      parts.push(`🛡️ +${lootObj.titanium} Титан`);
    }
    if (lootObj.aicore) {
      this.salvage.aicore = (this.salvage.aicore || 0) + lootObj.aicore;
      parts.push(`🔮 +${lootObj.aicore} ИИ-Ядро`);
    }

    if (parts.length > 0) {
      this.addNotification('💠 ТРОФЕИ ПОДНЯТЫ', parts.join(' | '));
      if (window.tacticalAudio) window.tacticalAudio.playSalvagePickup();
      if (this.engine3D) this.engine3D.spawnFloatingSalvage(parts);
      this.renderHangarDOM();
    }
  }


  // =========================================================================
  // DOM INIT
  // =========================================================================
  initDOM() {
    this.lblBuffer = document.getElementById('val-buffer');
    this.lblCredits = document.getElementById('val-credits');
    this.lblEnergyPercent = document.getElementById('label-energy-percent');
    this.progressBarFill = document.getElementById('progress-bar-fill');
    this.btnAssault = document.getElementById('btn-assault');
    this.btnDirectMissile = document.getElementById('btn-direct-missile');

    this.lblPassiveUSD = document.getElementById('val-passive-usd');
    this.lblPassive = document.getElementById('val-passive');
    this.lblClick = document.getElementById('val-click');
    this.lblMultiplier = document.getElementById('val-multiplier');
    this.lblTotalData = document.getElementById('val-total-data');
    this.lblSunkenCount = document.getElementById('val-sunken-count');
    this.lblKillsStatus = document.getElementById('val-kills-status');

    this.panelDossier = document.getElementById('panel-dossier');
    this.dossierBody = document.getElementById('dossier-body');
    this.dossierTime = document.getElementById('dossier-timestamp');
    this.btnToggleDossier = document.getElementById('btn-toggle-dossier');
    this.btnCloseDossier = document.getElementById('btn-close-dossier');
    this.dossierBeacon = document.getElementById('dossier-unread-beacon');

    this.boosterWidget = document.getElementById('booster-widget');
    this.btnOverclock = document.getElementById('btn-overclock');
    this.boosterStatusTitle = document.getElementById('booster-status-title');
    this.boosterStatusSub = document.getElementById('booster-status-sub');

    this.flirOverlay = document.getElementById('flir-thermal-overlay');
    this.btnOpenFlir = document.getElementById('btn-open-flir');
    this.btnExitFlir = document.getElementById('btn-exit-flir');

    this.mapModal = document.getElementById('map-modal');
    this.btnOpenMap = document.getElementById('btn-open-map');
    this.btnCloseMap = document.getElementById('btn-close-map');
    this.lblCurrentSector = document.getElementById('label-current-sector');

    this.cyberModal = document.getElementById('cyber-modal');
    this.btnOpenCyber = document.getElementById('btn-open-cyber');
    this.btnCloseCyber = document.getElementById('btn-close-cyber');
    this.cyberCanvas = document.getElementById('cyber-wave-canvas');
    this.cyberSliderFreq = document.getElementById('cyber-slider-freq');
    this.cyberSliderAmp = document.getElementById('cyber-slider-amp');
    this.cyberFreqVal = document.getElementById('cyber-freq-val');
    this.cyberAmpVal = document.getElementById('cyber-amp-val');
    this.cyberMatchStatus = document.getElementById('cyber-match-status');
    this.btnCyberSubmit = document.getElementById('btn-cyber-submit');
    this.cyberTimerLabel = document.getElementById('cyber-timer-label');

    this.assaultModal = document.getElementById('assault-modal');
    this.modalTimer = document.getElementById('modal-timer');
    this.lockBarFill = document.getElementById('lock-bar-fill');
    this.lockStatusLabel = document.getElementById('lock-status-label');
    this.screenFlash = document.getElementById('screen-flash');
    this.fpvCanvas = document.getElementById('fpv-canvas');

    // Help modal
    this.helpModal = document.getElementById('help-modal');
    this.btnOpenHelp = document.getElementById('btn-open-help');
    this.btnCloseHelp = document.getElementById('btn-close-help');
  }

  // =========================================================================
  // EVENT BINDING
  // =========================================================================
  initEvents() {
    // Primary Click Collector: Center Interact Zone & Viewport
    const centerZone = document.querySelector('.center-interact-zone');
    if (centerZone) {
      centerZone.addEventListener('click', (e) => {
        this.handleClick(e.clientX, e.clientY);
      });
    }

    const viewport = document.getElementById('drone-3d-viewport');
    if (viewport) {
      viewport.addEventListener('click', (e) => {
        this.handleClick(e.clientX, e.clientY);
      });
    }

    // Ring Buttons
    document.querySelectorAll('.ring-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetPanelId = btn.getAttribute('data-panel');
        const targetPanel = document.getElementById(targetPanelId);
        const wasActive = targetPanel && targetPanel.classList.contains('active');

        document.querySelectorAll('.concept-slide-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.ring-action-btn').forEach(b => b.classList.remove('active'));

        if (!wasActive && targetPanel) {
          targetPanel.classList.add('active');
          btn.classList.add('active');
        }
      });
    });

    document.querySelectorAll('.btn-close-panel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.concept-slide-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.ring-action-btn').forEach(b => b.classList.remove('active'));
      });
    });

    // Dossier Toggle
    if (this.btnToggleDossier) {
      this.btnToggleDossier.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.panelDossier) {
          const isCollapsed = this.panelDossier.classList.contains('collapsed');
          if (isCollapsed) {
            this.panelDossier.classList.remove('collapsed');
            this.btnToggleDossier.classList.add('active');
            this.dossierHasUnread = false;
            if (this.dossierBeacon) this.dossierBeacon.style.display = 'none';
          } else {
            this.panelDossier.classList.add('collapsed');
            this.btnToggleDossier.classList.remove('active');
          }
        }
      });
    }

    if (this.btnCloseDossier) {
      this.btnCloseDossier.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.panelDossier) {
          this.panelDossier.classList.add('collapsed');
          if (this.btnToggleDossier) this.btnToggleDossier.classList.remove('active');
        }
      });
    }

    // FLIR Thermal Recon Mode
    if (this.btnOpenFlir) {
      this.btnOpenFlir.addEventListener('click', () => {
        window.tacticalAudio.playThermalModeSfx();
        this.flirOverlay.classList.add('active');
        if (this.engine3D) this.engine3D.cameraMode = 'flir';
      });
    }

    // Help Modal
    if (this.btnOpenHelp) {
      this.btnOpenHelp.addEventListener('click', () => {
        if (this.helpModal) this.helpModal.classList.add('active');
      });
    }
    if (this.btnCloseHelp) {
      this.btnCloseHelp.addEventListener('click', () => {
        if (this.helpModal) this.helpModal.classList.remove('active');
      });
    }
    const btnUnderstood = document.getElementById('btn-help-understood');
    if (btnUnderstood) {
      btnUnderstood.addEventListener('click', () => {
        if (this.helpModal) this.helpModal.classList.remove('active');
      });
    }
    if (this.helpModal) {
      this.helpModal.addEventListener('click', (e) => {
        if (e.target === this.helpModal) this.helpModal.classList.remove('active');
      });
    }

    if (this.btnExitFlir) {
      this.btnExitFlir.addEventListener('click', () => {
        this.flirOverlay.classList.remove('active');
        if (this.engine3D) this.engine3D.cameraMode = 'orbit';
      });
    }

    document.querySelectorAll('.flir-lock-point').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetType = btn.getAttribute('data-target');
        let multiplier = 4;
        if (targetType === 'ammo') multiplier = 8;
        if (targetType === 'bridge') multiplier = 5;

        this.fireMissileSalvo(multiplier);
        this.flirOverlay.classList.remove('active');
        if (this.engine3D) this.engine3D.cameraMode = 'orbit';
      });
    });

    // Direct 3D Missile Fire
    if (this.btnDirectMissile) {
      this.btnDirectMissile.addEventListener('click', () => {
        this.fireMissileSalvo(3);
      });
    }

    // Sector Map
    if (this.btnOpenMap) {
      this.btnOpenMap.addEventListener('click', () => {
        this.mapModal.classList.add('active');
        window.tacticalAudio.playRadioSquelch();
      });
    }
    if (this.btnCloseMap) {
      this.btnCloseMap.addEventListener('click', () => {
        this.mapModal.classList.remove('active');
      });
    }

    document.querySelectorAll('.sector-choice-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.sector-choice-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.changeSector(card.getAttribute('data-sector'));
      });
    });

    // SIGINT Cyber Hack Modal — Enhanced
    if (this.btnOpenCyber) {
      this.btnOpenCyber.addEventListener('click', () => {
        this.cyberModal.classList.add('active');
        window.tacticalAudio.playSonarPing();
        this.targetFreq = 80 + Math.floor(Math.random() * 140);
        this.targetAmp = +(0.5 + Math.random() * 1.2).toFixed(1);
        this.cyberHackTimer = 30;
        this.cyberHackActive = true;
        this.cyberComboChannel = 0;
        this.cyberInterferenceTimer = 5 + Math.random() * 5;
      });
    }

    if (this.btnCloseCyber) {
      this.btnCloseCyber.addEventListener('click', () => {
        this.cyberModal.classList.remove('active');
        this.cyberHackActive = false;
      });
    }

    if (this.cyberSliderFreq) {
      this.cyberSliderFreq.addEventListener('input', (e) => {
        this.currentFreq = parseFloat(e.target.value);
        if (this.cyberFreqVal) this.cyberFreqVal.textContent = this.currentFreq.toFixed(1);
        this.checkCyberMatch();
      });
    }

    if (this.cyberSliderAmp) {
      this.cyberSliderAmp.addEventListener('input', (e) => {
        this.currentAmp = parseFloat(e.target.value);
        if (this.cyberAmpVal) this.cyberAmpVal.textContent = this.currentAmp.toFixed(1);
        this.checkCyberMatch();
      });
    }

    if (this.btnCyberSubmit) {
      this.btnCyberSubmit.addEventListener('click', () => {
        const match = this.getCyberMatchPercent();
        if (match >= 85) {
          window.tacticalAudio.playCyberHackTone(true);
          const mult = this.getGlobalMultiplier();
          this.creditsUSD += 2000 * mult;
          this.addData(50 * mult);
          this.totalHacks++;
          this.dailyHacks++;
          this.cyberComboChannel++;

          if (this.cyberComboChannel < 3) {
            // Spawn next channel
            this.targetFreq = 80 + Math.floor(Math.random() * 140);
            this.targetAmp = +(0.5 + Math.random() * 1.2).toFixed(1);
            this.cyberHackTimer = Math.max(15, 30 - this.cyberComboChannel * 5);
            this.addNotification('📡 КАНАЛ ВЗЛОМАН', `Combo x${this.cyberComboChannel}! Следующий канал...`);
          } else {
            // All channels hacked — big reward
            this.creditsUSD += 10000 * mult;
            this.addData(150 * mult);
            this.addNotification('🏆 ПОЛНЫЙ ВЗЛОМ', 'Все 3 канала дешифрованы! Мега-бонус!');
            this.cyberModal.classList.remove('active');
            this.cyberHackActive = false;

            // Check if active campaign mission in phase 1
            if (this.activeMission && this.missionPhase === 1) {
              this.advanceMissionPhase();
            }
          }
          this.checkAllAchievements();
          this.updateUI();
        } else {
          window.tacticalAudio.playCyberHackTone(false);
        }
      });
    }

    // Booster
    if (this.btnOverclock) {
      this.btnOverclock.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activateOverclock();
      });
    }

    // Quick Sell
    const sellBtn = document.getElementById('btn-quick-sell');
    if (sellBtn) sellBtn.addEventListener('click', () => this.sellDataForCash());

    // Hardware
    document.querySelectorAll('[data-buy-hw]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.buyHardware(btn.getAttribute('data-buy-hw'));
      });
    });

    // Cyber
    document.querySelectorAll('[data-buy-cyber]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.buyCyber(btn.getAttribute('data-buy-cyber'));
      });
    });

    // Contracts
    document.querySelectorAll('[data-start-contract]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.startContract(btn.getAttribute('data-start-contract'));
      });
    });

    // Tech
    document.querySelectorAll('[data-buy-tech]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tech = btn.getAttribute('data-buy-tech');
        const cost = parseInt(btn.getAttribute('data-cost-bp'), 10);
        if (!this.tech[tech] && this.blueprintsBP >= cost) {
          this.blueprintsBP -= cost;
          this.tech[tech] = true;
          window.tacticalAudio.playContractSfx();
          if (this.engine3D) this.engine3D.updateSwarmEscorts(true);
          this.updateUI();
        }
      });
    });

    // Assault
    if (this.btnAssault) {
      this.btnAssault.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.assaultCharge >= this.assaultChargeMax && !this.minigameActive) {
          this.startAssault();
        }
      });
    }

    // TMA Toggle
    const tmaBtn = document.getElementById('btn-toggle-tma');
    if (tmaBtn) {
      tmaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const frame = document.getElementById('game-frame');
        if (frame) frame.classList.toggle('hud-hidden');
      });
    }

    // Event banner action
    const eventActionBtn = document.getElementById('event-banner-action');
    if (eventActionBtn) {
      eventActionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleEventAction();
      });
    }

    // Autosave every 30s
    setInterval(() => this.saveGame(), 30000);
  }

  // =========================================================================
  // GAMEPLAY METHODS
  // =========================================================================
  changeSector(sectorId) {
    this.currentSector = sectorId;
    this.visitedSectors.add(sectorId);
    const info = SECTOR_INFO[sectorId];
    if (info && this.lblCurrentSector) {
      this.lblCurrentSector.textContent = info.name;
    }
    if (this.engine3D) {
      this.engine3D.setWeatherSector(sectorId);
    }
    // Start ambient soundscape for new sector
    window.tacticalAudio.startAmbient(sectorId);
    this.mapModal.classList.remove('active');
    this.checkAllAchievements();
    this._uiDirty = true;
  }

  fireMissileSalvo(multiplier = 3) {
    // Check FPV drone salvo cooldown
    if (this.weaponCooldown > 0) {
      this.addNotification('⏳ ПЕРЕЗАРЯДКА', `Дроны готовы через ${this.weaponCooldown.toFixed(1)}с`);
      return;
    }

    // Start salvo cooldown
    this.weaponCooldown = this.weaponCooldownMax;

    if (this.engine3D) {
      this.engine3D.launchMissileStrike(() => {
        const gainMB = this.getClickPower() * multiplier * 4.0;
        const gainUSD = this.getClickCashGain() * multiplier * 3;
        this.addData(gainMB);
        this.addCredits(gainUSD);
        this.spawnFloatingGain(window.innerWidth / 2, window.innerHeight / 2, gainMB, gainUSD, true);

        // Heavy damage to ship from salvo
        const salvoDmg = gainMB * 2.0;
        this.damageShip(salvoDmg);

        this.checkAllAchievements();
        this._uiDirty = true;
      });
    }
  }

  checkCyberMatch() {
    const match = this.getCyberMatchPercent();
    if (this.cyberMatchStatus) {
      this.cyberMatchStatus.textContent = `СОВПАДЕНИЕ: ${match.toFixed(0)}% ${this.cyberComboChannel > 0 ? '// COMBO x' + this.cyberComboChannel : ''}`;
      this.cyberMatchStatus.style.color = match >= 85 ? '#00ff66' : (match >= 50 ? '#ffcc00' : '#ff4444');
    }
  }

  getCyberMatchPercent() {
    const freqDiff = Math.abs(this.currentFreq - this.targetFreq);
    const ampDiff = Math.abs(this.currentAmp - this.targetAmp);
    const freqMatch = Math.max(0, 100 - freqDiff * 2.5);
    const ampMatch = Math.max(0, 100 - ampDiff * 50);
    return (freqMatch * 0.7 + ampMatch * 0.3);
  }

  drawCyberWave(t) {
    if (!this.cyberCanvas) return;
    const ctx = this.cyberCanvas.getContext('2d');
    const W = this.cyberCanvas.width;
    const H = this.cyberCanvas.height;

    ctx.fillStyle = '#05140e';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(0, 255, 102, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Interference noise overlay
    if (this.cyberInterferenceActive) {
      ctx.fillStyle = 'rgba(255, 40, 40, 0.06)';
      for (let i = 0; i < 30; i++) {
        ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 40, 2);
      }
    }

    // Target Wave (Cyan)
    ctx.strokeStyle = this.cyberInterferenceActive ? '#ff4444' : '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      let y = H / 2 + Math.sin(x * (this.targetFreq / 2500) + t * 4) * (this.targetAmp * 40);
      if (this.cyberInterferenceActive) y += (Math.random() - 0.5) * 15;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Player Wave (Green dashed)
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = H / 2 + Math.sin(x * (this.currentFreq / 2500) + t * 4) * (this.currentAmp * 40);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Timer display on canvas
    if (this.cyberHackActive) {
      ctx.fillStyle = this.cyberHackTimer < 10 ? '#ff4444' : '#ffcc00';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`ТАЙМЕР: ${Math.ceil(this.cyberHackTimer)}с`, W - 10, 20);

      // Channel indicator
      ctx.fillStyle = '#00e5ff';
      ctx.textAlign = 'left';
      ctx.fillText(`КАНАЛ: ${this.cyberComboChannel + 1} / 3`, 10, 20);
      ctx.textAlign = 'left';
    }
  }

  handleClick(x, y) {
    let gainMB = this.getClickPower();
    let gainUSD = this.getClickCashGain();
    let isCrit = Math.random() < this.getCritChance();
    this.totalClicks++;
    this.dailyClicks++;

    // Event click challenge
    if (this.activeEvent && this.activeEvent.type === 'click_challenge') {
      this.eventClickCount++;
    }

    if (isCrit) {
      gainMB *= 5.0;
      gainUSD *= 5;
      this.totalCrits++;
      this.dailyCrits++;
      window.tacticalAudio.playCritPing();
      this.spawnFloatingGain(x, y, gainMB, gainUSD, true);
    } else {
      window.tacticalAudio.playPing();
      this.spawnFloatingGain(x, y, gainMB, gainUSD, false);
    }

    this.addData(gainMB);
    this.addCredits(gainUSD);
    this.engine3D.triggerClickBounce();
  }

  damageShip(dmg) {
    const proto = DRONE_PROTOTYPES_DEF[this.selectedPrototype] || DRONE_PROTOTYPES_DEF.phantom;
    dmg *= (proto.fpvDamageMult || 1.0);
    this.shipHP = Math.max(0, this.shipHP - dmg);
    this._uiDirty = true;

    if (this.shipHP <= 0) {
      // Ship destroyed!
      this.sunkenShips++;
      this.shipLevel++;
      const reward = Math.floor(500 * this.shipLevel * this.getGlobalMultiplier());
      this.creditsUSD += reward;
      this.addNotification('💥 КОРАБЛЬ УНИЧТОЖЕН', `+$${reward.toLocaleString()} // Уровень ${this.shipLevel}`);
      window.tacticalAudio.playExplosion();

      if (this.engine3D) {
        this.engine3D.triggerShipExplosion();
      }

      // Drop random salvage from sunken ship
      const shipLoot = {};
      if (Math.random() < 0.65) shipLoot.titanium = 1 + Math.floor(Math.random() * 2);
      if (Math.random() < 0.45) shipLoot.chips = 1;
      if (this.shipLevel % 5 === 0) {
        shipLoot.box = 1;
        shipLoot.aicore = 1;
      }
      this.awardSalvage(shipLoot);

      // Spawn new ship with more HP
      this.shipMaxHP = Math.floor(100 * Math.pow(1.6, this.shipLevel - 1));
      this.shipHP = this.shipMaxHP;
      this.checkAllAchievements();
      this.saveGame();
    }
  }

  spawnFloatingGain(x, y, gainMB, gainUSD, isCrit) {
    const el = document.createElement('div');
    el.className = isCrit ? 'floating-gain crit' : 'floating-gain';
    const mbText = gainMB < 10 ? `+${gainMB.toFixed(1)} МБ` : `+${Math.floor(gainMB)} МБ`;
    el.textContent = isCrit ? `КРИТ! ${mbText} (+$${gainUSD})` : `${mbText} (+$${gainUSD})`;
    el.style.left = `${x + (Math.random() * 30 - 15)}px`;
    el.style.top = `${y - 20}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 850);
  }

  addData(amount) {
    const maxBuf = this.getMaxBufferMB();
    if (this.dataMB < maxBuf) {
      this.dataMB = Math.min(this.dataMB + amount, maxBuf);
    }
    this.totalDataMB += amount;
    this.dailyDataCollected += amount;
    // Also charge assault meter (proportional) — plasma_warhead doubles rate
    const chargeRate = this.tech.plasma_warhead ? 1.6 : 0.8;
    this.assaultCharge = Math.min(this.assaultCharge + amount * chargeRate, this.assaultChargeMax);
    this.checkDossierProgression();
    this._uiDirty = true;
  }

  addCredits(amount) {
    this.creditsUSD += amount;
    this.dailyCreditsEarned += amount;
    this._uiDirty = true;
  }

  sellDataForCash() {
    if (this.dataMB >= 10) {
      this.dataMB -= 10;
      this.creditsUSD += Math.floor(10 * 35 * this.getGlobalMultiplier());
      window.tacticalAudio.playContractSfx();
      this.updateUI();
    }
  }

  buyHardware(type) {
    const cost = this.getHWCost(type);
    if (this.dataMB >= cost) {
      this.dataMB -= cost;
      this.hw[type]++;
      window.tacticalAudio.playMountingSfx();
      if (this.engine3D) {
        this.engine3D.updateUpgrades({ ...this.hw, prestige: this.blueprintsBP });
        this.engine3D.addModule(type);
      }
      this.saveGame();
      this.updateUI();
    }
  }

  buyCyber(type) {
    const cost = this.getCyberCost(type);
    if (this.dataMB >= cost) {
      this.dataMB -= cost;
      this.cyber[type]++;
      window.tacticalAudio.playMountingSfx();
      if (this.engine3D) this.engine3D.addModule(type);
      this.saveGame();
      this.updateUI();
    }
  }

  startContract(id) {
    const c = this.activeContracts.find(item => item.id === id);
    if (c && !c.active && !c.completed) {
      if (this.dataMB >= c.costMB && this.creditsUSD >= c.costUSD) {
        this.dataMB -= c.costMB;
        this.creditsUSD -= c.costUSD;
        c.active = true;
        c.progress = 0;
        window.tacticalAudio.playMountingSfx();
        this.updateUI();
      }
    }
  }

  activateOverclock() {
    if (!this.isOverclocked && this.overclockCooldown <= 0) {
      this.isOverclocked = true;
      this.overclockTimer = 10.0;
      this.overclockCooldown = 25.0;
      this.overclockUses++;
      this.dailyOverclocks++;
      window.tacticalAudio.playCritPing();
      this._uiDirty = true;
    }
  }

  checkDossierProgression() {
    const percent = Math.min(100, (this.assaultCharge / this.assaultChargeMax) * 100.0);
    for (let i = 0; i < DOSSIER_LORE.length; i++) {
      if (percent >= DOSSIER_LORE[i].threshold && this.currentDossierStage <= i) {
        this.currentDossierStage = i + 1;
        this.updateDossier(DOSSIER_LORE[i], true);
      }
    }
  }

  updateDossier(lore, markUnread) {
    if (this.dossierTime) this.dossierTime.textContent = lore.timestamp;
    if (markUnread && this.dossierBeacon) {
      this.dossierHasUnread = true;
      this.dossierBeacon.style.display = 'inline-block';
    }

    if (this.typewriterTimer) clearInterval(this.typewriterTimer);
    let index = 0;
    const fullText = lore.text;
    if (this.dossierBody) {
      this.dossierBody.textContent = '';
      this.typewriterTimer = setInterval(() => {
        index++;
        this.dossierBody.textContent = fullText.slice(0, index) + '█';
        if (Math.random() > 0.5) window.tacticalAudio.playTypewriter();
        if (index >= fullText.length) {
          this.dossierBody.textContent = fullText;
          clearInterval(this.typewriterTimer);
        }
      }, 20);
    }
  }

  // =========================================================================
  // FPV ASSAULT — Enhanced Multi-Phase
  // =========================================================================
  startAssault() {
    this.minigameActive = true;
    this.assaultModal.classList.add('active');

    // Check if this should be a boss fight
    if (this.shouldTriggerBoss()) {
      this.bossActive = true;
      this.currentBoss = this.getBossForLevel();
      this.fpvGame.isBoss = true;
      this.fpvGame.bossData = this.currentBoss;
      this.addNotification(this.currentBoss.name, `БОСС: ${this.currentBoss.desc}`);
    } else {
      this.fpvGame.isBoss = false;
      this.fpvGame.bossData = null;
    }

    const proto = DRONE_PROTOTYPES_DEF[this.selectedPrototype] || DRONE_PROTOTYPES_DEF.phantom;
    let extraArmor = this.hw.armor + (proto.fpvExtraLives || 0) * 2;
    if (this.craftedModules && this.craftedModules.has('armor_titan')) extraArmor += 2;

    this.fpvGame.setDifficulty(this.blueprintsBP, extraArmor, this.tech.ghost_protocol || proto.id === 'phantom');
    this.fpvGame.start(this.fpvCanvas);
    window.tacticalAudio.playAlarm();
    this.checkAchievement('first_assault');
    this.dailyAssaults++;
  }

  updateMinigame(dt) {
    if (!this.minigameActive) return;

    const result = this.fpvGame.update(dt);
    try { this.fpvGame.draw(); } catch(e) { console.warn('FPV draw error:', e.message); }

    // Update HUD elements
    const progress = Math.min(100, (this.fpvGame.passed / this.fpvGame.requiredPass) * 100);
    if (this.lockBarFill) this.lockBarFill.style.width = `${progress}%`;

    if (this.fpvGame.phase === 'launch') {
      if (this.modalTimer) this.modalTimer.textContent = 'ФАЗА 1: ЗАПУСК ДРОНА';
      if (this.lockStatusLabel) {
        this.lockStatusLabel.textContent = '>>> НАЖМИ [ПРОБЕЛ] В ЗЕЛЁНОЙ ЗОНЕ <<<';
        this.lockStatusLabel.style.color = '#ffcc00';
      }
    } else if (this.fpvGame.phase === 'obstacle') {
      if (this.modalTimer) this.modalTimer.textContent = `ПРОРЫВ ПВО: ${this.fpvGame.passed} / ${this.fpvGame.requiredPass}`;
      if (this.lockStatusLabel) {
        this.lockStatusLabel.textContent = `♥ ${this.fpvGame.lives}/${this.fpvGame.maxLives} // [ПРОБЕЛ] = ВЗЛЁТ`;
        this.lockStatusLabel.style.color = '#00ff66';
      }
    } else if (this.fpvGame.phase === 'strike') {
      if (this.lockBarFill) this.lockBarFill.style.width = '100%';
      const lockPct = Math.floor((this.fpvGame.lockTimer / this.fpvGame.requiredLockTime) * 100);
      if (this.modalTimer) this.modalTimer.textContent = `ЗАХВАТ: ${lockPct}%`;
      if (this.lockStatusLabel) {
        this.lockStatusLabel.textContent = '>>> УДЕРЖИВАЙ ПРИЦЕЛ НА ЦЕЛИ <<<';
        this.lockStatusLabel.style.color = '#ff2a2a';
      }
    } else if (this.fpvGame.phase === 'explosion' || this.fpvGame.phase === 'rating') {
      if (this.modalTimer) this.modalTimer.textContent = this.fpvGame.phase === 'rating' ? `РЕЙТИНГ: ${this.fpvGame.rating}` : 'УДАР!';
    }

    if (result === 'success') {
      this.finishAssault(true);
    } else if (result === 'fail') {
      this.finishAssault(false);
    }
  }

  finishAssault(success) {
    this.minigameActive = false;

    // Track stats from the minigame
    this.lastAssaultRating = this.fpvGame.rating;
    this.lastAssaultNoDamage = this.fpvGame.score.noDamage;
    this.lastAssaultPerfectLaunch = this.fpvGame.score.perfectLaunch;
    this.lastAssaultSpeedDemon = this.fpvGame.totalTime < 10;

    // Track shield saves
    if (!this.fpvGame.score.noDamage && this.fpvGame.lives > 0) {
      this.shieldSaves += (this.fpvGame.maxLives - this.fpvGame.lives);
    }

    this.fpvGame.stop();

    if (success) {
      this.lockStatusLabel.textContent = this.bossActive
        ? '👑 БОСС-КОРАБЛЬ УНИЧТОЖЕН!'
        : '💥 КИНЕТИЧЕСКИЙ УДАР ПОДТВЕРЖДЁН!';
      this.lockStatusLabel.style.color = '#ffcc00';

      this.screenFlash.style.opacity = '1';
      setTimeout(() => { this.screenFlash.style.opacity = '0'; }, 600);

      // Rewards scaled by rating + boss multiplier
      const ratingMults = { S: 2.0, A: 1.5, B: 1.2, C: 1.0 };
      const rMult = ratingMults[this.lastAssaultRating] || 1.0;
      let bossMult = this.bossActive && this.currentBoss ? this.currentBoss.rewardMult : 1.0;
      if (this.craftedModules && this.craftedModules.has('plasma_warhead')) bossMult *= 2.0;

      this.blueprintsBP++;
      this.creditsUSD += Math.floor(15000 * rMult * bossMult);
      this.assaultCharge = 0;
      this.assaultChargeMax = Math.floor(500 * (1.0 + this.blueprintsBP * 0.4));
      this.currentDossierStage = 0;

      // Deliver kinetic impact to enemy warship
      this.damageShip(this.shipMaxHP);

      // Boss defeat tracking
      if (this.bossActive) {
        this.bossesDefeated++;
        this.addNotification('👑 БОСС ПОВЕРЖЕН', `${this.currentBoss.name} — x${bossMult} награды!`);
        this.bossActive = false;
        this.currentBoss = null;
      }

      // Bonus data from pickups
      if (this.fpvGame.collectedData > 0) {
        this.totalDataMB += this.fpvGame.collectedData * 50;
      }

      // Salvage Drop from assault
      const assaultLoot = {
        box: this.lastAssaultRating === 'S' ? 2 : 1,
        chips: 1 + Math.floor(Math.random() * 2),
        titanium: 1 + Math.floor(Math.random() * 2)
      };
      if (this.lastAssaultRating === 'S') assaultLoot.aicore = 1;
      this.awardSalvage(assaultLoot);

      // Advance campaign mission if active
      if (this.activeMission) {
        this.advanceMissionPhase();
      }

      // Check special achievements
      if (this.lastAssaultRating === 'S') this.checkAchievement('rank_s');
      if (this.lastAssaultPerfectLaunch) this.checkAchievement('perfect_launch');
      if (this.lastAssaultNoDamage) this.checkAchievement('no_damage');
      if (this.lastAssaultSpeedDemon) this.checkAchievement('speed_demon');
      this.checkAchievement('first_prestige');

      setTimeout(() => {
        this.assaultModal.classList.remove('active');
        this.updateDossier(DOSSIER_LORE[0], false);
        this.checkAllAchievements();
        this.saveGame();
        this._uiDirty = true;
      }, 3500);
    } else {
      this.lockStatusLabel.textContent = 'FPV-ДРОН УНИЧТОЖЕН // ШТУРМ ПРОВАЛЕН';
      this.lockStatusLabel.style.color = '#ff2a2a';

      setTimeout(() => {
        this.assaultModal.classList.remove('active');
      }, 1500);
    }
  }

  // =========================================================================
  // DYNAMIC CONTRACT DOM REBUILD
  // =========================================================================
  rebuildContractDOM() {
    const panel = document.querySelector('#panel-contracts .upgrade-list-scroll');
    if (!panel) return;

    // Keep the tech card (last child usually)
    const techCard = panel.querySelector('[data-buy-tech]')?.closest('.upgrade-item-card');

    // Remove contract cards
    panel.querySelectorAll('.contract-card-dynamic').forEach(c => c.remove());

    // Add new contracts
    this.activeContracts.forEach(c => {
      const card = document.createElement('div');
      card.className = 'upgrade-item-card contract-card-dynamic';
      card.innerHTML = `
        <div>
          <div class="item-card-title text-cyan">${c.name}</div>
          <div class="item-card-sub text-dim-cyan">+$${c.rewardUSD.toLocaleString()} // +${c.rewardMB} МБ</div>
          <div class="contract-bar-track">
            <div id="prog-contract-${c.id}" class="contract-bar-fill"></div>
          </div>
        </div>
        <button class="btn-buy-action" data-start-contract="${c.id}">СТАРТ</button>
      `;
      if (techCard) panel.insertBefore(card, techCard);
      else panel.appendChild(card);

      // Bind event
      card.querySelector('[data-start-contract]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.startContract(c.id);
      });
    });
  }

  // =========================================================================
  // MAIN GAME LOOP
  // =========================================================================
  startLoop() {
    let lastTime = performance.now();

    const loop = (now) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000.0);
      lastTime = now;

      // Overclock timers
      if (this.isOverclocked) {
        this.overclockTimer -= dt;
        if (this.overclockTimer <= 0) { this.isOverclocked = false; this._uiDirty = true; }
      }
      if (this.overclockCooldown > 0) this.overclockCooldown -= dt;

      // Weapon cooldown
      if (this.weaponCooldown > 0) {
        this.weaponCooldown = Math.max(0, this.weaponCooldown - dt);
        const cdFill = document.getElementById('cooldown-fill');
        if (cdFill) cdFill.style.width = `${(1 - this.weaponCooldown / this.weaponCooldownMax) * 100}%`;
      }

      // Passive income — data is uncapped, also charges assault meter
      if (!this.minigameActive) {
        let passiveMB = this.getPassiveRate();
        if (this.tech.data_nexus) passiveMB *= 2.0;
        if (passiveMB > 0) {
          const maxBuf = this.getMaxBufferMB();
          if (this.dataMB < maxBuf) {
            this.dataMB = Math.min(this.dataMB + passiveMB * dt, maxBuf);
          }
          this.totalDataMB += passiveMB * dt;
          this.dailyDataCollected += passiveMB * dt;
          // Charge assault meter — plasma_warhead doubles rate
          if (this.assaultCharge < this.assaultChargeMax) {
            const chargeRate = this.tech.plasma_warhead ? 1.6 : 0.8;
            this.assaultCharge = Math.min(this.assaultCharge + passiveMB * dt * chargeRate, this.assaultChargeMax);
          }
          this.checkDossierProgression();
          this._uiDirty = true;
        }
      }

      const passiveUSD = this.getUSDPassiveRate();
      if (passiveUSD > 0) {
        this.creditsUSD += passiveUSD * dt;
        this.dailyCreditsEarned += passiveUSD * dt;
        this._uiDirty = true;
      }

      // Contracts
      this.activeContracts.forEach(c => {
        if (c.active && !c.completed) {
          c.progress += dt;
          if (c.progress >= c.duration) {
            c.completed = true;
            c.active = false;
            this.creditsUSD += c.rewardUSD;
            this.addData(c.rewardMB);
            window.tacticalAudio.playContractSfx();
            this.addNotification('✅ КОНТРАКТ ВЫПОЛНЕН', `${c.name} — +$${c.rewardUSD.toLocaleString()}`);
            this._uiDirty = true;
          }
        }
      });
      this.refreshContracts();

      // SIGINT Cyber Hack timer & interference
      if (this.cyberHackActive) {
        this.cyberHackTimer -= dt;
        if (this.cyberHackTimer <= 0) {
          this.cyberHackActive = false;
          this.cyberModal.classList.remove('active');
          this.addNotification('❌ ВРЕМЯ ВЫШЛО', 'Сигнал потерян! Взлом провален.');
        }

        // Interference bursts
        this.cyberInterferenceTimer -= dt;
        if (this.cyberInterferenceTimer <= 0) {
          this.cyberInterferenceActive = true;
          this.cyberInterferenceTimer = 4 + Math.random() * 6;
          window.tacticalAudio.playCyberInterference();
          setTimeout(() => { this.cyberInterferenceActive = false; }, 1500 + Math.random() * 1500);
        }

        // Only draw cyber wave when modal is visible
        this.drawCyberWave(now / 1000.0);
      }

      // Random events
      this.updateRandomEvents(dt);
      if (this.activeEvent) this.updateEventBannerUI();

      // Minigame
      this.updateMinigame(dt);

      // === THROTTLED UI UPDATES (max ~4/sec) ===
      this._uiThrottleAccum += dt;
      if (this._uiDirty && this._uiThrottleAccum >= 0.25) {
        this._uiThrottleAccum = 0;
        this._uiDirty = false;
        this.updateUI();
        this.updateUIElements();
      }

      // === THROTTLED ACHIEVEMENT CHECK (every 2 sec) ===
      this._achieveCheckAccum += dt;
      if (this._achieveCheckAccum >= 2.0) {
        this._achieveCheckAccum = 0;
        this.checkAllAchievements();
        this.checkDailyQuests();
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  // =========================================================================
  // UI UPDATE
  // =========================================================================
  updateUI() {
    const maxBuf = this.getMaxBufferMB();
    const maxBufStr = isFinite(maxBuf) ? (maxBuf >= 1000 ? `${(maxBuf / 1000).toFixed(1)} ГБ` : `${maxBuf} МБ`) : '∞ БЕЗЛИМИТ';
    const dataStr = this.dataMB >= 1000 ? `${(this.dataMB / 1000).toFixed(2)} ГБ` : `${this.dataMB.toFixed(1)} МБ`;

    const chargePercent = Math.min(100, (this.assaultCharge / this.assaultChargeMax) * 100.0);

    if (this.lblBuffer) this.lblBuffer.textContent = `${dataStr} / ${maxBufStr}`;
    if (this.lblCredits) this.lblCredits.textContent = `$${Math.floor(this.creditsUSD).toLocaleString()}`;
    if (this.lblEnergyPercent) this.lblEnergyPercent.textContent = `${chargePercent.toFixed(0)}%`;
    if (this.progressBarFill) this.progressBarFill.style.width = `${chargePercent}%`;

    const passUSD = this.getUSDPassiveRate();
    if (this.lblPassiveUSD) this.lblPassiveUSD.textContent = `+$${Math.floor(passUSD)}/с`;
    if (this.lblPassive) this.lblPassive.textContent = `+${this.getPassiveRate().toFixed(1)} МБ/с`;
    if (this.lblClick) this.lblClick.textContent = `+${this.getClickPower().toFixed(1)} МБ`;
    if (this.lblMultiplier) this.lblMultiplier.textContent = `x${this.getGlobalMultiplier().toFixed(1)} [${this.blueprintsBP} ЧЖ]`;
    if (this.lblTotalData) this.lblTotalData.textContent = `ВСЕГО: ${this.totalDataMB >= 1000 ? (this.totalDataMB / 1000).toFixed(2) + ' ГБ' : this.totalDataMB.toFixed(0) + ' МБ'}`;

    if (this.lblSunkenCount) this.lblSunkenCount.textContent = `${this.sunkenShips} ВЫМПЕЛОВ`;
    if (this.lblKillsStatus) {
      let rank = 'ОПЕРАТОР БПА';
      if (this.sunkenShips >= 3) rank = 'КОМАНДИР ЗВЕНА';
      if (this.sunkenShips >= 8) rank = 'КОМАНДОР ФЛОТА';
      if (this.sunkenShips >= 15) rank = 'АДМИРАЛ';
      this.lblKillsStatus.textContent = `РАНГ: ${rank}`;
    }

    const isReady = this.assaultCharge >= this.assaultChargeMax;
    if (this.btnAssault) {
      if (isReady) {
        this.btnAssault.classList.add('ready');
        this.btnAssault.textContent = `>>> ЗАПУСК FPV-ШТУРМА [ГОТОВ] <<<`;
      } else {
        this.btnAssault.classList.remove('ready');
        this.btnAssault.textContent = `FPV-ЗАРЯД [${chargePercent.toFixed(0)}%] (${Math.floor(this.assaultCharge)}/${this.assaultChargeMax} МБ)`;
      }
    }

    // Ship HP bar
    const hpFill = document.getElementById('ship-hp-fill');
    const hpLabel = document.getElementById('ship-hp-label');
    if (hpFill) {
      const hpPct = Math.max(0, (this.shipHP / this.shipMaxHP) * 100);
      hpFill.style.width = `${hpPct}%`;
      hpFill.style.background = hpPct > 50 ? '#ff4444' : hpPct > 25 ? '#ff8800' : '#ff0000';
    }
    const shipData = getEnemyShipData(this.shipLevel);
    if (hpLabel) {
      hpLabel.textContent = `${shipData.icon} ${shipData.name} [Ур.${this.shipLevel}]: ${Math.ceil(this.shipHP).toLocaleString()} / ${this.shipMaxHP.toLocaleString()} HP`;
    }
  }

  updateUIElements() {
    ['satcom', 'optics', 'armor', 'waterjets', 'missiles'].forEach(k => {
      const c = this.getHWCost(k);
      const costEl = document.getElementById(`cost-hw-${k}`);
      const tierEl = document.getElementById(`tier-hw-${k}`);
      if (costEl) {
        if (c.isMax) {
          costEl.textContent = 'MAX (МК 10)';
          costEl.disabled = true;
        } else {
          costEl.textContent = `${c.mb >= 1000 ? (c.mb / 1000).toFixed(1) + ' ГБ' : c.mb + ' МБ'} | $${c.usd >= 1000 ? Math.floor(c.usd / 1000) + 'k' : c.usd}`;
          costEl.disabled = this.dataMB < c.mb || this.creditsUSD < c.usd;
        }
      }
      if (tierEl) tierEl.textContent = `МК ${Math.min(10, (this.hw[k] || 0) + 1)}`;
    });

    ['sniffer', 'quantum', 'autosiphon'].forEach(k => {
      const c = this.getCyberCost(k);
      const costEl = document.getElementById(`cost-cyber-${k}`);
      const tierEl = document.getElementById(`tier-cyber-${k}`);
      if (costEl) {
        if (c.isMax) {
          costEl.textContent = 'MAX (V.10)';
          costEl.disabled = true;
        } else {
          costEl.textContent = `${c.mb >= 1000 ? (c.mb / 1000).toFixed(1) + ' ГБ' : c.mb + ' МБ'} | $${c.usd >= 1000 ? Math.floor(c.usd / 1000) + 'k' : c.usd}`;
          costEl.disabled = this.dataMB < c.mb || this.creditsUSD < c.usd;
        }
      }
      if (tierEl) tierEl.textContent = `V.${Math.min(10, (this.cyber[k] || 0) + 1)}`;
    });

    this.activeContracts.forEach(c => {
      const progBar = document.getElementById(`prog-contract-${c.id}`);
      if (progBar) progBar.style.width = c.completed ? '100%' : `${(c.progress / c.duration) * 100}%`;
    });

    if (this.boosterWidget) {
      if (this.isOverclocked) {
        this.boosterWidget.className = 'booster-floating-widget active';
        if (this.boosterStatusTitle) this.boosterStatusTitle.textContent = `⚡ ${this.overclockTimer.toFixed(1)}с`;
        if (this.boosterStatusSub) this.boosterStatusSub.textContent = '+200% РАЗГОН';
      } else if (this.overclockCooldown > 0) {
        this.boosterWidget.className = 'booster-floating-widget cooldown';
        if (this.boosterStatusTitle) this.boosterStatusTitle.textContent = `КД ${this.overclockCooldown.toFixed(0)}с`;
        if (this.boosterStatusSub) this.boosterStatusSub.textContent = 'ОХЛАЖДЕНИЕ';
      } else {
        this.boosterWidget.className = 'booster-floating-widget';
        if (this.boosterStatusTitle) this.boosterStatusTitle.textContent = 'РАЗГОН +200%';
        if (this.boosterStatusSub) this.boosterStatusSub.textContent = 'ГОТОВ К ЗАПУСКУ';
      }
    }

    // EMP indicator
    if (this.empState) {
      const empEl = document.getElementById('emp-status');
      if (empEl) {
        if (this.empState.phase === 'down') {
          empEl.textContent = `⚡ ЭМ-ПОМЕХА: ${this.empState.timer.toFixed(0)}с`;
          empEl.style.color = '#ff4444';
          empEl.style.display = 'block';
        } else if (this.empState.phase === 'boost') {
          empEl.textContent = `⚡ РЕЗОНАНС x3: ${this.empState.timer.toFixed(0)}с`;
          empEl.style.color = '#00ff66';
          empEl.style.display = 'block';
        }
      }
    } else {
      const empEl = document.getElementById('emp-status');
      if (empEl) empEl.style.display = 'none';
    }
  }

  // =========================================================================
  // TECH TREE (TACTICAL R&D MATRIX)
  // =========================================================================
  initTechTree() {
    this.techTreeModal = document.getElementById('techtree-modal');
    const openBtn = document.getElementById('btn-open-techtree');
    const closeBtn = document.getElementById('btn-close-techtree');

    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.refreshTechTree();
        if (this.techTreeModal) this.techTreeModal.classList.add('active');
        if (this.allNodeIds && this.allNodeIds.length > 0) {
          this.selectTechNode(this.allNodeIds[this.selectedNodeIndex || 0]);
        }
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (this.techTreeModal) this.techTreeModal.classList.remove('active');
      });
    }

    // Filter Branch Tabs
    document.querySelectorAll('.tt-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.tt-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        document.querySelectorAll('.tt-branch').forEach(branch => {
          if (filter === 'all' || branch.getAttribute('data-branch') === filter) {
            branch.style.display = 'flex';
          } else {
            branch.style.display = 'none';
          }
        });
      });
    });

    // Tech node extended specifications & lore
    this.techDescriptions = {
      sniffer: {
        icon: '📡',
        tier: 'TIER 1',
        branch: 'СТЕЛС & КИБЕР-РЭБ',
        lore: 'Пассивный широкополосный анализатор радиочастот. Перехватывает пакеты телеметрии и навигации кораблей противника в скрытном режиме. Не демаскирует катер излучением.'
      },
      quantum: {
        icon: '🔮',
        tier: 'TIER 2',
        branch: 'СТЕЛС & КИБЕР-РЭБ',
        lore: 'Квантовый сопроцессор дешифровки протоколов военного стандарта. Мгновенно вычисляет уязвимости в шифровании бортовых систем врага, увеличивая шанс критического взлома.'
      },
      ghost_protocol: {
        icon: '👻',
        tier: 'TIER 3',
        branch: 'СТЕЛС & КИБЕР-РЭБ',
        lore: 'Электродинамический протокол поглощения радиоволн и тепловой сигнатуры. В режиме FPV-штурма подавляет сигналы ПВО противника, снижая количество препятствий на 40%.'
      },
      ecm_suite: {
        icon: '🛡️',
        tier: 'TIER 4',
        branch: 'СТЕЛС & КИБЕР-РЭБ',
        lore: 'Комплекс активного подавления радаров и каналов связи противника. Сокращает время перезарядки и подготовки к пуску боевых FPV-дронов в 2 раза.'
      },
      optics: {
        icon: '🔭',
        tier: 'TIER 1',
        branch: 'ОГНЕВАЯ МОЩЬ',
        lore: 'Многоспектральный гиростабилизированный оптико-электронный комплекс FLIR. Обеспечивает сопровождение теплоконтрастных целей в тумане, дыму и ночных условиях.'
      },
      missiles: {
        icon: '🚀',
        tier: 'TIER 2',
        branch: 'ОГНЕВАЯ МОЩЬ',
        lore: 'Складные стапели катапультного старта боевых FPV-дронов. Позволяют нести увеличенную кумулятивную боевую часть, повышая урон каждого удара на 50%.'
      },
      plasma_warhead: {
        icon: '💥',
        tier: 'TIER 3',
        branch: 'ОГНЕВАЯ МОЩЬ',
        lore: 'Высокотемпературная плазменная БЧ с кумулятивной струёй. Вызывает вторичные детонации боезапаса на вражеских судах и в 2 раза ускоряет накопление заряда штурма.'
      },
      swarm_ai: {
        icon: '🤖',
        tier: 'TIER 4',
        branch: 'ОГНЕВАЯ МОЩЬ',
        lore: 'Автономная нейросеть управления роем дронов. Поднимает в воздух звено эскортных БПА, синхронизируя перекрёстные удары и удваивая весь суммарный урон.'
      },
      satcom: {
        icon: '📡',
        tier: 'TIER 1',
        branch: 'ИНЖЕНЕРИЯ & БАЗА',
        lore: 'Высокоскоростной терминал спутниковой связи SATCOM с фазированной антенной решёткой. Обеспечивает стабильный восходящий поток разведданных в штаб.'
      },
      armor: {
        icon: '🛡️',
        tier: 'TIER 2',
        branch: 'ИНЖЕНЕРИЯ & БАЗА',
        lore: 'Многослойные бронепанели из карбида кремния и арамидных волокон. Защищают аккумуляторный отсек, давая дополнительную прочность в FPV-режиме и пассивный сбор данных.'
      },
      waterjets: {
        icon: '💨',
        tier: 'TIER 3',
        branch: 'ИНЖЕНЕРИЯ & БАЗА',
        lore: 'Высокоэффективные водомётные движители с регулируемым вектором тяги. Повышают манёвренность на волнении, формируют скрытный кильватер и увеличивают скорость сбора данных.'
      },
      autosiphon: {
        icon: '💰',
        tier: 'TIER 4',
        branch: 'ИНЖЕНЕРИЯ & БАЗА',
        lore: 'Автономный модуль перехвата и маршрутизации защищённых финансовых транзакций. Обеспечивает постоянный приток кредитов на счёт операции.'
      },
      data_nexus: {
        icon: '🌐',
        tier: 'TIER 5',
        branch: 'ИНЖЕНЕРИЯ & БАЗА',
        lore: 'Главный квантовый дата-центр «НЕКСУС». Синхронизирует все спутниковые каналы, РЭБ-станции и сенсоры, удваивая весь пассивный доход данных.'
      }
    };

    this.allNodeIds = [...document.querySelectorAll('.tt-node[data-tt]')].map(n => n.getAttribute('data-tt'));
    this.selectedNodeIndex = 0;

    // Node click handlers
    document.querySelectorAll('.tt-node[data-tt]').forEach(node => {
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = node.getAttribute('data-tt');
        this.selectTechNode(id);
        if (window.tacticalAudio) window.tacticalAudio.playPing();
      });
      // Double click or instant purchase
      node.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        const id = node.getAttribute('data-tt');
        this.purchaseTechNode(id);
      });
    });

    // Primary action button inside inspector
    const buyBtn = document.getElementById('tt-btn-action-buy');
    if (buyBtn) {
      buyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.allNodeIds && this.allNodeIds[this.selectedNodeIndex]) {
          this.purchaseTechNode(this.allNodeIds[this.selectedNodeIndex]);
        }
      });
    }

    // Navigation buttons
    const prevBtn = document.getElementById('tt-nav-prev');
    const nextBtn = document.getElementById('tt-nav-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedNodeIndex = (this.selectedNodeIndex - 1 + this.allNodeIds.length) % this.allNodeIds.length;
        this.selectTechNode(this.allNodeIds[this.selectedNodeIndex]);
        if (window.tacticalAudio) window.tacticalAudio.playPing();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedNodeIndex = (this.selectedNodeIndex + 1) % this.allNodeIds.length;
        this.selectTechNode(this.allNodeIds[this.selectedNodeIndex]);
        if (window.tacticalAudio) window.tacticalAudio.playPing();
      });
    }
  }

  selectTechNode(id) {
    if (!id) return;
    this.selectedNodeIndex = this.allNodeIds.indexOf(id);
    if (this.selectedNodeIndex < 0) this.selectedNodeIndex = 0;

    const node = document.querySelector(`.tt-node[data-tt="${id}"]`);
    if (!node) return;

    // Highlight selected node
    document.querySelectorAll('.tt-node').forEach(n => n.classList.remove('tt-selected'));
    node.classList.add('tt-selected');

    // Update inspector terminal
    const info = this.techDescriptions[id] || {};
    const nameEl = document.getElementById('tt-detail-name');
    const iconEl = document.getElementById('tt-detail-icon');
    const tierEl = document.getElementById('tt-detail-tier');
    const branchEl = document.getElementById('tt-detail-branch');
    const descEl = document.getElementById('tt-detail-desc');
    const statsEl = document.getElementById('tt-detail-stats');
    const statusWrap = document.getElementById('tt-detail-status-wrap');
    const buyBtn = document.getElementById('tt-btn-action-buy');

    if (nameEl) nameEl.textContent = node.querySelector('.tt-node-name')?.textContent || id;
    if (iconEl) iconEl.textContent = info.icon || '🔬';
    if (tierEl) tierEl.textContent = info.tier || `TIER ${node.getAttribute('data-tier') || '1'}`;
    if (branchEl) branchEl.textContent = info.branch || 'НИОКР КОРПУСА';
    if (descEl) descEl.textContent = info.lore || node.querySelector('.tt-node-desc')?.textContent || '';

    const cost = parseInt(node.getAttribute('data-tt-cost')) || 0;
    const req = node.getAttribute('data-tt-req');
    const effect = node.querySelector('.tt-node-desc')?.textContent || '';

    if (statsEl) {
      statsEl.innerHTML = `СТОИМОСТЬ: <strong>${cost.toLocaleString()} МБ</strong> // ЭФФЕКТ: <strong>${effect}</strong>${req ? ` // ТРЕБУЕТСЯ: <strong>${req.toUpperCase()}</strong>` : ''}`;
    }

    const isUnlocked = this.isTechUnlocked(id);
    const isReqMet = !req || this.isTechUnlocked(req);
    const hasEnoughData = this.dataMB >= cost;

    if (statusWrap) {
      if (isUnlocked) {
        statusWrap.innerHTML = `<div class="tt-status-pill unlocked">✓ МОДУЛЬ АКТИВИРОВАН</div>`;
      } else if (isReqMet) {
        if (hasEnoughData) {
          statusWrap.innerHTML = `<div class="tt-status-pill available">◉ ГОТОВО К ИССЛЕДОВАНИЮ</div>`;
        } else {
          statusWrap.innerHTML = `<div class="tt-status-pill ready">⚠️ НЕДОСТАТОЧНО ДАННЫХ</div>`;
        }
      } else {
        statusWrap.innerHTML = `<div class="tt-status-pill locked">🔒 ТРЕБУЕТСЯ ПРЕДШЕСТВЕННИК</div>`;
      }
    }

    if (buyBtn) {
      if (isUnlocked) {
        buyBtn.disabled = true;
        buyBtn.textContent = '✓ ИССЛЕДОВАНО';
      } else if (!isReqMet) {
        buyBtn.disabled = true;
        buyBtn.textContent = `🔒 ТРЕБУЕТСЯ: ${req.toUpperCase()}`;
      } else if (!hasEnoughData) {
        buyBtn.disabled = true;
        buyBtn.textContent = `НЕДОСТАТОЧНО (${cost.toLocaleString()} МБ)`;
      } else {
        buyBtn.disabled = false;
        buyBtn.textContent = `⚡ ИЗУЧИТЬ // ${cost.toLocaleString()} МБ`;
      }
    }
  }

  isTechUnlocked(id) {
    if (this.hw[id] !== undefined) return this.hw[id] > 0;
    if (this.cyber[id] !== undefined) return this.cyber[id] > 0;
    if (this.tech[id]) return true;
    return false;
  }

  purchaseTechNode(id) {
    const node = document.querySelector(`.tt-node[data-tt="${id}"]`);
    if (!node) return;

    if (this.isTechUnlocked(id)) return;

    const req = node.getAttribute('data-tt-req');
    if (req && !this.isTechUnlocked(req)) {
      this.addNotification('🔒 ЗАБЛОКИРОВАНО', `Сначала исследуйте предшественник: ${req.toUpperCase()}`);
      return;
    }

    const cost = parseInt(node.getAttribute('data-tt-cost')) || 0;
    if (this.dataMB < cost) {
      this.addNotification('❌ НЕ ХВАТАЕТ ДАННЫХ', `Нужно ${cost.toLocaleString()} МБ, у вас ${Math.floor(this.dataMB).toLocaleString()} МБ`);
      return;
    }

    this.dataMB -= cost;

    if (this.hw[id] !== undefined) {
      this.hw[id]++;
      if (this.engine3D) {
        this.engine3D.addModule(id);
        this.engine3D.updateUpgrades({ ...this.hw, ...this.cyber, prestige: this.blueprintsBP });
      }
    } else if (this.cyber[id] !== undefined) {
      this.cyber[id]++;
    } else {
      this.tech[id] = true;
    }

    const effectDesc = this.applyTechEffect(id);
    if (window.tacticalAudio) window.tacticalAudio.playMountingSfx();
    this.addNotification('🔬 МОДУЛЬ ИССЛЕДОВАН', `${node.querySelector('.tt-node-name')?.textContent || id}\n${effectDesc}`);
    
    this.refreshTechTree();
    this.selectTechNode(id);
    this.updateUIElements();
    this.saveGame();
    this._uiDirty = true;
  }

  applyTechEffect(id) {
    switch (id) {
      case 'satcom':
        return `+${(2.0 * this.hw.satcom).toFixed(1)} МБ/клик активно`;
      case 'optics':
        return `+${(4.0 * this.hw.optics).toFixed(1)} МБ/клик активно`;
      case 'armor':
        return `+1 жизнь в FPV, +${(1.5 * this.hw.armor).toFixed(1)} МБ/с`;
      case 'waterjets':
        return `+${(3.0 * this.hw.waterjets).toFixed(1)} МБ/с активно`;
      case 'missiles':
        return `FPV-дрон x${1 + this.hw.missiles * 0.5} к удару`;
      case 'sniffer':
        return `+${(2.5 * this.cyber.sniffer).toFixed(1)} МБ/с пассивно`;
      case 'quantum':
        return `+${(12 * this.cyber.quantum)}% крит шанс активен`;
      case 'autosiphon':
        return `+$${75 * this.cyber.autosiphon}/с пассивно`;

      case 'ghost_protocol':
        return '✓ FPV: -40% препятствий, -2 требуемых прохода';
      case 'ecm_suite':
        this.weaponCooldownMax = Math.max(0.5, this.weaponCooldownMax * 0.5);
        return `✓ Кулдаун пуска FPV: ${this.weaponCooldownMax.toFixed(1)}с (было 1.5с)`;
      case 'plasma_warhead':
        return '✓ Скорость заряда штурма x2 активна';
      case 'swarm_ai':
        this.tech.swarmAI = true;
        if (this.engine3D) this.engine3D.updateSwarmEscorts(true);
        return '✓ Рой ИИ дронов-эскортов активирован';
      case 'data_nexus':
        return '✓ Пассивный доход x2 активен';
      default:
        return '';
    }
  }

  refreshTechTree() {
    let unlockedTotal = 0;
    let stealthUnlocked = 0;
    let firepowerUnlocked = 0;
    let engineeringUnlocked = 0;

    const stealthNodes = ['sniffer', 'quantum', 'ghost_protocol', 'ecm_suite'];
    const firepowerNodes = ['optics', 'missiles', 'plasma_warhead', 'swarm_ai'];
    const engineeringNodes = ['satcom', 'armor', 'waterjets', 'autosiphon', 'data_nexus'];

    document.querySelectorAll('.tt-node[data-tt]').forEach(node => {
      const id = node.getAttribute('data-tt');
      const req = node.getAttribute('data-tt-req');
      const cost = parseInt(node.getAttribute('data-tt-cost')) || 0;

      node.classList.remove('tt-locked', 'tt-available', 'tt-unlocked');

      const isUnlocked = this.isTechUnlocked(id);
      const isReqMet = !req || this.isTechUnlocked(req);

      if (isUnlocked) {
        node.classList.add('tt-unlocked');
        unlockedTotal++;
        if (stealthNodes.includes(id)) stealthUnlocked++;
        if (firepowerNodes.includes(id)) firepowerUnlocked++;
        if (engineeringNodes.includes(id)) engineeringUnlocked++;
      } else if (isReqMet) {
        node.classList.add('tt-available');
      } else {
        node.classList.add('tt-locked');
      }
    });

    // Telemetry updates
    const userDataEl = document.getElementById('tt-user-data');
    if (userDataEl) {
      userDataEl.textContent = `${this.dataMB < 1000 ? this.dataMB.toFixed(1) : Math.floor(this.dataMB).toLocaleString()} МБ`;
    }

    const globalProgEl = document.getElementById('tt-global-progress');
    if (globalProgEl) {
      const percent = Math.round((unlockedTotal / 13) * 100);
      globalProgEl.textContent = `${unlockedTotal} / 13 [${percent}%]`;
    }

    const countStealthEl = document.getElementById('tt-count-stealth');
    if (countStealthEl) countStealthEl.textContent = `${stealthUnlocked}/4`;

    const countFirepowerEl = document.getElementById('tt-count-firepower');
    if (countFirepowerEl) countFirepowerEl.textContent = `${firepowerUnlocked}/4`;

    const countEngEl = document.getElementById('tt-count-engineering');
    if (countEngEl) countEngEl.textContent = `${engineeringUnlocked}/5`;
  }

  // Override passive rate to include tech tree bonuses
  getPassiveRateWithTech() {
    let rate = this.getPassiveRate();
    if (this.tech.data_nexus) rate *= 2.0;
    return rate;
  }

  // =========================================================================
  // SETTINGS
  // =========================================================================
  initSettings() {
    const settingsModal = document.getElementById('settings-modal');
    const openBtn = document.getElementById('btn-open-settings');
    const closeBtn = document.getElementById('btn-close-settings');

    if (openBtn) {
      openBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.refreshSettingsUI();
        if (settingsModal) settingsModal.classList.add('active');
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (settingsModal) settingsModal.classList.remove('active');
      });
    }

    // Sound toggle
    const soundToggle = document.getElementById('setting-sound');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        this.soundEnabled = !this.soundEnabled;
        if (window.tacticalAudio) {
          window.tacticalAudio.masterGain.gain.value = this.soundEnabled ? 1.0 : 0.0;
        }
        this.refreshSettingsUI();
        this.saveGame();
      });
    }

    // Volume slider
    const volSlider = document.getElementById('setting-volume');
    if (volSlider) {
      volSlider.value = this.soundEnabled ? 70 : 0;
      volSlider.addEventListener('input', () => {
        const vol = parseInt(volSlider.value) / 100;
        if (window.tacticalAudio && window.tacticalAudio.masterGain) {
          window.tacticalAudio.masterGain.gain.value = vol;
        }
        this.soundEnabled = vol > 0;
        this.refreshSettingsUI();
      });
    }

    // New Game
    const newGameBtn = document.getElementById('btn-new-game');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => {
        if (confirm('НОВАЯ ИГРА: Весь прогресс будет сброшен. Продолжить?')) {
          localStorage.removeItem('barracuda_save');
          location.reload();
        }
      });
    }

    // Apply saved sound setting
    if (!this.soundEnabled && window.tacticalAudio && window.tacticalAudio.masterGain) {
      window.tacticalAudio.masterGain.gain.value = 0;
    }
  }

  refreshSettingsUI() {
    const soundToggle = document.getElementById('setting-sound');
    if (soundToggle) {
      soundToggle.textContent = this.soundEnabled ? '🔊 ЗВУК: ВКЛ' : '🔇 ЗВУК: ВЫКЛ';
      soundToggle.style.color = this.soundEnabled ? '#00ff66' : '#ff4444';
    }
    const volSlider = document.getElementById('setting-volume');
    if (volSlider && window.tacticalAudio && window.tacticalAudio.masterGain) {
      volSlider.value = Math.round(window.tacticalAudio.masterGain.gain.value * 100);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.barracudaGame = new BarracudaGame();
  window.barracudaGame.initTechTree();
  window.barracudaGame.initSettings();
});
