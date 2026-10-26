# Автоматизация разбора файлов

[![hexlet-check](https://github.com/kicha3007-boop/ai-automation-project-439/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/kicha3007-boop/ai-automation-project-439/actions)

Напишите консольную программу на JavaScript, которая разбирает папку с документами
компании: определяет тип каждого файла, находит дубликаты, отделяет полезные документы
от посторонних и собирает реестр. Отдельная команда сводит выгрузки контактов из разных
источников в одну таблицу, приводит колонки к единому виду, нормализует телефоны
и почту, убирает повторы.

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-automation
Как это должно работать: https://files.hexlet.app/a/fjioad

## Стек

- JavaScript

## Установка

Нужны Node.js 22 или новее (Хекслет проверяет на Node.js 26), npm и make.

```bash
git clone https://github.com/kicha3007-boop/ai-automation-project-439.git
cd ai-automation-project-439
make setup     # npm ci
npm link       # команда file-automation появится в системе
```

## Использование

```bash
file-automation                                   # справка
file-automation files ./company-files --out ./out
file-automation contacts ./company-files --out ./out
```

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
