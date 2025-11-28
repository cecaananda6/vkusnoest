document.addEventListener('DOMContentLoaded', () => {
    const ingredientInput = document.getElementById('ingredientInput');
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    const selectedIngredientsContainer = document.getElementById('selectedIngredients');
    const findRecipesBtn = document.getElementById('findRecipesBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    
    // Modal Elements
    const modal = document.getElementById('recipeModal');
    const modalBody = document.getElementById('modalBody');
    const closeModal = document.getElementById('closeRecipeModal');

    let selectedIngredients = [];
    let allRecipes = [];

    // Fetch Recipes
    fetch('data/recipes.json')
        .then(response => response.json())
        .then(data => {
            allRecipes = data;
            // Merge user recipes
            const userRecipes = JSON.parse(localStorage.getItem('userRecipes')) || [];
            allRecipes = [...allRecipes, ...userRecipes];
        })
        .catch(error => console.error('Error loading recipes:', error));

    // Add Ingredient
    function addIngredient() {
        const text = ingredientInput.value.trim().toLowerCase();
        if (!text) return;

        if (!selectedIngredients.includes(text)) {
            selectedIngredients.push(text);
            renderSelectedIngredients();
            ingredientInput.value = '';
            updateFindButton();
        }
    }

    if (addIngredientBtn) addIngredientBtn.addEventListener('click', addIngredient);
    if (ingredientInput) {
        ingredientInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addIngredient();
        });
    }

    // Render Selected Ingredients
    function renderSelectedIngredients() {
        selectedIngredientsContainer.innerHTML = '';
        selectedIngredients.forEach((ing, index) => {
            const tag = document.createElement('span');
            tag.className = 'modal-tag'; // Reuse style
            tag.style.backgroundColor = 'var(--primary-color)';
            tag.style.color = 'white';
            tag.style.cursor = 'pointer';
            tag.innerHTML = `${ing} <i class="fas fa-times" style="margin-left: 5px;"></i>`;
            tag.onclick = () => removeIngredient(index);
            selectedIngredientsContainer.appendChild(tag);
        });
    }

    // Remove Ingredient
    function removeIngredient(index) {
        selectedIngredients.splice(index, 1);
        renderSelectedIngredients();
        updateFindButton();
    }

    function updateFindButton() {
        if (selectedIngredients.length > 0) {
            findRecipesBtn.style.display = 'block';
        } else {
            findRecipesBtn.style.display = 'none';
            resultsContainer.innerHTML = '';
        }
    }

    // Find Recipes
    if (findRecipesBtn) {
        findRecipesBtn.addEventListener('click', () => {
            if (selectedIngredients.length === 0) return;

            resultsContainer.innerHTML = '<div class="loading">Поиск рецептов...</div>';

            // Simple matching algorithm
            const matchedRecipes = allRecipes.filter(recipe => {
                // Check if recipe contains ANY of the selected ingredients
                // Ideally, we want recipes that contain MOST of the selected ingredients
                // Or recipes where selected ingredients cover MOST of the required ingredients
                
                // Let's count how many selected ingredients are in the recipe
                const recipeIngredients = recipe.ingredients.map(i => i.toLowerCase());
                let matchCount = 0;
                
                selectedIngredients.forEach(selIng => {
                    if (recipeIngredients.some(recIng => recIng.includes(selIng))) {
                        matchCount++;
                    }
                });

                // Return true if at least one ingredient matches
                // We will sort by match count later
                recipe.matchCount = matchCount;
                return matchCount > 0;
            });

            // Sort by match count descending
            matchedRecipes.sort((a, b) => b.matchCount - a.matchCount);

            renderResults(matchedRecipes);
        });
    }

    function renderResults(recipes) {
        resultsContainer.innerHTML = '';

        if (recipes.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">Ничего не найдено. Попробуйте другие ингредиенты.</div>';
            return;
        }

        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            
            // Calculate average rating
            const reviews = JSON.parse(localStorage.getItem(`reviews_${recipe.id}`)) || [];
            const avgRating = reviews.length ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : null;
            const ratingHtml = avgRating ? `<span class="card-rating" style="position:absolute; top:15px; right:15px; background:rgba(255,255,255,0.9); padding:5px 10px; border-radius:20px; font-weight:bold; color:#ffc107;"><i class="fa-solid fa-star"></i> ${avgRating}</span>` : '';

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
                    <p>Совпадений: ${recipe.matchCount}</p>
                    <div class="recipe-footer">
                        <span class="view-recipe-btn">Подробнее <i class="fa-solid fa-arrow-right"></i></span>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => openModal(recipe));
            resultsContainer.appendChild(card);
        });
    }

    // Modal Logic (Reused)
    function openModal(recipe) {
        if (!modal || !modalBody) return;
        
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
                
                <h3 class="modal-section-title">Ингредиенты</h3>
                <ul class="ingredients-list">
                    ${recipe.ingredients.map(ing => {
                        // Highlight matching ingredients
                        let isMatch = false;
                        const ingLower = ing.toLowerCase();
                        selectedIngredients.forEach(sel => {
                            if (ingLower.includes(sel)) isMatch = true;
                        });
                        return `<li style="${isMatch ? 'font-weight:bold; color:var(--primary-color);' : ''}">${ing}</li>`;
                    }).join('')}
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
