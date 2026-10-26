import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

// Обход папки компании. Единственное место, где программа ходит по папкам:
// им пользуются обе команды.

// Встретив папку, обход заходит в неё тем же способом, глубина не ограничена.
const collect = (root, directory) =>
  readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() || entry.isDirectory())
    .flatMap((entry) => {
      const filepath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collect(root, filepath);
      }

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
