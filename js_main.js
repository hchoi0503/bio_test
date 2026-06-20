/**
 * js_main.js
 * Main application controller for NCCAOM Biomed Mastery App
 * - App initialization
 * - Navigation between sections
 * - Dashboard rendering
 * - Question Bank rendering + search
 * - Modals (Question Detail + Import)
 */

// ============================================
// Section Navigation
// ============================================

function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.classList.add('hidden');
    });

    // Show target section
    const target = document.getElementById(sectionName);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    // Update nav button active states
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active', 'border-emerald-600', 'bg-emerald-900/30', 'text-emerald-300');
        btn.classList.add('border-zinc-700');
        
        if (btn.id === `nav-${sectionName}`) {
            btn.classList.add('active', 'border-emerald-600', 'bg-emerald-900/30', 'text-emerald-300');
            btn.classList.remove('border-zinc-700');
        }
    });

    // Special actions per section
    if (sectionName === 'dashboard') {
        renderDashboard();
    }
    
    if (sectionName === 'bank') {
        renderQuestionBank();
    }
}

// ============================================
// Dashboard Rendering
// ============================================

function renderDashboard() {
    if (!window.questions || window.questions.length === 0) return;

    let mastered = 0;
    let totalSeen = 0;
    let totalCorrect = 0;
    let dom1Seen = 0, dom1Correct = 0;
    let dom2Seen = 0, dom2Correct = 0;

    window.questions.forEach(q => {
        const prog = window.userProgress[q.id] || {};
        if (prog.mastered) mastered++;
        totalSeen += (prog.seen || 0);
        totalCorrect += (prog.correct_streak || 0);

        if (q.domain === 'I') {
            dom1Seen += (prog.seen || 0);
            dom1Correct += (prog.correct_streak || 0);
        } else {
            dom2Seen += (prog.seen || 0);
            dom2Correct += (prog.correct_streak || 0);
        }
    });

    const accuracy = totalSeen > 0 ? Math.round((totalCorrect / totalSeen) * 100) : 0;
    const dom1Acc = dom1Seen > 0 ? Math.round((dom1Correct / dom1Seen) * 100) : 0;
    const dom2Acc = dom2Seen > 0 ? Math.round((dom2Correct / dom2Seen) * 100) : 0;

    // Update DOM elements
    const masteredEl = document.getElementById('dash-mastered');
    const accuracyEl = document.getElementById('dash-accuracy');
    const attemptsEl = document.getElementById('dash-attempts');
    const headerMastered = document.getElementById('header-mastered');

    if (masteredEl) masteredEl.textContent = mastered;
    if (accuracyEl) accuracyEl.textContent = accuracy;
    if (attemptsEl) attemptsEl.textContent = `${totalSeen} attempts`;
    if (headerMastered) headerMastered.textContent = `${mastered}/${window.questions ? window.questions.length : 0}`;

    // Progress bar
    const progressBar = document.getElementById('mastered-progress-bar');
    if (progressBar) {
        progressBar.style.width = `${(mastered / window.questions.length) * 100}%`;
    }

    // Domain accuracy
    const dom1AccEl = document.getElementById('dash-dom1-acc');
    const dom1Bar = document.getElementById('dash-dom1-bar');
    const dom2AccEl = document.getElementById('dash-dom2-acc');
    const dom2Bar = document.getElementById('dash-dom2-bar');

    if (dom1AccEl) dom1AccEl.textContent = dom1Acc + '%';
    if (dom1Bar) dom1Bar.style.width = dom1Acc + '%';
    if (dom2AccEl) dom2AccEl.textContent = dom2Acc + '%';
    if (dom2Bar) dom2Bar.style.width = dom2Acc + '%';

    // Weak areas
    renderWeakAreas();
}

function renderWeakAreas() {
    const container = document.getElementById('weak-areas-list');
    if (!container) return;

    container.innerHTML = '';

    const weak = getWeakQuestions(5);

    if (weak.length === 0) {
        container.innerHTML = `
            <div class="flex items-center gap-x-2 text-emerald-400 text-sm py-2">
                <i class="fa-solid fa-check-circle"></i>
                <span>Great job! No weak areas detected yet.</span>
            </div>
        `;
        return;
    }

    weak.forEach(q => {
        const prog = window.userProgress[q.id] || {};
        const div = document.createElement('div');
        div.className = `flex justify-between items-center px-3 py-2 rounded-xl hover:bg-zinc-800 cursor-pointer text-sm border border-zinc-800`;
        div.innerHTML = `
            <div class="flex items-center gap-x-3">
                <span class="font-mono text-[10px] px-1.5 py-px bg-red-900/60 text-red-400 rounded">${q.id}</span>
                <span class="truncate max-w-[220px]">${q.topic.split(' - ')[0]}</span>
            </div>
            <span class="text-red-400 text-xs font-mono">${prog.miss_count || 0} misses</span>
        `;
        
        div.onclick = () => showQuestionDetail(q);
        container.appendChild(div);
    });
}

