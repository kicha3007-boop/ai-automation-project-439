#!/usr/bin/env node

import { program } from "commander";

import { run } from "../index.js";
import { commandDescriptions, defaultOut } from "../src/config.js";

program
  .name("file-automation")
  .description("Автоматизация разбора файлов компании")
  .version("1.0.0")
  .showHelpAfterError();

Object.entries(commandDescriptions).forEach(([command, description]) => {
  program
    .command(command)
    .description(description)
    .argument("<папка>", "папка с файлами компании")
    .option("-o, --out <папка>", "куда положить результат", defaultOut)
    .action((directory, options) => {
      try {
        const lines = run({ command, directory, out: options.out });
        console.log(lines.join("\n"));
      } catch (error) {
        console.error(`error: ${error.message}`);
        process.exit(1);
      }
    });
});

if (process.argv.length <= 2) {
  program.outputHelp();
} else {
  program.parse();
}
