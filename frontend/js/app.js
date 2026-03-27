// Configuration
const API_BASE = 'http://localhost:5000/api';
let currentUser = JSON.parse(localStorage.getItem('user')) || null;
let currentToken = localStorage.getItem('token') || null;

// UI State
let activePage = 'page-login';
let currentQuiz = {
    questions: [],
    currentIndex: 0,
    score: 0,
    isPremium: false,
    timer: null,
    timeLeft: 15
};

// --- Page Routing ---
function showPage(pageId) {
    document.querySelectorAll('#app-container > div').forEach(page => {
        page.classList.add('hidden');
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        activePage = pageId;
    }
}

// Check initial state
window.onload = () => {
    if (currentUser && currentToken) {
        showDashboard();
    } else {
        showPage('page-login');
    }
};

// --- Auth Handling ---
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        username: document.getElementById('reg-username').value,
        mobile: document.getElementById('reg-mobile').value,
        age: document.getElementById('reg-age').value,
        className: document.getElementById('reg-class').value,
        examPrep: document.getElementById('reg-exam').value,
        board: document.getElementById('reg-board').value,
        medium: document.getElementById('reg-medium').value
    };

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) {
            localStorage.setItem('user', JSON.stringify(result));
            localStorage.setItem('token', result.token);
            currentUser = result;
            currentToken = result.token;
            alert('Registration Successful! You received 100 coins.');
            showDashboard();
        } else {
            alert(result.message);
        }
    } catch (err) {
        console.error(err);
        alert('Server connection failed');
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const mobile = document.getElementById('login-mobile').value;

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mobile })
        });
        const result = await res.json();
        if (res.ok) {
            localStorage.setItem('user', JSON.stringify(result));
            localStorage.setItem('token', result.token);
            currentUser = result;
            currentToken = result.token;
            showDashboard();
        } else {
            alert(result.message);
        }
    } catch (err) {
        console.error(err);
        alert('Server error');
    }
});

function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    currentUser = null;
    currentToken = null;
    showPage('page-login');
}

// Toggle Conditional Fields
document.getElementById('reg-class').addEventListener('change', (e) => {
    const val = e.target.value;
    const condFields = document.getElementById('conditional-fields');
    if (['9','10','11','12'].includes(val)) {
        condFields.classList.remove('hidden');
    } else {
        condFields.classList.add('hidden');
    }
});

// --- Dashboard Logic ---
async function showDashboard() {
    showPage('page-dashboard');
    document.getElementById('dash-greeting').innerText = `Hi, ${currentUser.username}! 👋`;
    
    // Fetch stats
    try {
        const res = await fetch(`${API_BASE}/quizzes/stats`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const stats = await res.json();
        if (res.ok) {
            document.getElementById('dash-coins').innerHTML = `<i class="fa-solid fa-coins"></i> ${stats.coins}`;
            document.getElementById('stat-attempts').innerText = stats.attempts;
            document.getElementById('stat-accuracy').innerText = `${stats.avgAccuracy}%`;
        }
    } catch (err) { console.error(err); }

    // Fetch recommendations
    try {
        const res = await fetch(`${API_BASE}/quizzes/recommend`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const recommendations = await res.json();
        if (res.ok) {
            const container = document.getElementById('recommendations-container');
            container.innerHTML = '';
            recommendations.forEach(rec => {
                const div = document.createElement('div');
                div.className = 'card';
                div.style.padding = '15px';
                div.style.background = 'var(--glass)';
                div.style.marginBottom = '10px';
                div.innerHTML = `<p>${rec.title}</p>`;
                div.onclick = () => startQuiz(rec.category, false);
                container.appendChild(div);
            });
        }
    } catch (err) { console.error(err); }
}

// --- Quiz Logic ---
document.getElementById('btn-daily-quiz').onclick = () => startQuiz(currentUser.examPrep || 'General', false);
document.getElementById('btn-premium-quiz').onclick = () => startQuiz(currentUser.examPrep || 'General', true);

async function startQuiz(category, isPremium) {
    if (isPremium) {
        // Simple client gate check
        const coinsStr = document.getElementById('dash-coins').innerText;
        const currentCoins = parseInt(coinsStr.replace(/[^\d]/g, ''));
        if (currentCoins < 5) {
            return alert('Not enough coins for a premium quiz!');
        }
    }

    // Fetch questions
    try {
        const res = await fetch(`${API_BASE}/questions/fetch?category=${category}&limit=5`, {
            headers: { 'Authorization': `Bearer ${currentToken}` }
        });
        const questions = await res.json();
        if (res.ok && questions.length > 0) {
            currentQuiz = {
                questions,
                currentIndex: 0,
                score: 0,
                isPremium,
                timeLeft: 15
            };
            showPage('page-quiz');
            loadQuestion();
        } else {
            alert('No questions available yet. Admins are adding more!');
        }
    } catch (err) {
        console.error(err);
        alert('Failed to load quiz');
    }
}

function loadQuestion() {
    if (currentQuiz.currentIndex >= currentQuiz.questions.length) {
        return submitQuiz();
    }

    const q = currentQuiz.questions[currentQuiz.currentIndex];
    document.getElementById('question-text').innerText = q.questionText;
    document.getElementById('quiz-category-label').innerText = `${q.category} Quiz`;
    document.getElementById('q-counter').innerText = `Question ${currentQuiz.currentIndex + 1} of ${currentQuiz.questions.length}`;
    
    // Update progress bar
    const progress = ((currentQuiz.currentIndex + 1) / currentQuiz.questions.length) * 100;
    document.getElementById('quiz-progress').style.width = `${progress}%`;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => selectOption(index, btn);
        optionsContainer.appendChild(btn);
    });

    startTimer();
}

