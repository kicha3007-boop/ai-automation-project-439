import { listFiles } from "./walk.js";

export const analyzeFiles = (directory) => {
  const files = listFiles(directory);

  return { files, summary: { total: files.length } };
};

export const runFiles = ({ directory }) => {
  const { summary } = analyzeFiles(directory);

  return [`Файлов найдено: ${summary.total}`];
};
