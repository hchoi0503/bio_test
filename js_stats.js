/**
 * js_stats.js
 * Analytics and statistics for NCCAOM Biomed Mastery App
 */

// ============================================
// Core Stats Calculations
// ============================================

/**
 * Calculate overall statistics
 */
function calculateOverallStats() {
    if (!window.questions || window.questions.length === 0) {
        return {
            total: 0,
            mastered: 0,
            totalSeen: 0,
            totalCorrect: 0,
            accuracy: 0,
            flagged: 0
        };
    }

    let mastered = 0;
    let totalSeen = 0;
    let totalCorrect = 0;
    let flagged = 0;

    window.questions.forEach(q => {
        const prog = window.userProgress[q.id] || {};
        if (prog.mastered) mastered++;
        totalSeen += (prog.seen || 0);
        totalCorrect += (prog.correct_streak || 0);
        if (prog.flagged) flagged++;
    });

    const accuracy = totalSeen > 0 ? Math.round((totalCorrect / totalSeen) * 100) : 0;

    return {
        total: window.questions.length,
        mastered,
        totalSeen,
        totalCorrect,
        accuracy,
        flagged
    };
}

/**
 * Calculate stats broken down by domain
 */
function calculateDomainStats() {
    const stats = {
        I: { total: 0, mastered: 0, seen: 0, correct: 0, accuracy: 0 },
        II: { total: 0, mastered: 0, seen: 0, correct: 0, accuracy: 0 }
    };

    if (!window.questions) return stats;

    window.questions.forEach(q => {
        const prog = window.userProgress[q.id] || {};
        const domain = q.domain;

        if (!stats[domain]) return;

        stats[domain].total++;
        if (prog.mastered) stats[domain].mastered++;
        stats[domain].seen += (prog.seen || 0);
        stats[domain].correct += (prog.correct_streak || 0);
    });

    // Calculate accuracy per domain
    ['I', 'II'].forEach(domain => {
        const d = stats[domain];
        d.accuracy = d.seen > 0 ? Math.round((d.correct / d.seen) * 100) : 0;
    });

    return stats;
}

/**
 * Get most missed / struggling questions
 */
function getMostMissedQuestions(limit = 8) {
    if (!window.questions) return [];

    return window.questions
        .map(q => {
            const prog = window.userProgress[q.id] || {};
            return {
                ...q,
                missCount: prog.miss_count || 0,
                accuracy: prog.seen > 0 ? Math.round((prog.correct_streak / prog.seen) * 100) : 0
            };
        })
        .filter(q => q.missCount > 0)
        .sort((a, b) => b.missCount - a.missCount)
        .slice(0, limit);
}

/**
 * Get mastery distribution
 */
function getMasteryDistribution() {
    if (!window.questions) return { mastered: 0, inProgress: 0, untouched: 0 };

    let mastered = 0;
    let inProgress = 0;
    let untouched = 0;

    window.questions.forEach(q => {
        const prog = window.userProgress[q.id] || {};
        if (prog.mastered) {
            mastered++;
        } else if ((prog.seen || 0) > 0) {
            inProgress++;
        } else {
            untouched++;
        }
    });

    return { mastered, inProgress, untouched };
}

/**
 * Get stats by difficulty level
 */
function getDifficultyStats() {
    const difficulties = ['Easy', 'Medium', 'Hard'];
    const stats = {};

    difficulties.forEach(diff => {
        stats[diff] = { total: 0, mastered: 0, seen: 0, correct: 0, accuracy: 0 };
    });

    if (!window.questions) return stats;

    window.questions.forEach(q => {
        const diff = q.difficulty || 'Easy';
        const prog = window.userProgress[q.id] || {};

        if (!stats[diff]) stats[diff] = { total: 0, mastered: 0, seen: 0, correct: 0, accuracy: 0 };

        stats[diff].total++;
        if (prog.mastered) stats[diff].mastered++;
        stats[diff].seen += (prog.seen || 0);
        stats[diff].correct += (prog.correct_streak || 0);
    });

    // Calculate accuracy
    Object.keys(stats).forEach(diff => {
        const d = stats[diff];
        d.accuracy = d.seen > 0 ? Math.round((d.correct / d.seen) * 100) : 0;
    });

    return stats;
}

// ============================================
// Render Analytics Section
// ============================================

