import { columnMap, contactKeyFields, contactsColumns, outputFiles, sourcesSeparator } from "./config.js";
import { normalizeRecord } from "./normalize.js";
import { writeCsv } from "./table.js";

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

// Ключ склейки: нормализованный телефон, а без него почта.
export const contactKey = (record) => record.телефон || record.почта;

// Записи с одним ключом склеиваются в одну: пустые поля дополняются значениями
// из других записей, источники собираются без повторов.
export const mergeContacts = (records) => {
  const merged = records.reduce((contacts, record) => {
    const key = contactKey(record);
    const known = contacts.get(key);

    if (known === undefined) {
      return contacts.set(key, {
        имя: record.имя,
        телефон: record.телефон,
        почта: record.почта,
        источники: [record.источник],
      });
    }

    return contacts.set(key, {
      имя: known.имя || record.имя,
      телефон: known.телефон || record.телефон,
      почта: known.почта || record.почта,
      источники: known.источники.includes(record.источник)
        ? known.источники
        : [...known.источники, record.источник],
    });
  }, new Map());

  return [...merged.values()];
};

export const analyzeContacts = (files) => {
  const exports = readExports(files);
  const records = exports.flatMap((item) => item.records);
  const normalized = records.map(normalizeRecord);
  const identifiable = normalized
    .map((item) => item.record)
    .filter((record) => contactKey(record) !== "");
  const contacts = mergeContacts(identifiable);

  return {
    exports,
    contacts,
    summary: {
      exports: exports.length,
      records: records.length,
      contacts: contacts.length,
      rejectedValues: normalized.reduce((sum, item) => sum + item.rejected, 0),
      rejectedRecords: normalized.length - identifiable.length,
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
  `Уникальных контактов: ${summary.contacts}`,
  `Отбраковано значений: ${summary.rejectedValues}, записей без телефона и почты: ${summary.rejectedRecords}`,
];

const toContactsRow = (contact) => [
  contact.имя,
  contact.телефон,
  contact.почта,
  contact.источники.join(sourcesSeparator),
];

export const writeContacts = (out, contacts) =>
  writeCsv(out, outputFiles.contacts, contactsColumns, contacts.map(toContactsRow));
