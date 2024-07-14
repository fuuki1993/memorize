// modal.js
class ModalManager {
    constructor() {
        this.modalContainer = document.createElement('div');
        this.modalContainer.id = 'modalContainer';
        this.modalContainer.style.display = 'none';
        document.body.appendChild(this.modalContainer);
    }

    showModal(content) {
        this.modalContainer.innerHTML = `
            <div class="modal">
                <div class="modal-content">
                    ${content}
                    <button class="close-modal">閉じる</button>
                </div>
            </div>
        `;
        this.modalContainer.style.display = 'flex';
        document.querySelector('.close-modal').addEventListener('click', () => this.closeModal());
    }

    closeModal() {
        this.modalContainer.style.display = 'none';
    }

    showResults(results) {
        const content = `
            <h2>クイズ結果</h2>
            <p>タイプ: ${results.type}</p>
            <p>スコア: ${results.score} / ${results.total}</p>
            <p>正答率: ${((results.score / results.total) * 100).toFixed(2)}%</p>
        `;
        this.showModal(content);
    }
}