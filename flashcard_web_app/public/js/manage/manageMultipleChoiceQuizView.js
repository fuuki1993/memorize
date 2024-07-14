class ManageMultipleChoiceQuizView {
    constructor(container, app) {
        this.container = container;
        this.app = app;
        this.dataHandler = new DataHandler();
        this.eventListenersInitialized = false;
        this.editingQuizId = null;
        this.isEditMode = false;
        this.render().then(() => this.initEventListeners());
    }

    async render() {
        const categoryOptions = await this.getCategoryOptions();
        this.container.innerHTML = `
            <div class="manage-quiz-container">
                <h2>多肢選択問題管理</h2>
                
                <div class="category-management">
                    <div class="input-group">
                        <input type="text" id="newCategoryInput" placeholder="新しいカテゴリー名">
                        <button id="addCategoryBtn">カテゴリー追加</button>
                    </div>
                    
                    <div class="input-group">
                        <select id="categorySelect">
                            <option value="">カテゴリーを選択</option>
                            ${categoryOptions}
                        </select>
                        <button id="deleteCategoryBtn">カテゴリー削除</button>
                    </div>
                </div>
                
                <div id="quizList" class="quiz-list">
                    <table>
                        <thead>
                            <tr>
                                <th>質問</th>
                                <th style="width: 210px;">操作</th>
                            </tr>
                        </thead>
                        <tbody id="quizTableBody">
                            <!-- クイズデータがここに挿入されます -->
                        </tbody>
                    </table>
                </div>
                
                <div class="question-management">
                    <textarea id="questionInput" placeholder="質問を入力"></textarea>
                    <div id="imageUploadArea" class="image-upload-area">
                        <input type="file" id="imageUpload" accept="image/*" style="display: none;">
                        <label for="imageUpload" class="image-upload-label">画像をドラッグ＆ドロップまたはクリックしてアップロード</label>
                        <div id="imagePreview" class="image-preview"></div>
                    </div>
                    <div id="choicesContainer">
                        <!-- 選択肢の入力欄とチェックボックスを動的に生成 -->
                    </div>
                    <button id="addChoiceBtn">選択肢を追加</button>
                    <div style="text-align: center;">
                        <button id="addQuestionBtn">問題を追加</button>
                        <button id="updateQuestionBtn" style="display: none;">問題を更新</button>
                    </div>
                </div>
                <button id="backButton" class="back-button">戻る</button>
            </div>
        `;

        this.renderChoices();
        await this.updateQuizList();
        this.initImageUpload();
    }

    initEventListeners() {
        if (!this.eventListenersInitialized) {
            this.addEventListeners();
            this.eventListenersInitialized = true;
        }
    }

    addEventListeners() {
        document.getElementById('addCategoryBtn').addEventListener('click', () => this.addCategory());
        document.getElementById('deleteCategoryBtn').addEventListener('click', () => this.deleteCategory());
        document.getElementById('addQuestionBtn').addEventListener('click', () => this.addQuestion());
        document.getElementById('updateQuestionBtn').addEventListener('click', () => this.updateQuestion());
        document.getElementById('categorySelect').addEventListener('change', () => this.updateQuizList());
        document.getElementById('backButton').addEventListener('click', () => this.app.showView('manageQuiz'));
        document.getElementById('addChoiceBtn').addEventListener('click', () => this.addChoice());
    }

    async updateQuizList() {
        const tableBody = document.getElementById('quizTableBody');
        const selectedCategory = document.getElementById('categorySelect').value;
        
        tableBody.innerHTML = '';
        
        if (selectedCategory) {
            try {
                const quizzes = await this.dataHandler.getQuizzesByCategory(selectedCategory, 'multipleChoice');
                quizzes.forEach(quiz => {
                    const row = tableBody.insertRow();
                    row.innerHTML = `
                        <td>${quiz.question}</td>
                        <td class="button-group">
                            <button class="addBtn" data-id="${quiz.id}">追加</button>
                            <button class="editBtn" data-id="${quiz.id}">編集</button>
                            <button class="deleteBtn" data-id="${quiz.id}">削除</button>
                        </td>
                    `;
                });
    
                tableBody.querySelectorAll('.addBtn').forEach(btn => {
                    btn.addEventListener('click', () => this.resetToAddMode());
                });
                tableBody.querySelectorAll('.editBtn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        await this.editQuestion(parseInt(e.target.dataset.id));
                    });
                });
                tableBody.querySelectorAll('.deleteBtn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        await this.deleteQuestion(parseInt(e.target.dataset.id));
                    });
                });
            } catch (error) {
                console.error('クイズの取得中にエラーが発生しました:', error);
                tableBody.innerHTML = '<tr><td colspan="2">クイズの読み込み中にエラーが発生しました。</td></tr>';
            }
        }
    }

    resetToAddMode() {
        this.clearInputs();
        this.editingQuizId = null;
        this.isEditMode = false;
        document.getElementById('addQuestionBtn').style.display = 'inline-block';
        document.getElementById('updateQuestionBtn').style.display = 'none';
        this.renderChoices();
    }

    clearInputs() {
        document.getElementById('questionInput').value = '';
        this.renderChoices();
        document.getElementById('imagePreview').innerHTML = '';
        this.uploadedImage = null;
    }

    async addCategory() {
        const newCategoryInput = document.getElementById('newCategoryInput');
        const newCategory = newCategoryInput.value.trim();

        if (newCategory) {
            try {
                await this.dataHandler.addCategory(newCategory, 'multipleChoice');
                await this.updateCategorySelect();
                newCategoryInput.value = '';
                alert('カテゴリーが追加されました。');
            } catch (error) {
                console.error('カテゴリーの追加中にエラーが発生しました:', error);
                alert('カテゴリーの追加に失敗しました。');
            }
        } else {
            alert('カテゴリー名を入力してください。');
        }
    }

    async deleteCategory() {
        const categorySelect = document.getElementById('categorySelect');
        const selectedCategory = categorySelect.value;

        if (selectedCategory) {
            try {
                const categories = await this.dataHandler.getCategories('multipleChoice');
                const categoryToDelete = categories.find(c => c.name === selectedCategory);
                if (categoryToDelete) {
                    const result = await this.dataHandler.deleteCategory(categoryToDelete.id, 'multipleChoice');
                    if (result) {
                        await this.updateCategorySelect();
                        await this.updateQuizList();
                        alert('カテゴリーが削除されました。');
                    } else {
                        throw new Error('カテゴリーの削除に失敗しました。');
                    }
                }
            } catch (error) {
                console.error('カテゴリーの削除中にエラーが発生しました:', error);
                alert('カテゴリーの削除に失敗しました。');
            }
        } else {
            alert('削除するカテゴリーを選択してください。');
        }
    }

    async addQuestion() {
        const categorySelect = document.getElementById('categorySelect');
        const questionInput = document.getElementById('questionInput');
        const choiceInputs = document.querySelectorAll('.choiceInput');
        const correctCheckboxes = document.querySelectorAll('.correctCheckbox');
    
        const category = categorySelect.value;
        const question = questionInput.value.trim();
        const choices = Array.from(choiceInputs).map(input => input.value.trim());
        const correctAnswers = Array.from(correctCheckboxes)
            .map((checkbox, index) => checkbox.checked ? index : -1)
            .filter(index => index !== -1);
    
        if (category && question && choices.every(choice => choice) && correctAnswers.length > 0) {
            try {
                await this.dataHandler.addMultipleChoiceQuiz(category, question, choices, correctAnswers, this.uploadedImage);
                await this.updateQuizList();
                this.clearInputs();
                alert('問題が追加されました。');
            } catch (error) {
                console.error('問題の追加中にエラーが発生しました:', error);
                alert('問題の追加中にエラーが発生しました。');
            }
        } else {
            alert('すべての項目を入力し、少なくとも1つの正解を選択してください。');
        }
    }

    async editQuestion(quizId) {
        try {
            const quiz = await this.dataHandler.getQuizById(quizId);
            console.log('編集するクイズデータ:', JSON.stringify(quiz));  // デバッグログを追加
            if (quiz && quiz.type === 'multipleChoice') {
                document.getElementById('questionInput').value = quiz.question;
                document.getElementById('categorySelect').value = quiz.category;
    
                // 正解情報の存在チェック
                if (!quiz.correctAnswers || quiz.correctAnswers.length === 0) {
                    console.error(`エラー: クイズID ${quiz.id} に正解情報がありません`);
                    alert('このクイズの正解情報が見つかりません。');
                    return;
                }
    
                // 選択肢と正解のチェックボックスを表示
                this.renderChoices(quiz.options, quiz.correctAnswers);
    
                // 画像の表示
                const imagePreview = document.getElementById('imagePreview');
                if (quiz.image) {
                    imagePreview.innerHTML = `<img src="${quiz.image}" alt="Quiz image">`;
                    this.uploadedImage = quiz.image;
                } else {
                    imagePreview.innerHTML = '';
                    this.uploadedImage = null;
                }
    
                this.editingQuizId = quizId;
                this.isEditMode = true;
                document.getElementById('addQuestionBtn').style.display = 'none';
                document.getElementById('updateQuestionBtn').style.display = 'inline-block';
            }
        } catch (error) {
            console.error('問題の編集中にエラーが発生しました:', error);
            alert('問題の編集に失敗しました。');
        }
    }

    async updateQuestion() {
        if (this.editingQuizId) {
            const categorySelect = document.getElementById('categorySelect');
            const questionInput = document.getElementById('questionInput');
            const choiceInputs = document.querySelectorAll('.choiceInput');
            const correctCheckboxes = document.querySelectorAll('.correctCheckbox');
    
            const category = categorySelect.value;
            const question = questionInput.value.trim();
            const choices = Array.from(choiceInputs).map(input => input.value.trim());
            const correctAnswers = Array.from(correctCheckboxes)
                .map((checkbox, index) => checkbox.checked ? index : -1)
                .filter(index => index !== -1);
    
            console.log('更新するクイズデータ:', {
                id: this.editingQuizId,
                category,
                question,
                choices,
                correctAnswers
            });  // デバッグログを追加
    
            if (category && question && choices.every(choice => choice) && correctAnswers.length > 0) {
                try {
                    const result = await this.dataHandler.updateMultipleChoiceQuiz(
                        this.editingQuizId, 
                        category, 
                        question, 
                        choices, 
                        correctAnswers, 
                        this.uploadedImage
                    );
                    if (result) {
                        await this.updateQuizList();
                        this.resetToAddMode();
                        alert('問題が更新されました。');
                    } else {
                        throw new Error('問題の更新に失敗しました。');
                    }
                } catch (error) {
                    console.error('問題の更新中にエラーが発生しました:', error);
                    alert('問題の更新に失敗しました。');
                }
            } else {
                alert('すべての項目を入力し、少なくとも1つの正解を選択してください。');
            }
        }
    }

    cancelEdit() {
        this.resetToAddMode();
    }

    async deleteQuestion(quizId) {
        if (confirm('本当にこの問題を削除しますか？')) {
            try {
                const result = await this.dataHandler.deleteQuiz(quizId);
                if (result) {
                    await this.updateQuizList();
                    alert('問題が削除されました。');
                } else {
                    throw new Error('削除に失敗しました。');
                }
            } catch (error) {
                console.error('問題の削除中にエラーが発生しました:', error);
                alert('問題の削除に失敗しました。');
            }
        }
    }

    async getCategoryOptions() {
        try {
            const categories = await this.dataHandler.getCategories('multipleChoice');
            return categories
                .map(category => `<option value="${category.name}">${category.name}</option>`)
                .join('');
        } catch (error) {
            console.error('カテゴリーの取得中にエラーが発生しました:', error);
            return '';
        }
    }

    async updateCategorySelect() {
        const categorySelect = document.getElementById('categorySelect');
        categorySelect.innerHTML = `
            <option value="">カテゴリーを選択</option>
            ${await this.getCategoryOptions()}
        `;
    }

    initImageUpload() {
        const imageUploadArea = document.getElementById('imageUploadArea');
        const imageUpload = document.getElementById('imageUpload');
        const imagePreview = document.getElementById('imagePreview');

        imageUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            imageUploadArea.classList.add('dragover');
        });

        imageUploadArea.addEventListener('dragleave', () => {
            imageUploadArea.classList.remove('dragover');
        });

        imageUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            imageUploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            this.handleImageUpload(file);
        });

        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            this.handleImageUpload(file);
        });
    }

    handleImageUpload(file) {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.uploadedImage = e.target.result;
                document.getElementById('imagePreview').innerHTML = `<img src="${this.uploadedImage}" alt="Uploaded image">`;
            };
            reader.readAsDataURL(file);
        }
    }

    renderChoices(choices = ['', '', '', ''], correctAnswers = []) {
        const choicesContainer = document.getElementById('choicesContainer');
        choicesContainer.innerHTML = choices.map((choice, index) => `
            <div class="choice-input-group">
                <input type="checkbox" id="correctCheckbox${index}" class="correctCheckbox" ${correctAnswers.includes(index) ? 'checked' : ''}>
                <input type="text" id="choiceInput${index}" class="choiceInput" placeholder="選択肢${index + 1}" value="${choice}">
            </div>
        `).join('');
    }

    addChoice() {
        const choicesContainer = document.getElementById('choicesContainer');
        const newIndex = choicesContainer.children.length + 1;
        const newChoiceElement = document.createElement('div');
        newChoiceElement.className = 'choice-input-group';
        newChoiceElement.innerHTML = `
            <input type="checkbox" id="correctCheckbox${newIndex}" class="correctCheckbox">
            <input type="text" id="choiceInput${newIndex}" class="choiceInput" placeholder="選択肢${newIndex}">
        `;
        choicesContainer.appendChild(newChoiceElement);
    }
}