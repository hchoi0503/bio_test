/**
 * js_data.js
 * Data layer for NCCAOM Biomed Mastery App
 * - Loads questions.json
 * - Manages user progress (localStorage)
 * - Handles import of updated question banks
 */

// Global state (accessible from other files)
window.questions = [];
window.userProgress = {};

/**
 * Load questions from questions.json
 */
async function loadQuestions() {
    try {
        // Always fetch the latest questions.json (bypass browser cache)
        const response = await fetch('questions.json', { 
            cache: 'no-store' 
        });
        
        if (!response.ok) throw new Error('Failed to load questions.json');
        
        const data = await response.json();
        window.questions = data;
        
        console.log(`[Data] Loaded ${window.questions.length} questions from questions.json (fresh)`);
        return window.questions;
    } catch (error) {
        console.error('[Data] Error loading questions:', error);
        // Fallback: show error to user
        if (typeof showToast === 'function') {
            showToast('Failed to load question bank. Please refresh.', 'error');
        }
        return [];
    }
}

/**
 * Load user progress from localStorage
 */
function loadUserProgress() {
    const saved = getStorageItem('nccaomProgress', {});
    window.userProgress = saved;
    
    // Ensure every question has a progress entry
    if (window.questions.length > 0) {
        window.questions.forEach(q => {
            if (!window.userProgress[q.id]) {
                window.userProgress[q.id] = {
                    seen: 0,
                    correct_streak: 0,
                    miss_count: 0,
                    mastered: false,
                    flagged: false,
                    note: '',
                    last_reviewed: null
                };
            }
        });
    }
    
    console.log('[Data] User progress loaded from localStorage');
}

/**
 * Save current user progress to localStorage
 */
function saveUserProgress() {
    setStorageItem('nccaomProgress', window.userProgress);
}

/**
 * Merge saved progress into the questions array (adds progress data to each question object)
 */
function mergeProgressIntoQuestions() {
    if (!window.questions || window.questions.length === 0) return;

    window.questions.forEach(q => {
        const progress = window.userProgress[q.id] || {
            seen: 0,
            correct_streak: 0,
            miss_count: 0,
            mastered: false,
            flagged: false,
            note: '',
            last_reviewed: null
        };
        
        // Attach progress directly to question object for easy access in UI
        q.progress = progress;
    });
}

/**
 * Update progress for a specific question
 * @param {string} questionId 
 * @param {boolean} isCorrect 
 */
function updateQuestionProgress(questionId, isCorrect) {
    if (!window.userProgress[questionId]) {
        window.userProgress[questionId] = {
            seen: 0,
            correct_streak: 0,
            miss_count: 0,
            mastered: false,
            flagged: false,
            note: '',
            last_reviewed: null
        };
    }

    const prog = window.userProgress[questionId];
    prog.seen = (prog.seen || 0) + 1;
    prog.last_reviewed = new Date().toISOString();

    if (isCorrect) {
        prog.correct_streak = (prog.correct_streak || 0) + 1;
        // Auto-master after 3 correct in a row + at least 3 attempts
        if (prog.correct_streak >= 3 && prog.seen >= 3) {
            prog.mastered = true;
        }
    } else {
        prog.miss_count = (prog.miss_count || 0) + 1;
        prog.correct_streak = 0;
        prog.mastered = false;
    }

    saveUserProgress();
}

/**
 * Import a new question bank (from GitHub or pasted JSON)
 * Preserves existing user progress, notes, and flags for matching question IDs
 * @param {Array} newQuestions 
 */
function importNewQuestionBank(newQuestions) {
    if (!Array.isArray(newQuestions) || newQuestions.length === 0) {
        if (typeof showToast === 'function') {
            showToast('Invalid question data', 'error');
        }
        return false;
    }

    const oldProgress = { ...window.userProgress };
    const oldQuestionsMap = {};
    
    // Build map of old questions by ID
    window.questions.forEach(q => {
        oldQuestionsMap[q.id] = q;
    });

    // Replace questions
    window.questions = newQuestions;

    // Merge progress
    window.userProgress = {};
    
    newQuestions.forEach(q => {
        if (oldProgress[q.id]) {
            // Keep existing progress
            window.userProgress[q.id] = oldProgress[q.id];
        } else {
            // New question - initialize defaults
            window.userProgress[q.id] = {
                seen: 0,
                correct_streak: 0,
                miss_count: 0,
                mastered: false,
                flagged: false,
                note: '',
                last_reviewed: null
            };
        }
    });

    saveUserProgress();
    mergeProgressIntoQuestions();

    console.log(`[Data] Imported new bank with ${newQuestions.length} questions. Progress preserved.`);
    
    if (typeof showToast === 'function') {
        showToast(`Imported ${newQuestions.length} questions successfully`, 'success');
    }

    return true;
}

