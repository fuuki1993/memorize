class ManageQuizView {
    constructor(container, app) {
        this.container = container;
        this.app = app;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="menu-container">
                <h2 class="menu-title">MANAGE SELECT</h2>
                <div class="menu-options">
                    <div class="menu-option" id="manageNormalQuiz">
                        <div class="menu-option-icon"><i class="fas fa-book"></i></div>
                        <div class="menu-option-text">暗記</div>
                    </div>
                    <div class="menu-option" id="manageAnswerQuiz">
                        <div class="menu-option-icon"><i class="fas fa-question"></i></div>
                        <div class="menu-option-text">一問一答</div>
                    </div>
                    <div class="menu-option" id="manageMultipleChoiceQuiz">
                        <div class="menu-option-icon"><i class="fas fa-list-ul"></i></div>
                        <div class="menu-option-text">多肢選択</div>
                    </div>
                    <div class="menu-option" id="manageClassificationQuiz">
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
        document.getElementById('manageNormalQuiz').addEventListener('click', () => this.app.showView('manageNormalQuiz'));
        document.getElementById('manageAnswerQuiz').addEventListener('click', () => this.app.showView('manageAnswerQuiz'));
        document.getElementById('manageMultipleChoiceQuiz').addEventListener('click', () => this.app.showView('manageMultipleChoiceQuiz'));
        document.getElementById('manageClassificationQuiz').addEventListener('click', () => this.app.showView('manageClassificationQuiz'));
        document.getElementById('backToMain').addEventListener('click', () => this.app.showView('main'));
    }
}