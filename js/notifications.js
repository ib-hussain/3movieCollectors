// Add this function to notifications.js
function setNavbarActiveState() {
    // Remove active class from all navbar icons
    const allIconBtns = document.querySelectorAll('.nav-right .icon-btn');
    allIconBtns.forEach(btn => {
        btn.classList.remove('active');
        const iconCircle = btn.querySelector('.icon-circle');
        if (iconCircle) iconCircle.classList.remove('active');
    });
    
    // Add active class to notification icon
    const notificationBtn = document.querySelector('.nav-right .icon-btn:nth-child(1)'); // First icon button
    if (notificationBtn) {
        notificationBtn.classList.add('active');
        const iconCircle = notificationBtn.querySelector('.icon-circle');
        if (iconCircle) iconCircle.classList.add('active');
    }
}

// Call this when the page loads
document.addEventListener("DOMContentLoaded", () => {
    setNavbarActiveState();
    
    // ... rest of your existing notifications.js code ...
    const notificationCheckboxes = document.querySelectorAll('.notification-check');
    const markAllReadBtn = document.querySelector('.mark-all-read-btn');
    const notificationsCount = document.querySelector('.notifications-count');
    const unreadSection = document.querySelector('.notifications-section:first-child .section-title');

    // Update notification count
    function updateNotificationCount() {
        const unreadCount = document.querySelectorAll('.notification-item.unread').length;
        notificationsCount.textContent = `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`;
        
        // Update section title
        if (unreadSection) {
            unreadSection.textContent = `Unread (${unreadCount})`;
        }
        
        // Hide unread section if no unread notifications
        if (unreadCount === 0 && unreadSection) {
            unreadSection.closest('.notifications-section').style.display = 'none';
        } else if (unreadSection) {
            unreadSection.closest('.notifications-section').style.display = 'block';
        }
    }

    // Toggle individual notification read state
    notificationCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const notificationItem = this.closest('.notification-item');
            
            if (this.checked) {
                notificationItem.classList.remove('unread');
                notificationItem.classList.add('read');
            } else {
                notificationItem.classList.remove('read');
                notificationItem.classList.add('unread');
            }
            
            updateNotificationCount();
        });
    });

    // Mark all as read functionality
    markAllReadBtn.addEventListener('click', () => {
        notificationCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
            const notificationItem = checkbox.closest('.notification-item');
            notificationItem.classList.remove('unread');
            notificationItem.classList.add('read');
        });
        
        updateNotificationCount();
        
        // Show confirmation (optional)
        const originalText = markAllReadBtn.textContent;
        markAllReadBtn.textContent = 'All marked as read!';
        markAllReadBtn.style.background = '#37d24f';
        markAllReadBtn.style.borderColor = '#37d24f';
        markAllReadBtn.style.color = '#ffffff';
        
        setTimeout(() => {
            markAllReadBtn.textContent = originalText;
            markAllReadBtn.style.background = 'transparent';
            markAllReadBtn.style.borderColor = '#ff2c2c';
            markAllReadBtn.style.color = '#ff2c2c';
        }, 2000);
    });

    // Initialize notification count
    updateNotificationCount();
});