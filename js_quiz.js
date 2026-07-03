/**
 * js_quiz.js
 * Quiz engine for NCCAOM Biomed Mastery App
 */

// Quiz state
let currentQuiz = [];
let currentQuizIndex = 0;
let currentQuizScore = 0;
let currentQuestionId = null;
let selectedQuizLength = 15;
let selectedDomainFilter = 'all';

// ============================================
// Quiz Setup Controls
// ============================================

function setQuizLength(length) {
    selectedQuizLength = length;

    // Update button styles
    document.querySelectorAll('.quiz-len-btn').forEach(btn => {
        btn.classList.remove('border-emerald-600', 'bg-emerald-900/30', 'text-emerald-300');
        btn.classList.add('border-zinc-600');

        if (parseInt(btn.dataset.len) === length) {
            btn.classList.add('border-emerald-600', 'bg-emerald-900/30', 'text-emerald-300');
            btn.classList.remove('border-zinc-600');
        }
    });
}

function setDomainFilter(domain) {
    selectedDomainFilter = domain;

    document.querySelectorAll('[id^="filter-"]').forEach(btn => {
        btn.classList.remove('border-emerald-600', 'bg-emerald-900/30', 'text-emerald-300');
        btn.classList.add('border-zinc-600');
    });

    const activeBtn = document.getElementById(`filter-${domain}`);
    if (activeBtn) {
        activeBtn.classList.add('border-emerald-600', 'bg-emerald-900/30', 'text-emerald-300');
        activeBtn.classList.remove('border-zinc-600');
    } else {
        // "All" button
        const allBtn = document.getElementById('filter-all');
        if (allBtn) allBtn.classList.add('border-emerald-600', 'bg-emerald-900/30', 'text-emerald-300');
    }
}

// ============================================
// Start Quiz
// ============================================

function startQuiz() {
    let filtered = [];

    const filter = window.selectedFilter || 'all';

    if (filter === 'all') {
        filtered = [...window.questions];
    } else if (filter === 'I' || filter === 'II') {
        filtered = getQuestionsByDomain(filter);
    } else {
        // Specific sub-section (e.g. "I.A.1", "II.B")
        filtered = window.questions.filter(q => q.subsection === filter);
    }

    if (filtered.length === 0) {
        alert('No questions available for the selected filter.');
        return;
    }

    // Shuffle and take desired amount
    filtered = shuffleArray(filtered);
    currentQuiz = filtered.slice(0, selectedQuizLength);

    currentQuizIndex = 0;
    currentQuizScore = 0;

    // Switch UI
    document.getElementById('quiz-setup').classList.add('hidden');
    document.getElementById('quiz-active').classList.remove('hidden');
    document.getElementById('quiz-results')?.classList.add('hidden');

    // Show first question
    showQuizQuestion();
}

function showQuizQuestion() {
    if (currentQuizIndex >= currentQuiz.length) {
        showQuizResults();
        return;
    }

    const q = currentQuiz[currentQuizIndex];
    currentQuestionId = q.id;

    // Update progress badge
    const progressBadge = document.getElementById('quiz-progress-badge');
    if (progressBadge) {
        progressBadge.innerHTML = `
            <span class="font-mono">${currentQuizIndex + 1}</span> / <span class="font-mono">${currentQuiz.length}</span>
            <span class="ml-2 text-emerald-400">• ${q.domain}</span>
        `;
    }

    // Update counter
    const counter = document.getElementById('quiz-counter');
    if (counter) counter.textContent = `Question ${currentQuizIndex + 1} of ${currentQuiz.length}`;

    // Question text
    const questionEl = document.getElementById('quiz-question');
    if (questionEl) questionEl.innerHTML = q.question;

    // Options
    const optionsContainer = document.getElementById('quiz-options');
    if (!optionsContainer) return;

    optionsContainer.innerHTML = '';

    q.options.forEach((optionText, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C, D

        const btn = document.createElement('button');
        btn.className = `option-btn w-full text-left px-5 py-3.5 border border-zinc-600 rounded-2xl flex items-start gap-x-3 text-sm hover:border-emerald-500`;
        
        btn.innerHTML = `
            <div class="font-mono w-6 h-6 flex-shrink-0 mt-0.5 flex items-center justify-center border border-zinc-500 rounded-xl text-xs">${letter}</div>
            <div class="flex-1 text-left">${optionText}</div>
        `;

        btn.onclick = () => selectAnswer(btn, letter, q);
        optionsContainer.appendChild(btn);
    });

    // Hide feedback
    const feedback = document.getElementById('quiz-feedback');
    if (feedback) feedback.classList.add('hidden');
}

