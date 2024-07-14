class BasicStatsView {
    constructor(container, app) {
        this.container = container;
        this.app = app;
        this.dataHandler = app.dataHandler;
        this.render();
    }

    async render() {
        const stats = await this.calculateStats();
        this.container.innerHTML = `
            <div class="analysis-container">
                <h2 class="analysis-title">基本統計</h2>
                <div class="stats-grid">
                    <div class="stat-item">
                        <h3>総問題数</h3>
                        <p>${stats.totalQuizzes}</p>
                    </div>
                    <div class="stat-item">
                        <h3>総解答回数</h3>
                        <p>${stats.totalAttempts}</p>
                    </div>
                    <div class="stat-item">
                        <h3>正答率</h3>
                        <p>${stats.correctRate.toFixed(2)}%</p>
                    </div>
                    <div class="stat-item">
                        <h3>平均解答時間</h3>
                        <p>${stats.averageTime.toFixed(2)}秒</p>
                    </div>
                </div>
                <div class="charts-container">
                    <div class="chart-wrapper">
                        <h3 class="chart-title">カテゴリー別問題数</h3>
                        <div class="chart-container">
                            <canvas id="quizzesByCategory"></canvas>
                        </div>
                    </div>
                    <div class="chart-wrapper">
                        <h3 class="chart-title">正答率の推移</h3>
                        <div class="chart-container">
                            <canvas id="correctRateOverTime"></canvas>
                        </div>
                    </div>
                </div>
                <button id="backToAnalytics" class="back-button">分析メニューに戻る</button>
            </div>
        `;

        this.createQuizzesByCategoryChart(stats.quizzesByCategory);
        this.createCorrectRateOverTimeChart(stats.correctRateOverTime);

        document.getElementById('backToAnalytics').addEventListener('click', () => this.app.showView('analytics'));
    }

    async calculateStats() {
        const quizSessions = await this.dataHandler.getQuizSessions();
        const quizzes = await this.dataHandler.getQuizzes();
        const totalQuizzes = quizzes.length;
        const totalAttempts = quizSessions.length;
        let correctAnswers = 0;
        let totalTime = 0;

        quizSessions.forEach(session => {
            correctAnswers += session.correctAnswers;
            totalTime += session.time;
        });

        const correctRate = (correctAnswers / (totalAttempts * totalQuizzes)) * 100;
        const averageTime = totalTime / totalAttempts;

        // カテゴリー別問題数を計算
        const quizzesByCategory = {};
        quizzes.forEach(quiz => {
            if (quizzesByCategory[quiz.category]) {
                quizzesByCategory[quiz.category]++;
            } else {
                quizzesByCategory[quiz.category] = 1;
            }
        });

        // 正答率の推移を計算
        const correctRateOverTime = this.calculateCorrectRateOverTime(quizSessions);

        return {
            totalQuizzes,
            totalAttempts,
            correctRate,
            averageTime,
            quizzesByCategory,
            correctRateOverTime
        };
    }

    calculateCorrectRateOverTime(quizSessions) {
        const sortedSessions = quizSessions.sort((a, b) => a.date - b.date);
        const correctRateOverTime = [];
        let totalCorrect = 0;
        let totalQuestions = 0;

        sortedSessions.forEach((session, index) => {
            totalCorrect += session.correctAnswers;
            totalQuestions += session.totalQuestions;
            const correctRate = (totalCorrect / totalQuestions) * 100;
            correctRateOverTime.push({
                date: new Date(session.date).toLocaleDateString(),
                correctRate: correctRate
            });
        });

        return correctRateOverTime;
    }

    createQuizzesByCategoryChart(quizzesByCategory) {
        const ctx = document.getElementById('quizzesByCategory').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(quizzesByCategory),
                datasets: [{
                    label: '問題数',
                    data: Object.values(quizzesByCategory),
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '問題数'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    createCorrectRateOverTimeChart(correctRateOverTime) {
        const ctx = document.getElementById('correctRateOverTime').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: correctRateOverTime.map(data => data.date),
                datasets: [{
                    label: '正答率',
                    data: correctRateOverTime.map(data => data.correctRate),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
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
}