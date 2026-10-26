import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import { makeChaosFolder, runCli, tempDir } from "./helpers.js";

test("без аргументов печатает справку с обеими командами и --out, код 0", () => {
  const { status, stdout, stderr } = runCli([]);

  assert.equal(status, 0);
  assert.equal(stderr, "");
  assert.match(stdout, /Usage: file-automation/);
  assert.match(stdout, /files \[options\] <папка>/);
  assert.match(stdout, /contacts \[options\] <папка>/);
  assert.match(runCli(["files", "--help"]).stdout, /--out <папка>/);
});

test("неизвестная команда: сообщение и список команд в stderr, код ненулевой", () => {
  const { status, stdout, stderr } = runCli(["registry", "./company-files"]);

  assert.notEqual(status, 0);
  assert.equal(stdout, "");
  assert.match(stderr, /unknown command 'registry'/);
  assert.match(stderr, /files/);
  assert.match(stderr, /contacts/);
});

test("команда без папки сообщает о недостающем аргументе", () => {
  ["files", "contacts"].forEach((command) => {
    const { status, stdout, stderr } = runCli([command]);

    assert.notEqual(status, 0);
    assert.equal(stdout, "");
    assert.match(stderr, /missing required argument 'папка'/);
  });
});

test("--out без значения называет параметр", () => {
  const { status, stdout, stderr } = runCli(["files", "./company-files", "--out"]);

  assert.notEqual(status, 0);
  assert.equal(stdout, "");
  assert.match(stderr, /--out/);
});

test("несуществующая папка: ошибка в stderr, код ненулевой", () => {
  const { status, stderr } = runCli(["files", path.join(tempDir(), "nope")]);

  assert.notEqual(status, 0);
  assert.match(stderr, /папка не найдена/);
});

test("--out по умолчанию ./out относительно текущей папки, папка компании не меняется", () => {
  const company = makeChaosFolder();
  const cwd = tempDir("cwd-");

  ["files", "contacts"].forEach((command) => {
    const { status, stdout } = runCli([command, company], { cwd });

    assert.equal(status, 0);
    assert.ok(stdout.includes(`Отчёт: ${path.join("out", "report.txt")}`), stdout);
  });

  ["registry.csv", "contacts.csv", "report.txt", "report.json"].forEach((name) => {
    assert.ok(existsSync(path.join(cwd, "out", name)), name);
    assert.ok(!existsSync(path.join(company, name)), name);
  });
  assert.ok(!existsSync(path.join(company, "out")));
});
