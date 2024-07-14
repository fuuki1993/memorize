// app.js
class QuizApp {
    constructor() {
        this.currentView = 'main';
        this.quizData = {};
        this.currentQuiz = null;
        this.currentQuizType = null;
        this.timerManager = new TimerManager();
        this.modalManager = new ModalManager();
        this.dataHandler = new DataHandler();
        this.settings = this.loadSettings();
        this.applySettings(this.settings);

        this.initEventListeners();
        this.loadQuizData();
    }

    initEventListeners() {
        document.getElementById('logoSvg').addEventListener('click', () => this.showView('main'));
        document.getElementById('quizMenuBtn').addEventListener('click', () => this.showView('quizMenu'));
        document.getElementById('manageQuizBtn').addEventListener('click', () => this.showView('manageQuiz'));
        document.getElementById('analyticsBtn').addEventListener('click', () => this.showView('analytics'));
        document.getElementById('settingBtn').addEventListener('click', () => this.showView('setting'));
    }

    showView(view, category = null) {
        console.log(`Showing view: ${view}, category: ${category}`); // デバッグ用ログ

        // 各スタイルシートの要素を取得
        const quizStylesheet = document.querySelector('link[href="css/quiz.css"]');
        const manageQuizStylesheet = document.querySelector('link[href="css/manage-quiz.css"]');
        const settingStylesheet = document.querySelector('link[href="css/setting.css"]');

        this.currentView = view;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = ''; // Clear current content

        // ClassificationQuizViewを離れる時の処理
        if (this.currentView === 'classificationQuiz' && view !== 'classificationQuiz') {
            if (manageQuizStylesheet) {
                manageQuizStylesheet.disabled = false;
            }
        }

        // すべてのスタイルシートを一旦無効化
        if (quizStylesheet) quizStylesheet.disabled = true;
        if (manageQuizStylesheet) manageQuizStylesheet.disabled = true;
        if (settingStylesheet) settingStylesheet.disabled = true;

        // ビューを切り替える前に現在の設定を適用
        this.applySettings(this.settings);

        switch (view) {
            case 'main':
                new MainMenuView(mainContent, this);
                break;
            case 'quizMenu':
                new QuizMenuView(mainContent, this);
                break;
            case 'manageQuiz':
                new ManageQuizView(mainContent, this);
                break;
            case 'analytics':
                new AnalyticsView(mainContent, this);
                break;
            case 'setting':
                new SettingView(mainContent, this);
                if (settingStylesheet) settingStylesheet.disabled = false;
                break;
            case 'manageNormalQuiz':
                new ManageNormalQuizView(mainContent, this);
                // quiz.cssを無効化
                if (quizStylesheet) {
                    quizStylesheet.disabled = true;
                }
                break;
            case 'manageAnswerQuiz':
                new ManageAnswerQuizView(mainContent, this);
                // quiz.cssを無効化
                if (quizStylesheet) {
                    quizStylesheet.disabled = true;
                }
                break;
            case 'manageMultipleChoiceQuiz':
                new ManageMultipleChoiceQuizView(mainContent, this);
                // quiz.cssを無効化
                if (quizStylesheet) {
                    quizStylesheet.disabled = true;
                }
                break;
            case 'manageClassificationQuiz':
                new ManageClassificationQuizView(mainContent, this);
                // quiz.cssを無効化
                if (quizStylesheet) {
                    quizStylesheet.disabled = true;
                }
                break;
            case 'normalQuiz':
                new NormalQuizView(mainContent, this, category);
                break;
            case 'answerQuiz':
                new AnswerQuizView(mainContent, this, category);
                break;
            case 'multipleChoiceQuiz':
                new MultipleChoiceQuizView(mainContent, this, category);
                break;
            case 'classificationQuiz':
                const defaultCategory = this.dataHandler.getCategories('classification')[0]?.name;
                new ClassificationQuizView(mainContent, this, category || defaultCategory);
                if (quizStylesheet) quizStylesheet.disabled = false;
                break;
            case 'basicStats':
                new BasicStatsView(mainContent, this);
                break;
            case 'categoryAnalysis':
                new CategoryAnalysisView(mainContent, this);
                break;
            default:
                console.error('Unknown view:', view);
        }

        // 管理ビューの場合、manage-quiz.cssを有効化
        if (view.startsWith('manage') && manageQuizStylesheet) {
            manageQuizStylesheet.disabled = false;
        }

        // quiz.cssを有効化する条件
        if (!view.startsWith('manage') && view !== 'setting' && quizStylesheet) {
            quizStylesheet.disabled = false;
        }
    }

