import { columnMap, contactKeyFields } from "./config.js";
import { analyzeFiles } from "./files.js";

const fields = Object.keys(columnMap);

const normalizeColumnName = (column) => column.trim().toLowerCase().split(" ").filter(Boolean).join(" ");

// Поле схемы, которому соответствует колонка выгрузки, или null.
export const matchColumn = (column) =>
  fields.find((field) => columnMap[field].includes(normalizeColumnName(column))) ?? null;

export const isContactsExport = (columns) =>
  columns.some((column) => contactKeyFields.includes(matchColumn(column)));

const toRecord = (columns, values, source) => {
  const empty = Object.fromEntries(fields.map((field) => [field, ""]));

  return columns.reduce(
    (record, column, index) => {
      const field = matchColumn(column);
      const value = values[index] ?? "";

      return field === null || record[field] !== "" ? record : { ...record, [field]: value };
    },
    { ...empty, источник: source },
  );
};

// Выгрузки контактов узнаются по колонкам: имена файлов в программе не перечислены.
export const readExports = (files) =>
  files
    .filter((file) => file.table !== null && isContactsExport(file.table.columns))
    .map((file) => ({
      name: file.name,
      relative: file.relative,
      records: file.table.rows.map((values) => toRecord(file.table.columns, values, file.name)),
      unmatched: file.table.columns.filter((column) => matchColumn(column) === null),
    }));

export const analyzeContacts = (files) => {
  const exports = readExports(files);
  const records = exports.flatMap((item) => item.records);

  return {
    exports,
    summary: {
      exports: exports.length,
      records: records.length,
      unmatched: exports.flatMap(({ name, unmatched }) =>
        unmatched.map((column) => ({ column, source: name })),
      ),
    },
  };
};

export const formatContactsSummary = ({ exports, summary }) => [
  ...exports.map(({ name, records }) => `${name}: записей ${records.length}`),
  `Выгрузок прочитано: ${summary.exports}, записей: ${summary.records}`,
  `Колонки без соответствия: ${
    summary.unmatched.length === 0
      ? "нет"
      : summary.unmatched.map(({ column, source }) => `${column} (${source})`).join(", ")
  }`,
];

export const runContacts = ({ directory }) =>
  formatContactsSummary(analyzeContacts(analyzeFiles(directory).files));
