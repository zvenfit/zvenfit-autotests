# План покрытия ZvenFit

Целевая схема полноценного staging, production dry-run, CI/CD и rollback зафиксирована в [target-architecture.md](target-architecture.md).

## Уже автоматизировано

| Область | Проверка | Тип |
| --- | --- | --- |
| Все страницы | все URL из актуального `dist/sitemap.xml`, HTTP, `lang`, title, description, canonical и основной контент | contract |
| Все интерактивные элементы | реестр всех ссылок, кнопок, submit и кастомных контролов; неизвестный action-класс ломает тест | interaction contract |
| Внутренние и fragment-ссылки | destination присутствует в sitemap, fragment target существует | interaction contract |
| UI-контролы | mobile menu, Webflow slider, карусель отзывов, desktop-аккордеон, якорь и history back | functional |
| Главная | три направления, две площадки, приложение и переход к заявке | contract + journey |
| Групповые программы | актуальные тарифы, скидка приложения и раскрытие полной команды | product contract |
| Контакты | две карточки Яндекс Карт, Telegram, WhatsApp, App Store, RuStore и APK | product contract |
| Приложение | оффер 15%, условия акции и три download-ссылки | product contract |
| Тренеры | все профили из sitemap, основной контент, CTA записи и переход из каталога | contract + journey |
| Заявка | native validation и условная обязательность Telegram username | functional, mocked API |
| Заявка | payload, UUID, UTM, повтор с тем же `submission_id`, HTTP 429 | functional, mocked API |
| Расписание | двухнедельный API-запрос, фильтры типа/клуба/зала, пустая неделя | functional, mocked API |
| Расписание | dialog с клавиатуры, HTML sanitization, HTTP и invalid-payload ошибки | functional, mocked API |
| Production | все sitemap-контракты, продуктовые блоки, переходы и runtime API config | read-only |
| Адаптивность | отсутствие горизонтального overflow на всех sitemap-страницах в desktop/mobile Chrome и на девяти пограничных ширинах; углублённый grid-контракт мини-групп | cross-viewport + responsive contract |

## Следующие приоритеты

1. Расширить SEO-контракт на Open Graph и JSON-LD.
2. Добавить visual snapshots ключевых страниц после стабилизации дизайна.
3. Включить axe-проверки доступности после согласования допустимых исключений Webflow.
4. Добавить staging E2E после появления изолированного backend и технического YDB probe.

## Как понимать «проверяются все кнопки»

- Каждый интерактивный DOM-элемент на каждой sitemap-странице попадает в реестр и должен иметь известный тип действия.
- Каждая внутренняя ссылка проверяется на существующий маршрут, каждый fragment — на существующий target, телефон и email — на формат.
- Для каждого типа поведения есть отдельный сценарий. Одинаковые CTA не прокликиваются сотни раз: их destination проверяет реестр, а сам переход — representative journey.
- Скрытые responsive-контролы не кликаются в viewport, где они недоступны. Сейчас блок отзывов скрыт на обоих viewport: тест подтверждает, что его кнопки тоже недоступны; если блок станет видимым, тот же тест начнёт проверять прокрутку вперёд и назад.
- Горизонтальный аккордеон проверяется на desktop; на mobile текущий frontend показывает отдельную статическую вертикальную раскладку.

## Границы безопасности

- Production smoke не отправляет формы и не изменяет состояние.
- Форма и расписание тестируются через `page.route()` и детерминированные fixtures.
- Реальные персональные данные в fixtures запрещены.
- Отчёты и браузерные артефакты остаются локальными и игнорируются Git.
- В публичный репозиторий попадают только исходный код и документация.
- Hosted CI делает два публичных checkout, не использует secrets и не создаёт/
  загружает HTML reports, traces, screenshots или video.
- Ежедневный production suite выполняет только read-only contracts/journeys;
  feature-тесты формы в него не входят.
