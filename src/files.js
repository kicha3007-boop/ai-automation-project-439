import { classify } from "./content.js";
import { categories, statuses } from "./config.js";
import { listFiles } from "./walk.js";

const countBy = (items, keys, pick) =>
  Object.fromEntries(keys.map((key) => [key, items.filter((item) => pick(item) === key).length]));

export const analyzeFiles = (directory) => {
  const files = listFiles(directory).map(classify);

  const summary = {
    total: files.length,
    categories: countBy(files, Object.keys(categories), (file) => file.category),
    statuses: countBy(files, Object.values(statuses), (file) => file.status),
  };

  return { files, summary };
};

export const formatFilesSummary = ({ total, categories: byCategory, statuses: byStatus }) => [
  `Файлов найдено: ${total}`,
  `Табличных документов: ${byCategory.table}, текстовых: ${byCategory.text}, непарсимых: ${byCategory.unparsable}`,
  `Документов: ${byStatus[statuses.document]}, требуют ручного разбора: ${byStatus[statuses.manual]}, посторонних: ${byStatus[statuses.foreign]}`,
];

export const runFiles = ({ directory }) => formatFilesSummary(analyzeFiles(directory).summary);
