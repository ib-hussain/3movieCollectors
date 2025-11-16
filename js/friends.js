// ===== FRIENDS PAGE TABS (Super Lightweight) ===== //

document.querySelectorAll('.friend-tab').forEach(tab => {
    tab.addEventListener('click', () => {

        // Activate clicked tab
        document.querySelectorAll('.friend-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show matching section
        const target = tab.getAttribute('data-tab');
        document.querySelectorAll('.friends-section').forEach(section => {
            section.style.display = section.id === target ? 'block' : 'none';
        });
    });
});
