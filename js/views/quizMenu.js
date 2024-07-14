class QuizMenuView {
    constructor(container, app) {
        this.container = container;
        this.app = app;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="menu-container">
                <h2 class="menu-title">QUESTION SELECT</h2>
                <div class="menu-options">
                    <div class="menu-option" id="normalQuiz">
                        <div class="menu-option-icon"><i class="fas fa-book"></i></div>
                        <div class="menu-option-text">暗記</div>
                    </div>
                    <div class="menu-option" id="answerQuiz">
                        <div class="menu-option-icon"><i class="fas fa-question"></i></div>
                        <div class="menu-option-text">一問一答</div>
                    </div>
                    <div class="menu-option" id="multipleChoiceQuiz">
                        <div class="menu-option-icon"><i class="fas fa-list-ul"></i></div>
                        <div class="menu-option-text">多肢選択</div>
                    </div>
                    <div class="menu-option" id="classificationQuiz">
                        <div class="menu-option-icon"><i class="fas fa-folder"></i></div>
                        <div class="menu-option-text">分類</div>
                    </div>
                </div>
                <button class="back-button" id="backToMain">メインメニューに戻る</button>
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        document.getElementById('normalQuiz').addEventListener('click', () => {
            console.log('Normal Quiz clicked, app.quizData:', this.app.quizData);
            this.app.showView('normalQuiz', 'default');
        });
        document.getElementById('answerQuiz').addEventListener('click', () => this.app.showView('answerQuiz', 'default'));
        document.getElementById('multipleChoiceQuiz').addEventListener('click', () => this.app.showView('multipleChoiceQuiz'));
        document.getElementById('classificationQuiz').addEventListener('click', () => this.app.showView('classificationQuiz'));
        document.getElementById('backToMain').addEventListener('click', () => this.app.showView('main'));
    }
}