import { classify } from "./content.js";
import { categories, statuses } from "./config.js";
import { findDuplicateGroups, hashContent, mainCopyLinks } from "./duplicates.js";
import { listFiles } from "./walk.js";

const countBy = (items, keys, pick) =>
  Object.fromEntries(keys.map((key) => [key, items.filter((item) => pick(item) === key).length]));

const describeFile = (file) => {
  const { content, ...classified } = classify(file);

  return { ...classified, hash: hashContent(content) };
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

const groupsWord = (count) =>
  count % 10 === 1 && count % 100 !== 11 ? "группе" : "группах";

export const formatFilesSummary = (summary) => [
  `Файлов найдено: ${summary.total}`,
  `Табличных документов: ${summary.categories.table}, текстовых: ${summary.categories.text}, непарсимых: ${summary.categories.unparsable}`,
  `Документов: ${summary.statuses[statuses.document]}, требуют ручного разбора: ${summary.statuses[statuses.manual]}, посторонних: ${summary.statuses[statuses.foreign]}`,
  `Дубликатов найдено: ${summary.duplicates} в ${summary.duplicateGroups} ${groupsWord(summary.duplicateGroups)}`,
];

export const runFiles = ({ directory }) => formatFilesSummary(analyzeFiles(directory).summary);