function renderAnalytics() {
    const container = document.getElementById('analytics');
    if (!container) return;

    const overall = calculateOverallStats();
    const domainStats = calculateDomainStats();
    const mostMissed = getMostMissedQuestions(6);
    const masteryDist = getMasteryDistribution();
    const diffStats = getDifficultyStats();

    container.innerHTML = `
        <div class="mb-6">
            <h2 class="text-2xl font-semibold tracking-tight">Analytics</h2>
            <p class="text-sm text-zinc-400">Deeper insights into your study performance</p>
        </div>

        <!-- Overview Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div class="bg-zinc-900 border border-zinc-700 rounded-3xl p-5">
                <div class="text-xs text-zinc-400">Total Questions</div>
                <div class="text-4xl font-semibold mt-2">${overall.total}</div>
            </div>
            <div class="bg-zinc-900 border border-zinc-700 rounded-3xl p-5">
                <div class="text-xs text-zinc-400">Mastered</div>
                <div class="text-4xl font-semibold mt-2 text-emerald-400">${overall.mastered}</div>
                <div class="text-xs text-emerald-400 mt-1">${Math.round((overall.mastered / overall.total) * 100)}% complete</div>
            </div>
            <div class="bg-zinc-900 border border-zinc-700 rounded-3xl p-5">
                <div class="text-xs text-zinc-400">Overall Accuracy</div>
                <div class="text-4xl font-semibold mt-2">${overall.accuracy}<span class="text-xl text-zinc-400">%</span></div>
                <div class="text-xs text-zinc-400 mt-1">${overall.totalSeen} attempts</div>
            </div>
            <div class="bg-zinc-900 border border-zinc-700 rounded-3xl p-5">
                <div class="text-xs text-zinc-400">Flagged for Review</div>
                <div class="text-4xl font-semibold mt-2 text-red-400">${overall.flagged}</div>
            </div>
        </div>

        <!-- Domain Breakdown -->
        <div class="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 mb-6">
            <h3 class="font-semibold mb-4">Performance by Domain</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${['I', 'II'].map(domain => {
                    const d = domainStats[domain];
                    return `
                        <div>
                            <div class="flex justify-between text-sm mb-2">
                                <span class="${domain === 'I' ? 'text-blue-300' : 'text-amber-300'} font-medium">Domain ${domain} (${domain === 'I' ? '80%' : '20%'})</span>
                                <span class="font-mono">${d.accuracy}%</span>
                            </div>
                            <div class="h-2 bg-zinc-800 rounded-full overflow-hidden mb-3">
                                <div class="h-2 ${domain === 'I' ? 'bg-blue-500' : 'bg-amber-500'} rounded-full transition-all" style="width: ${d.accuracy}%"></div>
                            </div>
                            <div class="text-xs text-zinc-400 flex justify-between">
                                <span>${d.mastered} / ${d.total} mastered</span>
                                <span>${d.seen} attempts</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- Most Missed Questions -->
        <div class="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 mb-6">
            <h3 class="font-semibold mb-4 flex items-center gap-x-2">
                <i class="fa-solid fa-exclamation-triangle text-red-400"></i>
                <span>Most Missed Questions</span>
            </h3>
            
            ${mostMissed.length > 0 ? `
                <div class="space-y-2">
                    ${mostMissed.map(q => `
                        <div onclick="showQuestionDetail(getQuestionById('${q.id}'))" 
                             class="flex justify-between items-center px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-red-600/50 cursor-pointer text-sm">
                            <div class="flex items-center gap-x-3">
                                <span class="font-mono text-xs px-2 py-px bg-red-900/60 text-red-400 rounded">${q.id}</span>
                                <span class="truncate max-w-[280px]">${q.topic}</span>
                            </div>
                            <div class="text-right text-xs">
                                <div class="text-red-400 font-mono">${q.missCount} misses</div>
                                <div class="text-zinc-400">${q.accuracy}% accuracy</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : `
                <div class="text-emerald-400 text-sm flex items-center gap-x-2 py-2">
                    <i class="fa-solid fa-check-circle"></i>
                    <span>No missed questions yet. Great work!</span>
                </div>
            `}
        </div>

        <!-- Mastery Distribution -->
        <div class="bg-zinc-900 border border-zinc-700 rounded-3xl p-6">
            <h3 class="font-semibold mb-4">Mastery Distribution</h3>
            <div class="grid grid-cols-3 gap-4 text-center">
                <div class="bg-zinc-950 border border-zinc-700 rounded-2xl p-4">
                    <div class="text-emerald-400 text-3xl font-semibold">${masteryDist.mastered}</div>
                    <div class="text-xs text-zinc-400 mt-1">Mastered</div>
                </div>
                <div class="bg-zinc-950 border border-zinc-700 rounded-2xl p-4">
                    <div class="text-amber-400 text-3xl font-semibold">${masteryDist.inProgress}</div>
                    <div class="text-xs text-zinc-400 mt-1">In Progress</div>
                </div>
                <div class="bg-zinc-950 border border-zinc-700 rounded-2xl p-4">
                    <div class="text-zinc-400 text-3xl font-semibold">${masteryDist.untouched}</div>
                    <div class="text-xs text-zinc-400 mt-1">Not Started</div>
                </div>
            </div>
        </div>
    `;
}

// Make functions globally available
window.calculateOverallStats = calculateOverallStats;
window.calculateDomainStats = calculateDomainStats;
window.getMostMissedQuestions = getMostMissedQuestions;
window.getMasteryDistribution = getMasteryDistribution;
window.renderAnalytics = renderAnalytics;