function startTimer() {
    clearInterval(currentQuiz.timer);
    currentQuiz.timeLeft = 15;
    document.getElementById('time-left').innerText = currentQuiz.timeLeft;
    
    currentQuiz.timer = setInterval(() => {
        currentQuiz.timeLeft--;
        document.getElementById('time-left').innerText = currentQuiz.timeLeft;
        if (currentQuiz.timeLeft <= 0) {
            clearInterval(currentQuiz.timer);
            nextQuestion();
        }
    }, 1000);
}

function selectOption(index, btn) {
    clearInterval(currentQuiz.timer);
    const correctIndex = currentQuiz.questions[currentQuiz.currentIndex].correctOption;
    
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(b => b.style.pointerEvents = 'none');

    if (index === correctIndex) {
        btn.classList.add('correct');
        currentQuiz.score++;
    } else {
        btn.classList.add('wrong');
        btns[correctIndex].classList.add('correct');
    }

    setTimeout(nextQuestion, 1500); // Wait 1.5s before next
}

function nextQuestion() {
    currentQuiz.currentIndex++;
    loadQuestion();
}

async function submitQuiz() {
    clearInterval(currentQuiz.timer);
    
    const coinsEarned = currentQuiz.score * 5; // 5 coins per correct answer
    const data = {
        score: currentQuiz.score,
        totalQuestions: currentQuiz.questions.length,
        coinsEarned,
        isPremium: currentQuiz.isPremium
    };

    try {
        const res = await fetch(`${API_BASE}/quizzes/submit`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (res.ok) {
            showResult(currentQuiz.score, coinsEarned, result.rank);
        } else {
            alert('Error submitting quiz');
        }
    } catch (err) {
        console.error(err);
        alert('Connection error');
    }
}

function showResult(score, coins, rank) {
    showPage('page-result');
    document.getElementById('result-score').innerText = `${score}/${currentQuiz.questions.length}`;
    document.getElementById('result-coins').innerText = `+${coins}`;
    document.getElementById('result-rank').innerText = rank;
    
    if (score > 3) {
        document.getElementById('result-title').innerText = 'Amazing! 🏆';
    } else {
        document.getElementById('result-title').innerText = 'Good Try! 📚';
    }
}

// --- Leaderboard ---
async function showLeaderboard() {
    showPage('page-leaderboard');
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '<div class="loader"></div>';
    
    try {
        const res = await fetch(`${API_BASE}/quizzes/leaderboard`);
        const leaders = await res.json();
        if (res.ok) {
            list.innerHTML = '';
            leaders.forEach((user, i) => {
                const item = document.createElement('div');
                item.className = 'mt-10';
                item.style.padding = '15px';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.borderBottom = '1px solid var(--border)';
                item.innerHTML = `
                    <span>#${i+1} ${user.username}</span>
                    <span style="color:var(--accent)"><i class="fa-solid fa-coins"></i> ${user.coins}</span>
                `;
                list.appendChild(item);
            });
        }
    } catch (err) { console.error(err); }
}

// --- Admin ---
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-user').value;
    const password = document.getElementById('admin-pass').value;

    try {
        const res = await fetch(`${API_BASE}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await res.json();
        if (result.success) {
            localStorage.setItem('adminToken', result.token);
            showAdminPanel();
        } else {
            alert('Invalid Admin Link');
        }
    } catch (err) { alert('Error'); }
});

async function showAdminPanel() {
    if (!localStorage.getItem('adminToken')) {
        return showPage('page-admin-login');
    }
    showPage('page-admin-panel');
    loadAdminUsers();
}

async function loadAdminUsers() {
    const list = document.getElementById('admin-users-list');
    list.innerHTML = '<div class="loader"></div>';

    try {
        const res = await fetch(`${API_BASE}/admin/users`);
        const users = await res.json();
        if (res.ok) {
            list.innerHTML = '';
            users.forEach(u => {
                const div = document.createElement('div');
                div.style.padding = '10px';
                div.style.marginBottom = '5px';
                div.style.background = 'var(--glass)';
                div.style.fontSize = '0.8rem';
                div.innerHTML = `<strong>${u.username}</strong> - ${u.mobile} - ${u.coins} Coins`;
                list.appendChild(div);
            });
        }
    } catch (err) { console.error(err); }
}

document.getElementById('add-question-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        category: document.getElementById('q-category').value,
        questionText: document.getElementById('q-text').value,
        options: [
            document.getElementById('q-opt1').value,
            document.getElementById('q-opt2').value,
            document.getElementById('q-opt3').value,
            document.getElementById('q-opt4').value
        ],
        correctOption: 0 // Simplification: first option is always correct for this form
    };

    try {
        const res = await fetch(`${API_BASE}/admin/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            alert('Question added!');
            e.target.reset();
        }
    } catch (err) { alert('Error adding question'); }
});

document.getElementById('btn-ai-generate').onclick = async () => {
    const category = prompt('Enter Category for AI (e.g. JEE, NEET):', 'JEE');
    const subject = prompt('Enter Subject (e.g. Physics, Math):', 'Physics');
    
    if (!category || !subject) return;

    try {
        const res = await fetch(`${API_BASE}/admin/generate-ai`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, subject })
        });
        const result = await res.json();
        alert(result.message + ' (Questions Count: ' + result.count + ')');
    } catch (err) { alert('AI logic simulation failed'); }
};

function logoutAdmin() {
    localStorage.removeItem('adminToken');
    showPage('page-login');
}

// Extra Features
document.getElementById('btn-refer').onclick = () => {
    alert('Referral Link Copied! (Mock)');
};

document.getElementById('btn-share-result').onclick = () => {
    alert('Result shared to social media! (Mock)');
};
