import { analyzeContacts, formatContactsSummary, writeContacts } from "./contacts.js";
import { analyzeFiles, formatFilesSummary, writeRegistry } from "./files.js";
import { writeReports } from "./report.js";

// Разбор папки целиком: числа считаются один раз и идут в терминал и в оба отчёта.
// Каждой команде нужна только своя половина, но отчёт описывает папку целиком.
export const analyzeFolder = (directory) => {
  const files = analyzeFiles(directory);
  const contacts = analyzeContacts(files.files);

  return { directory, files, contacts };
};

const reportLines = (out, analysis) => {
  const reports = writeReports(out, analysis);

  return [`Отчёт: ${reports.text}`, `Отчёт для программ: ${reports.json}`];
};

export const runFiles = ({ directory, out }) => {
  const analysis = analyzeFolder(directory);
  const registry = writeRegistry(out, analysis.files.files);

  return [
    ...formatFilesSummary(analysis.files.summary),
    `Реестр: ${registry}`,
    ...reportLines(out, analysis),
  ];
};

export const runContacts = ({ directory, out }) => {
  const analysis = analyzeFolder(directory);
  const contacts = writeContacts(out, analysis.contacts.contacts);

  return [
    ...formatContactsSummary(analysis.contacts),
    `Таблица: ${contacts}`,
    ...reportLines(out, analysis),
  ];
};
