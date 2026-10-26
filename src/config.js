// Все значения, зашитые в программу, собраны здесь: команды, пути по умолчанию,
// расширения, подписи форматов, колонки реестра и карта колонок контактов.
// Новый формат или новое название колонки добавляется правкой этого файла.

export const commandDescriptions = {
  files: "собрать реестр документов папки",
  contacts: "собрать чистую таблицу контактов",
};

export const defaultOut = "./out";

export const outputFiles = {
  registry: "registry.csv",
  contacts: "contacts.csv",
  reportText: "report.txt",
  reportJson: "report.json",
};

// Категории файлов (колонка «тип» реестра).
export const categories = {
  table: "табличный документ",
  text: "текстовый документ",
  unparsable: "непарсимый",
};

// Статусы файлов (колонка «статус» реестра).
export const statuses = {
  document: "документ",
  manual: "требует ручного разбора",
  foreign: "постороннее",
};

// Расширения, с которыми программа работает, и категория каждого. Файл с другим
// расширением получает статус «постороннее».
export const extensions = {
  ".csv": "table",
  ".json": "table",
  ".txt": "text",
  ".md": "text",
  ".pdf": "unparsable",
  ".jpg": "unparsable",
  ".jpeg": "unparsable",
  ".xlsx": "unparsable",
};

// Подписи форматов: первые байты файла, которые важнее имени. Все они двоичные,
// поэтому файл с такой подписью программа не читает.
export const signatures = [
  { format: "pdf", bytes: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { format: "jpeg", bytes: [0xff, 0xd8, 0xff] },
  { format: "zip", bytes: [0x50, 0x4b] }, // PK: xlsx, docx
  { format: "png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { format: "ole", bytes: [0xd0, 0xcf, 0x11, 0xe0] }, // старые doc, xls, Thumbs.db
];

// Сколько первых байтов смотреть в поисках подписи и нулевого байта.
export const headSize = 512;

// Системный мусор, который документом не бывает.
export const systemFiles = [".DS_Store", "Thumbs.db", "desktop.ini"];

// Слова, которыми помечают копии в имени файла (сравниваются в нижнем регистре).
export const copyWords = ["копия", "copy"];

export const registryColumns = [
  "путь",
  "имя",
  "тип",
  "размер",
  "хеш",
  "статус",
  "основная копия",
  "строк",
  "колонки",
];

// Карта соответствий колонок выгрузок полям схемы контакта. Названия сравниваются
// в нижнем регистре без лишних пробелов. Новый источник добавляется строкой здесь.
export const columnMap = {
  имя: ["имя", "фио", "name", "full name", "имя и фамилия", "фамилия имя", "контактное лицо"],
  телефон: [
    "телефон",
    "тел",
    "тел.",
    "моб. телефон",
    "мобильный телефон",
    "мобильный",
    "номер телефона",
    "phone",
    "phone number",
    "mobile",
    "tel",
  ],
  почта: ["почта", "e-mail", "email", "mail", "эл. почта", "электронная почта", "емейл"],
};

// Поля схемы, по которым запись опознаётся как контакт.
export const contactKeyFields = ["телефон", "почта"];

export const contactsColumns = ["имя", "телефон", "почта", "источники"];

export const sourcesSeparator = "; ";

// Заглушки, которыми выгрузки обозначают пустое значение (в нижнем регистре).
export const placeholders = ["", "-", "–", "—", "null", "undefined", "n/a", "none", "nan"];

// Российский номер: 11 цифр, первая 7. Номер из 10 цифр пришёл без кода страны.
export const phone = {
  countryCode: "7",
  trunkPrefix: "8",
  length: 11,
};
