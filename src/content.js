import { readFileSync } from "node:fs";

import { extensions, headSize, signatures, statuses, systemFiles } from "./config.js";

// Всё, что программа узнаёт о файле по его байтам и расширению.

const startsWith = (head, bytes) => bytes.every((byte, index) => head[index] === byte);

export const findSignature = (head) =>
  signatures.find(({ bytes }) => startsWith(head, bytes))?.format ?? null;

// Категория по двум признакам. Подпись формата важнее имени: файл с подписью
// двоичного формата непарсимый, как бы он ни назывался. Без подписи решает
// расширение, а без знакомого расширения — нулевой байт в начале файла.
export const detectCategory = ({ ext }, content) => {
  const head = content.subarray(0, headSize);

  if (findSignature(head) !== null || head.includes(0)) {
    return "unparsable";
  }

  return Object.hasOwn(extensions, ext) ? extensions[ext] : "text";
};

export const isForeign = ({ name, ext, size }) =>
  size === 0 || systemFiles.includes(name) || (ext !== "" && !Object.hasOwn(extensions, ext));

export const detectStatus = (file, category) => {
  if (isForeign(file)) {
    return statuses.foreign;
  }

  return category === "unparsable" ? statuses.manual : statuses.document;
};

export const classify = (file) => {
  const content = readFileSync(file.path);
  const category = detectCategory(file, content);

  return { ...file, content, category, status: detectStatus(file, category) };
};
