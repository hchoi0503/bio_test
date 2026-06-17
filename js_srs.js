/**
 * js_srs.js
 * Lightweight Spaced Repetition / Review Priority System
 * 
 * Since full SRS scheduling was deemed not necessary for a 2-person app,
 * this module provides a practical "smart review" system based on:
 * - Miss count
 * - Accuracy
 * - Mastery status
 * - Simple recency weighting
 */

// ============================================
// Review Priority Calculation
// ============================================

/**
 * Calculate review priority score for a question (higher = more important to review)
 * @param {Object} question 
 * @returns {number} priority score
 */
function calculateReviewPriority(question) {
    const prog = window.userProgress[question.id] || {};
    
    let score = 0;

    // Base priority from misses (most important signal)
    score += (prog.miss_count || 0) * 10;

    // Lower accuracy = higher priority
    if (prog.seen > 0) {
        const accuracy = (prog.correct_streak / prog.seen) * 100;
        score += (100 - accuracy) * 0.5;
    } else {
        // Never seen = some priority (new material)
        score += 5;
    }

    // Mastered questions get heavily reduced priority
    if (prog.mastered) {
        score *= 0.1;
    }

    // Recency penalty (simple): questions reviewed recently get slightly lower priority
    if (prog.last_reviewed) {
        const lastReviewed = new Date(prog.last_reviewed);
        const daysSince = (Date.now() - lastReviewed.getTime()) / (1000 * 60 * 60 * 24);
        
        // Reduce priority if reviewed in last 2 days
        if (daysSince < 2) {
            score *= 0.6;
        }
    }

    // Boost flagged questions
    if (prog.flagged) {
        score += 15;
    }

    return Math.max(0, Math.round(score));
}

/**
 * Get questions sorted by review priority (highest first)
 * @param {number} limit 
 * @returns {Array}
 */
function getDueQuestions(limit = 10) {
    if (!window.questions) return [];

    const scored = window.questions.map(q => ({
        ...q,
        reviewScore: calculateReviewPriority(q)
    }));

    return scored
        .filter(q => q.reviewScore > 0) // Only questions worth reviewing
        .sort((a, b) => b.reviewScore - a.reviewScore)
        .slice(0, limit);
}

/**
 * Get a smart mix for "Review Session"
 * (Mix of weak + flagged + some in-progress)
 */
function getSmartReviewSet(count = 8) {
    const weak = getDueQuestions(Math.ceil(count * 0.6));
    const flagged = getFlaggedQuestions().slice(0, Math.ceil(count * 0.3));
    
    // Combine and deduplicate
    const combined = [...weak, ...flagged];
    const unique = [];
    const seenIds = new Set();

    for (const q of combined) {
        if (!seenIds.has(q.id)) {
            seenIds.add(q.id);
            unique.push(q);
        }
    }

    // Fill remaining slots with random non-mastered if needed
    if (unique.length < count) {
        const nonMastered = window.questions.filter(q => {
            const prog = window.userProgress[q.id] || {};
            return !prog.mastered && !seenIds.has(q.id);
        });
        
        const shuffled = shuffleArray(nonMastered);
        unique.push(...shuffled.slice(0, count - unique.length));
    }

    return unique.slice(0, count);
}

/**
 * Mark a question as reviewed (updates last_reviewed timestamp)
 */
function markQuestionReviewed(questionId) {
    if (!window.userProgress[questionId]) {
        window.userProgress[questionId] = {};
    }
    
    window.userProgress[questionId].last_reviewed = new Date().toISOString();
    saveUserProgress();
}

// ============================================
// Optional: Start Review Session
// ============================================

/**
 * Start a smart review session using the SRS logic
 */
function startSmartReviewSession() {
    const reviewSet = getSmartReviewSet(8);
    
    if (reviewSet.length === 0) {
        if (typeof showToast === 'function') {
            showToast('No questions need review right now!', 'success');
        }
        return;
    }

    // Use the quiz engine
    if (typeof showSection === 'function') {
        showSection('quiz');
    }

    // Temporarily override currentQuiz
    window.currentQuiz = reviewSet; // Note: this uses the global from js_quiz.js
    window.currentQuizIndex = 0;
    window.currentQuizScore = 0;

    const setup = document.getElementById('quiz-setup');
    const active = document.getElementById('quiz-active');

    if (setup) setup.classList.add('hidden');
    if (active) active.classList.remove('hidden');

    // Show first question (reusing logic from js_quiz.js)
    if (typeof showQuizQuestion === 'function') {
        showQuizQuestion();
    } else {
        alert('Quiz system not ready. Please implement full js_quiz.js integration.');
    }
}

// Make functions globally available
window.calculateReviewPriority = calculateReviewPriority;
window.getDueQuestions = getDueQuestions;
window.getSmartReviewSet = getSmartReviewSet;
window.markQuestionReviewed = markQuestionReviewed;
window.startSmartReviewSession = startSmartReviewSession;