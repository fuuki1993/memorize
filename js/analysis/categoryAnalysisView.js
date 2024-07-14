class CategoryAnalysisView {
    constructor(container, app) {
        this.container = container;
        this.app = app;
        this.dataHandler = app.dataHandler;
        this.categories = [];
        this.selectedPeriod = 'all';
        this.init();
    }

    async init() {
        await this.loadCategories();
        await this.render();
    }

    async loadCategories() {
        this.categories = await this.getUniqueCategories();
    }

    async render() {
        const categoryStats = await this.calculateCategoryStats();
        this.container.innerHTML = `
            <div class="analysis-container">
                <h2 class="analysis-title">カテゴリー別分析</h2>
                <div class="selector-container">
                    <div class="period-selector">
                        <label for="periodSelect">期間選択:</label>
                        <select id="periodSelect">
                            <option value="all">全期間</option>
                            <option value="week">過去1週間</option>
                            <option value="month">過去1ヶ月</option>
                            <option value="year">過去1年</option>
                        </select>
                    </div>
                </div>
                <div class="stats-grid">
                    ${this.renderCategoryStats(categoryStats)}
                </div>
                <div class="charts-container">
                    <div class="chart-wrapper">
                        <h3 class="chart-title">カテゴリー別正答率</h3>
                        <div class="chart-container">
                            <canvas id="categoryCorrectRateChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-wrapper">
                        <h3 class="chart-title">カテゴリー別平均解答時間</h3>
                        <div class="chart-container">
                            <canvas id="categoryAverageTimeChart"></canvas>
                        </div>
                    </div>
                </div>
                <button id="backToAnalytics" class="back-button">分析メニューに戻る</button>
            </div>
        `;

        this.createCategoryCorrectRateChart(categoryStats);
        this.createCategoryAverageTimeChart(categoryStats);

        this.addEventListeners();
    }

    addEventListeners() {
        document.getElementById('backToAnalytics').addEventListener('click', () => this.app.showView('analytics'));
        document.getElementById('periodSelect').addEventListener('change', (e) => {
            this.selectedPeriod = e.target.value;
            this.updateCharts();
        });
    }

    async updateCharts() {
        const categoryStats = await this.calculateCategoryStats();
        this.createCategoryCorrectRateChart(categoryStats);
        this.createCategoryAverageTimeChart(categoryStats);
        document.querySelector('.stats-grid').innerHTML = this.renderCategoryStats(categoryStats);
    }

    async getUniqueCategories() {
        const quizSessions = await this.dataHandler.getQuizSessions();
        return [...new Set(quizSessions.map(session => session.category))];
    }

    async calculateCategoryStats() {
        const quizSessions = await this.dataHandler.getQuizSessions();
        const filteredSessions = this.filterSessionsByPeriod(quizSessions);

        const categoryStats = {};

        this.categories.forEach(category => {
            categoryStats[category] = {
                totalQuestions: 0,
                correctAnswers: 0,
                totalTime: 0,
                attempts: 0
            };
        });

        filteredSessions.forEach(session => {
            const stats = categoryStats[session.category];
            stats.totalQuestions += session.totalQuestions;
            stats.correctAnswers += session.correctAnswers;
            stats.totalTime += session.time;
            stats.attempts++;
        });

        Object.keys(categoryStats).forEach(category => {
            const stats = categoryStats[category];
            stats.correctRate = (stats.correctAnswers / stats.totalQuestions) * 100 || 0;
            stats.averageTime = stats.totalTime / stats.attempts || 0;
        });

        return categoryStats;
    }

    filterSessionsByPeriod(sessions) {
        const now = new Date();
        let startDate;

        switch (this.selectedPeriod) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                break;
            case 'year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                break;
            default:
                startDate = new Date(0); // 全期間
        }

        return sessions.filter(session => new Date(session.date) >= startDate);
    }

    renderCategoryStats(categoryStats) {
        const totalStats = Object.values(categoryStats).reduce((acc, stats) => {
            acc.totalQuestions += stats.totalQuestions;
            acc.correctAnswers += stats.correctAnswers;
            acc.totalTime += stats.totalTime;
            acc.attempts += stats.attempts;
            return acc;
        }, { totalQuestions: 0, correctAnswers: 0, totalTime: 0, attempts: 0 });

        const overallCorrectRate = (totalStats.correctAnswers / totalStats.totalQuestions) * 100 || 0;
        const overallAverageTime = totalStats.totalTime / totalStats.attempts || 0;

        return `
            <div class="stat-item">
                <h3>総問題数</h3>
                <p>${totalStats.totalQuestions}</p>
            </div>
            <div class="stat-item">
                <h3>全体正答率</h3>
                <p>${overallCorrectRate.toFixed(2)}%</p>
            </div>
            <div class="stat-item">
                <h3>全体平均解答時間</h3>
                <p>${overallAverageTime.toFixed(2)}秒</p>
            </div>
            <div class="stat-item">
                <h3>総解答回数</h3>
                <p>${totalStats.attempts}</p>
            </div>
        `;
    }

    createCategoryCorrectRateChart(categoryStats) {
        const ctx = document.getElementById('categoryCorrectRateChart').getContext('2d');
        if (this.correctRateChart) {
            this.correctRateChart.destroy();
        }
        this.correctRateChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(categoryStats),
                datasets: [{
                    label: '正答率',
                    data: Object.values(categoryStats).map(stats => stats.correctRate),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                            display: true,
                            text: '正答率 (%)'
                        }
                    }
                }
            }
        });
    }

    createCategoryAverageTimeChart(categoryStats) {
        const ctx = document.getElementById('categoryAverageTimeChart').getContext('2d');
        if (this.averageTimeChart) {
            this.averageTimeChart.destroy();
        }
        this.averageTimeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(categoryStats),
                datasets: [{
                    label: '平均解答時間',
                    data: Object.values(categoryStats).map(stats => stats.averageTime),
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '平均解答時間 (秒)'
                        }
                    }
                }
            }
        });
    }
}