/**
 * Get a single question by ID
 */
function getQuestionById(id) {
    return window.questions.find(q => q.id === id);
}

/**
 * Get questions filtered by domain
 */
function getQuestionsByDomain(domain) {
    if (domain === 'all') return window.questions;
    return window.questions.filter(q => q.domain === domain);
}

/**
 * Get all flagged questions
 */
function getFlaggedQuestions() {
    return window.questions.filter(q => window.userProgress[q.id]?.flagged);
}

/**
 * Get weak / struggling questions (sorted by miss count)
 */
function getWeakQuestions(limit = 6) {
    return window.questions
        .filter(q => (window.userProgress[q.id]?.miss_count || 0) > 0)
        .sort((a, b) => {
            const missA = window.userProgress[a.id]?.miss_count || 0;
            const missB = window.userProgress[b.id]?.miss_count || 0;
            return missB - missA;
        })
        .slice(0, limit);
}

/**
 * Initialize data layer (call this on app start)
 */
async function initializeData() {
    await loadQuestions();
    loadUserProgress();
    mergeProgressIntoQuestions();
    console.log('[Data] Data layer initialized');
}

// Make key functions globally available
window.initializeData = initializeData;
window.updateQuestionProgress = updateQuestionProgress;
window.importNewQuestionBank = importNewQuestionBank;
window.getQuestionById = getQuestionById;
window.getQuestionsByDomain = getQuestionsByDomain;
window.getFlaggedQuestions = getFlaggedQuestions;
window.getWeakQuestions = getWeakQuestions;
window.saveUserProgress = saveUserProgress;

/**
 * Reset ALL user progress (use with caution)
 * This clears mastered status, streaks, notes, flags, etc.
 * Also clears in-memory quiz state and forces UI refresh.
 */
function resetAllProgress() {
    if (!confirm('Are you sure you want to reset ALL progress? This cannot be undone.')) {
        return;
    }

    // 1. Clear progress object
    window.userProgress = {};

    // 2. Re-initialize default progress for all questions
    if (window.questions && window.questions.length > 0) {
        window.questions.forEach(q => {
            window.userProgress[q.id] = {
                seen: 0,
                correct_streak: 0,
                miss_count: 0,
                mastered: false,
                flagged: false,
                note: '',
                last_reviewed: null
            };
        });
    }

    // 3. Clear in-memory quiz state (if exists)
    if (typeof currentQuiz !== 'undefined') window.currentQuiz = [];
    if (typeof currentQuizIndex !== 'undefined') window.currentQuizIndex = 0;
    if (typeof currentQuizScore !== 'undefined') window.currentQuizScore = 0;
    if (typeof currentQuestionId !== 'undefined') window.currentQuestionId = null;

    // 4. Save cleared progress
    saveUserProgress();

    // 5. Re-merge progress into questions
    if (typeof mergeProgressIntoQuestions === 'function') {
        mergeProgressIntoQuestions();
    }

    // 6. Force refresh all relevant UI sections
    if (typeof renderDashboard === 'function') {
        renderDashboard();
    }
    if (typeof renderQuestionBank === 'function') {
        renderQuestionBank();
    }
    if (typeof renderAnalytics === 'function') {
        const analyticsSection = document.getElementById('analytics');
        if (analyticsSection && analyticsSection.classList.contains('active')) {
            renderAnalytics();
        }
    }

    // 7. If Quiz section is currently active, reset its UI
    const quizActive = document.getElementById('quiz-active');
    const quizResults = document.getElementById('quiz-results');
    const quizSetup = document.getElementById('quiz-setup');

    if (quizActive && !quizActive.classList.contains('hidden')) {
        quizActive.classList.add('hidden');
    }
    if (quizResults && !quizResults.classList.contains('hidden')) {
        quizResults.classList.add('hidden');
    }
    if (quizSetup) {
        quizSetup.classList.remove('hidden');
    }

    // 8. Feedback
    if (typeof showToast === 'function') {
        showToast('All progress has been reset successfully.', 'success');
    } else {
        alert('All progress has been reset.');
    }

    console.log('[Data] All progress has been fully reset.');
}

// Make reset function globally available
window.resetAllProgress = resetAllProgress;