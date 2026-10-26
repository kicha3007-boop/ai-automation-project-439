import assert from "node:assert/strict";
import { test } from "node:test";

import { matchColumn } from "../src/contacts.js";
import { normalizeName as normalizeFileName } from "../src/duplicates.js";
import { normalizeEmail, normalizeName, normalizePhone } from "../src/normalize.js";

test("телефоны с 8, 7, +7, скобками, дефисами и без кода страны совпадают", () => {
  ["8-921-555-14-95", "+7 (921) 555-14-95", "89215551495", "79215551495", "9215551495"].forEach(
    (raw) => assert.deepEqual(normalizePhone(raw), { value: "79215551495", rejected: false }, raw),
  );
});

test("телефон без нужного числа цифр и текст вместо номера отбракованы", () => {
  ["12345", "не указан", "нет данных", "+1 (921) 555-14-95", "892155514951"].forEach((raw) =>
    assert.deepEqual(normalizePhone(raw), { value: "", rejected: true }, raw),
  );
});

test("заглушки и пустые значения остаются пустыми без отбраковки", () => {
  ["", "  ", "-", "null", "NULL", undefined].forEach((raw) => {
    assert.deepEqual(normalizePhone(raw), { value: "", rejected: false });
    assert.deepEqual(normalizeEmail(raw), { value: "", rejected: false });
    assert.deepEqual(normalizeName(raw), { value: "", rejected: false });
  });
});

test("почта обрезается и приводится к нижнему регистру, адрес без @ отбракован", () => {
  assert.deepEqual(normalizeEmail(" USER001@EXAMPLE.COM "), {
    value: "user001@example.com",
    rejected: false,
  });
  ["user.example.com", "@example.com", "user@", "a@b@c"].forEach((raw) =>
    assert.equal(normalizeEmail(raw).rejected, true, raw),
  );
});

test("имя без двойных пробелов, с заглавной буквы", () => {
  assert.equal(normalizeName(" АЛИСА  НЕСТЕРОВА ").value, "Алиса Нестерова");
  assert.equal(normalizeName("иван петров").value, "Иван Петров");
  assert.equal(normalizeName("анна-мария смит").value, "Анна-Мария Смит");
});

test("разные названия колонок приводятся к одному полю схемы", () => {
  assert.equal(matchColumn("Телефон "), "телефон");
  assert.equal(matchColumn("Моб. телефон"), "телефон");
  assert.equal(matchColumn("phone"), "телефон");
  assert.equal(matchColumn("E-mail"), "почта");
  assert.equal(matchColumn("Почта"), "почта");
  assert.equal(matchColumn("ФИО"), "имя");
  assert.equal(matchColumn("Контрагент"), null);
  assert.equal(matchColumn("Должность"), null);
});

test("имя файла приводится к одному виду для поиска дубликатов", () => {
  ["СЧЁТ.csv", "Счёт (1).csv", "Копия счёт.csv", "счёт (2).CSV"].forEach((name) =>
    assert.equal(normalizeFileName(name), "счёт.csv", name),
  );
  assert.equal(normalizeFileName("счёт.txt"), "счёт.txt");
});