// ============================================
// Answer Handling
// ============================================

function selectAnswer(btn, selectedLetter, question) {
    // Disable all option buttons
    const allBtns = document.querySelectorAll('#quiz-options button');
    allBtns.forEach(b => b.disabled = true);

    // Get the text of the selected option
    const selectedText = btn.querySelector('.flex-1') 
        ? btn.querySelector('.flex-1').textContent.trim() 
        : '';

    // Flexible correctness check:
    // Works if correct is a letter (A/B/C/D) OR the full answer text
    const correctVal = (question.correct || '').toString().trim();
    const isLetterCorrect = selectedLetter === correctVal;
    const isTextCorrect = selectedText === correctVal;
    const isCorrect = isLetterCorrect || isTextCorrect;

    // Highlight correct/incorrect
    allBtns.forEach(b => {
        const letterDiv = b.querySelector('.font-mono');
        if (!letterDiv) return;

        const letter = letterDiv.textContent.trim();
        const optionText = b.querySelector('.flex-1') 
            ? b.querySelector('.flex-1').textContent.trim() 
            : '';

        if (letter === correctVal || optionText === correctVal) {
            b.classList.add('correct', 'border-green-600');
        } else if ((letter === selectedLetter || optionText === selectedText) && !isCorrect) {
            b.classList.add('incorrect', 'border-red-600');
        }
    });

    // Update progress in data layer
    if (typeof updateQuestionProgress === 'function') {
        updateQuestionProgress(question.id, isCorrect);
    }

    if (isCorrect) currentQuizScore++;

    // Show feedback
    const feedback = document.getElementById('quiz-feedback');
    const content = document.getElementById('feedback-content');

    if (!feedback || !content) return;

    feedback.classList.remove('hidden');

    if (isCorrect) {
        content.innerHTML = `
            <div class="flex items-start gap-x-3">
                <i class="fa-solid fa-check-circle text-2xl text-emerald-400 mt-0.5"></i>
                <div>
                    <div class="font-semibold text-emerald-300">Correct!</div>
                    <div class="text-sm text-zinc-300 mt-1">${question.explanation}</div>
                </div>
            </div>
        `;
    } else {
        content.innerHTML = `
            <div class="flex items-start gap-x-3">
                <i class="fa-solid fa-times-circle text-2xl text-red-400 mt-0.5"></i>
                <div>
                    <div class="font-semibold text-red-300">Incorrect. The correct answer is <strong>${question.correct}</strong>.</div>
                    <div class="text-sm text-zinc-300 mt-1">${question.explanation}</div>
                </div>
            </div>
        `;
    }

    // Update next button text if last question
    const nextBtn = feedback.querySelector('button');
    if (nextBtn && currentQuizIndex === currentQuiz.length - 1) {
        nextBtn.innerHTML = `See Results <i class="fa-solid fa-arrow-right ml-2"></i>`;
    }
}

// ============================================
// Navigation
// ============================================

function nextQuestion() {
    currentQuizIndex++;

    const feedback = document.getElementById('quiz-feedback');
    if (feedback) feedback.classList.add('hidden');

    if (currentQuizIndex < currentQuiz.length) {
        showQuizQuestion();
    } else {
        showQuizResults();
    }
}

// ============================================
// Results
// ============================================

