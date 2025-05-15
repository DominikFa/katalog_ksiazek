// js/scripts.js
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('nav-toggle');
    const navList = document.querySelector('.nav__list');
    const currentPage = window.location.pathname.split('/').pop() || 'home.html'; // Default to home.html if path is '/'

    // Mobile navigation toggle
    if (navToggle && navList) {
        navToggle.addEventListener('click', () => {
            navList.classList.toggle('nav__list--active');
        });
    }

    // Active navigation link
    const navLinks = document.querySelectorAll('.nav__list .nav__link');
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage) {
            if(link) link.classList.add('nav__link--active');
        } else {
            if(link) link.classList.remove('nav__link--active');
        }
    });

    // --- Page Specific Logic ---

    // CATALOG PAGE LOGIC
    if (currentPage === 'catalog.html') {
        const catalogGrid = document.getElementById('catalog-grid');
        const authorsFilterList = document.getElementById('authors-filter-list');
        const tagsFilterList = document.getElementById('tags-filter-list');
        const paginationControls = document.getElementById('pagination-controls');
        const sortBySelect = document.getElementById('sort-by');
        const applyFiltersButton = document.getElementById('apply-filters-button'); // Desktop/Tablet
        const mobileFilterButton = document.getElementById('mobile-filter-button'); // Mobile
        const catalogSidebar = document.querySelector('.catalog-sidebar');

        let allBooks = [];
        let allAuthors = [];
        let currentFilters = { authors: [], tags: [] };
        let currentSort = 'title-asc';
        let currentPageNum = 1;
        const itemsPerPage = 8; 

        async function fetchData() {
            try {
                const [booksRes, authorsRes] = await Promise.all([
                    fetch('../data/books.json'),
                    fetch('../data/authors.json')
                ]);
                if (!booksRes.ok || !authorsRes.ok) {
                    throw new Error('Network response was not ok.');
                }
                allBooks = await booksRes.json();
                allAuthors = await authorsRes.json();
                populateFilters();
                renderCatalog();
            } catch (error) {
                console.error("Błąd podczas ładowania danych:", error);
                if(catalogGrid) catalogGrid.innerHTML = "<p>Nie udało się załadować katalogu. Spróbuj ponownie później.</p>";
            }
        }

        function populateFilters() {
            if (!authorsFilterList || !tagsFilterList) return;

            authorsFilterList.innerHTML = allAuthors.map(author => `
                <li><label><input type="checkbox" name="author" value="${author.id}"> ${author.name}</label></li>
            `).join('');

            const uniqueTags = [...new Set(allBooks.flatMap(book => book.tags || []))].sort();
            tagsFilterList.innerHTML = uniqueTags.map(tag => `
                <li><label><input type="checkbox" name="tag" value="${tag.toLowerCase()}"> ${tag.charAt(0).toUpperCase() + tag.slice(1)}</label></li>
            `).join('');

            // Add event listeners after populating
            document.querySelectorAll('.catalog-sidebar input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    // For desktop/tablet, filters might apply immediately or via button
                    // For mobile, this change will be noted, and applied when "Filtruj" (modal) is confirmed
                     if (window.innerWidth > 767) { // Apply immediately on desktop if no explicit button or for testing
                         updateFiltersAndRender();
                     }
                });
            });
        }
        
        function updateFiltersAndRender() {
            currentFilters.authors = Array.from(document.querySelectorAll('.catalog-sidebar input[name="author"]:checked')).map(cb => parseInt(cb.value));
            currentFilters.tags = Array.from(document.querySelectorAll('.catalog-sidebar input[name="tag"]:checked')).map(cb => cb.value);
            currentPageNum = 1; 
            renderCatalog();
            if(catalogSidebar && catalogSidebar.classList.contains('catalog-sidebar--active')){
                catalogSidebar.classList.remove('catalog-sidebar--active'); // Close mobile filter view
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
                const authorMatch = currentFilters.authors.length === 0 || currentFilters.authors.includes(book.authorId);
                const tagMatch = currentFilters.tags.length === 0 || currentFilters.tags.every(tag => book.tags && book.tags.map(t=>t.toLowerCase()).includes(tag));
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

            if(paginatedBooks.length === 0){
                catalogGrid.innerHTML = "<p>Brak książek spełniających kryteria.</p>";
            } else {
                catalogGrid.innerHTML = paginatedBooks.map(book => {
                    const author = allAuthors.find(a => a.id === book.authorId);
                    return `
                        <article class="book-card">
                            <a href="details.html?id=${book.id}" class="book-card__link">
                                <img src="${book.imageUrl || 'https://placehold.co/124x119/E3E3E3/474545?text=Brak+Foto'}" alt="Okładka: ${book.title}" class="book-card__image">
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
            paginationControls.innerHTML = ''; // Clear previous pagination
            if (totalPages <= 1) return; // No pagination if only one page or less

            let paginationHTML = '';
            const maxVisibleButtons = 5; // Including current, ellipsis, first/last

            if (totalPages <= maxVisibleButtons) {
                for (let i = 1; i <= totalPages; i++) {
                    paginationHTML += `<a href="#" class="pagination__link ${i === currentPageNum ? 'pagination__link--active' : ''}" data-page="${i}">${i}</a>`;
                }
            } else {
                // Previous Button
                // paginationHTML += `<a href="#" class="pagination__link" data-page="${Math.max(1, currentPageNum - 1)}">&lt;</a>`;

                // Page 1
                paginationHTML += `<a href="#" class="pagination__link ${1 === currentPageNum ? 'pagination__link--active' : ''}" data-page="1">1</a>`;

                let startEllipsis = false;
                let endEllipsis = false;

                if (currentPageNum > 3) {
                    paginationHTML += `<span class="pagination__ellipsis">...</span>`;
                    startEllipsis = true;
                }

                let pageStart = Math.max(2, currentPageNum - 1);
                let pageEnd = Math.min(totalPages - 1, currentPageNum + 1);

                if(currentPageNum === 1) pageEnd = Math.min(totalPages -1, 3);
                if(currentPageNum === totalPages) pageStart = Math.max(2, totalPages -2);


                for (let i = pageStart; i <= pageEnd; i++) {
                     paginationHTML += `<a href="#" class="pagination__link ${i === currentPageNum ? 'pagination__link--active' : ''}" data-page="${i}">${i}</a>`;
                }

                if (currentPageNum < totalPages - 2) {
                     paginationHTML += `<span class="pagination__ellipsis">...</span>`;
                     endEllipsis = true;
                }
                
                // Last Page
                paginationHTML += `<a href="#" class="pagination__link ${totalPages === currentPageNum ? 'pagination__link--active' : ''}" data-page="${totalPages}">${totalPages}</a>`;
                
                // Next Button
                // paginationHTML += `<a href="#" class="pagination__link" data-page="${Math.min(totalPages, currentPageNum + 1)}">&gt;</a>`;
            }

            paginationControls.innerHTML = paginationHTML;
            document.querySelectorAll('.pagination__link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const page = parseInt(e.target.dataset.page);
                    if (page !== currentPageNum) {
                        currentPageNum = page;
                        renderCatalog();
                        window.scrollTo(0, catalogGrid.offsetTop - 100); // Scroll to top of grid
                    }
                });
            });
        }


        if (sortBySelect) {
            sortBySelect.addEventListener('change', (e) => {
                currentSort = e.target.value;
                currentPageNum = 1;
                renderCatalog();
            });
        }
        // Desktop/Tablet filter button
        if (applyFiltersButton && window.innerWidth > 767) { 
            applyFiltersButton.addEventListener('click', updateFiltersAndRender);
        }

        // Mobile filter button to toggle sidebar visibility & then apply filters
        if (mobileFilterButton && catalogSidebar) {
            mobileFilterButton.addEventListener('click', () => {
                catalogSidebar.classList.toggle('catalog-sidebar--active');
                 // If sidebar becomes active, we might want its internal button to apply filters
                const mobileApplyBtn = catalogSidebar.querySelector('.catalog-sidebar__filter-button');
                if(mobileApplyBtn && !mobileApplyBtn.dataset.listenerAttached){
                    mobileApplyBtn.addEventListener('click', updateFiltersAndRender);
                    mobileApplyBtn.dataset.listenerAttached = "true"; // Prevent multiple listeners
                }
            });
        }
        // Initial data fetch
        fetchData();
    }

    // DETAILS PAGE LOGIC
    if (currentPage === 'details.html') {
        const params = new URLSearchParams(window.location.search);
        const bookId = parseInt(params.get('id'));
        const contentArea = document.getElementById('book-details-content');

        async function fetchBookDetails() {
            if (!bookId || !contentArea) {
                if(contentArea) contentArea.innerHTML = "<p>Nieprawidłowy identyfikator książki.</p>";
                return;
            }
            try {
                 const [booksRes, authorsRes] = await Promise.all([
                    fetch('../data/books.json'),
                    fetch('../data/authors.json')
                ]);
                if (!booksRes.ok || !authorsRes.ok) throw new Error('Network error fetching details.');

                const books = await booksRes.json();
                const authors = await authorsRes.json();
                
                const book = books.find(b => b.id === bookId);
                if (!book) {
                    contentArea.innerHTML = "<p>Nie znaleziono książki o podanym ID.</p>";
                    return;
                }
                const author = authors.find(a => a.id === book.authorId);

                document.getElementById('book-title').textContent = book.title;
                document.getElementById('book-author').textContent = author ? author.name : 'Nieznany autor';
                document.getElementById('book-image').src = book.imageUrl || 'https://placehold.co/395x376/E3E3E3/474545?text=Brak+Obrazka';
                document.getElementById('book-image').alt = `Okładka: ${book.title}`;
                document.getElementById('book-release-date').textContent = book.releaseDate || 'Brak danych';
                document.getElementById('book-language').textContent = book.language || 'Brak danych';
                document.getElementById('book-pages').textContent = book.pages ? `${book.pages} stron` : 'Brak danych';
                document.getElementById('book-rating').textContent = book.rating !== undefined ? `${book.rating}/10` : 'Brak oceny';
                document.getElementById('book-genres').textContent = book.genres && book.genres.length > 0 ? book.genres.join(', ') : 'Brak danych';
                document.getElementById('book-description').textContent = book.description || 'Brak opisu.';

            } catch (error) {
                console.error("Błąd ładowania szczegółów książki:", error);
                contentArea.innerHTML = "<p>Nie udało się załadować szczegółów. Spróbuj ponownie później.</p>";
            }
        }
        const backButton = document.getElementById('back-button');
        if(backButton) {
            backButton.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = 'catalog.html';
            });
        }
        fetchBookDetails();
    }

    // COLUMNS PAGE (RÓŻNE) LOGIC
    if (currentPage === 'columns.html') {
        const quotesList = document.getElementById('quotes-list');
        const recommendedBooksList = document.getElementById('recommended-books-list');
        const categoriesList = document.getElementById('categories-list');

        async function fetchColumnsData() {
            try {
                const [quotesRes, booksRes, categoriesRes] = await Promise.all([
                    fetch('../data/quotes.json'),
                    fetch('../data/books.json'), 
                    fetch('../data/categories.json')
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

    // CONTACT PAGE LOGIC
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