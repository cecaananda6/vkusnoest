document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const authModal = document.getElementById('authModal');
    const closeAuthModal = document.getElementById('closeAuthModal');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const userNameDisplay = document.getElementById('userNameDisplay');
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    
    const loginFormEl = document.getElementById('loginFormEl');
    const registerFormEl = document.getElementById('registerFormEl');

    // State
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

    // Init
    updateAuthUI();

    // Event Listeners
    if(loginBtn) loginBtn.addEventListener('click', () => openAuthModal('login'));
    if(registerBtn) registerBtn.addEventListener('click', () => openAuthModal('register'));
    if(logoutBtn) logoutBtn.addEventListener('click', logout);
    
    if(closeAuthModal) closeAuthModal.addEventListener('click', () => authModal.style.display = 'none');
    
    if(switchToRegister) switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showForm('register');
    });
    
    if(switchToLogin) switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showForm('login');
    });

    if(loginFormEl) loginFormEl.addEventListener('submit', handleLogin);
    if(registerFormEl) registerFormEl.addEventListener('submit', handleRegister);

    // Functions
    function openAuthModal(mode) {
        if (!authModal) return;
        authModal.style.display = 'block';
        showForm(mode);
    }

    function showForm(mode) {
        if (!loginForm || !registerForm) return;
        if (mode === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
    }

    function handleRegister(e) {
        e.preventDefault();
        const name = e.target[0].value;
        const email = e.target[1].value;
        const password = e.target[2].value;

        const users = JSON.parse(localStorage.getItem('users')) || [];
        
        if (users.find(u => u.email === email)) {
            alert('Пользователь с таким email уже существует');
            return;
        }

        const newUser = { id: Date.now(), name, email, password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        login(newUser);
        authModal.style.display = 'none';
        e.target.reset();
    }

    function handleLogin(e) {
        e.preventDefault();
        const email = e.target[0].value;
        const password = e.target[1].value;

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            login(user);
            authModal.style.display = 'none';
            e.target.reset();
        } else {
            alert('Неверный email или пароль');
        }
    }

    function login(user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateAuthUI();
        window.location.reload(); // Reload to update UI on pages like add-recipe
    }

    function logout() {
        currentUser = null;
        localStorage.removeItem('currentUser');
        updateAuthUI();
        window.location.reload(); // Reload to update any protected content
    }

    function updateAuthUI() {
        if (currentUser) {
            if(authButtons) authButtons.style.display = 'none';
            if(userProfile) {
                userProfile.style.display = 'flex';
                userProfile.style.cursor = 'pointer';
                userProfile.onclick = () => window.location.href = 'profile.html';
            }
            if(userNameDisplay) userNameDisplay.textContent = currentUser.name;
        } else {
            if(authButtons) authButtons.style.display = 'flex';
            if(userProfile) userProfile.style.display = 'none';
        }
    }

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (authModal && e.target === authModal) {
            authModal.style.display = 'none';
        }
    });

    // Mobile Menu Logic
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');

    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            nav.classList.toggle('active');
            
            // Change icon
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                if (nav.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (nav.classList.contains('active') && !nav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                nav.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
});
