class NormalQuizView {
    constructor(container, app, category) {
        console.log(`NormalQuizView constructor called. Category: ${category}`); // デバッグ用ログ
        this.container = container;
        this.app = app;
        this.dataHandler = new DataHandler();
        this.settings = app.settings; // アプリケーションの設定を取得

        // Fetch categories asynchronously
        this.initializeView(category);
    }

    async initializeView(category) {
        try {
            this.categories = await this.dataHandler.getCategories('normal');
            console.log('Categories:', this.categories);

            if (!Array.isArray(this.categories) || this.categories.length === 0) {
                this.renderEmptyState("暗記クイズのカテゴリーがありません。");
                return;
            }

            this.category = this.categories.find(c => c.name === category) || this.categories[0];
            this.questions = await this.shuffleQuestions(await this.dataHandler.getQuizzesByCategory(this.category.name, 'normal'));

            if (this.questions.length === 0) {
                this.renderEmptyState(`${this.category.name}カテゴリーには問題がありません。`);
                return;
            }

            this.currentQuestionIndex = 0;
            this.isShowingAnswer = false;
            this.startTime = new Date();
            this.endTime = null;
            this.totalQuestions = 0;
            this.reviewedQuestions = 0;

            console.log('NormalQuizView initialized:', {
                categories: this.categories,
                selectedCategory: this.category,
                questions: this.questions
            });

            this.render();
        } catch (error) {
            console.error('Error initializing NormalQuizView:', error);
            this.renderEmptyState("クイズデータの読み込み中にエラーが発生しました。");
        }
    }

    shuffleQuestions(questions) {
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
        return questions;
    }

    render() {
        console.log('Rendering NormalQuizView:', {
            category: this.category,
            questionsCount: this.questions.length,
            currentQuestionIndex: this.currentQuestionIndex
        });

        if (this.questions.length === 0) {
            this.renderEmptyState();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        const questionFontSizeClass = `question-text`;
        const answerFontSizeClass = `answer-text`;

        this.container.innerHTML = `
            <link rel="stylesheet" href="css/quiz.css">
            <div class="quiz-container">
                <h2>暗記クイズ: ${this.category.name}</h2>
                <div class="quiz-controls">
                    <select id="categorySelect">
                        ${this.getCategoryOptions()}
                    </select>
                    <button id="shuffleButton" aria-label="Shuffle questions"></button>
                </div>
                <div class="quiz-card-container">
                    <div class="quiz-card ${this.isShowingAnswer ? 'flipped' : ''}">
                        <div class="card-front">
                            <div class="card-content ${questionFontSizeClass}">
                                ${question.question}
                                ${question.image ? `<img src="${question.image}" alt="Question image" class="question-image">` : ''}
                            </div>
                            <span class="flip-icon">&#8635;</span>
                        </div>
                        <div class="card-back">
                            <div class="card-content ${answerFontSizeClass}">
                                ${question.answer}
                            </div>
                            <span class="flip-icon">&#8635;</span>
                        </div>
                    </div>
                </div>
                <div class="quiz-navigation">
                    <button id="prevQuestion" ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>&#8592;</button>
                    <span>${this.currentQuestionIndex + 1} / ${this.questions.length}</span>
                    <button id="nextQuestion" ${this.currentQuestionIndex === this.questions.length - 1 ? 'disabled' : ''}>&#8594;</button>
                </div>
                <button id="backToMenu" class="back-button">戻る</button>
            </div>
        `;

        this.addEventListeners();
    }

    renderEmptyState(message) {
        this.container.innerHTML = `
            <div class="quiz-container">
                <h2>暗記クイズ</h2>
                <p>${message}</p>
                <button id="backToMenu" class="back-button">戻る</button>
            </div>
        `;
        document.getElementById('backToMenu').addEventListener('click', () => this.app.showView('quizMenu'));
    }

    addEventListeners() {
        document.getElementById('categorySelect').addEventListener('change', (e) => this.changeCategory(e.target.value));
        const quizCard = document.querySelector('.quiz-card');
        if (quizCard) {
            quizCard.addEventListener('click', () => this.flipCard());
        }
        const prevButton = document.getElementById('prevQuestion');
        if (prevButton) {
            prevButton.addEventListener('click', () => this.navigateQuestion(-1));
        }
        const nextButton = document.getElementById('nextQuestion');
        if (nextButton) {
            nextButton.addEventListener('click', () => this.navigateQuestion(1));
        }
        document.getElementById('backToMenu').addEventListener('click', () => this.showResults());
        document.getElementById('shuffleButton').addEventListener('click', () => this.shuffleCurrentQuestions());
    }

    getCategoryOptions() {
        return this.categories.map(category => 
            `<option value="${category.name}" ${category.name === this.category.name ? 'selected' : ''}>${category.name}</option>`
        ).join('');
    }

    changeCategory(newCategoryName) {
        this.category = this.categories.find(c => c.name === newCategoryName);
        this.questions = this.shuffleQuestions(this.dataHandler.getQuizzesByCategory(this.category.name, 'normal'));
        this.currentQuestionIndex = 0;
        this.isShowingAnswer = false;
        this.render();
    }

    flipCard() {
        this.isShowingAnswer = !this.isShowingAnswer;
        document.querySelector('.quiz-card').classList.toggle('flipped');
        if (this.isShowingAnswer) {
            this.reviewedQuestions++;
        }
    }

    navigateQuestion(direction) {
        this.currentQuestionIndex += direction;
        this.isShowingAnswer = false;
        this.totalQuestions++;
        if (this.currentQuestionIndex >= this.questions.length) {
            this.showResults();
        } else {
            this.render();
        }
    }

    shuffleCurrentQuestions() {
        this.questions = this.shuffleQuestions([...this.questions]);
        this.currentQuestionIndex = 0;
        this.isShowingAnswer = false;
        this.render();
    }

    showResults() {
        this.endTime = new Date();
        const duration = (this.endTime - this.startTime) / 1000; // 秒単位
        const reviewPercentage = (this.reviewedQuestions / this.totalQuestions * 100).toFixed(2);

        const sessionData = {
            type: 'normal',
            category: this.category.name,
            startTime: this.startTime,
            endTime: this.endTime,
            duration: duration,
            totalQuestions: this.totalQuestions,
            reviewedQuestions: this.reviewedQuestions,
            reviewPercentage: parseFloat(reviewPercentage)
        };

        this.dataHandler.saveNormalQuizSession(sessionData)
            .then(() => {
                console.log("Normal quiz session saved successfully");
            })
            .catch((error) => {
                console.error("Error saving normal quiz session:", error);
            });

        const results = [
            { label: 'セッション開始時間', value: this.startTime.toLocaleString() },
            { label: 'セッション終了時間', value: this.endTime.toLocaleString() },
            { label: 'セッション時間', value: `${duration.toFixed(2)}秒` },
            { label: '確認した問題数', value: `${this.reviewedQuestions} / ${this.totalQuestions}` },
            { label: '確認率', value: `${reviewPercentage}%` }
        ];

        new ResultDialog('暗記クイズ結果', results, () => this.app.showView('quizMenu'));
    }
}