// ============================================
// Question Bank Rendering
// ============================================

function renderQuestionBank(filteredQuestions = null) {
    const container = document.getElementById('question-bank-grid');
    if (!container) return;

    container.innerHTML = '';

    const toShow = filteredQuestions || window.questions || [];

    if (toShow.length === 0) {
        container.innerHTML = `<div class="col-span-2 text-center py-8 text-zinc-400">No questions found.</div>`;
        return;
    }

    toShow.forEach(q => {
        const prog = window.userProgress[q.id] || {};
        const accuracy = prog.seen > 0 ? calculateAccuracy(prog.seen, prog.correct_streak) : null;

        const card = document.createElement('div');
        card.className = `question-card bg-zinc-900 border border-zinc-700 hover:border-zinc-500 rounded-3xl p-5 cursor-pointer flex flex-col`;
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-x-2">
                    <span class="font-mono text-xs px-2 py-px rounded-xl ${q.domain === 'I' ? 'domain-i' : 'domain-ii'}">${q.id}</span>
                    <span class="text-xs px-2 py-px rounded-xl bg-zinc-800 text-zinc-400">${q.difficulty}</span>
                    ${prog.mastered ? `<span class="mastered-badge text-[9px]">MASTERED</span>` : ''}
                    ${prog.flagged ? `<i class="fa-solid fa-flag text-red-400 ml-1"></i>` : ''}
                </div>
                ${accuracy !== null ? `<span class="text-xs font-mono ${getAccuracyColor(accuracy)}">${accuracy}%</span>` : ''}
            </div>
            
            <div class="font-medium text-sm mb-4 leading-snug flex-1">${q.question.length > 140 ? q.question.substring(0, 137) + '...' : q.question}</div>
            
            <div class="flex items-center justify-between text-xs mt-auto">
                <span class="topic-tag">${q.topic.split('(')[0].trim().substring(0, 32)}</span>
                <div onclick="event.stopImmediatePropagation(); startSingleQuestionPractice('${q.id}');" 
                     class="flex items-center gap-x-1 text-emerald-400 hover:text-emerald-300 font-medium">
                    <i class="fa-solid fa-play text-xs"></i>
                    <span class="text-[10px]">PRACTICE</span>
                </div>
            </div>
        `;

        card.onclick = () => showQuestionDetail(q);
        container.appendChild(card);
    });
}

function filterQuestionBank() {
    const searchInput = document.getElementById('bank-search');
    if (!searchInput) return;

    const term = searchInput.value.toLowerCase().trim();
    
    if (!term) {
        renderQuestionBank();
        return;
    }

    const filtered = window.questions.filter(q => 
        q.question.toLowerCase().includes(term) ||
        q.topic.toLowerCase().includes(term) ||
        q.id.toLowerCase().includes(term) ||
        (q.explanation && q.explanation.toLowerCase().includes(term))
    );

    renderQuestionBank(filtered);
}

// ============================================
// Question Detail Modal
// ============================================

function showQuestionDetail(q) {
    const modal = document.getElementById('question-modal');
    const contentContainer = modal.querySelector('div[onclick*="stopImmediatePropagation"]');
    
    if (!contentContainer) return;

    const prog = window.userProgress[q.id] || {};

    contentContainer.innerHTML = `
        <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-x-3">
                <span class="font-mono px-3 py-1 text-xs rounded-2xl ${q.domain === 'I' ? 'domain-i' : 'domain-ii'}">${q.id}</span>
                <span class="text-xs px-2.5 py-1 bg-zinc-800 rounded-2xl">${q.difficulty}</span>
                ${prog.mastered ? `<span class="mastered-badge">MASTERED</span>` : ''}
            </div>
            <button onclick="closeQuestionModal()" class="text-2xl leading-none text-zinc-400 hover:text-white">×</button>
        </div>

        <div class="font-semibold text-lg leading-tight mb-5">${q.question}</div>

        <div class="space-y-2 mb-6">
            ${q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isCorrect = letter === q.correct;
                return `
                    <div class="px-4 py-3 border ${isCorrect ? 'border-emerald-600 bg-emerald-900/20' : 'border-zinc-700'} rounded-2xl flex gap-x-3 text-sm">
                        <div class="font-mono w-5 mt-0.5">${letter}.</div>
                        <div class="flex-1">${opt}</div>
                        ${isCorrect ? '<i class="fa-solid fa-check text-emerald-400 mt-1"></i>' : ''}
                    </div>
                `;
            }).join('')}
        </div>

        <div class="bg-zinc-950 border border-zinc-700 p-5 rounded-2xl mb-5">
            <div class="uppercase text-emerald-400 text-xs tracking-widest mb-1">Explanation</div>
            <div class="text-sm text-zinc-200">${q.explanation}</div>
        </div>

        <!-- Notes -->
        <div class="mb-5">
            <div class="text-xs uppercase tracking-widest text-zinc-400 mb-1.5 flex items-center gap-x-2">
                <i class="fa-solid fa-sticky-note"></i> 
                <span>Your Notes</span>
            </div>
            <textarea id="modal-note-textarea" 
                      class="w-full bg-zinc-950 border border-zinc-700 focus:border-emerald-600 rounded-2xl p-3 text-sm min-h-[80px]"
                      placeholder="Add your notes, mnemonics or clinical pearls...">${prog.note || ''}</textarea>
        </div>

        <div class="flex items-center justify-between text-xs">
            <div class="flex gap-x-2">
                <button onclick="toggleFlag('${q.id}', this)" class="px-4 py-2 border border-zinc-600 rounded-2xl flex items-center gap-x-2 text-xs hover:bg-zinc-800">
                    <i class="fa-solid fa-flag ${prog.flagged ? 'text-red-400' : ''}"></i>
                    <span>${prog.flagged ? 'Unflag' : 'Flag'}</span>
                </button>
            </div>
            
            <button onclick="startSingleQuestionPractice('${q.id}'); closeQuestionModal();" 
                    class="px-5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-2xl flex items-center gap-x-2">
                <i class="fa-solid fa-play"></i>
                <span>Practice this question</span>
            </button>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Auto-save notes on input
    const textarea = document.getElementById('modal-note-textarea');
    if (textarea) {
        textarea.oninput = () => {
            if (!window.userProgress[q.id]) window.userProgress[q.id] = {};
            window.userProgress[q.id].note = textarea.value.trim();
            saveUserProgress();
        };
    }
}

