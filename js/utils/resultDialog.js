class ResultDialog {
    constructor(title, results, onClose) {
        this.title = title;
        this.results = results;
        this.onClose = onClose;
        this.render();
    }

    render() {
        const dialog = document.createElement('div');
        dialog.className = 'result-dialog-overlay';
        dialog.innerHTML = `
            <div class="result-dialog">
                <h2>${this.title}</h2>
                ${this.results.map(result => `<p>${result.label}: ${result.value}</p>`).join('')}
                <div class="result-dialog-button-container">
                    <button id="closeResultDialog" class="close-result-dialog">閉じる</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        document.getElementById('closeResultDialog').addEventListener('click', () => {
            document.body.removeChild(dialog);
            this.onClose();
        });
    }
}