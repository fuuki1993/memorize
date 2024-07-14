class AnalyticsView {
    constructor(container, app) {
        this.container = container;
        this.app = app;
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="menu-container">
                <h2 class="menu-title">ANALYSIS SELECT</h2>
                <div class="menu-options">
                    <div class="menu-option" id="basicStats">
                        <div class="menu-option-icon"><i class="fas fa-chart-bar"></i></div>
                        <div class="menu-option-text">基本統計</div>
                    </div>
                    <div class="menu-option" id="learningTrends">
                        <div class="menu-option-icon"><i class="fas fa-chart-line"></i></div>
                        <div class="menu-option-text">学習トレンド</div>
                    </div>
                    <div class="menu-option" id="categoryAnalysis">
                        <div class="menu-option-icon"><i class="fas fa-pie-chart"></i></div>
                        <div class="menu-option-text">カテゴリー別</div>
                    </div>
                    <div class="menu-option" id="timeAnalysis">
                        <div class="menu-option-icon"><i class="fas fa-clock"></i></div>
                        <div class="menu-option-text">時間帯分析</div>
                    </div>
                </div>
                <button class="back-button" id="backToMain">メインメニューに戻る</button>
            </div>
        `;

        this.addEventListeners();
    }

    addEventListeners() {
        document.getElementById('basicStats').addEventListener('click', () => this.showAnalysis('basic'));
        document.getElementById('learningTrends').addEventListener('click', () => this.showAnalysis('trends'));
        document.getElementById('categoryAnalysis').addEventListener('click', () => this.showAnalysis('category'));
        document.getElementById('timeAnalysis').addEventListener('click', () => this.showAnalysis('time'));
        document.getElementById('backToMain').addEventListener('click', () => this.app.showView('main'));
    }

    showAnalysis(type) {
        switch (type) {
            case 'basic':
                new BasicStatsView(this.container, this.app);
                break;
            case 'trends':
                new LearningTrendsView(this.container, this.app);
                break;
            case 'category':
                new CategoryAnalysisView(this.container, this.app);
                break;
            case 'time':
                new TimeAnalysisView(this.container, this.app);
                break;
            default:
                console.log(`${type} タイプの分析結果を表示`);
        }
    }
}