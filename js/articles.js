document.addEventListener('DOMContentLoaded', () => {
    const articlesGrid = document.getElementById('articlesGrid');
    const modal = document.getElementById('articleModal');
    const modalBody = document.getElementById('articleModalBody');
    const closeModal = document.getElementById('closeArticleModal');
    const filterBtns = document.querySelectorAll('.article-filter');

    let allArticles = [];

    // Fetch Articles
    fetch('data/articles.json')
        .then(response => response.json())
        .then(data => {
            allArticles = data;
            renderArticles('all');
        })
        .catch(error => {
            console.error('Error loading articles:', error);
            if (articlesGrid) {
                articlesGrid.innerHTML = '<p class="error">Не удалось загрузить статьи.</p>';
            }
        });

    // Render Function
    function renderArticles(filter) {
        if (!articlesGrid) return;
        articlesGrid.innerHTML = '';

        const filtered = filter === 'all' 
            ? allArticles 
            : allArticles.filter(a => a.tag === filter);

        if (filtered.length === 0) {
            articlesGrid.innerHTML = '<p>В этой категории пока нет статей.</p>';
            return;
        }

        filtered.forEach((article, index) => {
            const delay = (index % 3) + 1; // 1, 2, 3 for animation delay
            const card = document.createElement('article');
            card.className = `article-card reveal reveal-delay-${delay}`;
            
            // Add active class for animation if JS enabled
            setTimeout(() => card.classList.add('active'), 100);

            card.innerHTML = `
                <div class="article-image">
                    <img src="${article.image}" alt="${article.title}" onerror="this.src='https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1000&auto=format&fit=crop'">
                </div>
                <div class="article-content">
                    <span class="article-tag">${article.tag}</span>
                    <h3>${article.title}</h3>
                    <p>${article.preview}</p>
                    <a href="#" class="read-more" data-id="${article.id}">Читать далее <i class="fa-solid fa-arrow-right"></i></a>
                </div>
            `;

            // Add click event for read more
            const btn = card.querySelector('.read-more');
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                openArticleModal(article);
            });

            articlesGrid.appendChild(card);
        });
    }

    // Filter Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => {
                b.classList.remove('active');
                // Reset style if needed, but CSS handles .active
            });
            btn.classList.add('active');
            
            renderArticles(btn.dataset.filter);
        });
    });

    // Modal Logic
    function openArticleModal(article) {
        if (!modal || !modalBody) return;

        modalBody.innerHTML = `
            <img src="${article.image}" alt="${article.title}" class="modal-header-img" onerror="this.src='https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1000&auto=format&fit=crop'">
            <div class="modal-details">
                <span class="article-tag" style="display:inline-block; margin-bottom:10px; background:var(--primary-color); color:white; padding:5px 10px; border-radius:15px; font-size:0.8rem;">${article.tag}</span>
                <h2 class="modal-title">${article.title}</h2>
                <div class="article-full-content">
                    ${article.content}
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});
