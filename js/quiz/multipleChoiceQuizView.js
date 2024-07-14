class MultipleChoiceQuizView {
    constructor(container, app, category) {
        this.container = container;
        this.app = app;
        this.dataHandler = new DataHandler();
        this.settings = app.settings; // アプリケーションの設定を取得
        this.startTime = new Date(); // コンストラクタで初期化
        this.init(category);
    }

    async init(category) {
        try {
            this.categories = await this.dataHandler.getCategories('normal');
            
            if (this.categories.length === 0) {
                await this.renderEmptyState("多肢選択クイズのカテゴリーがありません。");
                return;
            }
    
            this.category = this.categories.find(c => c.name === category) || this.categories[0];
            this.questions = await this.dataHandler.getQuizzesByCategory(this.category.name, 'multipleChoice');
            console.log('取得したクイズデータ:', JSON.stringify(this.questions));
    
            if (this.questions.length === 0) {
                await this.renderEmptyState(`${this.category.name}カテゴリーには問題がありません。`);
                return;
            }
    
            this.questions = await this.shuffleQuestions(this.questions);
            console.log('シャッフル後のクイズデータ:', JSON.stringify(this.questions));

            this.currentQuestionIndex = 0;
            this.correctAnswers = 0;
            this.incorrectAnswers = 0;
            this.totalQuestions = 0;
            this.selectedOptions = new Set();
            this.sessionData = {
                startTime: this.startTime, // this.startTime を使用
                endTime: null,
                correctAnswers: 0,
                totalQuestions: 0,
                category: this.category.name
            };

            this.render();
        } catch (error) {
            console.error("Error initializing MultipleChoiceQuizView:", error);
            await this.renderEmptyState("クイズの読み込み中にエラーが発生しました。");
        }
    }

    async renderEmptyState(message) {
        this.container.innerHTML = `
            <div class="quiz-container">
                <h2>多肢選択クイズ</h2>
                <p>${message}</p>
                <button id="backToMenu" class="back-button">戻る</button>
            </div>
        `;
        await new Promise(resolve => setTimeout(resolve, 0));
        document.getElementById('backToMenu').addEventListener('click', () => this.app.showView('quizMenu'));
    }

    async changeCategory(newCategoryName) {
        await this.saveSessionData();
        this.category = this.categories.find(c => c.name === newCategoryName);
        this.questions = await this.shuffleQuestions(await this.dataHandler.getQuizzesByCategory(this.category.name, 'multipleChoice'));
        this.currentQuestionIndex = 0;
        this.correctAnswers = 0;
        this.incorrectAnswers = 0;
        this.startTime = new Date(); // カテゴリー変更時に更新
        this.sessionData = {
            startTime: this.startTime,
            endTime: null,
            correctAnswers: 0,
            totalQuestions: 0,
            category: this.category.name
        };
        this.render();
    }

    async saveSessionData() {
        const sessionData = {
            type: 'multipleChoice',
            startTime: this.sessionData.startTime,
            endTime: this.sessionData.endTime || new Date(),
            correctAnswers: this.sessionData.correctAnswers,
            totalQuestions: this.sessionData.totalQuestions,
            category: this.sessionData.category
        };
        await this.dataHandler.saveMultipleChoiceQuizSession(sessionData);
    }

    async shuffleQuestions(questions) {
        console.log('シャッフル前の質問:', JSON.stringify(questions));
        const shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const result = shuffled.map(question => {
            if (!question.correctAnswers || question.correctAnswers.length === 0) {
                console.error(`エラー: クイズID ${question.id} に正解情報がありません`);
                return question; // 正解情報がない場合は元のまま返す
            }
            const shuffledOptions = this.shuffleOptions(question.options, question.correctAnswers);
            return {
                ...question,
                options: shuffledOptions.options,
                correctAnswers: shuffledOptions.correctAnswers
            };
        });
        console.log('シャッフル後の質問:', JSON.stringify(result));
        return result;
    }

    async shuffleCurrentQuestions() {
        this.questions = await this.shuffleQuestions([...this.questions]);
        this.currentQuestionIndex = 0;
        this.correctAnswers = 0;
        this.incorrectAnswers = 0;
        this.totalQuestions = 0;
        this.selectedOptions.clear();
        this.startTime = new Date(); // シャッフル時に更新
        this.sessionData = {
            startTime: this.startTime,
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
        const questionFontSizeClass = `question-text`;

        this.container.innerHTML = `
            <div class="quiz-container">
                <h2>多肢選択クイズ: ${this.category.name}</h2>
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
                    ${this.getOptionsHtml(question.options)}
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
    }

    addEventListeners() {
        document.getElementById('categorySelect').addEventListener('change', (e) => this.changeCategory(e.target.value));
        const optionButtons = document.querySelectorAll('.option-button');
        optionButtons.forEach(button => {
            button.addEventListener('click', () => this.toggleOption(button));
        });
        const submitButton = document.getElementById('submitAnswer');
        if (submitButton) {
            submitButton.addEventListener('click', () => this.checkAnswer());
        }
        const prevButton = document.getElementById('prevQuestion');
        if (prevButton) {
            prevButton.addEventListener('click', () => this.navigateQuestion(-1));
        }
        const nextButton = document.getElementById('nextQuestion');
        if (nextButton) {
            nextButton.addEventListener('click', () => this.navigateQuestion(1));
        }
        document.getElementById('backToMenu').addEventListener('click', () => {
            this.saveSessionData();
            this.app.showView('quizMenu');
        });
        document.getElementById('shuffleButton').addEventListener('click', () => this.shuffleCurrentQuestions());
    }

    getCategoryOptions() {
        return this.categories.map(category => 
            `<option value="${category.name}" ${category.name === this.category.name ? 'selected' : ''}>${category.name}</option>`
        ).join('');
    }

    getOptionsHtml(options) {
        const answerFontSizeClass = `answer-text-${this.settings.answerFontSize}`;

        if (Array.isArray(options)) {
            // オプションが単純な配列の場合
            return `
                <div class="options-grid">
                    ${options.map((option, index) => `
                        <div class="options-row">
                            <button class="option-button ${answerFontSizeClass}" data-option="${index}">
                                ${typeof option === 'object' && option.image 
                                    ? `<img src="${option.image}" alt="Option Image" class="option-image"><br>` 
                                    : ''}
                                ${typeof option === 'object' ? option.text : option}
                            </button>
                        </div>
                    `).join('')}
                </div>
                <div class="submit-button-container">
                    <button id="submitAnswer" class="submit-button">回答する</button>
                </div>
            `;
        } else if (options && Array.isArray(options.options)) {
            // オプションが {options: [], correctAnswers: []} 形式の場合
            return `
                <div class="options-grid">
                    ${options.options.map((option, index) => `
                        <div class="options-row">
                            <button class="option-button ${answerFontSizeClass}" data-option="${index}">
                                ${typeof option === 'object' && option.image 
                                    ? `<img src="${option.image}" alt="Option Image" class="option-image"><br>` 
                                    : ''}
                                ${typeof option === 'object' ? option.text : option}
                            </button>
                        </div>
                    `).join('')}
                </div>
                <div class="submit-button-container">
                    <button id="submitAnswer" class="submit-button">回答する</button>
                </div>
            `;
        } else {
            console.error('Invalid options format:', options);
            return '<p>Error: Invalid options format</p>';
        }
    }

    toggleOption(button) {
        const optionIndex = parseInt(button.dataset.option);
        if (this.selectedOptions.has(optionIndex)) {
            this.selectedOptions.delete(optionIndex);
            button.classList.remove('selected');
        } else {
            this.selectedOptions.add(optionIndex);
            button.classList.add('selected');
        }
    }

    checkAnswer() {
        const question = this.questions[this.currentQuestionIndex];
        console.log('チェックする質問:', JSON.stringify(question));
        console.log('選択されたオプション:', Array.from(this.selectedOptions));
    
        if (!question.correctAnswers || question.correctAnswers.length === 0) {
            console.error('正解情報が設定されていません:', question);
            return;
        }
    
        const correctAnswers = new Set(question.correctAnswers);
        const isCorrect = this.selectedOptions.size === correctAnswers.size &&
            [...this.selectedOptions].every(option => correctAnswers.has(option));
    
        console.log('正解:', Array.from(correctAnswers));
        console.log('正解か:', isCorrect);
    
        if (isCorrect) {
            this.correctAnswers++;
            this.showFeedback('正解！', 'correct');
        } else {
            this.incorrectAnswers++;
            const correctOptionsText = question.correctAnswers.map(index => question.options[index]).join(', ');
            this.showFeedback(`不正解。正解は: ${correctOptionsText}`, 'incorrect');
        }
    
        this.totalQuestions++;
        this.selectedOptions.clear();
        this.sessionData.correctAnswers = this.correctAnswers;
        this.sessionData.totalQuestions = this.totalQuestions;
        if (this.currentQuestionIndex >= this.questions.length - 1) {
            this.showResults();
        } else {
            setTimeout(() => this.navigateQuestion(1), 1000); // 1秒後に次の問題へ
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

        new ResultDialog('多肢選択クイズ結果', results, () => {
            this.currentQuestionIndex = 0;
            this.correctAnswers = 0;
            this.incorrectAnswers = 0;
            this.totalQuestions = 0;
            this.startTime = new Date(); // リセット時に更新
            this.endTime = null;
            this.sessionData = {
                startTime: this.startTime,
                endTime: null,
                correctAnswers: 0,
                totalQuestions: 0,
                category: this.category.name
            };
            this.render();
        });
    }

    shuffleOptions(options, correctAnswers) {
        console.log('シャッフル前のオプションと正解:', JSON.stringify({options, correctAnswers}));
        const shuffled = [...options];
        const newCorrectAnswers = [...correctAnswers];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            newCorrectAnswers.forEach((answer, index) => {
                if (answer === i) newCorrectAnswers[index] = j;
                else if (answer === j) newCorrectAnswers[index] = i;
            });
        }
        console.log('シャッフル後のオプションと正解:', JSON.stringify({options: shuffled, correctAnswers: newCorrectAnswers}));
        return { options: shuffled, correctAnswers: newCorrectAnswers };
    }
}