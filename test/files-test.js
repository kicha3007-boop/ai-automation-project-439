import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { before, describe, test } from "node:test";

import { chaosFiles, makeChaosFolder, numberAfter, readCsv, runCli, tempDir } from "./helpers.js";

describe("команда files", () => {
  let company;
  let out;
  let stdout;
  let registry;
  const row = (relative) => registry.rows.find((item) => item["путь"] === relative);

  before(() => {
    company = makeChaosFolder();
    out = path.join(tempDir("out-"), "nested", "out");
    const result = runCli(["files", company, "--out", out]);
    assert.equal(result.status, 0, result.stderr);
    stdout = result.stdout;
    registry = readCsv(path.join(out, "registry.csv"));
  });

  test("считает файлы вместе с подпапками любой глубины, папки не считает", () => {
    assert.equal(numberAfter(stdout, "Файлов найдено"), Object.keys(chaosFiles).length);
    assert.ok(row("arhiv/glubzhe/kontakty-rassylka.csv"));
  });

  test("сводка по категориям и статусам сходится с числом файлов", () => {
    assert.match(stdout, /Табличных документов: 11, текстовых: 5, непарсимых: 7/);
    assert.match(stdout, /Документов: 14, требуют ручного разбора: 5, посторонних: 4/);
  });

  test("дубликаты по хешу, по имени и одноимённые из подпапок собраны в группы", () => {
    assert.match(stdout, /Дубликатов найдено: 3 в 3 группах/);
    assert.equal(row("Копия oplata-01.csv")["основная копия"], "oplata-01.csv");
    assert.equal(row("vypiska (1).csv")["основная копия"], "VYPISKA.csv");
    assert.equal(row("arhiv/dogovor.txt")["основная копия"], "dogovor.txt");
    ["oplata-01.csv", "VYPISKA.csv", "dogovor.txt", "arhiv/oplata-12.csv"].forEach((main) =>
      assert.equal(row(main)["основная копия"], ""),
    );
  });

  test("копия ссылается прямо на основную, без цепочек", () => {
    registry.rows
      .filter((item) => item["основная копия"] !== "")
      .forEach((item) => assert.equal(row(item["основная копия"])["основная копия"], ""));
  });

  test("печатает путь к реестру и создаёт папку --out", () => {
    assert.match(stdout, /Реестр: .*registry\.csv/);
    assert.deepEqual(readdirSync(out).sort(), ["registry.csv", "report.json", "report.txt"]);
  });

  test("колонки реестра в заданном порядке, по строке на каждый файл", () => {
    assert.deepEqual(registry.columns, [
      "путь",
      "имя",
      "тип",
      "размер",
      "хеш",
      "статус",
      "основная копия",
      "строк",
      "колонки",
    ]);
    assert.equal(registry.rows.length, Object.keys(chaosFiles).length);
  });

  test("тип и статус: подпись формата важнее расширения", () => {
    const expected = {
      "oplata-01.csv": ["табличный документ", "документ"],
      "staraya-crm.json": ["табличный документ", "документ"],
      "dogovor.txt": ["текстовый документ", "документ"],
      "zametki.md": ["текстовый документ", "документ"],
      spravka: ["текстовый документ", "документ"],
      "akt.pdf": ["непарсимый", "требует ручного разбора"],
      "skan.jpg": ["непарсимый", "требует ручного разбора"],
      "svodka.xlsx": ["непарсимый", "требует ручного разбора"],
      "lzhet.txt": ["непарсимый", "требует ручного разбора"],
      binarnik: ["непарсимый", "требует ручного разбора"],
      ".DS_Store": ["непарсимый", "постороннее"],
      "pustoy.csv": ["табличный документ", "постороннее"],
      "logo.png": ["непарсимый", "постороннее"],
      "readme.log": ["текстовый документ", "постороннее"],
    };

    Object.entries(expected).forEach(([name, [type, status]]) => {
      assert.equal(row(name)["тип"], type, name);
      assert.equal(row(name)["статус"], status, name);
    });
  });

  test("размер и хеш по содержимому", () => {
    const content = readFileSync(path.join(company, "akt.pdf"));

    assert.equal(row("akt.pdf")["размер"], String(content.length));
    assert.equal(row("akt.pdf")["хеш"], createHash("sha256").update(content).digest("hex"));
    assert.equal(row("oplata-01.csv")["хеш"], row("Копия oplata-01.csv")["хеш"]);
  });

  test("у табличных документов строки и колонки, BOM и точка с запятой учтены", () => {
    assert.equal(row("oplata-01.csv")["строк"], "2");
    assert.equal(row("oplata-01.csv")["колонки"], "Дата; Номер; Контрагент; Сумма");
    assert.equal(row("vypiska (1).csv")["строк"], "1");
    assert.equal(row("kontakty-vebinar.csv")["колонки"], "Имя; Телефон; E-mail; Город");
    assert.equal(row("spisok.csv")["колонки"], "ФИО; Моб. телефон; Почта");
    assert.equal(row("spisok.csv")["строк"], "3");
    assert.equal(row("staraya-crm.json")["строк"], "2");
    assert.equal(row("staraya-crm.json")["колонки"], "name; phone; company");
    assert.equal(row("ankety.csv")["строк"], "1");
  });

  test("у остальных файлов строки и колонки пустые", () => {
    ["dogovor.txt", "akt.pdf", "pustoy.csv", ".DS_Store"].forEach((name) => {
      assert.equal(row(name)["строк"], "");
      assert.equal(row(name)["колонки"], "");
    });
  });

  test("значение с запятой не разъезжается по колонкам", () => {
    const company2 = makeChaosFolder({ "dannye, 2025.csv": "a,b\n1,2\n" });
    const out2 = tempDir();
    runCli(["files", company2, "--out", out2]);
    const [only] = readCsv(path.join(out2, "registry.csv")).rows;

    assert.equal(only["путь"], "dannye, 2025.csv");
    assert.equal(only["колонки"], "a; b");
  });

  test("повторный запуск даёт тот же реестр", () => {
    const again = tempDir();
    runCli(["files", company, "--out", again]);

    assert.equal(
      readFileSync(path.join(again, "registry.csv"), "utf8"),
      readFileSync(path.join(out, "registry.csv"), "utf8"),
    );
  });

  test("папка компании не меняется", () => {
    const listing = (directory) =>
      readdirSync(directory, { recursive: true }).map(String).sort();

    assert.deepEqual(listing(company), listing(makeChaosFolder()));
  });
});
