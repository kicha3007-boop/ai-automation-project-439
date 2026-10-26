import { createHash } from "node:crypto";
import path from "node:path";

import { copyWords } from "./config.js";

export const hashContent = (content) => createHash("sha256").update(content).digest("hex");

// Имя без регистра, суффикса «(1)» и слова «копия». Расширение остаётся: счёт.csv
// и счёт.txt — разные документы.
export const normalizeName = (name) => {
  const lower = name.toLowerCase();
  const ext = path.extname(lower);
  const words = lower
    .slice(0, lower.length - ext.length)
    .split(" ")
    .filter((word) => word !== "" && !copyWords.includes(word))
    .filter((word, index, all) => !(index === all.length - 1 && /^\(\d+\)$/.test(word)));

  return `${words.join(" ")}${ext}`;
};

const depth = (file) => file.relative.split("/").length;

// Правило основной копии: файл ближе к корню папки, затем тот, чьё имя уже
// в приведённом виде, затем с коротким именем, затем по пути. Порядок
// файловой системы на выбор не влияет.
const compareForMain = (a, b) =>
  depth(a) - depth(b) ||
  Number(normalizeName(b.name) === b.name) - Number(normalizeName(a.name) === a.name) ||
  a.name.length - b.name.length ||
  (a.relative < b.relative ? -1 : a.relative > b.relative ? 1 : 0);

// Группы копий: файлы связаны, если у них один хеш или одно приведённое имя.
// Связи собираются через «представителя» группы, поэтому группа, сошедшаяся
// и по хешу, и по имени, остаётся одной.
export const findDuplicateGroups = (files) => {
  const parent = new Map(files.map((file) => [file.relative, file.relative]));
  const find = (key) => (parent.get(key) === key ? key : find(parent.get(key)));
  const union = (a, b) => parent.set(find(a), find(b));

  const linkBy = (pick) => {
    const seen = new Map();
    files.forEach((file) => {
      const key = pick(file);
      if (seen.has(key)) {
        union(file.relative, seen.get(key));
      } else {
        seen.set(key, file.relative);
      }
    });
  };

  linkBy((file) => file.hash);
  linkBy((file) => normalizeName(file.name));

  const groups = new Map();
  files.forEach((file) => {
    const root = find(file.relative);
    groups.set(root, [...(groups.get(root) ?? []), file]);
  });

  return [...groups.values()]
    .filter((group) => group.length > 1)
    .map((group) => {
      const [main, ...copies] = [...group].sort(compareForMain);
      return { main, copies };
    })
    .sort((a, b) => (a.main.relative < b.main.relative ? -1 : 1));
};

// Ссылка каждой копии прямо на основную, без цепочек.
export const mainCopyLinks = (groups) =>
  new Map(
    groups.flatMap(({ main, copies }) => copies.map((copy) => [copy.relative, main.relative])),
  );
