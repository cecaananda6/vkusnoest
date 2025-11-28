document.addEventListener('DOMContentLoaded', () => {
    const shoppingListContainer = document.getElementById('shoppingListContainer');
    const clearListBtn = document.getElementById('clearListBtn');
    const copyListBtn = document.getElementById('copyListBtn');
    const addItemBtn = document.getElementById('addItemBtn');
    const newItemInput = document.getElementById('newItemInput');

    // Load shopping list from localStorage
    function loadShoppingList() {
        const shoppingList = JSON.parse(localStorage.getItem('shoppingList')) || [];
        renderShoppingList(shoppingList);
    }

    // Render the list
    function renderShoppingList(list) {
        if (!shoppingListContainer) return;

        if (list.length === 0) {
            shoppingListContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-carrot"></i>
                    <h3>Ваш список покупок пуст</h3>
                    <p>Добавляйте ингредиенты из рецептов или вписывайте их вручную.</p>
                    <a href="index.html" class="btn btn-primary">Перейти к рецептам</a>
                </div>
            `;
            if (clearListBtn) clearListBtn.style.display = 'none';
            if (copyListBtn) copyListBtn.style.display = 'none';
            return;
        }

        if (clearListBtn) clearListBtn.style.display = 'inline-block';
        if (copyListBtn) copyListBtn.style.display = 'inline-block';

        let html = '<ul class="shopping-list">';
        list.forEach((item, index) => {
            html += `
                <li class="shopping-item">
                    <label class="checkbox-container">
                        <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleItem(${index})">
                        <span class="checkmark"></span>
                        <span class="item-text ${item.checked ? 'checked' : ''}">${item.text}</span>
                    </label>
                    <div class="item-actions">
                        <button class="btn-icon-small edit-btn" onclick="editItem(${index})" title="Редактировать">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn-icon-small delete-btn" onclick="deleteItem(${index})" title="Удалить">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </li>
            `;
        });
        html += '</ul>';
        shoppingListContainer.innerHTML = html;
    }

    // Add new item
    function handleAddItem() {
        const text = newItemInput.value.trim();
        if (!text) return;

        const shoppingList = JSON.parse(localStorage.getItem('shoppingList')) || [];
        shoppingList.unshift({ text, checked: false });
        localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
        
        newItemInput.value = '';
        renderShoppingList(shoppingList);
        showNotification('Товар добавлен');
    }

    if (addItemBtn) addItemBtn.addEventListener('click', handleAddItem);
    if (newItemInput) {
        newItemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAddItem();
        });
    }

    // Copy list to clipboard
    if (copyListBtn) {
        copyListBtn.addEventListener('click', () => {
            const shoppingList = JSON.parse(localStorage.getItem('shoppingList')) || [];
            if (shoppingList.length === 0) return;

            const textToCopy = shoppingList.map(item => {
                return `${item.checked ? '[x]' : '[ ]'} ${item.text}`;
            }).join('\n');

            navigator.clipboard.writeText(textToCopy).then(() => {
                showNotification('Список скопирован в буфер обмена');
            }).catch(err => {
                console.error('Failed to copy: ', err);
                showNotification('Ошибка копирования');
            });
        });
    }

    // Toggle item checked state
    window.toggleItem = (index) => {
        const shoppingList = JSON.parse(localStorage.getItem('shoppingList')) || [];
        if (shoppingList[index]) {
            shoppingList[index].checked = !shoppingList[index].checked;
            localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
            renderShoppingList(shoppingList);
        }
    };

    // Edit item
    window.editItem = (index) => {
        const shoppingList = JSON.parse(localStorage.getItem('shoppingList')) || [];
        const item = shoppingList[index];
        
        const newText = prompt('Редактировать товар:', item.text);
        if (newText !== null && newText.trim() !== '') {
            shoppingList[index].text = newText.trim();
            localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
            renderShoppingList(shoppingList);
        }
    };

    // Delete single item
    window.deleteItem = (index) => {
        const shoppingList = JSON.parse(localStorage.getItem('shoppingList')) || [];
        shoppingList.splice(index, 1);
        localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
        renderShoppingList(shoppingList);
        showNotification('Товар удален');
    };

    // Clear all items
    if (clearListBtn) {
        clearListBtn.addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите очистить весь список?')) {
                localStorage.removeItem('shoppingList');
                loadShoppingList();
                showNotification('Список очищен');
            }
        });
    }

    // Initial load
    loadShoppingList();
});

// Helper for notifications (reused from app.js logic if available, or simple alert)
function showNotification(message) {
    // Create notification element if it doesn't exist
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
