document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Update Profile Info
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const logoutBtnProfile = document.getElementById('logoutBtnProfile');

    if (profileName) profileName.textContent = currentUser.name;
    if (profileEmail) profileEmail.textContent = currentUser.email;

    if (logoutBtnProfile) {
        logoutBtnProfile.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }

    // Load Data
    const favoritesGrid = document.getElementById('favoritesGrid');
    const myRecipesGrid = document.getElementById('myRecipesGrid');
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    fetch('data/recipes.json')
        .then(response => response.json())
        .then(staticRecipes => {
            // Merge with user recipes
            const userRecipes = JSON.parse(localStorage.getItem('userRecipes')) || [];
            const allRecipes = [...staticRecipes, ...userRecipes];

            // Render Favorites
            if (favoritesGrid) {
                const favoriteRecipes = allRecipes.filter(recipe => favorites.includes(recipe.id));
                renderRecipes(favoriteRecipes, favoritesGrid, true);
            }

            // Render My Recipes
            if (myRecipesGrid) {
                const myRecipes = userRecipes.filter(recipe => recipe.author === currentUser.name);
                renderRecipes(myRecipes, myRecipesGrid, false, true);
            }
        })
        .catch(err => {
            console.error(err);
            if (favoritesGrid) favoritesGrid.innerHTML = '<p class="error">Ошибка загрузки рецептов</p>';
            if (myRecipesGrid) myRecipesGrid.innerHTML = '<p class="error">Ошибка загрузки рецептов</p>';
        });

    function renderRecipes(recipes, container, isFavoriteList = false, isMyList = false) {
        container.innerHTML = '';
        
        if (recipes.length === 0) {
            container.innerHTML = '<div class="no-results">Здесь пока пусто.</div>';
            return;
        }

        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            
            // Calculate average rating
            const reviews = JSON.parse(localStorage.getItem(`reviews_${recipe.id}`)) || [];
            const avgRating = reviews.length ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : null;
            const ratingHtml = avgRating ? `<span class="card-rating" style="position:absolute; top:15px; right:15px; background:rgba(255,255,255,0.9); padding:5px 10px; border-radius:20px; font-weight:bold; color:#ffc107;"><i class="fa-solid fa-star"></i> ${avgRating}</span>` : '';

            // Determine button HTML
            let actionBtn = '';
            if (isFavoriteList) {
                actionBtn = `
                    <button class="favorite-btn active" title="Удалить из избранного" onclick="event.stopPropagation(); removeFavorite(${recipe.id}, this)">
                        <i class="fa-solid fa-heart"></i>
                    </button>`;
            } else if (isMyList) {
                actionBtn = `
                    <button class="favorite-btn" title="Удалить рецепт" style="color: #ff4757;" onclick="event.stopPropagation(); deleteMyRecipe(${recipe.id}, this)">
                        <i class="fa-solid fa-trash"></i>
                    </button>`;
            }

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
                        ${actionBtn}
                    </div>
                </div>
            `;
            
            // Add to Shopping List Button
            const addToShoppingListBtn = document.createElement('button');
            addToShoppingListBtn.className = 'btn btn-small btn-outline';
            addToShoppingListBtn.style.marginTop = '10px';
            addToShoppingListBtn.innerHTML = '<i class="fas fa-plus"></i> В список покупок';
            addToShoppingListBtn.onclick = (e) => {
                e.stopPropagation();
                addToShoppingList(recipe.id);
            };
            
            // Insert after meta
            const meta = card.querySelector('.recipe-meta');
            meta.after(addToShoppingListBtn);
            
            card.addEventListener('click', () => openModal(recipe));
            container.appendChild(card);
        });
    }

    // Modal Logic (Simplified version of app.js)
    const modal = document.getElementById('recipeModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.querySelector('.close-modal');

    function openModal(recipe) {
        if (!modal || !modalBody) return;
        const tagsHtml = recipe.tags ? 
            `<div class="modal-tags">${recipe.tags.map(tag => `<span class="modal-tag">${tag}</span>`).join('')}</div>` : '';

        modalBody.innerHTML = `
            <img src="${recipe.image}" alt="${recipe.title}" class="modal-header-img">
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
                
                <h3 class="modal-section-title">Ингредиенты</h3>
                <ul class="ingredients-list">
                    ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join('')}
                </ul>

                <h3 class="modal-section-title">Приготовление</h3>
                <ol class="steps-list">
                    ${recipe.steps.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>
        `;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    if(closeModal) {
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

function removeFavorite(id, btn) {
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const index = favorites.indexOf(id);
    
    if (index !== -1) {
        favorites.splice(index, 1);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        // Remove card from DOM
        const card = btn.closest('.recipe-card');
        card.remove();
        
        // Check if empty
        const grid = document.getElementById('favoritesGrid');
        if (grid.children.length === 0) {
            grid.innerHTML = '<div class="no-results">У вас пока нет избранных рецептов.</div>';
        }
    }
}

function deleteMyRecipe(id, btn) {
    if (!confirm('Вы уверены, что хотите удалить этот рецепт?')) return;

    const userRecipes = JSON.parse(localStorage.getItem('userRecipes')) || [];
    const newRecipes = userRecipes.filter(r => r.id !== id);
    localStorage.setItem('userRecipes', JSON.stringify(newRecipes));

    // Remove card from DOM
    const card = btn.closest('.recipe-card');
    card.remove();

    // Check if empty
    const grid = document.getElementById('myRecipesGrid');
    if (grid.children.length === 0) {
        grid.innerHTML = '<div class="no-results">Здесь пока пусто.</div>';
    }
}

// Shared Add to Shopping List Logic (Duplicated from app.js for independence)
function addToShoppingList(recipeId) {
    // Need to fetch recipes first since we don't have allRecipes global here
    fetch('data/recipes.json')
        .then(response => response.json())
        .then(allRecipes => {
            const userRecipes = JSON.parse(localStorage.getItem('userRecipes')) || [];
            const fullList = [...allRecipes, ...userRecipes];
            
            const recipe = fullList.find(r => r.id === recipeId);
            if (!recipe) return;

            const currentList = JSON.parse(localStorage.getItem('shoppingList')) || [];
            let addedCount = 0;

            recipe.ingredients.forEach(ing => {
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
        });
}