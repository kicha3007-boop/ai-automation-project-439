import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, test } from "node:test";

import { chaosFiles, makeChaosFolder, numberAfter, projectRoot, runCli, tempDir } from "./helpers.js";

const company = makeChaosFolder();

const runInto = (command) => {
  const out = tempDir();
  const { stdout } = runCli([command, company, "--out", out]);

  return {
    stdout,
    text: readFileSync(path.join(out, "report.txt"), "utf8"),
    json: JSON.parse(readFileSync(path.join(out, "report.json"), "utf8")),
  };
};

describe("отчёты", () => {
  const files = runInto("files");
  const contacts = runInto("contacts");

  test("обе команды пишут одинаковые report.txt и report.json и печатают пути к ним", () => {
    assert.equal(files.text, contacts.text);
    assert.deepEqual(files.json, contacts.json);
    [files, contacts].forEach(({ stdout }) => {
      assert.match(stdout, /Отчёт: .*report\.txt/);
      assert.match(stdout, /Отчёт для программ: .*report\.json/);
    });
  });

  test("в report.txt общее число файлов, число контактов и все выгрузки", () => {
    assert.equal(numberAfter(files.text, "Файлов найдено"), Object.keys(chaosFiles).length);
    assert.equal(
      numberAfter(files.text, "Уникальных контактов"),
      numberAfter(contacts.stdout, "Уникальных контактов"),
    );
    ["ankety.csv", "arhiv/glubzhe/kontakty-rassylka.csv", "kontakty-vebinar.csv", "spisok.csv", "staraya-crm.json"].forEach(
      (name) => assert.ok(files.text.includes(name), name),
    );
  });

  test("файлы под ручной разбор и на удаление названы с путём", () => {
    const section = (title) => files.text.split(title)[1].split("\n\n").slice(1, 3).join("\n");

    assert.match(section("Требуют ручного разбора (5)"), /akt\.pdf[\s\S]*lzhet\.txt/);
    assert.match(section("Можно удалить (4)"), /\.DS_Store[\s\S]*readme\.log/);
  });

  test("группы дубликатов с лишним местом", () => {
    const extra = Buffer.byteLength(chaosFiles["Копия oplata-01.csv"]);

    assert.match(files.text, /Дубликаты \(копий: 3, групп: 3/);
    assert.ok(files.text.includes(`лишнего места: ${extra} байт`));
    assert.match(files.text, /dogovor\.txt\n\s+arhiv\/dogovor\.txt/);
  });

  test("сводка по источникам выровнена колонками", () => {
    assert.match(files.text, /Источник\s+Записей\n-+\n/);
  });

  test("report.json разбирается, числа совпадают с терминалом", () => {
    assert.equal(files.json.files.summary.total, numberAfter(files.stdout, "Файлов найдено"));
    assert.equal(files.json.files.summary.duplicates, 3);
    assert.equal(files.json.contacts.summary.contacts, numberAfter(contacts.stdout, "Уникальных контактов"));
    assert.equal(files.json.contacts.sources.length, 5);
    assert.ok(files.json.files.manual.includes("akt.pdf"));
  });
});

test("обход папки написан в одном месте", () => {
  const sources = readdirSync(path.join(projectRoot, "src")).map((name) =>
    readFileSync(path.join(projectRoot, "src", name), "utf8"),
  );

  assert.equal(sources.filter((source) => source.includes("readdirSync")).length, 1);
});
