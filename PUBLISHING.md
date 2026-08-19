# Публикация репозитория в GitHub

Рекомендуемое имя: `Nioris/yg-autofill`.

## Через Git

Сначала создайте в GitHub пустой репозиторий `yg-autofill` без автоматически добавленных README, LICENSE и `.gitignore`, потому что эти файлы уже находятся в проекте.

Из каталога проекта выполните:

```bash
git init
git add .
git commit -m "Initial release: YG Autofill v12.0"
git branch -M main
git remote add origin https://github.com/Nioris/yg-autofill.git
git push -u origin main
```

При использовании SSH замените remote:

```bash
git remote set-url origin git@github.com:Nioris/yg-autofill.git
```

## Рекомендуемые настройки GitHub

Описание репозитория:

```text
Autofill Yandex Games listings from multilingual JSON files with validation, exact tag selection and detailed logs.
```

Темы:

```text
yandex-games, autofill, javascript, json, localization, developer-tools
```

Лицензия определяется GitHub автоматически по файлу `LICENSE` как Apache-2.0.

После первого push рекомендуется создать релиз `v12.0` и приложить `yg-autofill.js` как отдельный файл.
