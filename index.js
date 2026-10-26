import { runContacts, runFiles } from "./src/commands.js";

const commands = {
  files: runFiles,
  contacts: runContacts,
};

export const commandNames = Object.keys(commands);

// Возвращает строки для терминала: печатает их вызывающая сторона.
export const run = ({ command, directory, out }) => commands[command]({ directory, out });
