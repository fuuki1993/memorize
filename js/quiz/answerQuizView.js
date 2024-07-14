class AnswerQuizView {
    constructor(container, app, category) {
        this.container = container;
        this.app = app;
        this.dataHandler = new DataHandler();
        this.settings = app.settings; // アプリケーションの設定を取得
        this.init(category);
    }

    async init(category) {
        try {
            // 'normal' カテゴリーを取得
            this.categories = await this.dataHandler.getCategories('normal');
            
            if (this.categories.length === 0) {
                await this.renderEmptyState("クイズのカテゴリーがありません。");
                return;
            }

            this.category = this.categories.find(c => c.name === category) || this.categories[0];
            // 'normal' タイプのクイズを取得
            this.questions = await this.shuffleQuestions(await this.dataHandler.getQuizzesByCategory(this.category.name, 'normal'));

            if (this.questions.length === 0) {
                await this.renderEmptyState(`${this.category.name}カテゴリーには問題がありません。`);
                return;
            }

            this.currentQuestionIndex = 0;
            this.correctAnswers = 0;
            this.incorrectAnswers = 0;
            this.startTime = new Date();
            this.endTime = null;
            this.totalQuestions = 0;
            this.sessionData = {
                startTime: new Date(),
                endTime: null,
                correctAnswers: 0,
                totalQuestions: 0,
                category: this.category.name
            };

            this.render();
        } catch (error) {
            console.error("Error initializing AnswerQuizView:", error);
            await this.renderEmptyState("クイズの読み込み中にエラーが発生しました。");
        }
    }

    async changeCategory(newCategoryName) {
        this.saveSessionData();
        this.category = this.categories.find(c => c.name === newCategoryName);
        // 'normal' タイプのクイズを取得
        this.questions = await this.shuffleQuestions(await this.dataHandler.getQuizzesByCategory(this.category.name, 'normal'));
        this.currentQuestionIndex = 0;
        this.correctAnswers = 0;
        this.incorrectAnswers = 0;
        this.sessionData = {
            startTime: new Date(),
            endTime: null,
            correctAnswers: 0,
            totalQuestions: 0,
            category: this.category.name
        };
        this.render();
    }

    render() {
        if (this.questions.length === 0) {
            this.renderEmptyState();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        const questionFontSizeClass = `question-text-${this.settings.questionFontSize}`; // この行を修正

        this.container.innerHTML = `
            <div class="quiz-container">
                <h2>一問一答クイズ: ${this.category.name}</h2>
                <div class="quiz-controls">
                    <select id="categorySelect">
                        ${this.getCategoryOptions()}
                    </select>
                    <button id="shuffleButton" aria-label="Shuffle questions"></button>
                </div>
                <div class="question-container">
                    <div class="card-content ${questionFontSizeClass}">
                        ${question.question}
                        ${question.image ? `<img src="${question.image}" alt="Question Image" class="question-image">` : ''}
                    </div>
                </div>
                <div class="answer-container">
                    <input type="text" id="answerInput" placeholder="回答を入力してください">
                    <button id="submitAnswer">回答</button>
                </div>
                <div class="quiz-navigation">
                    <button id="prevQuestion" ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>&#8592;</button>
                    <span>${this.currentQuestionIndex + 1} / ${this.questions.length}</span>
                    <button id="nextQuestion" ${this.currentQuestionIndex === this.questions.length - 1 ? 'disabled' : ''}>&#8594;</button>
                </div>
                <div class="score-container">
                    <span>正解: ${this.correctAnswers}</span>
                    <span>不正解: ${this.incorrectAnswers}</span>
                </div>
                <button id="backToMenu" class="back-button">戻る</button>
            </div>
        `;

        this.addEventListeners();
        this.focusAnswerInput(); // render メソッドの最後でもフォーカスを設定
    }

    async renderEmptyState(message) {
        this.container.innerHTML = `
            <div class="quiz-container">
                <h2>一問一答クイズ${this.category ? `: ${this.category.name}` : ''}</h2>
                <p>${message}</p>
                ${this.categories && this.categories.length > 0 ? `
                    <select id="categorySelect">
                        ${this.getCategoryOptions()}
                    </select>
                ` : ''}
                <button id="backToMenu" class="back-button">戻る</button>
            </div>
        `;
        // DOMの更新を待つ
        await new Promise(resolve => setTimeout(resolve, 0));
        this.addEventListeners();
    }

    addEventListeners() {
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => this.changeCategory(e.target.value));
        }

        const submitButton = document.getElementById('submitAnswer');
        if (submitButton) {
            submitButton.addEventListener('click', () => this.checkAnswer());
        }

        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.checkAnswer();
                }
            });
        }

        const prevButton = document.getElementById('prevQuestion');
        if (prevButton) {
            prevButton.addEventListener('click', () => this.navigateQuestion(-1));
        }

        const nextButton = document.getElementById('nextQuestion');
        if (nextButton) {
            nextButton.addEventListener('click', () => this.navigateQuestion(1));
        }

        const backToMenuButton = document.getElementById('backToMenu');
        if (backToMenuButton) {
            backToMenuButton.addEventListener('click', () => {
                this.saveSessionData();
                this.app.showView('quizMenu');
            });
        }

        const shuffleButton = document.getElementById('shuffleButton');
        if (shuffleButton) {
            shuffleButton.addEventListener('click', () => this.shuffleCurrentQuestions());
        }
    }

    getCategoryOptions() {
        if (!this.categories || this.categories.length === 0) {
            return '';
        }
        return this.categories.map(category => 
            `<option value="${category.name}" ${this.category && category.name === this.category.name ? 'selected' : ''}>${category.name}</option>`
        ).join('');
    }

    checkAnswer() {
        const userAnswer = document.getElementById('answerInput').value.trim().toLowerCase();
        const question = this.questions[this.currentQuestionIndex];
        
        // answers プロパティが存在しない場合は、answer プロパティを使用
        const correctAnswers = question.answers 
            ? question.answers.map(answer => answer.toLowerCase())
            : [question.answer.toLowerCase()];

        if (correctAnswers.includes(userAnswer)) {
            this.showFeedback('正解！', 'correct');
            this.correctAnswers++;
        } else {
            this.showFeedback(`不正解。正解は ${correctAnswers.join(' または ')} です。`, 'incorrect');
            this.incorrectAnswers++;
        }

        this.totalQuestions++;
        this.sessionData.correctAnswers = this.correctAnswers;
        this.sessionData.totalQuestions = this.totalQuestions;

        this.updateScore();

        // 全ての問題が終わったら結果を表示
        if (this.totalQuestions === this.questions.length) {
            this.showResults();
        } else {
            // 次の問題へ
            setTimeout(() => {
                this.currentQuestionIndex++;
                if (this.currentQuestionIndex >= this.questions.length) {
                    this.currentQuestionIndex = 0;
                }
                this.render();
                this.focusAnswerInput(); // 新しい問題が表示された後にフォーカスを設定
            }, 1500);
        }
    }

    updateScore() {
        const scoreContainer = document.querySelector('.score-container');
        if (scoreContainer) {
            scoreContainer.innerHTML = `
                <span>正解: ${this.correctAnswers}</span>
                <span>不正解: ${this.incorrectAnswers}</span>
            `;
        }
    }

    showFeedback(message, type) {
        const feedbackElement = document.createElement('div');
        feedbackElement.className = `feedback ${type}`;
        feedbackElement.textContent = message;
        this.container.appendChild(feedbackElement);

        setTimeout(() => {
            feedbackElement.remove();
        }, 1000); // 1秒後にフィードバックを消す
    }

    navigateQuestion(direction) {
        this.currentQuestionIndex += direction;
        if (this.currentQuestionIndex < 0) {
            this.currentQuestionIndex = 0;
        } else if (this.currentQuestionIndex >= this.questions.length) {
            this.currentQuestionIndex = this.questions.length - 1;
        }
        this.render();
    }

    showResults() {
        this.endTime = new Date();
        this.sessionData.endTime = this.endTime;
        this.saveSessionData();
        const duration = (this.endTime - this.startTime) / 1000; // 秒単位
        const correctPercentage = (this.correctAnswers / this.totalQuestions * 100).toFixed(2);

        const results = [
            { label: 'セッション開始時間', value: this.startTime.toLocaleString() },
            { label: 'セッション終了時間', value: this.endTime.toLocaleString() },
            { label: 'セッション時間', value: `${duration.toFixed(2)}秒` },
            { label: '正解数', value: `${this.correctAnswers} / ${this.totalQuestions}` },
            { label: '正答率', value: `${correctPercentage}%` }
        ];

        new ResultDialog('一問一答クイズ結果', results, () => {
            this.currentQuestionIndex = 0;
            this.correctAnswers = 0;
            this.incorrectAnswers = 0;
            this.totalQuestions = 0;
            this.startTime = new Date();
            this.endTime = null;
            this.sessionData = {
                startTime: new Date(),
                endTime: null,
                correctAnswers: 0,
                totalQuestions: 0,
                category: this.category.name
            };
            this.render();
        });
    }

    async saveSessionData() {
        if (!this.sessionData) {
            console.warn('sessionData is undefined, creating a new one');
            this.sessionData = {
                startTime: new Date(),
                endTime: new Date(),
                correctAnswers: 0,
                totalQuestions: 0,
                category: this.category ? this.category.name : 'unknown'
            };
        }

        const sessionData = {
            type: 'answer',
            startTime: this.sessionData.startTime,
            endTime: this.sessionData.endTime || new Date(),
            correctAnswers: this.sessionData.correctAnswers,
            totalQuestions: this.sessionData.totalQuestions,
            category: this.sessionData.category
        };
        await this.dataHandler.saveQuizSession(sessionData);
    }

    shuffleQuestions(questions) {
        const shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    async shuffleCurrentQuestions() {
        this.questions = await this.shuffleQuestions([...this.questions]);
        this.currentQuestionIndex = 0;
        this.correctAnswers = 0;
        this.incorrectAnswers = 0;
        this.totalQuestions = 0;
        this.startTime = new Date();
        this.endTime = null;
        this.sessionData = {
            startTime: new Date(),
            endTime: null,
            correctAnswers: 0,
            totalQuestions: 0,
            category: this.category.name
        };
        this.render();
    }

    focusAnswerInput() {
        const answerInput = document.getElementById('answerInput');
        if (answerInput) {
            answerInput.focus();
        }
    }
}