import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// Чтение табличных файлов и запись csv, общее для обеих команд.

const bom = "﻿";

const stripBom = (text) => (text.startsWith(bom) ? text.slice(1) : text);

const splitLines = (text) =>
  text
    .split("\n")
    .map((line) => (line.endsWith("\r") ? line.slice(0, -1) : line))
    .filter((line) => line.trim() !== "");

// Разделитель определяется по заголовку: чего в нём больше, запятых или точек с запятой.
export const detectSeparator = (header) =>
  header.split(";").length > header.split(",").length ? ";" : ",";

// Строка csv с учётом кавычек: значение в кавычках может содержать разделитель,
// а удвоенная кавычка внутри него означает саму кавычку.
export const parseCsvLine = (line, separator) => {
  const state = [...line].reduce(
    (acc, symbol, index, symbols) => {
      if (acc.skip) {
        return { ...acc, skip: false };
      }
      if (symbol === '"' && acc.quoted && symbols[index + 1] === '"') {
        return { ...acc, value: `${acc.value}"`, skip: true };
      }
      if (symbol === '"') {
        return { ...acc, quoted: !acc.quoted };
      }
      if (symbol === separator && !acc.quoted) {
        return { ...acc, values: [...acc.values, acc.value], value: "" };
      }
      return { ...acc, value: `${acc.value}${symbol}` };
    },
    { values: [], value: "", quoted: false, skip: false },
  );

  return [...state.values, state.value];
};

const readCsv = (text) => {
  const [header = "", ...lines] = splitLines(text);
  const separator = detectSeparator(header);
  const columns = header === "" ? [] : parseCsvLine(header, separator).map((name) => name.trim());

  return { columns, rows: lines.map((line) => parseCsvLine(line, separator)) };
};

const readJson = (text) => {
  const data = JSON.parse(text);
  const records = (Array.isArray(data) ? data : [data]).filter(
    (record) => record !== null && typeof record === "object",
  );
  const columns = [...new Set(records.flatMap((record) => Object.keys(record)))];

  return {
    columns,
    rows: records.map((record) =>
      columns.map((column) => (record[column] === null || record[column] === undefined ? "" : String(record[column]))),
    ),
  };
};

// Табличный документ: названия колонок и строки данных (массивы значений
// в порядке колонок). Часть выгрузок пришла из Excel: с BOM в начале
// и с точкой с запятой вместо запятой.
export const readTable = (filepath) => {
  const text = stripBom(readFileSync(filepath, "utf8"));

  return path.extname(filepath).toLowerCase() === ".json" ? readJson(text) : readCsv(text);
};

const toCsvValue = (value) => {
  const text = String(value ?? "");

  return /[",\n\r]/.test(text) ? `"${text.split('"').join('""')}"` : text;
};

export const toCsv = (columns, rows) =>
  `${[columns, ...rows].map((values) => values.map(toCsvValue).join(",")).join("\n")}\n`;

export const writeFile = (out, filename, content) => {
  const target = path.join(out, filename);

  mkdirSync(out, { recursive: true });
  writeFileSync(target, content);

  return target;
};

export const writeCsv = (out, filename, columns, rows) =>
  writeFile(out, filename, toCsv(columns, rows));
