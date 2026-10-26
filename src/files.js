import { classify } from "./content.js";
import { categories, outputFiles, registryColumns, statuses } from "./config.js";
import { findDuplicateGroups, hashContent, mainCopyLinks } from "./duplicates.js";
import { readTable, writeCsv } from "./table.js";
import { listFiles } from "./walk.js";

const countBy = (items, keys, pick) =>
  Object.fromEntries(keys.map((key) => [key, items.filter((item) => pick(item) === key).length]));

export const isReadableTable = (file) =>
  file.category === "table" && file.status === statuses.document;

// Заголовок и строки табличного документа. Файл, который не разобрался,
// остаётся в реестре без них.
const readTableSafely = (file) => {
  try {
    return readTable(file.path);
  } catch {
    return null;
  }
};

const describeFile = (file) => {
  const { content, ...classified } = classify(file);
  const table = isReadableTable(classified) ? readTableSafely(classified) : null;

  return { ...classified, hash: hashContent(content), table };
};

export const analyzeFiles = (directory) => {
  const described = listFiles(directory).map(describeFile);
  const groups = findDuplicateGroups(described);
  const links = mainCopyLinks(groups);
  const files = described.map((file) => ({ ...file, main: links.get(file.relative) ?? "" }));

  const summary = {
    total: files.length,
    categories: countBy(files, Object.keys(categories), (file) => file.category),
    statuses: countBy(files, Object.values(statuses), (file) => file.status),
    duplicates: links.size,
    duplicateGroups: groups.length,
  };

  return { files, groups, summary };
};

const toRegistryRow = (file) => [
  file.relative,
  file.name,
  categories[file.category],
  file.size,
  file.hash,
  file.status,
  file.main,
  file.table ? file.table.rows.length : "",
  file.table ? file.table.columns.join("; ") : "",
];

export const writeRegistry = (out, files) =>
  writeCsv(out, outputFiles.registry, registryColumns, files.map(toRegistryRow));

const groupsWord = (count) => (count % 10 === 1 && count % 100 !== 11 ? "группе" : "группах");

export const formatFilesSummary = (summary) => [
  `Файлов найдено: ${summary.total}`,
  `Табличных документов: ${summary.categories.table}, текстовых: ${summary.categories.text}, непарсимых: ${summary.categories.unparsable}`,
  `Документов: ${summary.statuses[statuses.document]}, требуют ручного разбора: ${summary.statuses[statuses.manual]}, посторонних: ${summary.statuses[statuses.foreign]}`,
  `Дубликатов найдено: ${summary.duplicates} в ${summary.duplicateGroups} ${groupsWord(summary.duplicateGroups)}`,
];

export const runFiles = ({ directory, out }) => {
  const { files, summary } = analyzeFiles(directory);
  const registryPath = writeRegistry(out, files);

  return [...formatFilesSummary(summary), `Реестр: ${registryPath}`];
};