function closeQuestionModal() {
    const modal = document.getElementById('question-modal');
    modal.classList.remove('flex');
    modal.classList.add('hidden');
}

function toggleFlag(questionId, btn) {
    if (!window.userProgress[questionId]) {
        window.userProgress[questionId] = {};
    }
    
    window.userProgress[questionId].flagged = !window.userProgress[questionId].flagged;
    saveUserProgress();

    // Update button appearance
    const icon = btn.querySelector('i');
    const span = btn.querySelector('span');
    
    if (window.userProgress[questionId].flagged) {
        icon.classList.add('text-red-400');
        span.textContent = 'Unflag';
    } else {
        icon.classList.remove('text-red-400');
        span.textContent = 'Flag';
    }

    // Refresh bank if visible
    const bankSection = document.getElementById('bank');
    if (bankSection && bankSection.classList.contains('active')) {
        renderQuestionBank();
    }
}

// ============================================
// Import functionality removed (user updates questions.json directly on GitHub)

// ============================================
// Quick Quiz Helpers
// ============================================

function startQuickQuiz(length) {
    // These functions will be defined in js_quiz.js
    if (typeof setQuizLength === 'function') setQuizLength(length);
    if (typeof setDomainFilter === 'function') setDomainFilter('all');
    
    showSection('quiz');
    
    // Auto-start after short delay
    setTimeout(() => {
        if (typeof startQuiz === 'function') startQuiz();
    }, 150);
}

function startSingleQuestionPractice(questionId) {
    const q = getQuestionById(questionId);
    if (!q) return;

    showSection('quiz');
    
    // These will be implemented in js_quiz.js
    if (typeof startSingleQuestionQuiz === 'function') {
        startSingleQuestionQuiz(questionId);
    } else {
        // Fallback: show message
        alert('Quiz module not fully loaded yet. Please implement js_quiz.js');
    }
}

// ============================================
// App Initialization
// ============================================

async function initializeApp() {
    console.log('%c[NCCAOM Mastery App] Initializing...', 'color:#0ea47a');

    // Initialize data layer first
    if (typeof initializeData === 'function') {
        await initializeData();
    }

    // === PWA / Offline Support (TEMPORARILY DISABLED) ===
    // We unregister any existing service worker to avoid caching issues during development.
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                registration.unregister();
                console.log('[PWA] Service Worker unregistered for development');
            }
        });
    }

    // Uncomment the registration block below when we are ready for the final version.
    /*
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                    console.log('[PWA] Service Worker registered successfully');
                })
                .catch(error => {
                    console.log('[PWA] Service Worker registration failed:', error);
                });
        });
    }
    */

    // Initial render
    renderDashboard();
    renderQuestionBank();

    // Set initial nav active state
    const dashboardNav = document.getElementById('nav-dashboard');
    if (dashboardNav) {
        dashboardNav.classList.add('active', 'border-emerald-600', 'bg-emerald-900/30', 'text-emerald-300');
    }

    // Wire up search with debounce
    const searchInput = document.getElementById('bank-search');
    if (searchInput && typeof debounce === 'function') {
        searchInput.onkeyup = debounce(filterQuestionBank, 250);
    }

    // Keyboard support (Escape to close modals)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const questionModal = document.getElementById('question-modal');
            const importModal = document.getElementById('import-modal');
            
            if (!questionModal.classList.contains('hidden')) {
                closeQuestionModal();
            } else if (!importModal.classList.contains('hidden')) {
                closeImportModal();
            }
        }
    });

    console.log('%c[NCCAOM Mastery App] Ready!', 'color:#0ea47a');
}

// Boot the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}