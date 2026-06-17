/**
 * js_utils.js
 * Reusable helper functions for the NCCAOM Biomed Mastery App
 */

// ============================================
// Array & Data Helpers
// ============================================

/**
 * Shuffle an array in place (Fisher-Yates algorithm)
 * @param {Array} array 
 * @returns {Array} shuffled array
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Calculate accuracy percentage
 * @param {number} seen 
 * @param {number} correctStreak 
 * @returns {number} accuracy percentage (0-100)
 */
function calculateAccuracy(seen, correctStreak) {
    if (!seen || seen === 0) return 0;
    return Math.round((correctStreak / seen) * 100);
}

/**
 * Get a simple color class based on accuracy
 * @param {number} accuracy 
 * @returns {string} Tailwind color class
 */
function getAccuracyColor(accuracy) {
    if (accuracy >= 80) return 'text-emerald-400';
    if (accuracy >= 60) return 'text-amber-400';
    return 'text-red-400';
}

// ============================================
// Storage Helpers (light wrappers)
// ============================================

/**
 * Safely get item from localStorage
 * @param {string} key 
 * @param {any} defaultValue 
 * @returns {any}
 */
function getStorageItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.warn(`Failed to read from localStorage key "${key}"`, e);
        return defaultValue;
    }
}

/**
 * Safely set item in localStorage
 * @param {string} key 
 * @param {any} value 
 */
function setStorageItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn(`Failed to write to localStorage key "${key}"`, e);
    }
}

// ============================================
// UI Helpers
// ============================================

/**
 * Simple debounce function
 * @param {Function} func 
 * @param {number} delay 
 * @returns {Function}
 */
function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Show a simple toast notification
 * @param {string} message 
 * @param {string} type - 'success' | 'error' | 'info'
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    
    let bgColor = 'bg-zinc-800 border-zinc-700';
    if (type === 'success') bgColor = 'bg-emerald-900 border-emerald-700 text-emerald-200';
    if (type === 'error') bgColor = 'bg-red-900 border-red-700 text-red-200';

    toast.className = `fixed bottom-4 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl border text-sm shadow-xl z-[200] ${bgColor}`;
    toast.innerHTML = `
        <div class="flex items-center gap-x-3">
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'all 0.3s ease';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

/**
 * Format a date for display
 * @param {string|Date} dateInput 
 * @returns {string}
 */
function formatDate(dateInput) {
    if (!dateInput) return 'Never';
    const date = new Date(dateInput);
    return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
    });
}

// ============================================
// Domain & Question Helpers
// ============================================

/**
 * Get human-readable domain label
 * @param {string} domain - 'I' or 'II'
 * @returns {string}
 */
function getDomainLabel(domain) {
    return domain === 'I' ? 'Domain I (80%)' : 'Domain II (20%)';
}

/**
 * Get color classes for a domain
 * @param {string} domain 
 * @returns {string}
 */
function getDomainColorClasses(domain) {
    return domain === 'I' 
        ? 'bg-blue-900/60 text-blue-300 border-blue-700' 
        : 'bg-amber-900/60 text-amber-300 border-amber-700';
}

// Export functions if using modules in the future (currently global for simplicity)
window.shuffleArray = shuffleArray;
window.calculateAccuracy = calculateAccuracy;
window.getAccuracyColor = getAccuracyColor;
window.getStorageItem = getStorageItem;
window.setStorageItem = setStorageItem;
window.debounce = debounce;
window.showToast = showToast;
window.formatDate = formatDate;
window.getDomainLabel = getDomainLabel;
window.getDomainColorClasses = getDomainColorClasses;