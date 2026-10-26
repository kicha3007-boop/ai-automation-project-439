import { phone, placeholders } from "./config.js";

// Нормализация значений контакта. Каждая функция возвращает { value, rejected }:
// пустое значение и заглушка дают пустую строку без отбраковки, значение, которое
// привести к виду не удалось, отбраковывается.

const digitsOnly = (value) => [...value].filter((symbol) => "0123456789".includes(symbol)).join("");

export const isPlaceholder = (value) =>
  placeholders.includes(String(value ?? "").trim().toLowerCase());

const empty = { value: "", rejected: false };
const rejected = { value: "", rejected: true };

export const normalizePhone = (raw) => {
  if (isPlaceholder(raw)) {
    return empty;
  }

  const digits = digitsOnly(String(raw));
  const local = phone.length - phone.countryCode.length;

  if (digits.length === local) {
    return { value: `${phone.countryCode}${digits}`, rejected: false };
  }
  if (
    digits.length === phone.length &&
    [phone.countryCode, phone.trunkPrefix].includes(digits[0])
  ) {
    return { value: `${phone.countryCode}${digits.slice(1)}`, rejected: false };
  }

  return rejected;
};

export const normalizeEmail = (raw) => {
  if (isPlaceholder(raw)) {
    return empty;
  }

  const email = String(raw).trim().toLowerCase();
  const parts = email.split("@");
  const valid = parts.length === 2 && parts.every((part) => part !== "") && !email.includes(" ");

  return valid ? { value: email, rejected: false } : rejected;
};

const capitalize = (word) =>
  word
    .split("-")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join("-");

export const normalizeName = (raw) => {
  if (isPlaceholder(raw)) {
    return empty;
  }

  const name = String(raw).split(" ").filter((word) => word !== "").map(capitalize).join(" ");

  return { value: name, rejected: false };
};

const normalizers = {
  имя: normalizeName,
  телефон: normalizePhone,
  почта: normalizeEmail,
};

// Запись целиком: нормализованные поля и число отбракованных значений.
export const normalizeRecord = (record) =>
  Object.entries(normalizers).reduce(
    (acc, [field, normalize]) => {
      const result = normalize(record[field]);

      return {
        record: { ...acc.record, [field]: result.value },
        rejected: acc.rejected + Number(result.rejected),
      };
    },
    { record: { ...record }, rejected: 0 },
  );