function showQuizResults() {
    const active = document.getElementById('quiz-active');
    const results = document.getElementById('quiz-results');

    if (active) active.classList.add('hidden');

    if (!results) {
        // Create results panel if it doesn't exist
        const container = document.querySelector('#quiz .max-w-2xl');
        if (container) {
            const resultsHTML = `
                <div id="quiz-results" class="bg-zinc-900 border border-zinc-700 rounded-3xl p-8 text-center">
                    <i class="fa-solid fa-trophy text-6xl text-emerald-400 mb-4"></i>
                    <h3 class="text-3xl font-semibold tracking-tight">Quiz Complete!</h3>
                    
                    <div class="my-6">
                        <div class="text-7xl font-semibold tabular-nums" id="final-score">${currentQuizScore}</div>
                        <p class="text-emerald-400">correct answers</p>
                    </div>
                    
                    <div class="max-w-xs mx-auto grid grid-cols-3 gap-4 text-sm mb-8">
                        <div class="bg-zinc-950 border border-zinc-700 rounded-2xl py-3">
                            <div class="text-xs text-zinc-400">Correct</div>
                            <div id="results-correct" class="font-mono text-2xl font-semibold text-emerald-400">${currentQuizScore}</div>
                        </div>
                        <div class="bg-zinc-950 border border-zinc-700 rounded-2xl py-3">
                            <div class="text-xs text-zinc-400">Incorrect</div>
                            <div id="results-incorrect" class="font-mono text-2xl font-semibold text-red-400">${currentQuiz.length - currentQuizScore}</div>
                        </div>
                        <div class="bg-zinc-950 border border-zinc-700 rounded-2xl py-3">
                            <div class="text-xs text-zinc-400">Accuracy</div>
                            <div id="results-accuracy" class="font-mono text-2xl font-semibold">${Math.round((currentQuizScore / currentQuiz.length) * 100)}%</div>
                        </div>
                    </div>

                    <div class="flex justify-center gap-x-3">
                        <button onclick="restartQuiz()" class="px-6 py-3 text-sm border border-zinc-600 hover:bg-zinc-800 rounded-3xl flex items-center gap-x-2">
                            <i class="fa-solid fa-redo"></i> <span>Try Again</span>
                        </button>
                        <button onclick="showSection('bank')" class="px-6 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-3xl flex items-center gap-x-2">
                            Review Questions
                        </button>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', resultsHTML);
        }
        return;
    }

    results.classList.remove('hidden');

    // Fill in results
    document.getElementById('final-score').textContent = currentQuizScore;
    document.getElementById('results-correct').textContent = currentQuizScore;
    document.getElementById('results-incorrect').textContent = currentQuiz.length - currentQuizScore;
    document.getElementById('results-accuracy').textContent = Math.round((currentQuizScore / currentQuiz.length) * 100) + '%';
}

function restartQuiz() {
    // Reset and go back to setup
    const results = document.getElementById('quiz-results');
    const active = document.getElementById('quiz-active');
    const setup = document.getElementById('quiz-setup');

    if (results) results.classList.add('hidden');
    if (active) active.classList.add('hidden');
    if (setup) setup.classList.remove('hidden');

    // Re-render dashboard in case progress changed
    if (typeof renderDashboard === 'function') {
        renderDashboard();
    }
}

// ============================================
// Single Question Practice
// ============================================

function startSingleQuestionQuiz(questionId) {
    const q = getQuestionById(questionId);
    if (!q) return;

    currentQuiz = [q];
    currentQuizIndex = 0;
    currentQuizScore = 0;

    // Hide setup, show active quiz
    const setup = document.getElementById('quiz-setup');
    const active = document.getElementById('quiz-active');
    const results = document.getElementById('quiz-results');

    if (setup) setup.classList.add('hidden');
    if (active) active.classList.remove('hidden');
    if (results) results.classList.add('hidden');

    showQuizQuestion();
}

// Make functions available globally
window.setQuizLength = setQuizLength;
window.setDomainFilter = setDomainFilter;
window.startQuiz = startQuiz;
window.startSingleQuestionQuiz = startSingleQuestionQuiz;
window.nextQuestion = nextQuestion;