document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('js-enabled');

    // Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, {
        root: null,
        threshold: 0.15, // Trigger when 15% of the element is visible
        rootMargin: "0px 0px -50px 0px"
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // Add hover tilt effect to recipe cards (if they exist)
    // We use event delegation because cards might be added dynamically
    const recipesGrid = document.getElementById('recipesGrid');
    if (recipesGrid) {
        recipesGrid.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.recipe-card');
            if (!card) return;

            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -5; // Max 5deg rotation
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        recipesGrid.addEventListener('mouseout', (e) => {
            const card = e.target.closest('.recipe-card');
            if (!card) return;
            
            card.style.transform = '';
        });
    }
});
