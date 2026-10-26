import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

// Обход папки компании. Единственное место, где программа ходит по папкам:
// им пользуются обе команды.

const collect = (root, directory) =>
  readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const filepath = path.join(directory, entry.name);

      return {
        path: filepath,
        relative: path.relative(root, filepath).split(path.sep).join("/"),
        name: entry.name,
        ext: path.extname(entry.name).toLowerCase(),
        size: statSync(filepath).size,
      };
    });

export const listFiles = (directory) => {
  if (!existsSync(directory) || !statSync(directory).isDirectory()) {
    throw new Error(`папка не найдена: ${directory}`);
  }

  return collect(directory, directory).sort((a, b) => (a.relative < b.relative ? -1 : 1));
};
