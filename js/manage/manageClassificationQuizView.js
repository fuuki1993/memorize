class ManageClassificationQuizView {
    constructor(container, app) {
        this.container = container;
        this.app = app;
        this.dataHandler = new DataHandler();
        this.selectedCategoryId = null;
        this.currentImageData = null;
        this.render().then(() => this.initEventListeners());
    }

    async render() {
        try {
            const categoryOptions = await this.getCategoryOptions();
            const classificationOptions = await this.getClassificationOptions();

            this.container.innerHTML = `
                <div class="manage-quiz-container">
                    <h2>分類問題追加</h2>
                    
                    <div class="input-group">
                        <div class="input-wrapper">
                            <input type="text" id="newCategoryNameInput" placeholder="新しいカテゴリー名">
                            <button id="addCategoryBtn">カテゴリーを追加</button>
                        </div>
                        <div class="input-wrapper">
                            <select id="categorySelect">
                                <option value="">カテゴリーを選択</option>
                                ${categoryOptions}
                            </select>
                            <div class="input-wrapper">
                                <button id="deleteCategoryBtn">カテゴリーを削除</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="classification-input-group">
                        <div class="left-column">
                            <input type="text" id="newClassificationInput" placeholder="新しい分類名">
                            <button id="addClassificationBtn">分類を追加</button>
                        </div>
                        <div class="right-column">
                            <div id="imageUploadArea" class="image-upload-area">
                                <input type="file" id="classificationImageInput" accept="image/*" hidden>
                                <label for="classificationImageInput">画像をアップロード</label>
                            </div>
                        </div>
                    </div>
                    
                    <div class="input-group">
                        <div class="input-wrapper">
                            <select id="deleteClassificationSelect">
                                <option value="">削除する分類</option>
                                ${classificationOptions}
                            </select>
                            <button id="deleteClassificationBtn">分類を削除</button>
                        </div>
                        <div class="input-wrapper">
                            <input type="text" id="newItemInput" placeholder="項目内容">
                            <button id="addItemBtn">項目を追加</button>
                        </div>
                    </div>
                    
                    <div class="classification-container">
                        <div class="classification-lists">
                            <div id="classificationList" class="classification-list">
                            </div>
                            <div id="unclassifiedList" class="unclassified-list">
                                <h4>未分類の項目:</h4>
                                <ul></ul>
                            </div>
                        </div>
                    </div>
                    
                    <button id="backButton" class="back-button">戻る</button>
                </div>
            `;
        
            await this.updateClassificationList();
            await this.updateUnclassifiedList();
        } catch (error) {
            console.error('Error in render method:', error);
        }
    }

    initEventListeners() {
        console.log('イベントリスナーを初期化しています'); // デバッグ用
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => this.addCategory());
        }

        const categorySelect = document.getElementById('categorySelect');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => this.onCategorySelect(e.target.value));
        }

        const deleteCategoryBtn = document.getElementById('deleteCategoryBtn');
        if (deleteCategoryBtn) {
            deleteCategoryBtn.addEventListener('click', () => this.deleteCategory());
        }

        const addClassificationBtn = document.getElementById('addClassificationBtn');
        if (addClassificationBtn) {
            addClassificationBtn.addEventListener('click', () => {
                console.log('分類を追加ボタンがクリックされました'); // デバッグ用
                this.addClassification();
            });
        }

        const deleteClassificationBtn = document.getElementById('deleteClassificationBtn');
        if (deleteClassificationBtn) {
            deleteClassificationBtn.addEventListener('click', () => this.deleteClassification());
        }

        const addItemBtn = document.getElementById('addItemBtn');
        if (addItemBtn) {
            addItemBtn.addEventListener('click', () => this.addItem());
        }

        const backButton = document.getElementById('backButton');
        if (backButton) {
            backButton.addEventListener('click', () => this.app.showView('manageQuiz'));
        }

        this.initDragAndDrop();

        const imageUploadArea = document.getElementById('imageUploadArea');
        const classificationImageInput = document.getElementById('classificationImageInput');

        if (imageUploadArea) {
            imageUploadArea.addEventListener('dragover', this.onDragOver.bind(this));
            imageUploadArea.addEventListener('drop', this.onImageDrop.bind(this));
        }

        if (classificationImageInput) {
            classificationImageInput.addEventListener('change', this.onImageSelect.bind(this));
        }
    }

    initDragAndDrop() {
        const classificationList = document.getElementById('classificationList');
        const unclassifiedList = document.getElementById('unclassifiedList');

        if (classificationList) {
            classificationList.addEventListener('dragover', this.onDragOver.bind(this));
            classificationList.addEventListener('drop', this.onDrop.bind(this));
        }

        if (unclassifiedList) {
            unclassifiedList.addEventListener('dragover', this.onDragOver.bind(this));
            unclassifiedList.addEventListener('drop', this.onDrop.bind(this));
        }
    }

    onDragOver(e) {
        e.preventDefault();
    }

    async onDrop(e) {
        e.preventDefault();
        const itemId = e.dataTransfer.getData('text/plain');
        const targetClassification = e.target.closest('.classification-item');
        const targetUnclassified = e.target.closest('#unclassifiedList');

        try {
            if (targetClassification) {
                const classificationId = targetClassification.dataset.id;
                await this.dataHandler.assignItemToClassification(itemId, classificationId);
            } else if (targetUnclassified) {
                await this.dataHandler.removeItemFromClassification(itemId);
            }

            await this.updateClassificationList();
            await this.updateUnclassifiedList();
        } catch (error) {
            console.error('項目の移動中にエラーが発生しました:', error);
            alert('項目の移動中にエラーが発生しました。');
        }
    }

    onImageDrop(e) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            this.handleImageUpload(file);
        }
    }

    onImageSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleImageUpload(file);
        }
    }

    handleImageUpload(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.compressImage(e.target.result, (compressedImage) => {
                this.currentImageData = compressedImage;
                this.updateImagePreview(compressedImage);
                console.log('画像がアップロードされました:', compressedImage.substring(0, 50) + '...'); // デバッグ用
            });
        };
        reader.readAsDataURL(file);
    }

    compressImage(src, callback) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxWidth = 800; // 最大幅を設定
            const maxHeight = 600; // 最大高さを設定
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }

            canvas.width = width;
            canvas.height = height;

            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
                const reader = new FileReader();
                reader.onloadend = function() {
                    callback(reader.result);
                }
                reader.readAsDataURL(blob);
            }, 'image/jpeg', 0.7); // JPEG形式で品質70%に圧縮
        }
        img.src = src;
    }

    updateImagePreview(imageData) {
        const imageUploadArea = document.getElementById('imageUploadArea');
        const existingPreview = imageUploadArea.querySelector('.image-preview');
        if (existingPreview) {
            existingPreview.remove();
        }

        const label = imageUploadArea.querySelector('label');
        if (imageData) {
            const img = document.createElement('img');
            img.src = imageData;
            img.classList.add('image-preview');
            imageUploadArea.appendChild(img);
            label.textContent = '画像を変更';
        } else {
            label.textContent = '画像をアップロード';
        }
    }

    async addCategory() {
        const input = document.getElementById('newCategoryNameInput');
        const name = input.value.trim();
        if (name) {
            try {
                const newCategory = await this.dataHandler.addCategory(name, 'classification');
                input.value = '';
                await this.updateCategorySelect();
                this.selectedCategoryId = newCategory.id;
                document.getElementById('categorySelect').value = newCategory.id;
                await this.updateClassificationList();
                await this.updateUnclassifiedList();
            } catch (error) {
                console.error('カテゴリーの追加中にエラーが発生しました:', error);
                alert('カテゴリーの追加中にエラーが発生しました。');
            }
        } else {
            alert('カテゴリー名を入力してください。');
        }
    }

    onCategorySelect(categoryId) {
        this.selectedCategoryId = categoryId ? parseInt(categoryId) : null;
        this.updateClassificationList();
        this.updateUnclassifiedList();
        this.updateClassificationSelect(); // 追加
    }

    async addClassification() {
        console.log('addClassification メソッドが呼び出されました');
        if (!this.selectedCategoryId) {
            alert('カテゴリーを選択してください。');
            return;
        }
        const input = document.getElementById('newClassificationInput');
        const name = input.value.trim();
        if (name) {
            console.log('追加前の画像データ:', this.currentImageData ? this.currentImageData.substring(0, 50) + '...' : 'なし');
            try {
                const newClassification = await this.dataHandler.addClassification(name, this.selectedCategoryId, this.currentImageData);
                console.log('追加された分類:', newClassification);
                input.value = '';
                await this.updateClassificationList();
                await this.updateClassificationSelect();
                
                // 画像プレビューをリセット
                this.currentImageData = null;
                this.updateImagePreview(null);
            } catch (error) {
                console.error('分類の追加中にエラーが発生しました:', error);
                alert('分類の追加中にエラーが発生しました。');
            }
        } else {
            alert('分類名を入力してください。');
        }
    }

    async deleteClassification() {
        const select = document.getElementById('deleteClassificationSelect');
        const classificationId = select.value;
        if (classificationId) {
            if (confirm('この分類を削除してもよろしいですか？')) {
                try {
                    await this.dataHandler.deleteClassification(parseInt(classificationId));
                    await this.updateClassificationList();
                    await this.updateClassificationSelect();
                    await this.updateUnclassifiedList();
                } catch (error) {
                    console.error('分類の削除中にエラーが発生しました:', error);
                    alert('分類の削除中にエラーが発生しました。');
                }
            }
        } else {
            alert('削除する分類を選択してください。');
        }
    }

    deleteCategory() {
        if (!this.selectedCategoryId) {
            alert('カテゴリーを選択してください。');
            return;
        }
        if (confirm('このカテゴリーを削除してもよろしいですか？')) {
            try {
                this.dataHandler.deleteCategory(this.selectedCategoryId, 'classification');
                this.selectedCategoryId = null;
                this.updateCategorySelect();
                this.updateClassificationList();
                this.updateUnclassifiedList();
                this.updateClassificationSelect();
            } catch (error) {
                console.error('カテゴリーの削除中にエラーが発生しました:', error);
                alert('カテゴリーの削除中にエラーが発生しました。');
            }
        }
    }

    async addItem() {
        if (!this.selectedCategoryId) {
            alert('カテゴリーを選択してください。');
            return;
        }
        const input = document.getElementById('newItemInput');
        const content = input.value.trim();
        if (content) {
            try {
                await this.dataHandler.addItem(content, this.selectedCategoryId);
                input.value = '';
                await this.updateUnclassifiedList();
            } catch (error) {
                console.error('項目の追加中にエラーが発生しました:', error);
                alert('項目の追加中にエラーが発生しました。');
            }
        } else {
            alert('項目内容を入力してください。');
        }
    }

    async updateCategorySelect() {
        const select = document.getElementById('categorySelect');
        const categoryOptions = await this.getCategoryOptions();
        select.innerHTML = `
            <option value="">カテゴリーを選択</option>
            ${categoryOptions}
        `;
    }

    async updateClassificationSelect() {
        const select = document.getElementById('deleteClassificationSelect');
        if (this.selectedCategoryId) {
            try {
                const classifications = await this.dataHandler.getClassifications();
                const filteredClassifications = classifications.filter(c => c.categoryId === this.selectedCategoryId);
                select.innerHTML = `
                    <option value="">削除する分類</option>
                    ${filteredClassifications.map(classification => `<option value="${classification.id}">${classification.name}</option>`).join('')}
                `;
            } catch (error) {
                console.error('分類の取得中にエラーが発生しました:', error);
                select.innerHTML = '<option value="">エラーが発生しました</option>';
            }
        } else {
            select.innerHTML = '<option value="">削除する分類</option>';
        }
    }

    async updateClassificationList() {
        console.log('updateClassificationList メソッドが呼び出されました');
        const list = document.getElementById('classificationList');
        if (this.selectedCategoryId) {
            try {
                const classifications = await this.dataHandler.getClassifications();
                const filteredClassifications = classifications.filter(c => c.categoryId === this.selectedCategoryId);
                console.log('表示する分類:', filteredClassifications);
                
                const items = await this.dataHandler.getItems(this.selectedCategoryId);
                
                list.innerHTML = filteredClassifications.map(classification => {
                    const classificationItems = items.filter(item => item.classificationId === classification.id);
                    const itemsHtml = classificationItems.map(item => `
                        <li draggable="true" data-id="${item.id}">
                            <span class="item-content">${item.content}</span>
                            <button class="deleteItemBtn" data-id="${item.id}" aria-label="削除"></button>
                        </li>
                    `).join('');

                    const imageHtml = classification.image 
                        ? `<img src="${classification.image}" alt="${classification.name}" class="classification-image">`
                        : '';

                    return `
                        <div class="classification-item" data-id="${classification.id}">
                            ${imageHtml}
                            <span>${classification.name}</span>
                            <ul>${itemsHtml}</ul>
                        </div>
                    `;
                }).join('');

                this.addDragListeners(list.querySelectorAll('li'));
                this.addDeleteItemListeners(list.querySelectorAll('.deleteItemBtn'));
            } catch (error) {
                console.error('分類リストの更新中にエラーが発生しました:', error);
                list.innerHTML = '<p>エラーが発生しました。</p>';
            }
        } else {
            list.innerHTML = '<p>カテゴリーを選択してください。</p>';
        }
    }

    async updateUnclassifiedList() {
        const list = document.getElementById('unclassifiedList').querySelector('ul');
        if (this.selectedCategoryId) {
            try {
                const unclassifiedItems = await this.dataHandler.getUnclassifiedItems(this.selectedCategoryId);
                list.innerHTML = unclassifiedItems.map(item => `
                    <li draggable="true" data-id="${item.id}">
                        <span class="item-content">${item.content}</span>
                        <button class="deleteItemBtn" data-id="${item.id}" aria-label="削除"></button>
                    </li>
                `).join('');

                this.addDragListeners(list.querySelectorAll('li'));
                this.addDeleteItemListeners(list.querySelectorAll('.deleteItemBtn'));
            } catch (error) {
                console.error('未分類項目の取得中にエラーが発生しました:', error);
                list.innerHTML = '<li>エラーが発生しました。</li>';
            }
        } else {
            list.innerHTML = '<li>カテゴリーを選択してください。</li>';
        }
    }

    addDragListeners(elements) {
        elements.forEach(element => {
            element.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
            });
        });

        const dropTargets = document.querySelectorAll('.classification-item, #unclassifiedList');
        dropTargets.forEach(target => {
            target.addEventListener('dragenter', (e) => {
                e.preventDefault();
                target.classList.add('drag-over');
            });
            target.addEventListener('dragleave', (e) => {
                e.preventDefault();
                target.classList.remove('drag-over');
            });
            target.addEventListener('drop', (e) => {
                e.preventDefault();
                target.classList.remove('drag-over');
            });
        });
    }

    addDeleteItemListeners(buttons) {
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.dataset.id;
                if (confirm('この項目を削除してもよろしいですか？')) {
                    this.dataHandler.deleteItem(itemId);
                    this.updateClassificationList();
                    this.updateUnclassifiedList();
                }
            });
        });
    }

    async getCategoryOptions() {
        const categories = await this.dataHandler.getCategories('classification');
        return categories
            .map(category => `<option value="${category.id}">${category.name}</option>`)
            .join('');
    }

    async getClassificationOptions() {
        if (this.selectedCategoryId) {
            const classifications = await this.dataHandler.getClassifications();
            return classifications
                .filter(classification => classification.categoryId === this.selectedCategoryId)
                .map(classification => `<option value="${classification.id}">${classification.name}</option>`)
                .join('');
        }
        return '';
    }
}