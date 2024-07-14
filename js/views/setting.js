class SettingView {
    constructor(container, app) {
        this.container = container;
        this.app = app;
        this.settings = this.loadSettings();
        this.tempSettings = { ...this.settings }; // 一時的な設定を保持
        this.render();
        this.applySettings(this.settings); // 保存された設定を適用
    }

    loadSettings() {
        const defaultSettings = {
            darkMode: false,
            questionFontSize: 'small',
            answerFontSize: 'small'
        };
        const savedSettings = JSON.parse(localStorage.getItem('settings')) || {};
        return { ...defaultSettings, ...savedSettings };
    }

    render() {
        this.container.innerHTML = `
            <div class="analysis-container">
                <h2 class="analysis-title">設定</h2>
                <div class="settings-wrapper">
                    <fieldset class="setting-fieldset">
                        <legend>表示設定</legend>
                        <div class="setting-option">
                            <label for="darkMode">ダークモード</label>
                            <label class="switch">
                                <input type="checkbox" id="darkMode" ${this.tempSettings.darkMode ? 'checked' : ''}>
                                <span class="slider round"></span>
                            </label>
                        </div>
                        <div class="setting-option">
                            <label for="questionFontSize">問題文の文字サイズ</label>
                            <select id="questionFontSize">
                                <option value="small" ${this.tempSettings.questionFontSize === 'small' ? 'selected' : ''}>小</option>
                                <option value="medium" ${this.tempSettings.questionFontSize === 'medium' ? 'selected' : ''}>中</option>
                                <option value="large" ${this.tempSettings.questionFontSize === 'large' ? 'selected' : ''}>大</option>
                            </select>
                        </div>
                        <div class="setting-option">
                            <label for="answerFontSize">回答の文字サイズ</label>
                            <select id="answerFontSize">
                                <option value="small" ${this.tempSettings.answerFontSize === 'small' ? 'selected' : ''}>小</option>
                                <option value="medium" ${this.tempSettings.answerFontSize === 'medium' ? 'selected' : ''}>中</option>
                                <option value="large" ${this.tempSettings.answerFontSize === 'large' ? 'selected' : ''}>大</option>
                            </select>
                        </div>
                    </fieldset>
                    <fieldset class="setting-fieldset">
                        <legend>データ管理</legend>
                        <div class="setting-option clear-button-container">
                            <button id="clearSession" class="clear-button">セッション情報を削除</button>
                        </div>
                    </fieldset>
                    <div class="button-container">
                        <button id="saveSettings" class="primary-button">設定を保存</button>
                        <button id="backToMain" class="secondary-button">メインメニューに戻る</button>
                    </div>
                </div>
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        document.getElementById('saveSettings').addEventListener('click', () => this.saveSettings());
        document.getElementById('darkMode').addEventListener('change', (e) => this.toggleDarkMode(e.target.checked));
        document.getElementById('clearSession').addEventListener('click', () => this.clearSessionData());
        document.getElementById('backToMain').addEventListener('click', () => this.backToMain());
        document.getElementById('questionFontSize').addEventListener('change', (e) => this.tempSettings.questionFontSize = e.target.value);
        document.getElementById('answerFontSize').addEventListener('change', (e) => this.tempSettings.answerFontSize = e.target.value);
    }

    toggleDarkMode(isDarkMode) {
        this.tempSettings.darkMode = isDarkMode;
        this.applySettings(this.tempSettings);
    }

    applySettings(settings) {
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        // 他の設定の適用もここに追加
    }

    saveSettings() {
        this.settings = { ...this.tempSettings };
        localStorage.setItem('settings', JSON.stringify(this.settings));
        alert('設定が保存されました');
        this.app.updateSettings(this.settings); // 新しいメソッド
    }

    backToMain() {
        this.tempSettings = { ...this.settings }; // 一時的な設定をリセット
        this.applySettings(this.settings);
        this.app.showView('main');
    }

    clearSessionData() {
        sessionStorage.clear();
        localStorage.removeItem('quizResults');
        localStorage.removeItem('learningHistory');
        alert('セッション情報が削除されました。学習履歴もリセットされました。');
    }
}