    startQuiz(type, category) {
        this.currentQuizType = type;
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = ''; // Clear current content

        switch (type) {
            case 'normal':
                new NormalQuiz(mainContent, this, category);
                break;
            case 'answerQuiz':
                console.log('Creating AnswerQuizView with category:', category);
                console.log('Current quizData:', this.quizData);
                new AnswerQuizView(mainContent, this, category);
                break;
            case 'multiple':
                new MultipleChoiceQuiz(mainContent, this, category);
                break;
            case 'classification':
                new ClassificationQuiz(mainContent, this, category);
                break;
            default:
                console.error('Unknown quiz type:', type);
        }

        this.timerManager.startTimer();
    }

    endQuiz(results) {
        this.timerManager.stopTimer();
        this.modalManager.showResults(results);
        this.dataHandler.saveQuizResults(results);
    }

    async loadQuizData() {
        console.log('App: Loading quiz data');
        this.quizData = this.dataHandler.loadQuizData();
        console.log('App: Quiz data loaded:', this.quizData);
        
        ['normal', 'answer', 'multipleChoice', 'classification'].forEach(type => {
            if (!this.quizData[type] || Object.keys(this.quizData[type]).length === 0) {
                console.warn(`No ${type} quiz data found`);
            } else {
                console.log(`${type} quiz data:`, this.quizData[type]);
            }
        });
    }

    loadSettings() {
        const defaultSettings = {
            darkMode: false,
            questionFontSize: 'medium',
            answerFontSize: 'medium'
        };
        const savedSettings = JSON.parse(localStorage.getItem('settings')) || {};
        return { ...defaultSettings, ...savedSettings };
    }

    applySettings(settings) {
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        // 問題文と回答の文字サイズを適用
        document.documentElement.style.setProperty('--question-font-size', this.getFontSize(settings.questionFontSize));
        document.documentElement.style.setProperty('--answer-font-size', this.getFontSize(settings.answerFontSize));

        // 質問のフォントサイズを更新
        const questionElements = document.querySelectorAll('.question-text-small, .question-text-medium, .question-text-large');
        questionElements.forEach(element => {
            element.classList.remove('question-text-small', 'question-text-medium', 'question-text-large');
            element.classList.add(`question-text-${settings.questionFontSize}`);
        });

        // 分類クイズの文字サイズを更新
        const classificationTitles = document.querySelectorAll('.classification-container h3');
        classificationTitles.forEach(title => {
            title.style.fontSize = this.getFontSize(settings.questionFontSize);
        });
    }

    getFontSize(size) {
        switch (size) {
            case 'small': return '16px';
            case 'medium': return '24px';
            case 'large': return '32px';
            default: return '24px';
        }
    }

    updateSettings(newSettings) {
        this.settings = newSettings;
        this.applySettings(this.settings);
        localStorage.setItem('settings', JSON.stringify(this.settings));
        
        // 現在のビューを再レンダリング
        if (this.currentView) {
            this.showView(this.currentView);
        }
    }

    async saveQuizSession(sessionData) {
        await this.dataHandler.saveNormalQuizSession(sessionData);
    }
}

const app = new QuizApp();
app.showView('main');