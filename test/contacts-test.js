import assert from "node:assert/strict";
import path from "node:path";
import { before, describe, test } from "node:test";

import { makeChaosFolder, numberAfter, readCsv, runCli, tempDir } from "./helpers.js";

describe("команда contacts", () => {
  let stdout;
  let contacts;
  const byPhone = (phone) => contacts.rows.find((row) => row["телефон"] === phone);
  const byEmail = (email) => contacts.rows.find((row) => row["почта"] === email);

  before(() => {
    const out = tempDir();
    const result = runCli(["contacts", makeChaosFolder(), "--out", out]);
    assert.equal(result.status, 0, result.stderr);
    stdout = result.stdout;
    contacts = readCsv(path.join(out, "contacts.csv"));
  });

  test("выгрузки найдены по колонкам, включая подпапки и json", () => {
    const lines = stdout.split("\n");

    assert.deepEqual(lines.slice(0, 6), [
      "ankety.csv: записей 1",
      "kontakty-rassylka.csv: записей 2",
      "kontakty-vebinar.csv: записей 3",
      "spisok.csv: записей 3",
      "staraya-crm.json: записей 2",
      "Выгрузок прочитано: 5, записей: 11",
    ]);
  });

  test("счета и выписки с колонкой «Контрагент» выгрузками не считаются", () => {
    ["oplata-01.csv", "oplata-12.csv", "VYPISKA.csv", "vypiska (1).csv"].forEach((name) =>
      assert.ok(!stdout.includes(name), name),
    );
  });

  test("колонки без соответствия названы", () => {
    assert.match(
      stdout,
      /Колонки без соответствия: Должность \(ankety\.csv\), Город \(kontakty-vebinar\.csv\), company \(staraya-crm\.json\)/,
    );
  });

  test("сводка: уникальные контакты, отбракованные значения и записи, путь к таблице", () => {
    assert.equal(numberAfter(stdout, "Уникальных контактов"), 5);
    assert.match(stdout, /Отбраковано значений: 3, записей без телефона и почты: 2/);
    assert.match(stdout, /Таблица: .*contacts\.csv/);
    assert.equal(contacts.rows.length, 5);
  });

  test("колонки таблицы: имя, телефон, почта, источники", () => {
    assert.deepEqual(contacts.columns, ["имя", "телефон", "почта", "источники"]);
  });

  test("телефоны в разных записях склеены, поля дополняют друг друга, источники по разу", () => {
    assert.deepEqual(byPhone("79215551495"), {
      имя: "Иван Петров",
      телефон: "79215551495",
      почта: "ivan@example.com",
      источники: "kontakty-vebinar.csv; spisok.csv; staraya-crm.json",
    });
    assert.deepEqual(byPhone("78125558219"), {
      имя: "Ольга Кузнецова",
      телефон: "78125558219",
      почта: "olga@example.com",
      источники: "ankety.csv; staraya-crm.json",
    });
  });

  test("запись из подпапки склеена, двойные пробелы в имени убраны", () => {
    assert.deepEqual(byPhone("79035550011"), {
      имя: "Мария Сидорова",
      телефон: "79035550011",
      почта: "maria@example.com",
      источники: "kontakty-rassylka.csv; kontakty-vebinar.csv",
    });
  });

  test("запись без телефона склеивается по почте, битый телефон отбракован", () => {
    assert.equal(byEmail("sergey@example.ru")["телефон"], "");
    assert.equal(byEmail("petr@example.com")["имя"], "Пётр Волков");
  });

  test("в таблице нет заглушек, битых значений и записей без телефона и почты", () => {
    contacts.rows.forEach((row) => {
      assert.ok(row["телефон"] !== "" || row["почта"] !== "");
      Object.values(row).forEach((value) => {
        assert.ok(!["-", "null", "NULL", "не указан", "12345", "anna-at-example.ru"].includes(value));
      });
      if (row["телефон"] !== "") {
        assert.match(row["телефон"], /^7[0-9]{10}$/);
      }
      if (row["почта"] !== "") {
        assert.equal(row["почта"], row["почта"].trim().toLowerCase());
      }
    });
    assert.ok(!contacts.rows.some((row) => row["имя"] === "Пустой Контакт"));
  });

  test("повторов нет: телефоны и почты уникальны", () => {
    const phones = contacts.rows.map((row) => row["телефон"]).filter(Boolean);
    const emails = contacts.rows.map((row) => row["почта"]).filter(Boolean);

    assert.equal(new Set(phones).size, phones.length);
    assert.equal(new Set(emails).size, emails.length);
  });

  test("без выгрузок контактов таблица пустая, команда не падает", () => {
    const out = tempDir();
    const result = runCli(["contacts", makeChaosFolder({ "a.txt": "текст" }), "--out", out]);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Выгрузок прочитано: 0, записей: 0/);
    assert.deepEqual(readCsv(path.join(out, "contacts.csv")).rows, []);
  });
});
