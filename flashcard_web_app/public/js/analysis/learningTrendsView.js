class LearningTrendsView {
    constructor(container, app) {
        this.container = container;
        this.app = app;
        this.dataHandler = app.dataHandler;
        this.currentPeriod = 'all'; // デフォルトは全期間
        this.charts = {}; // チャートオブジェクトを保存するためのオブジェクト
        this.render();
    }

    async render() {
        this.container.innerHTML = `
            <div class="analysis-container">
                <h2 class="analysis-title">学習トレンド</h2>
                <div class="period-selector">
                    <label for="periodSelect">期間選択:</label>
                    <select id="periodSelect">
                        <option value="all">全期間</option>
                        <option value="week">過去1週間</option>
                        <option value="month">過去1ヶ月</option>
                        <option value="year">過去1年</option>
                    </select>
                </div>
                <div class="charts-container">
                    <div class="chart-wrapper">
                        <h3 class="chart-title">日別学習回数</h3>
                        <div class="chart-container">
                            <canvas id="dailySessionsChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-wrapper">
                        <h3 class="chart-title">正答率の推移</h3>
                        <div class="chart-container">
                            <canvas id="correctRateTrendChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-wrapper">
                        <h3 class="chart-title">平均解答時間の推移</h3>
                        <div class="chart-container">
                            <canvas id="avgTimeTrendChart"></canvas>
                        </div>
                    </div>
                </div>
                <div class="stats-summary">
                    <h3>期間サマリー</h3>
                    <div id="statsSummary"></div>
                </div>
                <button id="backToAnalytics" class="back-button">分析メニューに戻る</button>
            </div>
        `;

        this.addEventListeners();
        await this.updateCharts();
    }

    addEventListeners() {
        document.getElementById('periodSelect').addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.updateCharts();
        });
        document.getElementById('backToAnalytics').addEventListener('click', () => this.app.showView('analytics'));
    }

    async updateCharts() {
        const trends = await this.calculateTrends();
        console.log('Calculated trends:', trends); // デバッグ用ログ
        this.createDailySessionsChart(trends.dailySessions);
        this.createCorrectRateTrendChart(trends.correctRateTrend);
        this.createAvgTimeTrendChart(trends.avgTimeTrend);
        this.updateStatsSummary(trends);
    }

    async calculateTrends() {
        const quizSessions = await this.filterSessionsByPeriod(await this.dataHandler.getQuizSessions());
        console.log('Filtered quiz sessions:', quizSessions); // デバッグ用ログ
        const dailySessions = this.calculateDailySessions(quizSessions);
        const correctRateTrend = this.calculateCorrectRateTrend(quizSessions);
        const avgTimeTrend = this.calculateAvgTimeTrend(quizSessions);

        return {
            dailySessions,
            correctRateTrend,
            avgTimeTrend,
            quizSessions
        };
    }

    filterSessionsByPeriod(sessions) {
        const now = new Date();
        let startDate;

        switch (this.currentPeriod) {
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
                return sessions; // 全期間の場合はフィルタリングしない
        }

        return sessions.filter(session => new Date(session.date) >= startDate);
    }

    calculateDailySessions(quizSessions) {
        const dailyCounts = {};
        quizSessions.forEach(session => {
            const date = this.formatDate(new Date(session.date));
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });
        return Object.entries(dailyCounts).map(([date, count]) => ({ x: date, y: count }));
    }

    calculateCorrectRateTrend(quizSessions) {
        const sortedSessions = quizSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
        return sortedSessions.map(session => ({
            x: this.formatDate(new Date(session.date)),
            y: (session.correctAnswers / session.totalQuestions) * 100
        }));
    }

    calculateAvgTimeTrend(quizSessions) {
        const sortedSessions = quizSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
        return sortedSessions.map(session => ({
            x: this.formatDate(new Date(session.date)),
            y: session.time / session.totalQuestions
        }));
    }

    formatDate(date) {
        return date.toISOString().split('T')[0]; // 'YYYY-MM-DD' 形式を返す
    }

    createDailySessionsChart(dailySessions) {
        console.log('Daily sessions data:', dailySessions); // デバッグ用ログ
        const ctx = document.getElementById('dailySessionsChart').getContext('2d');
        
        if (this.charts.dailySessions) {
            this.charts.dailySessions.destroy();
        }

        this.charts.dailySessions = new Chart(ctx, {
            type: 'bar',
            data: {
                datasets: [{
                    label: '学習回数',
                    data: dailySessions,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            parser: 'yyyy-MM-dd',
                            displayFormats: {
                                day: 'yyyy-MM-dd'
                            }
                        },
                        title: {
                            display: true,
                            text: '日付'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '学習回数'
                        }
                    }
                }
            }
        });
    }

    createCorrectRateTrendChart(correctRateTrend) {
        console.log('Correct rate trend data:', correctRateTrend); // デバッグ用ログ
        const ctx = document.getElementById('correctRateTrendChart').getContext('2d');
        
        if (this.charts.correctRateTrend) {
            this.charts.correctRateTrend.destroy();
        }

        this.charts.correctRateTrend = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: '正答率',
                    data: correctRateTrend,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            parser: 'yyyy-MM-dd',
                            displayFormats: {
                                day: 'yyyy-MM-dd'
                            }
                        },
                        title: {
                            display: true,
                            text: '日付'
                        }
                    },
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

    createAvgTimeTrendChart(avgTimeTrend) {
        console.log('Average time trend data:', avgTimeTrend); // デバッグ用ログ
        const ctx = document.getElementById('avgTimeTrendChart').getContext('2d');
        
        if (this.charts.avgTimeTrend) {
            this.charts.avgTimeTrend.destroy();
        }

        this.charts.avgTimeTrend = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: '平均解答時間',
                    data: avgTimeTrend,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            parser: 'yyyy-MM-dd',
                            displayFormats: {
                                day: 'yyyy-MM-dd'
                            }
                        },
                        title: {
                            display: true,
                            text: '日付'
                        }
                    },
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

    updateStatsSummary(trends) {
        const sessions = trends.quizSessions;
        const totalSessions = sessions.length;
        const totalQuestions = sessions.reduce((sum, session) => sum + session.totalQuestions, 0);
        const totalCorrect = sessions.reduce((sum, session) => sum + session.correctAnswers, 0);
        const totalTime = sessions.reduce((sum, session) => sum + session.time, 0);

        const averageCorrectRate = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
        const averageTime = totalQuestions > 0 ? totalTime / totalQuestions : 0;

        const summaryHTML = `
            <p>総セッション数: ${totalSessions}</p>
            <p>総問題数: ${totalQuestions}</p>
            <p>平均正答率: ${averageCorrectRate.toFixed(2)}%</p>
            <p>平均解答時間: ${averageTime.toFixed(2)}秒</p>
        `;

        document.getElementById('statsSummary').innerHTML = summaryHTML;
    }
}