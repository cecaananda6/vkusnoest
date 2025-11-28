document.addEventListener('DOMContentLoaded', () => {
    const addRecipeForm = document.getElementById('addRecipeForm');
    const ingredientsContainer = document.getElementById('ingredientsContainer');
    const stepsContainer = document.getElementById('stepsContainer');
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    const addStepBtn = document.getElementById('addStepBtn');
    const addRecipeContainer = document.querySelector('.add-recipe-container');

    // Check if user is logged in
    let user = null;
    try {
        const userJson = localStorage.getItem('currentUser');
        user = userJson ? JSON.parse(userJson) : null;
    } catch (e) {
        console.error('Auth Error:', e);
    }

    if (!user) {
        if (addRecipeContainer) {
            addRecipeContainer.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <div style="background: #fff5f5; width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                        <i class="fas fa-user-lock" style="font-size: 32px; color: var(--primary-color);"></i>
                    </div>
                    <h2 style="margin-bottom: 15px;">Войдите, чтобы создать рецепт</h2>
                    <p style="margin-bottom: 30px; color: #666; max-width: 500px; margin-left: auto; margin-right: auto;">
                        Делитесь своими кулинарными шедеврами с тысячами пользователей! 
                        После входа вы сможете добавлять рецепты, сохранять черновики и получать отзывы.
                    </p>
                    <button class="btn btn-primary" id="loginRedirectBtn" style="padding: 12px 40px;">Войти в аккаунт</button>
                </div>
            `;
            
            // Add listener to the new button to trigger the main login button
            const loginRedirectBtn = document.getElementById('loginRedirectBtn');
            if (loginRedirectBtn) {
                loginRedirectBtn.addEventListener('click', () => {
                    const loginBtn = document.getElementById('loginBtn');
                    if (loginBtn) loginBtn.click();
                });
            }
        }
        return;
    }

    // Add Ingredient Field
    if (addIngredientBtn) {
        addIngredientBtn.addEventListener('click', () => {
            const div = document.createElement('div');
            div.className = 'ingredient-row';
            div.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
            div.innerHTML = `
                <input type="text" class="ingredient-input" required placeholder="Ингредиент">
                <button type="button" class="btn btn-outline btn-small" style="color: #ff4757; border-color: #ff4757;" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
            `;
            ingredientsContainer.appendChild(div);
        });
    }

    // Add Step Field
    if (addStepBtn) {
        addStepBtn.addEventListener('click', () => {
            const div = document.createElement('div');
            div.className = 'step-row';
            div.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
            div.innerHTML = `
                <textarea class="step-input" required placeholder="Следующий шаг..." rows="2"></textarea>
                <button type="button" class="btn btn-outline btn-small" style="color: #ff4757; border-color: #ff4757;" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
            `;
            stepsContainer.appendChild(div);
        });
    }

    // Handle Form Submission
    if (addRecipeForm) {
        addRecipeForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Collect Ingredients
            const ingredientsText = document.getElementById('recipeIngredients').value;
            const ingredients = ingredientsText.split('\n').map(i => i.trim()).filter(i => i);

            // Collect Steps
            const steps = [];
            document.querySelectorAll('.step-input').forEach(input => {
                if (input.value.trim()) steps.push(input.value.trim());
            });

            if (ingredients.length === 0 || steps.length === 0) {
                alert('Пожалуйста, добавьте хотя бы один ингредиент и один шаг приготовления.');
                return;
            }

            try {
                const caloriesVal = document.getElementById('recipeCalories').value;
                const caloriesStr = caloriesVal ? `${caloriesVal} ккал` : '---';

                const newRecipe = {
                    id: Date.now(),
                    title: document.getElementById('recipeTitle').value.trim(),
                    category: document.getElementById('recipeCategory').value,
                    difficulty: document.getElementById('recipeDifficulty').value,
                    time: document.getElementById('recipeTime').value.trim(),
                    calories: caloriesStr,
                    image: document.getElementById('recipeImage').value.trim(),
                    description: document.getElementById('recipeDescription').value.trim(),
                    ingredients: ingredients,
                    steps: steps,
                    tags: [],
                    author: user.name,
                    isUserRecipe: true,
                    date: new Date().toISOString()
                };

                // Save to localStorage
                let userRecipes = [];
                try {
                    const stored = localStorage.getItem('userRecipes');
                    userRecipes = stored ? JSON.parse(stored) : [];
                    if (!Array.isArray(userRecipes)) userRecipes = [];
                } catch (err) {
                    console.error('Error reading userRecipes:', err);
                    userRecipes = [];
                }

                userRecipes.push(newRecipe);
                localStorage.setItem('userRecipes', JSON.stringify(userRecipes));

                alert('Рецепт успешно добавлен!');
                window.location.href = 'index.html';
            } catch (err) {
                console.error('Error saving recipe:', err);
                alert('Произошла ошибка при сохранении рецепта. Проверьте консоль.');
            }
        });
    }
});
