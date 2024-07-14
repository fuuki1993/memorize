class TimeAnalysisView {
    constructor(container, app) {
        this.container = container;
        this.app = app;
        this.dataHandler = app.dataHandler;
        this.render();
    }

    async render() {
        const timeData = await this.calculateTimeData();
        this.container.innerHTML = `
            <div class="analysis-container">
                <h2 class="analysis-title">時間帯分析</h2>
                <div class="charts-container">
                    <div class="chart-wrapper">
                        <h3 class="chart-title">時間帯別学習回数</h3>
                        <div class="chart-container">
                            <canvas id="studyCountByHour"></canvas>
                        </div>
                    </div>
                    <div class="chart-wrapper">
                        <h3 class="chart-title">時間帯別正答率</h3>
                        <div class="chart-container">
                            <canvas id="correctRateByHour"></canvas>
                        </div>
                    </div>
                </div>
                <div class="stats-summary">
                    <h3>学習時間帯の傾向</h3>
                    <p>最も学習回数が多い時間帯: ${timeData.mostActiveHour}時</p>
                    <p>最も正答率が高い時間帯: ${timeData.bestPerformanceHour}時</p>
                </div>
                <button id="backToAnalytics" class="back-button">分析メニューに戻る</button>
            </div>
        `;

        this.createStudyCountByHourChart(timeData.studyCountByHour);
        this.createCorrectRateByHourChart(timeData.correctRateByHour);

        document.getElementById('backToAnalytics').addEventListener('click', () => this.app.showView('analytics'));
    }

    async calculateTimeData() {
        const quizSessions = await this.dataHandler.getQuizSessions();
        const studyCountByHour = new Array(24).fill(0);
        const correctAnswersByHour = new Array(24).fill(0);
        const totalQuestionsByHour = new Array(24).fill(0);

        quizSessions.forEach(session => {
            const hour = new Date(session.date).getHours();
            studyCountByHour[hour]++;
            correctAnswersByHour[hour] += session.correctAnswers;
            totalQuestionsByHour[hour] += session.totalQuestions;
        });

        const correctRateByHour = correctAnswersByHour.map((correct, index) => 
            totalQuestionsByHour[index] > 0 ? (correct / totalQuestionsByHour[index]) * 100 : 0
        );

        const mostActiveHour = studyCountByHour.indexOf(Math.max(...studyCountByHour));
        const bestPerformanceHour = correctRateByHour.indexOf(Math.max(...correctRateByHour));

        return {
            studyCountByHour,
            correctRateByHour,
            mostActiveHour,
            bestPerformanceHour
        };
    }

    createStudyCountByHourChart(studyCountByHour) {
        const ctx = document.getElementById('studyCountByHour').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}時`),
                datasets: [{
                    label: '学習回数',
                    data: studyCountByHour,
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
                            text: '学習回数'
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

    createCorrectRateByHourChart(correctRateByHour) {
        const ctx = document.getElementById('correctRateByHour').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 24}, (_, i) => `${i}時`),
                datasets: [{
                    label: '正答率',
                    data: correctRateByHour,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
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