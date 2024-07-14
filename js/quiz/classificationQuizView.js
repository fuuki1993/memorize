class ClassificationQuizView {
    constructor(container, app, category) {
        this.container = container;
        this.app = app;
        this.dataHandler = app.dataHandler;
        this.sessionData = {
            startTime: new Date(),
            endTime: null,
            correctAnswers: 0,
            totalPlacements: 0,
            category: category // カテゴリーを初期化時に設定
        };
        this.init(category);
        this.placementCount = 0;
        this.totalItems = 0;
        this.shuffleButton = null;
    }

    async init(category) {
        try {
            this.categories = await this.dataHandler.getCategories('classification');
            
            console.log('Categories:', this.categories); // デバッグ用ログ

            if (this.categories.length === 0) {
                await this.renderEmptyState("分類クイズのカテゴリーがありません。");
                return;
            }

            this.category = this.categories.find(c => c.name === category) || this.categories[0];
            this.sessionData.category = this.category.name; // カテゴリーを更新
            
            if (!this.dataHandler.getClassificationQuizData) {
                throw new Error('getClassificationQuizData method is not defined in DataHandler');
            }
            
            this.quizData = await this.dataHandler.getClassificationQuizData(this.category.id);

            console.log('Selected category:', this.category); // デバッグ用ログ
            console.log('Quiz data:', this.quizData); // デバッグ用ログ

            if (!this.quizData || !this.quizData.items || this.quizData.items.length === 0) {
                await this.renderEmptyState(`${this.category.name}カテゴリーには問題がありません。`);
                return;
            }

            this.currentQuestionIndex = 0;
            this.correctAnswers = 0;
            this.incorrectAnswers = 0;
            this.startTime = new Date();
            this.endTime = null;
            this.totalQuestions = this.quizData.items.length;
            this.placementCount = 0;
            this.totalItems = this.quizData.items.length;

            this.quizData = await this.shuffleQuizData(this.quizData);

            this.render();
        } catch (error) {
            console.error("Error initializing ClassificationQuizView:", error);
            await this.renderEmptyState("クイズの読み込み中にエラーが発生しました。");
        }
    }

    async renderEmptyState(message) {
        this.container.innerHTML = `
            <div class="quiz-container">
                <h2>分類クイズ</h2>
                <p>${message}</p>
                <button id="backToMenu" class="back-button">戻る</button>
            </div>
        `;
        await new Promise(resolve => setTimeout(resolve, 0));
        document.getElementById('backToMenu').addEventListener('click', () => this.app.showView('quizMenu'));
    }

    async render() {
        if (!this.quizData || this.quizData.items.length === 0) {
            await this.renderEmptyState();
            return;
        }

        let categorySelectHtml = '';
        if (this.categories && this.categories.length > 1) {
            categorySelectHtml = `
                <div class="quiz-controls">
                    <select id="categorySelect">
                        ${this.categories.map(category => `
                            <option value="${category.name}" ${category.name === this.category.name ? 'selected' : ''}>
                                ${category.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
            `;
        }

        this.container.innerHTML = `
            <div class="quiz-container classification-quiz-container">
                <h2>分類クイズ: ${this.category.name}</h2>
                <div class="quiz-controls">
                <select id="categorySelect">
                    ${this.categories.map(category => `
                        <option value="${category.name}" ${category.name === this.category.name ? 'selected' : ''}>
                            ${category.name}
                        </option>
                    `).join('')}
                </select>
                <button id="shuffleButton" aria-label="Shuffle questions"></button>
            </div>
                <div class="classification-quiz">
                    <div class="classifications-grid">
                        ${this.renderClassifications()}
                    </div>
                    <div class="items-container">
                        ${this.renderItems()}
                    </div>
                </div>
                <div class="score-container">
                    <span>配置回数: <span id="placementCount">${this.placementCount}</span></span>
                    <span>正解数: <span id="correctAnswers">${this.correctAnswers}/${this.totalItems}</span></span>
                    <span>不正解数: <span id="incorrectAnswers">${this.incorrectAnswers}</span></span>
                </div>
                <button id="submitClassification" class="submit-button">回答する</button>
                <button id="backToMenu" class="back-button">メニューに戻る</button>
            </div>
        `;

        this.attachEventListeners();
        
        // DOMの更新後に equalizeContainerHeights を呼び出す
        setTimeout(() => {
            this.adjustClassificationContainers();
        }, 0);
    }

    renderClassifications() {
        return `
            <div class="classifications-container">
                ${this.quizData.classifications.map(classification => `
                    <div class="classification-container" id="classification-${classification.id}" data-classification-id="${classification.id}">
                        <h3>${classification.name}</h3>
                        <div class="classification-content">
                            ${classification.image ? `<img src="${classification.image}" alt="${classification.name}" class="classification-image">` : ''}
                            <div class="classification-items"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderItems() {
        return `
            <div class="items-container">
                ${this.quizData.items.map(item => `
                    <div class="item" id="item-${item.id}" draggable="true">
                        ${item.image ? `<img src="${item.image}" alt="${item.content}" class="item-image">` : ''}
                        <span>${item.content}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    attachEventListeners() {
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => this.changeCategory(e.target.value));
        }
        document.getElementById('backToMenu').addEventListener('click', () => this.app.showView('quizMenu'));
        document.getElementById('submitClassification').addEventListener('click', () => this.checkAnswers());
        this.setupDragAndDrop();
        this.shuffleButton = document.getElementById('shuffleButton');
        if (this.shuffleButton) {
            this.shuffleButton.addEventListener('click', () => this.shuffleCurrentQuizData());
        }
    }

    setupDragAndDrop() {
        const items = document.querySelectorAll('.item');
        const dropZones = document.querySelectorAll('.classification-content');
        const itemsContainer = document.querySelector('.items-container');

        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.id);
                e.target.classList.add('dragging');
            });

            item.addEventListener('dragend', (e) => {
                e.target.classList.remove('dragging');
            });
        });

        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                const itemId = e.dataTransfer.getData('text');
                const item = document.getElementById(itemId);
                const classificationContainer = zone.closest('.classification-container');
                const classificationId = classificationContainer.dataset.classificationId;
    
                this.sessionData.totalPlacements++;
    
                if (this.isCorrectClassification(itemId, classificationId)) {
                    zone.appendChild(item);
                    this.sessionData.correctAnswers++;
                    this.showFeedback('正解！', 'correct');
                    classificationContainer.classList.add('correct-answer');
                    item.style.display = 'none';
                    setTimeout(() => {
                        classificationContainer.classList.remove('correct-answer');
                    }, 500);
                } else {
                    this.showFeedback('不正解', 'incorrect');
                    classificationContainer.classList.add('incorrect-answer');
                    setTimeout(() => {
                        itemsContainer.appendChild(item);
                        classificationContainer.classList.remove('incorrect-answer');
                    }, 500);
                }

                this.updateScore();
                if (this.sessionData.correctAnswers === this.totalItems) {
                    this.showResults();
                }
            });
        });
    }

    showFeedback(message, type) {
        const feedbackElement = document.createElement('div');
        feedbackElement.className = `feedback ${type}`;
        feedbackElement.textContent = message;
        this.container.appendChild(feedbackElement);

        setTimeout(() => {
            feedbackElement.remove();
        }, 1000);
    }

    isCorrectClassification(itemId, classificationId) {
        const item = this.quizData.items.find(i => `item-${i.id}` === itemId);
        return item && item.classificationId === parseInt(classificationId);
    }

    flashColor(element, className) {
        element.classList.add(className);
        setTimeout(() => {
            element.classList.remove(className);
        }, 500);
    }

    checkAnswer(itemId, classificationId) {
        const isCorrect = this.isCorrectClassification(itemId, classificationId);

        if (isCorrect) {
            this.correctAnswers++;
        } else {
            this.incorrectAnswers++;
        }

        this.updateScore();
        if (this.correctAnswers + this.incorrectAnswers === this.totalQuestions) {
            this.showResults();
        }
    }

    updateScore() {
        document.getElementById('placementCount').textContent = this.sessionData.totalPlacements;
        document.getElementById('correctAnswers').textContent = `${this.sessionData.correctAnswers}/${this.sessionData.totalPlacements}`;
        document.getElementById('incorrectAnswers').textContent = this.sessionData.totalPlacements - this.sessionData.correctAnswers;
    }

    addEventListeners() {
        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => this.changeCategory(e.target.value));
        }
        document.getElementById('backToMenu').addEventListener('click', () => this.app.showView('quizMenu'));
    }

    getCategoryOptions() {
        return this.categories.map(category => 
            `<option value="${category.name}" ${category.name === this.category.name ? 'selected' : ''}>${category.name}</option>`
        ).join('');
    }

    async changeCategory(newCategoryName) {
        this.category = this.categories.find(c => c.name === newCategoryName);
        this.quizData = await this.dataHandler.getClassificationQuizData(this.category.id);
        this.correctAnswers = 0;
        this.incorrectAnswers = 0;
        this.placementCount = 0;
        this.totalItems = this.quizData.items.length;
        this.sessionData.category = this.category.name; // カテゴリーを更新
        this.resetSession(); // セッションをリセット
        this.render();
    }

    navigateQuestion(direction) {
        this.currentQuestionIndex += direction;
        if (this.currentQuestionIndex < 0) {
            this.currentQuestionIndex = 0;
        } else if (this.currentQuestionIndex >= this.totalQuestions) {
            this.currentQuestionIndex = this.totalQuestions - 1;
        }
        this.render();
    }

    showResults() {
        this.sessionData.endTime = new Date();
        const duration = (this.sessionData.endTime - this.sessionData.startTime) / 1000; // 秒単位
        const correctPercentage = (this.sessionData.correctAnswers / this.sessionData.totalPlacements * 100).toFixed(2);

        const results = [
            { label: 'セッション開始時間', value: this.sessionData.startTime.toLocaleString() },
            { label: 'セッション終了時間', value: this.sessionData.endTime.toLocaleString() },
            { label: 'セッション時間', value: `${duration.toFixed(2)}秒` },
            { label: '正解数', value: `${this.sessionData.correctAnswers} / ${this.sessionData.totalPlacements}` },
            { label: '正答率', value: `${correctPercentage}%` }
        ];

        new ResultDialog('分類クイズ結果', results, () => {
            this.saveSessionData();
            this.resetSession();
            this.render();
        });
    }

    async saveSessionData() {
        const sessionData = {
            type: 'classification',
            startTime: this.sessionData.startTime,
            endTime: this.sessionData.endTime,
            correctAnswers: this.sessionData.correctAnswers,
            totalPlacements: this.sessionData.totalPlacements,
            category: this.sessionData.category
        };
        await this.dataHandler.saveClassificationQuizSession(sessionData);
    }

    resetSession() {
        this.sessionData = {
            startTime: new Date(),
            endTime: null,
            correctAnswers: 0,
            totalPlacements: 0,
            category: this.category.name // カテゴリーを設定
        };
        this.placementCount = 0;
        this.totalItems = this.quizData.items.length;
    }

    adjustClassificationContainers() {
        const containers = document.querySelectorAll('.classification-container');
        containers.forEach(container => {
            const content = container.querySelector('.classification-content');
            const image = container.querySelector('.classification-image');
            const items = container.querySelector('.classification-items');

            if (image) {
                image.style.maxHeight = '160px'; // 画像の最大高さを設定
                image.style.width = 'auto'; // 幅を自動調整
                image.style.objectFit = 'contain'; // アスペクト比を保持しつつ、コンテナに収まるようにする
            }

            if (items) {
                const remainingHeight = 220 - (image ? image.offsetHeight : 0) - container.querySelector('h3').offsetHeight;
                items.style.height = `${Math.max(remainingHeight, 60)}px`; // 最小高さを60pxに設定
            }
        });
    }

    async shuffleCurrentQuizData() {
        this.quizData = await this.shuffleQuizData(this.quizData);
        this.correctAnswers = 0;
        this.incorrectAnswers = 0;
        this.placementCount = 0;
        this.totalItems = this.quizData.items.length;
        this.startTime = new Date();
        this.endTime = null;
        this.render();
    }

    async shuffleQuizData(quizData) {
        const shuffledClassifications = this.shuffleArray([...quizData.classifications]);
        const shuffledItems = this.shuffleArray([...quizData.items]);

        return {
            ...quizData,
            classifications: shuffledClassifications,
            items: shuffledItems
        };
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}