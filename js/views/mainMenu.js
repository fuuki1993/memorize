// mainMenu.js
class MainMenuView {
    constructor(container, app) {
        this.container = container;
        this.app = app;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="menu-container">
                <h1 class="menu-title">MAIN MENU</h1>
                <div class="menu-options">
                    <div class="menu-option" id="startQuiz">
                        <div class="menu-option-icon"><i class="fas fa-list"></i></div>
                        <div class="menu-option-text">問題</div>
                    </div>
                    <div class="menu-option" id="manageQuiz">
                        <div class="menu-option-icon"><i class="fas fa-cogs"></i></div>
                        <div class="menu-option-text">問題管理</div>
                    </div>
                    <div class="menu-option" id="analytics">
                        <div class="menu-option-icon"><i class="fas fa-chart-line"></i></div>
                        <div class="menu-option-text">学習分析</div>
                    </div>
                    <div class="menu-option" id="setting">
                        <div class="menu-option-icon"><i class="fas fa-cog"></i></div>
                        <div class="menu-option-text">設定</div>
                    </div>
                </div>
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        document.getElementById('startQuiz').addEventListener('click', () => this.app.showView('quizMenu'));
        document.getElementById('manageQuiz').addEventListener('click', () => this.app.showView('manageQuiz'));
        document.getElementById('analytics').addEventListener('click', () => this.app.showView('analytics'));
        document.getElementById('setting').addEventListener('click', () => this.app.showView('setting'));
    }
}
