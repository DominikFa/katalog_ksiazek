document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('nav-toggle');
    const navList = document.querySelector('.nav__list');
    const currentPage = window.location.pathname.split('/').pop() || 'home.html';

    const GITHUB_DATA_BASE_URL = 'https://raw.githubusercontent.com/DominikFa/katalog_ksiazek/master/data/';

    if (navToggle && navList) {
        navToggle.addEventListener('click', () => {
            navList.classList.toggle('nav__list--active');
        });
    }

    const navLinks = document.querySelectorAll('.nav__list .nav__link');
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref) {
            const linkPage = linkHref.split('/').pop();
            if ((linkPage === currentPage) || (currentPage === '' && linkPage === 'home.html')) {
                if(link) link.classList.add('nav__link--active');
            } else {
                if(link) link.classList.remove('nav__link--active');
            }
        }
    });


    if (currentPage === 'catalog.html') {
        const catalogGrid = document.getElementById('catalog-grid');
        const authorsFilterList = document.getElementById('authors-filter-list');
        const tagsFilterList = document.getElementById('tags-filter-list');
        const paginationControls = document.getElementById('pagination-controls');

        const sortBySelectDesktop = document.getElementById('sort-by');
        const sortBySelectMobile = document.getElementById('sort-by-mobile');

        const applyFiltersButton = document.getElementById('apply-filters-button');
        const mobileFilterButton = document.getElementById('mobile-filter-button');
        const closeFiltersButton = document.getElementById('close-filters-button');
        const catalogSidebar = document.getElementById('catalog-sidebar');

        const mobileSortButton = document.getElementById('mobile-sort-button');
        const sortModal = document.getElementById('sort-modal');
        const applySortMobileButton = document.getElementById('apply-sort-mobile-button');
        const closeSortModalButton = document.getElementById('close-sort-modal-button');


        const searchAuthorInput = document.getElementById('search-author');
        const searchTagInput = document.getElementById('search-tag');

        let allBooks = [];
        let allAuthors = [];
        let allTagsList = [];

        let selectedFilters = { authors: [], tags: [] };
        let appliedFilters = { authors: [], tags: [] };
        let currentSort = sortBySelectDesktop ? sortBySelectDesktop.value : 'title-asc';
        let currentPageNum = 1;


        let itemsPerPage = 12;

        function updateItemsPerPage() {
            if (window.innerWidth <= 767) {
                itemsPerPage = 4;
            } else if (window.innerWidth <= 1023) {
                itemsPerPage = 6;
            } else {
                itemsPerPage = 12;
            }
        }
        updateItemsPerPage();
        window.addEventListener('resize', () => {
            const oldItemsPerPage = itemsPerPage;
            updateItemsPerPage();
            if (oldItemsPerPage !== itemsPerPage) {
                currentPageNum = 1;
                renderCatalog();
            }
        });


        async function fetchData() {
            try {
                const [booksRes, authorsRes] = await Promise.all([
                    fetch(`${GITHUB_DATA_BASE_URL}books.json`),
                    fetch(`${GITHUB_DATA_BASE_URL}authors.json`)
                ]);
                if (!booksRes.ok || !authorsRes.ok) {
                    throw new Error(`Network response was not ok. Books: ${booksRes.status}, Authors: ${authorsRes.status}`);
                }
                allBooks = await booksRes.json();
                allAuthors = await authorsRes.json();
                allTagsList = [...new Set(allBooks.flatMap(book => book.tags || []))].sort();

                populateAuthorFilterList(allAuthors);
                populateTagFilterList(allTagsList);

                applyCurrentFiltersAndSort();
            } catch (error) {
                console.error("Błąd podczas ładowania danych katalogu:", error);
                if(catalogGrid) catalogGrid.innerHTML = `<p>Nie udało się załadować katalogu. Sprawdź konsolę.</p>`;
            }
        }

        function populateAuthorFilterList(authorsToDisplay) {
            if (!authorsFilterList) return;
            authorsFilterList.innerHTML = authorsToDisplay.map(author => `
                <li><label><input type="checkbox" name="author" value="${author.id}" ${appliedFilters.authors.includes(author.id) ? 'checked' : ''}> ${author.name}</label></li>
            `).join('');
        }

        function populateTagFilterList(tagsToDisplay) {
            if (!tagsFilterList) return;
            tagsFilterList.innerHTML = tagsToDisplay.map(tag => `
                <li><label><input type="checkbox" name="tag" value="${tag.toLowerCase()}" ${appliedFilters.tags.includes(tag.toLowerCase()) ? 'checked' : ''}> ${tag.charAt(0).toUpperCase() + tag.slice(1)}</label></li>
            `).join('');
        }



        if (searchAuthorInput) {
            searchAuthorInput.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                const filteredAuthors = allAuthors.filter(author => author.name.toLowerCase().includes(searchTerm));
                populateAuthorFilterList(filteredAuthors);

                document.querySelectorAll('#authors-filter-list input[name="author"]').forEach(cb => {
                    if (selectedFilters.authors.includes(parseInt(cb.value))) {
                        cb.checked = true;
                    }
                });
            });
        }

        if (searchTagInput) {
            searchTagInput.addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                const filteredTags = allTagsList.filter(tag => tag.toLowerCase().includes(searchTerm));
                populateTagFilterList(filteredTags);
                document.querySelectorAll('#tags-filter-list input[name="tag"]').forEach(cb => {
                    if (selectedFilters.tags.includes(cb.value)) {
                        cb.checked = true;
                    }
                });
            });
        }


        function storeSelectedFilters() {
            selectedFilters.authors = Array.from(document.querySelectorAll('#authors-filter-list input[name="author"]:checked')).map(cb => parseInt(cb.value));
            selectedFilters.tags = Array.from(document.querySelectorAll('#tags-filter-list input[name="tag"]:checked')).map(cb => cb.value);
        }

        function applyCurrentFiltersAndSort() {

            appliedFilters = JSON.parse(JSON.stringify(selectedFilters));
            currentPageNum = 1;
            renderCatalog();
            if (catalogSidebar && catalogSidebar.classList.contains('catalog-sidebar--active')) {
                catalogSidebar.classList.remove('catalog-sidebar--active');
            }
        }

        function sortBooks(books, sortOrder) {
            return [...books].sort((a, b) => {
                switch (sortOrder) {
                    case 'title-asc':
                        return a.title.localeCompare(b.title);
                    case 'title-desc':
                        return b.title.localeCompare(a.title);
                    case 'rating-desc':
                        return (b.rating || 0) - (a.rating || 0);
                    case 'rating-asc':
                        return (a.rating || 0) - (b.rating || 0);
                    default:
                        return 0;
                }
            });
        }

        function filterBooks(books) {
            return books.filter(book => {
                const authorMatch = appliedFilters.authors.length === 0 || appliedFilters.authors.includes(book.authorId);
                const tagMatch = appliedFilters.tags.length === 0 || appliedFilters.tags.every(tag => book.tags && book.tags.map(t => t.toLowerCase()).includes(tag));
                return authorMatch && tagMatch;
            });
        }

        function renderCatalog() {
             if (!catalogGrid) return;
            let booksToDisplay = filterBooks(allBooks);
            booksToDisplay = sortBooks(booksToDisplay, currentSort);

            const totalItems = booksToDisplay.length;
            const totalPages = Math.ceil(totalItems / itemsPerPage);

            const startIndex = (currentPageNum - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedBooks = booksToDisplay.slice(startIndex, endIndex);

            if(paginatedBooks.length === 0 && totalItems > 0){
                 catalogGrid.innerHTML = "<p>Brak książek na tej stronie. Spróbuj zmienić stronę.</p>";
            } else if (totalItems === 0) {
                 catalogGrid.innerHTML = "<p>Brak książek spełniających kryteria.</p>";
            }
            else {
                catalogGrid.innerHTML = paginatedBooks.map(book => {
                    const author = allAuthors.find(a => a.id === book.authorId);
                    const placeholder = 'https://placehold.co/124x119/E3E3E3/474545?text=Brak+Foto';
                    return `
                        <article class="book-card">
                            <a href="details.html?id=${book.id}" class="book-card__link">
                                <img src="${book.imageUrl || placeholder}" alt="Okładka: ${book.title}" class="book-card__image" onerror="this.onerror=null;this.src='${placeholder}';">
                                <div class="book-card__info">
                                    <h3 class="book-card__title">${book.title}</h3>
                                    <p class="book-card__author">${author ? author.name : 'Nieznany autor'}</p>
                                    <p class="book-card__rating">Ocena: ${book.rating !== undefined ? book.rating+'/10' : 'Brak'}</p>
                                </div>
                            </a>
                        </article>
                    `;
                }).join('');
            }
            renderPagination(totalPages);
        }


        function renderPagination(totalPages) {
            if (!paginationControls) return;
            paginationControls.innerHTML = '';
            if (totalPages <= 1) return;

            const SPREAD = 1;

            let pages = [];
            pages.push({ page: 1, text: '1', active: currentPageNum === 1 });

            let rangeStart = Math.max(2, currentPageNum - SPREAD);
            let rangeEnd = Math.min(totalPages - 1, currentPageNum + SPREAD);

            if (rangeStart > 2) {
                pages.push({ text: '...', isEllipsis: true });
            }

            for (let i = rangeStart; i <= rangeEnd; i++) {
                if (i === 1 && totalPages > 1) continue;
                if (i === totalPages && totalPages > 1) continue;
                pages.push({ page: i, text: i.toString(), active: currentPageNum === i });
            }

            if (rangeEnd < totalPages - 1) {
                pages.push({ text: '...', isEllipsis: true });
            }

            if (totalPages > 1) {
                pages.push({ page: totalPages, text: totalPages.toString(), active: currentPageNum === totalPages });
            }

            let uniqueButtons = [];
            const seen = new Set();
            for (const btn of pages) {
                if (btn.isEllipsis) {
                    if (uniqueButtons.length === 0 || !uniqueButtons[uniqueButtons.length - 1].isEllipsis) {
                        uniqueButtons.push(btn);
                    }
                } else if (!seen.has(btn.page)) {
                    uniqueButtons.push(btn);
                    seen.add(btn.page);
                }
            }

            if (uniqueButtons.length > 1 && uniqueButtons[1].isEllipsis && uniqueButtons[0].page + 1 === uniqueButtons[2]?.page) {
                uniqueButtons.splice(1, 1);
            }
            if (uniqueButtons.length > 2 && uniqueButtons[uniqueButtons.length - 2].isEllipsis && uniqueButtons[uniqueButtons.length - 1].page - 1 === uniqueButtons[uniqueButtons.length - 3]?.page) {
                uniqueButtons.splice(uniqueButtons.length - 2, 1);
            }

            paginationControls.innerHTML = uniqueButtons.map(btn => {
                if (btn.isEllipsis) {
                    return `<span class="pagination__ellipsis">${btn.text}</span>`;
                }
                return `<a href="#" class="pagination__link ${btn.active ? 'pagination__link--active' : ''}" data-page="${btn.page}">${btn.text}</a>`;
            }).join('');

            document.querySelectorAll('.pagination__link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = parseInt(e.target.dataset.page);
                    if (page !== currentPageNum) {
                        currentPageNum = page;
                        renderCatalog();
                        const catalogLayoutTop = document.querySelector('.catalog-layout')?.offsetTop || 0;
                        window.scrollTo({ top: catalogLayoutTop - 80, behavior: 'smooth' });
                    }
                });
            });
        }


        if (sortBySelectDesktop) {
            sortBySelectDesktop.addEventListener('change', (e) => {
                currentSort = e.target.value;
                if (sortBySelectMobile) sortBySelectMobile.value = currentSort;
                applyCurrentFiltersAndSort();
            });
        }

        if (applyFiltersButton) {
            applyFiltersButton.addEventListener('click', () => {
                storeSelectedFilters();
                applyCurrentFiltersAndSort();
            });
        }

        if (mobileFilterButton && catalogSidebar && closeFiltersButton) {
            mobileFilterButton.addEventListener('click', () => {
                document.querySelectorAll('#authors-filter-list input[name="author"]').forEach(cb => {
                    cb.checked = appliedFilters.authors.includes(parseInt(cb.value));
                });
                document.querySelectorAll('#tags-filter-list input[name="tag"]').forEach(cb => {
                    cb.checked = appliedFilters.tags.includes(cb.value);
                });
                if(searchAuthorInput) searchAuthorInput.value = '';
                if(searchTagInput) searchTagInput.value = '';
                populateAuthorFilterList(allAuthors);
                populateTagFilterList(allTagsList);
                catalogSidebar.classList.add('catalog-sidebar--active');
            });
            closeFiltersButton.addEventListener('click', () => {
                catalogSidebar.classList.remove('catalog-sidebar--active');
            });
        }

        if (mobileSortButton && sortModal && sortBySelectMobile && applySortMobileButton && closeSortModalButton) {
            mobileSortButton.addEventListener('click', () => {
                sortBySelectMobile.value = currentSort;
                sortModal.classList.add('modal--active');
            });
            closeSortModalButton.addEventListener('click', () => {
                sortModal.classList.remove('modal--active');
            });
            applySortMobileButton.addEventListener('click', () => {
                currentSort = sortBySelectMobile.value;
                if (sortBySelectDesktop) sortBySelectDesktop.value = currentSort;
                sortModal.classList.remove('modal--active');
                applyCurrentFiltersAndSort();
            });
            sortModal.addEventListener('click', (e) => {
                if (e.target === sortModal) {
                    sortModal.classList.remove('modal--active');
                }
            });
        }

        fetchData();
    }


    if (currentPage === 'details.html') {
        const params = new URLSearchParams(window.location.search);
        const bookId = parseInt(params.get('id'));
        const contentArea = document.getElementById('details-content');

        async function fetchBookDetails() {
            if (!bookId) {
                if(contentArea) contentArea.innerHTML = "<p>Nieprawidłowy identyfikator książki.</p>";
                return;
            }
            try {
                 const [booksRes, authorsRes] = await Promise.all([
                    fetch(`${GITHUB_DATA_BASE_URL}books.json`),
                    fetch(`${GITHUB_DATA_BASE_URL}authors.json`)
                ]);
                if (!booksRes.ok || !authorsRes.ok) throw new Error('Network error fetching details.');

                const books = await booksRes.json();
                const authors = await authorsRes.json();

                const book = books.find(b => b.id === bookId);
                if (!book) {
                    if(contentArea) contentArea.innerHTML = "<p>Nie znaleziono książki o podanym ID.</p>";
                    return;
                }
                const author = authors.find(a => a.id === book.authorId);

                document.getElementById('book-title').textContent = book.title;
                document.getElementById('book-author').textContent = author ? author.name : 'Nieznany autor';
                
                const bookImageElement = document.getElementById('book-image');
                if (bookImageElement) {
                    const placeholder = 'https://placehold.co/395x376/E3E3E3/474545?text=Brak+Obrazka';
                    bookImageElement.src = book.imageUrl || placeholder;
                    bookImageElement.alt = `Okładka: ${book.title}`;
                    bookImageElement.onerror = () => {
                        bookImageElement.onerror = null; 
                        bookImageElement.src = placeholder;
                    };
                }

                document.getElementById('book-release-date').textContent = book.releaseDate || 'Brak danych';
                document.getElementById('book-language').textContent = book.language || 'Brak danych';
                document.getElementById('book-pages').textContent = book.pages ? `${book.pages} stron` : 'Brak danych';
                document.getElementById('book-rating').textContent = book.rating !== undefined ? `${book.rating}/10` : 'Brak oceny';
                document.getElementById('book-genres').textContent = book.genres && book.genres.length > 0 ? book.genres.join(', ') : 'Brak danych';
                document.getElementById('book-description').textContent = book.description || 'Brak opisu.';
                
                const downloadButtonDesktop = document.getElementById('download-pdf-button-desktop');
                const downloadButtonMobile = document.getElementById('download-pdf-button-mobile-tablet');

                if (book.pdfDownload) {
                    const setupDownloadButton = (button) => {
                        if (button) {
                            button.href = book.pdfDownload;
                            button.setAttribute('target', '_blank');
                            button.setAttribute('download', `${book.title.replace(/[\s/]/g, '_')}.pdf`);
                            button.style.display = 'flex';
                        }
                    };
                    setupDownloadButton(downloadButtonDesktop);
                    setupDownloadButton(downloadButtonMobile);
                } else {
                    if (downloadButtonDesktop) downloadButtonDesktop.style.display = 'none';
                    if (downloadButtonMobile) downloadButtonMobile.style.display = 'none';
                }

            } catch (error) {
                console.error("Błąd ładowania szczegółów książki:", error);
                if(contentArea) contentArea.innerHTML = "<p>Nie udało się załadować szczegółów. Spróbuj ponownie później.</p>";
            }
        }

        const backButtonDesktop = document.getElementById('back-button-desktop');
        const backButtonMobileTablet = document.getElementById('back-button-mobile-tablet');

        const navigateBackToCatalog = (e) => {
            e.preventDefault();
            window.location.href = 'catalog.html';
        };

        if (backButtonDesktop) {
            backButtonDesktop.addEventListener('click', navigateBackToCatalog);
        }
        if (backButtonMobileTablet) {
            backButtonMobileTablet.addEventListener('click', navigateBackToCatalog);
        }

        fetchBookDetails();
    }


    if (currentPage === 'columns.html') {
        const quotesList = document.getElementById('quotes-list');
        const recommendedBooksList = document.getElementById('recommended-books-list');
        const categoriesList = document.getElementById('categories-list');

        async function fetchColumnsData() {
            try {
                const [quotesRes, booksRes, categoriesRes] = await Promise.all([
                    fetch(`${GITHUB_DATA_BASE_URL}quotes.json`),
                    fetch(`${GITHUB_DATA_BASE_URL}books.json`),
                    fetch(`${GITHUB_DATA_BASE_URL}categories.json`)
                ]);
                if (!quotesRes.ok || !booksRes.ok || !categoriesRes.ok) throw new Error('Network error fetching columns data.');

                const quotes = await quotesRes.json();
                const books = await booksRes.json();
                const categories = await categoriesRes.json();

                if (quotesList) {
                    quotesList.innerHTML = quotes.slice(0, 8).map(q => `<li>"${q.text}"<br>- ${q.author}</li>`).join('');
                }
                if (recommendedBooksList) {
                    const recommended = books.sort((a,b) => (b.rating || 0) - (a.rating || 0)).slice(0,10);
                    recommendedBooksList.innerHTML = recommended.map(b => `<li>${b.title}</li>`).join('');
                }
                if (categoriesList) {
                    categoriesList.innerHTML = categories.slice(0, 10).map(c => `<li>${c.name}</li>`).join('');
                }

            } catch (error) {
                console.error("Błąd ładowania danych dla strony 'Różne':", error);
                if(quotesList) quotesList.innerHTML = "<li>Nie udało się załadować cytatów.</li>";
                if(recommendedBooksList) recommendedBooksList.innerHTML = "<li>Nie udało się załadować polecanych książek.</li>";
                if(categoriesList) categoriesList.innerHTML = "<li>Nie udało się załadować kategorii.</li>";
            }
        }
        fetchColumnsData();
    }


    if (currentPage === 'contact.html') {
        const contactForm = document.getElementById('contact-form');
        const formStatusMessage = document.getElementById('form-status-message');

        if (contactForm && formStatusMessage) {
            contactForm.addEventListener('submit', function(e) {
                e.preventDefault();

                const name = document.getElementById('name').value.trim();
                const surname = document.getElementById('surname').value.trim();
                const email = document.getElementById('email').value.trim();
                const message = document.getElementById('message').value.trim();

                if (!name || !surname || !email || !message) {
                    formStatusMessage.textContent = "Wszystkie pola są wymagane!";
                    formStatusMessage.style.color = "red";
                    return;
                }
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(email)) {
                    formStatusMessage.textContent = "Proszę podać poprawny adres email.";
                    formStatusMessage.style.color = "red";
                    return;
                }

                console.log("Formularz wysłany (symulacja):", { name, surname, email, message });
                formStatusMessage.textContent = "Wiadomość wysłana pomyślnie!";
                formStatusMessage.style.color = "green";
                contactForm.reset();

                setTimeout(() => {
                    if(formStatusMessage) formStatusMessage.textContent = "";
                }, 3000);
            });
        }
    }
    console.log(`Strona: ${currentPage}. Skrypty załadowane.`);
});