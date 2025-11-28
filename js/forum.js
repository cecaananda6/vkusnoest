document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const topicsList = document.getElementById('topicsList');
    const topicView = document.getElementById('topicView');
    const createTopicBtn = document.getElementById('createTopicBtn');
    const createTopicModal = document.getElementById('createTopicModal');
    const closeTopicModal = document.getElementById('closeTopicModal');
    const createTopicForm = document.getElementById('createTopicForm');
    const backToTopics = document.getElementById('backToTopics');
    const filterBtns = document.querySelectorAll('.forum-filter');
    
    // Topic View Elements
    const topicTitle = document.getElementById('topicTitle');
    const topicAuthor = document.getElementById('topicAuthor');
    const topicDate = document.getElementById('topicDate');
    const topicContent = document.getElementById('topicContent');
    const commentsList = document.getElementById('commentsList');
    const commentInput = document.getElementById('commentInput');
    const submitCommentBtn = document.getElementById('submitCommentBtn');
    const addCommentForm = document.getElementById('addCommentForm');
    const loginToComment = document.getElementById('loginToComment');

    // State
    let currentTopicId = null;
    let staticTopics = [];
    let userTopics = JSON.parse(localStorage.getItem('userTopics')) || [];
    let allTopics = [];
    let currentFilter = 'all';

    // Fetch Data
    fetch('data/forum.json')
        .then(response => response.json())
        .then(data => {
            staticTopics = data;
            mergeAndRender();
        })
        .catch(error => {
            console.error('Error loading forum topics:', error);
            // Fallback if fetch fails
            mergeAndRender();
        });

    function mergeAndRender() {
        // Combine user topics (newest first) and static topics
        allTopics = [...userTopics, ...staticTopics];
        renderTopics();
    }

    // Init
    checkAuthForForum();

    // Event Listeners
    if(createTopicBtn) createTopicBtn.addEventListener('click', () => {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            alert('Пожалуйста, войдите, чтобы создать тему');
            const loginBtn = document.getElementById('loginBtn');
            if (loginBtn) loginBtn.click();
            return;
        }
        if (createTopicModal) createTopicModal.style.display = 'block';
    });

    if(closeTopicModal) closeTopicModal.addEventListener('click', () => {
        if (createTopicModal) createTopicModal.style.display = 'none';
    });
    
    if(createTopicForm) createTopicForm.addEventListener('submit', handleCreateTopic);
    
    if(backToTopics) backToTopics.addEventListener('click', () => {
        if (topicView) topicView.style.display = 'none';
        if (topicsList) topicsList.style.display = 'grid';
        currentTopicId = null;
        // Refresh list to show updated comment counts
        renderTopics();
    });

    if(submitCommentBtn) submitCommentBtn.addEventListener('click', handleAddComment);

    // Filter Logic
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => {
                b.classList.remove('active');
                b.classList.remove('btn-primary');
                b.classList.add('btn-outline');
            });
            btn.classList.add('active');
            btn.classList.remove('btn-outline');
            btn.classList.add('btn-primary');
            
            currentFilter = btn.dataset.filter;
            renderTopics();
        });
    });

    // Functions
    function renderTopics() {
        if (!topicsList) return;
        topicsList.innerHTML = '';

        let filteredTopics = allTopics;
        if (currentFilter !== 'all') {
            filteredTopics = allTopics.filter(t => t.category === currentFilter);
        }

        if (filteredTopics.length === 0) {
            topicsList.innerHTML = '<p class="text-light">В этой категории пока нет тем.</p>';
            return;
        }

        filteredTopics.forEach(topic => {
            // Get extra comments count
            const extraComments = JSON.parse(localStorage.getItem(`comments_${topic.id}`)) || [];
            const totalComments = (topic.comments ? topic.comments.length : 0) + extraComments.length;

            const card = document.createElement('div');
            card.className = 'topic-card';
            
            // Category badge color
            let badgeColor = 'var(--primary-color)';
            if (topic.category === 'Вопросы') badgeColor = '#e67e22';
            if (topic.category === 'Инвентарь') badgeColor = '#3498db';
            if (topic.category === 'Советы') badgeColor = '#27ae60';

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <h3>${topic.title}</h3>
                    <span style="background:${badgeColor}; color:white; padding:2px 8px; border-radius:10px; font-size:0.7rem; white-space:nowrap;">${topic.category || 'Общее'}</span>
                </div>
                <div class="topic-meta">
                    <span><i class="fa-solid fa-user"></i> ${topic.author}</span>
                    <span><i class="fa-regular fa-calendar"></i> ${topic.date}</span>
                    <span><i class="fa-regular fa-comment"></i> ${totalComments}</span>
                </div>
            `;
            card.addEventListener('click', () => openTopic(topic));
            topicsList.appendChild(card);
        });
    }

    function openTopic(topic) {
        if (!topicView || !topicsList) return;
        currentTopicId = topic.id;
        topicsList.style.display = 'none';
        topicView.style.display = 'block';

        if (topicTitle) topicTitle.textContent = topic.title;
        if (topicAuthor) topicAuthor.textContent = topic.author;
        if (topicDate) topicDate.textContent = topic.date;
        if (topicContent) topicContent.textContent = topic.content;

        renderComments(topic);
        checkAuthForForum();
    }

    function renderComments(topic) {
        if (!commentsList) return;
        commentsList.innerHTML = '';

        // Merge static and local comments
        const staticComments = topic.comments || [];
        const localComments = JSON.parse(localStorage.getItem(`comments_${topic.id}`)) || [];
        const allComments = [...staticComments, ...localComments];

        if (allComments.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">Пока нет комментариев. Будьте первым!</p>';
            return;
        }

        allComments.forEach(comment => {
            const commentEl = document.createElement('div');
            commentEl.className = 'comment-card';
            commentEl.innerHTML = `
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-date">${comment.date}</span>
                </div>
                <p>${comment.text}</p>
            `;
            commentsList.appendChild(commentEl);
        });
    }

    function handleCreateTopic(e) {
        e.preventDefault();
        const title = e.target[0].value;
        const category = e.target[1].value;
        const content = e.target[2].value;
        const user = JSON.parse(localStorage.getItem('currentUser'));

        const newTopic = {
            id: Date.now(),
            title,
            category,
            content,
            author: user.name,
            date: new Date().toLocaleDateString('ru-RU'),
            comments: []
        };

        userTopics.unshift(newTopic);
        localStorage.setItem('userTopics', JSON.stringify(userTopics));
        
        if (createTopicModal) createTopicModal.style.display = 'none';
        e.target.reset();
        mergeAndRender();
    }

    function handleAddComment() {
        if (!commentInput) return;
        const text = commentInput.value.trim();
        if (!text) return;

        const user = JSON.parse(localStorage.getItem('currentUser'));
        
        const newComment = {
            author: user.name,
            text,
            date: new Date().toLocaleDateString('ru-RU')
        };

        // Save to local storage specifically for this topic
        const localComments = JSON.parse(localStorage.getItem(`comments_${currentTopicId}`)) || [];
        localComments.push(newComment);
        localStorage.setItem(`comments_${currentTopicId}`, JSON.stringify(localComments));
        
        commentInput.value = '';
        
        // Re-render comments
        const currentTopic = allTopics.find(t => t.id === currentTopicId);
        renderComments(currentTopic);
    }

    function checkAuthForForum() {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        
        if (addCommentForm && loginToComment) {
            if (user) {
                addCommentForm.style.display = 'block';
                loginToComment.style.display = 'none';
            } else {
                addCommentForm.style.display = 'none';
                loginToComment.style.display = 'block';
            }
        }
    }

    // Listen for auth changes (from auth.js)
    window.addEventListener('storage', () => {
        checkAuthForForum();
    });
});
