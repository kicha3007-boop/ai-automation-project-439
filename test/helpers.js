import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const projectRoot = path.resolve(import.meta.dirname, "..");
const bin = path.join(projectRoot, "bin", "file-automation.js");

export const runCli = (args, options = {}) =>
  spawnSync(process.execPath, [bin, ...args], { encoding: "utf8", ...options });

export const tempDir = (prefix = "fa-") => mkdtempSync(path.join(tmpdir(), prefix));

const bom = "﻿";

const invoice = "Дата,Номер,Контрагент,Сумма\n2025-01-12,СЧ-1,ООО «Гранит»,100.00\n2025-01-19,СЧ-2,ИП Ковалёв,200.50\n";

// Папка-хаос с теми же ловушками, что и у набора компании, но со своими именами
// и числами. Имена не различаются одним регистром, чтобы набор раскладывался
// и на Windows.
export const chaosFiles = {
  "oplata-01.csv": invoice,
  "Копия oplata-01.csv": invoice,
  "VYPISKA.csv": "Дата,Операция,Сумма,Контрагент\n2025-02-05,Списание,-100.00,ООО «Гранит»\n",
  "vypiska (1).csv": "Дата,Операция,Сумма,Контрагент\n2025-02-05,Списание,-100.50,ООО «Гранит»\n\n",
  "dogovor.txt": "Договор аренды офиса.\n",
  "zametki.md": "# Заметки\n\nПроверить счета.\n",
  spravka: "Справка о реквизитах\nИНН 7700000000\n",
  "akt.pdf": Buffer.from("%PDF-1.4\n%âã\n1 0 obj\n", "latin1"),
  "skan.jpg": Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]),
  "svodka.xlsx": Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00]),
  "lzhet.txt": Buffer.from("%PDF-1.7\nэто скан под именем текста\n", "utf8"),
  binarnik: Buffer.from([0x01, 0x02, 0x00, 0x03]),
  ".DS_Store": Buffer.from([0x00, 0x00, 0x00, 0x01, 0x42, 0x75, 0x64, 0x31]),
  "pustoy.csv": "",
  "logo.png": Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x11, 0x22]),
  "readme.log": "просто текст\n",
  "kontakty-vebinar.csv": `${bom}Имя,Телефон,E-mail,Город\n ИВАН ПЕТРОВ ,8-921-555-14-95, IVAN@EXAMPLE.COM \nМария  Сидорова,+7 (903) 555-00-11,-\nПустой Контакт,NULL,\n`,
  "spisok.csv": "ФИО;Моб. телефон;Почта\nПетров Иван;89215551495;\nСергей Иванов;не указан;sergey@example.ru\nАнна Белова;12345;anna-at-example.ru\n",
  "staraya-crm.json": JSON.stringify(
    [
      { name: "Иван Петров", phone: "9215551495", company: "ООО «Пирс»" },
      { name: "ольга кузнецова", phone: "+7 812 555 82 19", company: null },
    ],
    null,
    2,
  ),
  "ankety.csv": "Имя,Телефон,Почта,Должность\nОльга Кузнецова,88125558219,olga@example.com,\"Бухгалтер, старший\"\n",
  "arhiv/oplata-12.csv": invoice.replace("СЧ-1", "СЧ-12"),
  "arhiv/dogovor.txt": "Договор аренды офиса, старая редакция.\n",
  "arhiv/glubzhe/kontakty-rassylka.csv": "Имя,Телефон,Email\nМария   Сидорова,89035550011,maria@example.com\nПётр Волков,,petr@example.com\n",
};

export const makeChaosFolder = (files = chaosFiles) => {
  const root = tempDir("company-");
  Object.entries(files).forEach(([relative, content]) => {
    const target = path.join(root, ...relative.split("/"));
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  });

  return root;
};

const splitCsvRow = (row) => {
  const values = [];
  let value = "";
  let quoted = false;
  [...row].forEach((symbol) => {
    if (symbol === '"') {
      quoted = !quoted;
    } else if (symbol === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += symbol;
    }
  });

  return [...values, value];
};

export const readCsv = (filepath) => {
  const [header, ...rows] = readFileSync(filepath, "utf8")
    .split("\n")
    .filter((row) => row !== "");
  const columns = splitCsvRow(header);

  return {
    columns,
    rows: rows.map((row) =>
      Object.fromEntries(splitCsvRow(row).map((value, index) => [columns[index], value])),
    ),
  };
};

export const numberAfter = (text, label) => Number(text.match(new RegExp(`${label}[^0-9]*([0-9]+)`))?.[1]);
