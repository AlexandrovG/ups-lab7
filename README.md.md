# Лабораторная №6: React + Redux Toolkit + Axios/Swagger + Vite Proxy

Исправленные исходники. Открыть подробную памятку `ЛР6_ИНСТРУКЦИЯ_ИСПРАВЛЕНИЯ.md`.

Запуск (рядом с `office-ups-sprint-6-backend`):

```bash
npm install
npm run generate-api
npm run dev
```

Открыть `http://localhost:3000`. Контрольная сборка: `npm run build`.

Backend порт 8080, MinIO порт 9000. Защищённые запросы требуют действительный JWT. Демо-режим mock доступен только гостю при недоступности API. После F5 Redux намеренно сбрасывается в гостевое состояние, JWT остаётся в localStorage по учебному заданию.
