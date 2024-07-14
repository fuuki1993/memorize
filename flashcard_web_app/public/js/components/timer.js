// timer.js
class TimerManager {
    constructor() {
        this.timerElement = document.getElementById('timerDisplay');
        this.timerInterval = null;
        this.remainingTime = 0;
    }

    showTimerDialog(callback) {
        const dialog = document.createElement('div');
        dialog.innerHTML = `
            <h3>学習セッション時間の設定</h3>
            <input type="number" id="sessionTimeInput" value="5" min="1">
            <button id="startSessionBtn">セッション開始</button>
        `;
        document.body.appendChild(dialog);

        document.getElementById('startSessionBtn').addEventListener('click', () => {
            const minutes = parseInt(document.getElementById('sessionTimeInput').value, 10);
            this.remainingTime = minutes * 60;
            document.body.removeChild(dialog);
            callback();
        });
    }

    startTimer() {
        this.updateTimerDisplay();
        this.timerInterval = setInterval(() => {
            this.remainingTime--;
            this.updateTimerDisplay();
            if (this.remainingTime <= 0) {
                this.stopTimer();
            }
        }, 1000);
    }

    stopTimer() {
        clearInterval(this.timerInterval);
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        this.timerElement.textContent = `残り時間: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}