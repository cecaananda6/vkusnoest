document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const recipesGrid = document.getElementById('recipesGrid');
    const recipesCount = document.getElementById('recipesCount');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const categoryBtns = document.querySelectorAll('.category-card');
    const navLinks = document.querySelectorAll('.nav-link[data-category]');
    const modal = document.getElementById('recipeModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.querySelector('.close-modal');
    
    // Filter Elements
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filterPanel = document.getElementById('filterPanel');
    const timeFilter = document.getElementById('timeFilter');
    const difficultyFilter = document.getElementById('difficultyFilter');
    const caloriesFilter = document.getElementById('caloriesFilter');
    const tagFilters = document.querySelectorAll('.tag-filter');
    const searchIngredients = document.getElementById('searchIngredients');

    // State
    let allRecipes = [];
    let currentCategory = 'all';
    let searchQuery = '';
    let currentSort = 'new'; // 'new' or 'popular'
    let activeFilters = {
        time: 'all',
        difficulty: 'all',
        calories: null,
        tags: [],
        searchIngredients: false,
        favoritesOnly: false
    };
    let currentRecipeId = null;

    // Fetch Data
    if (recipesGrid) {
        fetch('data/recipes.json')
            .then(response => response.json())
            .then(data => {
                allRecipes = data;
                
                // Merge user recipes
                const userRecipes = JSON.parse(localStorage.getItem('userRecipes')) || [];
                allRecipes = [...allRecipes, ...userRecipes];

                renderRecipes();
                renderRecipeOfDay();
            })
            .catch(error => {
                console.error('Error loading recipes:', error);
                recipesGrid.innerHTML = '<p class="error">Не удалось загрузить рецепты. Пожалуйста, попробуйте позже.</p>';
            });
    }

    // Recipe of the Day Logic
    function renderRecipeOfDay() {
        const container = document.getElementById('recipeOfDayContainer');
        if (!container || allRecipes.length === 0) return;

        // Pick a random recipe
        const randomIndex = Math.floor(Math.random() * allRecipes.length);
        const recipe = allRecipes[randomIndex];

        container.innerHTML = `
            <div class="recipe-of-day-image">
                <img src="${recipe.image}" alt="${recipe.title}" onerror="this.src='https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=1000&auto=format&fit=crop'">
            </div>
            <div class="recipe-of-day-content">
                <span class="recipe-of-day-badge">Рецепт дня</span>
                <h3 class="recipe-of-day-title">${recipe.title}</h3>
                <div class="recipe-of-day-meta">
                    <span><i class="fa-regular fa-clock"></i> ${recipe.time}</span>
                    <span><i class="fa-solid fa-fire"></i> ${recipe.calories || '---'}</span>
                    <span><i class="fa-solid fa-chart-simple"></i> ${recipe.difficulty}</span>
                </div>
                <p class="recipe-of-day-desc">${recipe.description}</p>
                <button class="btn btn-primary" onclick="openModalById(${recipe.id})">Смотреть рецепт</button>
            </div>
        `;
    }

    // Expose openModalById globally for the button
    window.openModalById = (id) => {
        const recipe = allRecipes.find(r => r.id === id);
        if (recipe) openModal(recipe);
    };

    // Sort Logic
    const sortTabs = document.querySelectorAll('.sort-tab');
    sortTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            sortTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentSort = tab.dataset.sort;
            renderRecipes();
        });
    });

    // Render Recipes
    function renderRecipes() {
        if (!recipesGrid) return;
        recipesGrid.innerHTML = '';
        
        let filteredRecipes = allRecipes.filter(recipe => {
            // Category Filter
            const matchesCategory = currentCategory === 'all' || recipe.category === currentCategory;
            
            // Search Filter
            const query = searchQuery.toLowerCase();
            let matchesSearch = recipe.title.toLowerCase().includes(query) || 
                                recipe.description.toLowerCase().includes(query);
            
            if (activeFilters.searchIngredients && !matchesSearch) {
                matchesSearch = recipe.ingredients.some(ing => ing.toLowerCase().includes(query));
            }

            // Time Filter
            let matchesTime = true;
            if (activeFilters.time !== 'all') {
                const recipeTime = parseInt(recipe.time); // Assumes format "30 мин"
                matchesTime = recipeTime <= parseInt(activeFilters.time);
            }

            // Difficulty Filter
            let matchesDifficulty = true;
            if (activeFilters.difficulty !== 'all') {
                matchesDifficulty = recipe.difficulty === activeFilters.difficulty;
            }

            // Calories Filter
            let matchesCalories = true;
            if (activeFilters.calories) {
                const recipeCalories = parseInt(recipe.calories);
                if (!isNaN(recipeCalories)) {
                    matchesCalories = recipeCalories <= activeFilters.calories;
                }
            }

            // Tags Filter
            let matchesTags = true;
            if (activeFilters.tags.length > 0) {
                if (!recipe.tags) {
                    matchesTags = false;
                } else {
                    matchesTags = activeFilters.tags.every(tag => recipe.tags.includes(tag));
                }
            }

            // Favorites Filter
            let matchesFavorites = true;
            if (activeFilters.favoritesOnly) {
                const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
                matchesFavorites = favorites.includes(recipe.id);
            }

            return matchesCategory && matchesSearch && matchesTime && matchesDifficulty && matchesCalories && matchesTags && matchesFavorites;
        });

        // Sorting
        if (currentSort === 'new') {
            // Sort by ID descending (assuming higher ID is newer)
            filteredRecipes.sort((a, b) => b.id - a.id);
        } else if (currentSort === 'popular') {
            // Sort by average rating
            filteredRecipes.sort((a, b) => {
                const reviewsA = JSON.parse(localStorage.getItem(`reviews_${a.id}`)) || [];
                const avgA = reviewsA.length ? reviewsA.reduce((sum, r) => sum + r.rating, 0) / reviewsA.length : 0;
                
                const reviewsB = JSON.parse(localStorage.getItem(`reviews_${b.id}`)) || [];
                const avgB = reviewsB.length ? reviewsB.reduce((sum, r) => sum + r.rating, 0) / reviewsB.length : 0;
                
                return avgB - avgA;
            });
        }

        recipesCount.textContent = `${filteredRecipes.length} ${getDeclension(filteredRecipes.length, ['рецепт', 'рецепта', 'рецептов'])}`;

        if (filteredRecipes.length === 0) {
            recipesGrid.innerHTML = '<div class="no-results">Ничего не найдено</div>';
            return;
        }

        const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

        filteredRecipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            
            // Calculate average rating
            const reviews = JSON.parse(localStorage.getItem(`reviews_${recipe.id}`)) || [];
            const avgRating = reviews.length ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : null;
            const ratingHtml = avgRating ? `<span class="card-rating" style="position:absolute; top:15px; right:15px; background:rgba(255,255,255,0.9); padding:5px 10px; border-radius:20px; font-weight:bold; color:#ffc107;"><i class="fa-solid fa-star"></i> ${avgRating}</span>` : '';
            
            const isFavorite = favorites.includes(recipe.id);
            const favoriteClass = isFavorite ? 'active' : '';

            card.innerHTML = `
                <div class="recipe-image">
                    <span class="recipe-category">${recipe.category}</span>
                    ${ratingHtml}
                    <img src="${recipe.image}" alt="${recipe.title}" onerror="this.src='https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=1000&auto=format&fit=crop'">
                </div>
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-meta">
                        <span><i class="fa-regular fa-clock"></i> ${recipe.time}</span>
                        <span><i class="fa-solid fa-fire"></i> ${recipe.calories || '---'}</span>
                    </div>
                    <p>${recipe.description}</p>
                    <div class="recipe-footer">
                        <span class="view-recipe-btn">Подробнее <i class="fa-solid fa-arrow-right"></i></span>
                        <button class="favorite-btn ${favoriteClass}" onclick="event.stopPropagation(); toggleFavorite(${recipe.id}, this)">
                            <i class="fa-solid fa-heart"></i>
                        </button>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => openModal(recipe));
            recipesGrid.appendChild(card);
        });
    }

    // Helper for word declension
    function getDeclension(number, titles) {
        const cases = [2, 0, 1, 1, 1, 2];
        return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
    }

    // Filter Logic
    if(filterToggleBtn) {
        filterToggleBtn.addEventListener('click', () => {
            filterPanel.classList.toggle('active');
        });
    }

    function updateFilters() {
        activeFilters.time = timeFilter.value;
        activeFilters.difficulty = difficultyFilter.value;
        activeFilters.calories = caloriesFilter.value ? parseInt(caloriesFilter.value) : null;
        activeFilters.searchIngredients = searchIngredients.checked;
        
        activeFilters.tags = [];
        tagFilters.forEach(cb => {
            if (cb.checked) activeFilters.tags.push(cb.value);
        });

        renderRecipes();
    }

    if(timeFilter) timeFilter.addEventListener('change', updateFilters);
    if(difficultyFilter) difficultyFilter.addEventListener('change', updateFilters);
    if(caloriesFilter) caloriesFilter.addEventListener('input', updateFilters);
    if(searchIngredients) searchIngredients.addEventListener('change', updateFilters);
    tagFilters.forEach(cb => cb.addEventListener('change', updateFilters));

    // Favorites Filter Toggle
    const favoritesToggle = document.getElementById('favoritesToggle');
    if (favoritesToggle) {
        favoritesToggle.addEventListener('click', () => {
            activeFilters.favoritesOnly = !activeFilters.favoritesOnly;
            favoritesToggle.classList.toggle('active');
            renderRecipes();
        });
    }

    // Category Logic
    function setCategory(category) {
        currentCategory = category;
        
        categoryBtns.forEach(btn => {
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        navLinks.forEach(link => {
            if (link.dataset.category === category) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        renderRecipes();
    }

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setCategory(btn.dataset.category);
        });
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            setCategory(link.dataset.category);
            document.getElementById('recipes').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Search Logic
    function handleSearch() {
        if (!searchInput) return;
        searchQuery = searchInput.value.trim();
        renderRecipes();
        if (searchQuery) {
            const recipesSection = document.getElementById('recipes');
            if (recipesSection) recipesSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }

    // Helper to render ingredients
    function renderIngredients(ingredients) {
        if (!ingredients || ingredients.length === 0) return '';
        
        // Handle case where ingredients might be a single string with newlines (legacy data)
        let list = ingredients;
        if (ingredients.length === 1 && ingredients[0].includes('\n')) {
            list = ingredients[0].split('\n').filter(i => i.trim());
        }

        return list.map(ing => `<li>${ing}</li>`).join('');
    }

    // Modal Logic
    function openModal(recipe) {
        if (!modal || !modalBody) return;
        currentRecipeId = recipe.id;
        
        // Generate Tags HTML
        const tagsHtml = recipe.tags ? 
            `<div class="modal-tags">${recipe.tags.map(tag => `<span class="modal-tag">${tag}</span>`).join('')}</div>` : '';

        modalBody.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.title}" class="modal-header-img" onerror="this.src='https://images.unsplash.com/photo-1495521821757-a1efb6729352?q=80&w=1000&auto=format&fit=crop'">
            <div class="modal-details">
                <h2 class="modal-title">${recipe.title}</h2>
                <div class="modal-info">
                    <span><i class="fa-regular fa-clock"></i> ${recipe.time}</span>
                    <span><i class="fa-solid fa-chart-simple"></i> ${recipe.difficulty}</span>
                    <span><i class="fa-solid fa-fire"></i> ${recipe.calories || '---'}</span>
                    <span><i class="fa-solid fa-user-group"></i> ${recipe.servings || 2} порции</span>
                </div>
                ${tagsHtml}
                <p style="margin-top: 15px;">${recipe.description}</p>
                
                <h3 class="modal-section-title">
                    Ингредиенты 
                    <button class="btn btn-small btn-outline" onclick="addToShoppingList(${recipe.id})" style="margin-left: 10px; font-size: 0.8rem;">
                        <i class="fas fa-plus"></i> В список покупок
                    </button>
                </h3>
                <ul class="ingredients-list">
                    ${renderIngredients(recipe.ingredients)}
                </ul>

                <h3 class="modal-section-title">Приготовление</h3>
                <ol class="steps-list">
                    ${recipe.steps.map(step => `<li>${step.replace(/^\d+[\.\)]\s*/, '')}</li>`).join('')}
                </ol>

                <div class="recipe-reviews-section">
                    <h3 class="modal-section-title">Отзывы и оценки</h3>
                    <div class="rating-summary" id="ratingSummary">
                        <span class="average-rating" id="avgRatingDisplay">0.0</span>
                        <div class="stars-display" id="averageStars"></div>
                        <span class="reviews-count" id="reviewsCountDisplay">(0 отзывов)</span>
                    </div>
                    
                    <div id="reviewsList" class="reviews-list"></div>

                    <div class="add-review-form" id="addReviewForm" style="display: none;">
                        <h4>Оставить отзыв</h4>
                        <div class="star-rating-input">
                            <input type="radio" name="rating" value="5" id="star5"><label for="star5">★</label>
                            <input type="radio" name="rating" value="4" id="star4"><label for="star4">★</label>
                            <input type="radio" name="rating" value="3" id="star3"><label for="star3">★</label>
                            <input type="radio" name="rating" value="2" id="star2"><label for="star2">★</label>
                            <input type="radio" name="rating" value="1" id="star1"><label for="star1">★</label>
                        </div>
                        <textarea id="reviewText" placeholder="Ваш комментарий..." rows="3"></textarea>
                        <button class="btn btn-primary mt-10" id="submitReviewBtn">Отправить</button>
                    </div>
                    <div class="login-to-comment" id="loginToReview" style="display: none;">
                        <p>Войдите, чтобы оценить рецепт.</p>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        // Setup Reviews
        setupReviews(recipe.id);
    }

    // Add to Shopping List
    window.addToShoppingList = (recipeId) => {
        const recipe = allRecipes.find(r => r.id === recipeId);
        if (!recipe) return;

        const currentList = JSON.parse(localStorage.getItem('shoppingList')) || [];
        let addedCount = 0;

        recipe.ingredients.forEach(ing => {
            // Check if already exists
            if (!currentList.some(item => item.text === ing)) {
                currentList.push({ text: ing, checked: false });
                addedCount++;
            }
        });

        localStorage.setItem('shoppingList', JSON.stringify(currentList));
        
        if (addedCount > 0) {
            alert(`Добавлено ${addedCount} ингредиентов в список покупок`);
        } else {
            alert('Все ингредиенты уже есть в списке');
        }
    };

    function setupReviews(recipeId) {
        const reviewsList = document.getElementById('reviewsList');
        const addReviewForm = document.getElementById('addReviewForm');
        const loginToReview = document.getElementById('loginToReview');
        const submitReviewBtn = document.getElementById('submitReviewBtn');
        const reviewText = document.getElementById('reviewText');
        const avgRatingDisplay = document.getElementById('avgRatingDisplay');
        const averageStars = document.getElementById('averageStars');
        const reviewsCountDisplay = document.getElementById('reviewsCountDisplay');

        // Check Auth
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (user) {
            addReviewForm.style.display = 'block';
            loginToReview.style.display = 'none';
        } else {
            addReviewForm.style.display = 'none';
            loginToReview.style.display = 'block';
        }

        // Load Reviews
        const reviews = JSON.parse(localStorage.getItem(`reviews_${recipeId}`)) || [];
        renderReviewsList(reviews, reviewsList);
        updateRatingSummary(reviews, avgRatingDisplay, averageStars, reviewsCountDisplay);

        // Submit Handler
        submitReviewBtn.onclick = () => {
            const text = reviewText.value.trim();
            const ratingInput = document.querySelector('input[name="rating"]:checked');
            
            if (!ratingInput) {
                alert('Пожалуйста, поставьте оценку');
                return;
            }
            
            const rating = parseInt(ratingInput.value);
            const newReview = {
                author: user.name,
                text,
                rating,
                date: new Date().toLocaleDateString('ru-RU')
            };

            reviews.unshift(newReview);
            localStorage.setItem(`reviews_${recipeId}`, JSON.stringify(reviews));
            
            reviewText.value = '';
            ratingInput.checked = false;
            
            renderReviewsList(reviews, reviewsList);
            updateRatingSummary(reviews, avgRatingDisplay, averageStars, reviewsCountDisplay);
            
            // Update grid to show new rating immediately if needed
            renderRecipes(); 
        };
    }

    function renderReviewsList(reviews, container) {
        container.innerHTML = '';
        if (reviews.length === 0) {
            container.innerHTML = '<p class="text-light">Пока нет отзывов. Будьте первым!</p>';
            return;
        }

        reviews.forEach(review => {
            const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            const el = document.createElement('div');
            el.className = 'review-item';
            el.innerHTML = `
                <div class="review-header">
                    <span class="review-author">${review.author}</span>
                    <span class="review-date">${review.date}</span>
                </div>
                <div class="review-stars">${stars}</div>
                <p>${review.text}</p>
            `;
            container.appendChild(el);
        });
    }

    function updateRatingSummary(reviews, avgEl, starsEl, countEl) {
        if (reviews.length === 0) {
            avgEl.textContent = '0.0';
            starsEl.textContent = '☆☆☆☆☆';
            countEl.textContent = '(0 отзывов)';
            return;
        }

        const sum = reviews.reduce((a, b) => a + b.rating, 0);
        const avg = (sum / reviews.length).toFixed(1);
        
        avgEl.textContent = avg;
        countEl.textContent = `(${reviews.length} ${getDeclension(reviews.length, ['отзыв', 'отзыва', 'отзывов'])})`;
        
        const roundedAvg = Math.round(avg);
        starsEl.textContent = '★'.repeat(roundedAvg) + '☆'.repeat(5 - roundedAvg);
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (modal) modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    }

    window.addEventListener('click', (e) => {
        if (modal && e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});

// Global function for favorites
function toggleFavorite(id, btn) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const index = favorites.indexOf(id);
    
    if (index === -1) {
        favorites.push(id);
        btn.classList.add('active');
    } else {
        favorites.splice(index, 1);
        btn.classList.remove('active');
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
}
