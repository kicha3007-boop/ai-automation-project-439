import asTable from "as-table";

import { outputFiles, statuses } from "./config.js";
import { formatFilesSummary } from "./files.js";
import { writeFile } from "./table.js";

// Отчёт описывает папку целиком, какую бы команду ни запустили: данные для него
// собирает analyzeFolder, здесь они только раскладываются в два вида.

const pathsWithStatus = (files, status) =>
  files.filter((file) => file.status === status).map((file) => file.relative);

const extraSize = ({ copies }) => copies.reduce((sum, copy) => sum + copy.size, 0);

// Те же данные, что и в отчёте для человека, структурой для следующей программы.
export const buildReportData = ({ directory, files, contacts }) => {
  const duplicates = files.groups.map((group) => ({
    main: group.main.relative,
    copies: group.copies.map((copy) => copy.relative),
    extraSize: extraSize(group),
  }));

  return {
    folder: directory,
    files: {
      summary: files.summary,
      manual: pathsWithStatus(files.files, statuses.manual),
      foreign: pathsWithStatus(files.files, statuses.foreign),
      duplicates,
      duplicatesExtraSize: duplicates.reduce((sum, group) => sum + group.extraSize, 0),
    },
    contacts: {
      summary: contacts.summary,
      sources: contacts.exports.map((item) => ({
        name: item.name,
        path: item.relative,
        records: item.records.length,
      })),
    },
  };
};

const listSection = (title, explanation, items) => [
  `${title} (${items.length})`,
  "",
  explanation,
  "",
  ...(items.length === 0 ? ["  нет"] : items.map((item) => `  ${item}`)),
  "",
];

const duplicatesSection = ({ summary }, duplicates, totalExtra) => [
  `Дубликаты (копий: ${summary.duplicates}, групп: ${summary.duplicateGroups}, лишнего места: ${totalExtra} байт)`,
  "",
  "Какой файл из группы оставить, решает человек. Лишнее место — размер всех файлов группы, кроме одного.",
  "",
  ...(duplicates.length === 0
    ? ["  нет"]
    : duplicates.flatMap((group, index) => [
        `  Группа ${index + 1}, лишнего места: ${group.extraSize} байт`,
        ...[group.main, ...group.copies].map((file) => `    ${file}`),
      ])),
  "",
];

const contactsSection = (contacts) => {
  const { summary, sources } = contacts;
  const unmatched = summary.unmatched.map(({ column, source }) => `${column} (${source})`);

  return [
    "Контакты",
    "",
    sources.length === 0
      ? "Выгрузок контактов в папке нет."
      : asTable(sources.map((source) => ({ Источник: source.path, Записей: source.records }))),
    "",
    `Выгрузок прочитано: ${summary.exports}, записей: ${summary.records}`,
    `Уникальных контактов: ${summary.contacts}`,
    `Отбраковано значений: ${summary.rejectedValues}, записей без телефона и почты: ${summary.rejectedRecords}`,
    `Колонки без соответствия: ${unmatched.length === 0 ? "нет" : unmatched.join(", ")}`,
    "",
  ];
};

export const buildReportText = (data) => {
  const { summary } = data.files;

  return [
    `Отчёт по папке ${data.folder}`,
    "",
    "Сводка",
    "",
    ...formatFilesSummary(summary),
    "",
    ...listSection(
      "Требуют ручного разбора",
      "Программа эти файлы не прочитала, содержимое придётся посмотреть человеку.",
      data.files.manual,
    ),
    ...listSection(
      "Можно удалить",
      "Эти файлы не документы: системный мусор, пустые файлы и форматы, с которыми программа не работает.",
      data.files.foreign,
    ),
    ...duplicatesSection(data.files, data.files.duplicates, data.files.duplicatesExtraSize),
    ...contactsSection(data.contacts),
  ].join("\n");
};

export const writeReports = (out, analysis) => {
  const data = buildReportData(analysis);

  return {
    text: writeFile(out, outputFiles.reportText, buildReportText(data)),
    json: writeFile(out, outputFiles.reportJson, `${JSON.stringify(data, null, 2)}\n`),
  };
};
