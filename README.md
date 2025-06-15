# Dokumentacja Projektu: Katalog Książek

## 1. Wstęp

Projekt "Katalog Książek" to w pełni funkcjonalna, responsywna aplikacja internetowa stworzona w celu prezentacji cyfrowej biblioteki książek. Umożliwia użytkownikom przeglądanie, odkrywanie i wyszukiwanie książek z różnorodnych gatunków i epok. Aplikacja oferuje szczegółowe informacje o każdej pozycji, w tym opisy, oceny i dane o wydaniu. Kluczowe funkcjonalności obejmują zaawansowane filtrowanie katalogu po autorach i tagach, dynamiczne sortowanie wyników oraz możliwość pobierania wybranych tytułów w formacie PDF. Projekt został zrealizowany przy użyciu nowoczesnych technologii front-endowych, kładąc nacisk na responsywność i interaktywność interfejsu użytkownika.

## 2. Opis Struktury Serwisu

Struktura projektu jest logicznie zorganizowana w foldery, co zapewnia przejrzystość i łatwość w zarządzaniu kodem oraz zasobami.
* `katalog_ksiazek/`
    * `assets/` - Zasoby graficzne (ikony, logo)
    * `css/`
        * `style.css` - Główny arkusz stylów
    * `data/` - Pliki danych w formacie JSON
        * `authors.json`
        * `books.json`
        * `categories.json`
        * `quotes.json`
    * `js/`
        * `scripts.js` - Skrypty JavaScript
    * `pages/` - Pliki HTML poszczególnych podstron
        * `index.html`
        * `catalog.html`
        * `columns.html`
        * `contact.html`
        * `details.html`
## 3. Opis Zastosowanych Technologii

Aplikacja została zbudowana przy użyciu standardowych, nowoczesnych technologii webowych, co zapewnia jej wysoką wydajność i kompatybilność.

* **HTML5**: Wykorzystany do stworzenia semantycznej i dobrze zorganizowanej struktury wszystkich podstron serwisu.
* **CSS3**: Jeden plik `style.css` definiuje wygląd całej aplikacji. Kluczowe wykorzystane funkcje to **Responsive Web Design** (Media Queries), **Flexbox**, **CSS Grid** oraz **Zmienne CSS**.
* **JavaScript (ES6+)**: Cała logika aplikacji znajduje się w pliku `scripts.js`. Odpowiada on za asynchroniczne ładowanie danych (`fetch API`), dynamiczną manipulację DOM oraz obsługę wszystkich interakcji użytkownika.
* **JSON (JavaScript Object Notation)**: Format używany jako źródło danych dla aplikacji, ładowanych dynamicznie po stronie klienta.

## 4. Testy

Testy zostały przeprowadzone na najpopularniejszych przeglądarkach (Chrome , Safari , Edge , Firefox , Opera ) oraz na trzech głównych rozdzielczościach (desktop, tablet, mobile).

Wyniki potwierdziły, że aplikacja jest w pełni responsywna i funkcjonalna. Dzięki zastosowaniu standardowych technologii webowych i nowoczesnych technik CSS, interfejs użytkownika zachowuje spójność wizualną, a wszystkie interaktywne elementy, takie jak filtrowanie, sortowanie i paginacja, działają poprawnie we wszystkich testowanych środowiskach. Zrzutey z testów znajdują się w pliku `testy.pdf`

| Przeglądarka | Wersja | Zgodność Ogólna |
| :--- | :--- | :---: |
| **Chrome** | Ostatnia | Zgodny |
| **Safari** | Ostatnia | Zgodny |
| **Edge** | Ostatnia | Zgodny |
| **Firefox** | Ostatnia | Zgodny |
| **Opera** | Ostatnia | Zgodny |

## 5. Wnioski

Projekt "Katalog Książek" został zrealizowany z powodzeniem, spełniając wszystkie założone cele. Stworzona aplikacja jest w pełni funkcjonalnym, samodzielnym serwisem po stronie klienta, który efektywnie zarządza danymi i prezentuje je w przystępny sposób.

Do kluczowych atutów projektu należą:
* Pełna responsywność i spójność interfejsu na różnych urządzeniach.
* Intuicyjna nawigacja i obsługa.
* Wydajne, działające po stronie klienta mechanizmy filtrowania i sortowania danych.

Zastosowanie nowoczesnych, ale standardowych technologii, gwarantuje wysoką kompatybilność międzyprzeglądarkową, co zostało potwierdzone w testach. Projekt stanowi solidną podstawę do ewentualnej dalszej rozbudowy serwisu o nowe funkcjonalności.