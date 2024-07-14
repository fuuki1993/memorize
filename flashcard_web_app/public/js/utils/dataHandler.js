// dataHandler.js
class DataHandler {
    constructor() {
        this.dbName = 'QuizAppDB';
        this.dbVersion = 5; // バージョンを5に増やす
        this.db = null;
    }

    async openDatabase() {
        if (this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error("IndexedDB error:", event.target.error);
                reject("IndexedDB error");
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("IndexedDB opened successfully");
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                console.log("Upgrading database...");
                
                if (!this.db.objectStoreNames.contains('classifications')) {
                    console.log("Creating 'classifications' object store");
                    this.db.createObjectStore('classifications', { keyPath: 'id' });
                }
                if (!this.db.objectStoreNames.contains('categories')) {
                    console.log("Creating 'categories' object store");
                    this.db.createObjectStore('categories', { keyPath: 'id' });
                }
                if (!this.db.objectStoreNames.contains('items')) {
                    console.log("Creating 'items' object store");
                    this.db.createObjectStore('items', { keyPath: 'id' });
                }
                if (!this.db.objectStoreNames.contains('quizzes')) {
                    console.log("Creating 'quizzes' object store");
                    const quizzesStore = this.db.createObjectStore('quizzes', { keyPath: 'id' });
                    quizzesStore.createIndex('category', 'category', { unique: false });
                } else {
                    // quizzesストアが既に存在する場合、インデックスを追加
                    const quizzesStore = event.currentTarget.transaction.objectStore('quizzes');
                    if (!quizzesStore.indexNames.contains('category')) {
                        quizzesStore.createIndex('category', 'category', { unique: false });
                    }
                }

                if (!this.db.objectStoreNames.contains('quizSessions')) {
                    console.log("Creating 'quizSessions' object store");
                    this.db.createObjectStore('quizSessions', { keyPath: 'id', autoIncrement: true });
                }
            };
        });
    }

    async addClassification(name, categoryId, image = null) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['classifications'], 'readwrite');
            const store = transaction.objectStore('classifications');
            const newClassification = { id: Date.now(), name, categoryId, image };
            const request = store.add(newClassification);

            request.onerror = (event) => {
                console.error("Error adding classification:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                console.log("Classification added successfully");
                resolve(newClassification);
            };
        });
    }

    async getClassifications() {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['classifications'], 'readonly');
            const store = transaction.objectStore('classifications');
            const request = store.getAll();

            request.onerror = (event) => {
                console.error("Error getting classifications:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    }

    async getCategories(type) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['categories'], 'readonly');
            const store = transaction.objectStore('categories');
            const request = store.getAll();

            request.onerror = (event) => {
                console.error("Error getting categories:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                const categories = event.target.result.filter(category => category.type === type);
                resolve(categories);
            };
        });
    }

    async addCategory(name, type) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['categories'], 'readwrite');
            const store = transaction.objectStore('categories');
            const newCategory = { id: Date.now(), name, type };
            const request = store.add(newCategory);

            request.onerror = (event) => {
                console.error("Error adding category:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                console.log("Category added successfully");
                resolve(newCategory);
            };
        });
    }

    async getUnclassifiedItems(categoryId) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['items'], 'readonly');
            const store = transaction.objectStore('items');
            const request = store.getAll();

            request.onerror = (event) => {
                console.error("Error getting unclassified items:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                const items = event.target.result;
                const unclassifiedItems = items.filter(item => 
                    item.categoryId === categoryId && !item.classificationId
                );
                resolve(unclassifiedItems);
            };
        });
    }

    async getItems(categoryId) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['items'], 'readonly');
            const store = transaction.objectStore('items');
            const request = store.getAll();

            request.onerror = (event) => {
                console.error("Error getting items:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                const items = event.target.result;
                const filteredItems = items.filter(item => item.categoryId === categoryId);
                resolve(filteredItems);
            };
        });
    }

    async deleteClassification(classificationId) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['classifications', 'items'], 'readwrite');
            const classificationStore = transaction.objectStore('classifications');
            const itemStore = transaction.objectStore('items');

            // 分類を削除
            const deleteClassificationRequest = classificationStore.delete(classificationId);

            deleteClassificationRequest.onerror = (event) => {
                console.error("Error deleting classification:", event.target.error);
                reject(event.target.error);
            };

            deleteClassificationRequest.onsuccess = () => {
                // 関連する項目の classificationId を null に設定
                const getAllItemsRequest = itemStore.getAll();

                getAllItemsRequest.onerror = (event) => {
                    console.error("Error getting items:", event.target.error);
                    reject(event.target.error);
                };

                getAllItemsRequest.onsuccess = (event) => {
                    const items = event.target.result;
                    const updatePromises = items
                        .filter(item => item.classificationId === classificationId)
                        .map(item => {
                            item.classificationId = null;
                            return itemStore.put(item);
                        });

                    Promise.all(updatePromises)
                        .then(() => {
                            console.log("Classification and related items updated successfully");
                            resolve();
                        })
                        .catch((error) => {
                            console.error("Error updating items:", error);
                            reject(error);
                        });
                };
            };
        });
    }

    async addItem(content, categoryId, classificationId = null) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['items'], 'readwrite');
            const store = transaction.objectStore('items');
            const newItem = {
                id: Date.now(),
                content,
                categoryId,
                classificationId
            };
            const request = store.add(newItem);

            request.onerror = (event) => {
                console.error("Error adding item:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                console.log("Item added successfully");
                resolve(newItem);
            };
        });
    }

    async assignItemToClassification(itemId, classificationId) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['items'], 'readwrite');
            const store = transaction.objectStore('items');
            const request = store.get(parseInt(itemId));

            request.onerror = (event) => {
                console.error("Error getting item:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                const item = event.target.result;
                if (item) {
                    item.classificationId = parseInt(classificationId);
                    const updateRequest = store.put(item);

                    updateRequest.onerror = (event) => {
                        console.error("Error updating item:", event.target.error);
                        reject(event.target.error);
                    };

                    updateRequest.onsuccess = (event) => {
                        console.log("Item assigned to classification successfully");
                        resolve(item);
                    };
                } else {
                    reject(new Error("Item not found"));
                }
            };
        });
    }

    async removeItemFromClassification(itemId) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['items'], 'readwrite');
            const store = transaction.objectStore('items');
            const request = store.get(parseInt(itemId));

            request.onerror = (event) => {
                console.error("Error getting item:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                const item = event.target.result;
                if (item) {
                    item.classificationId = null;
                    const updateRequest = store.put(item);

                    updateRequest.onerror = (event) => {
                        console.error("Error updating item:", event.target.error);
                        reject(event.target.error);
                    };

                    updateRequest.onsuccess = (event) => {
                        console.log("Item removed from classification successfully");
                        resolve(item);
                    };
                } else {
                    reject(new Error("Item not found"));
                }
            };
        });
    }

    async getQuizzesByCategory(category, type) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizzes'], 'readonly');
            const store = transaction.objectStore('quizzes');
            const index = store.index('category');
            const request = index.getAll(IDBKeyRange.only(category));
    
            request.onerror = (event) => {
                console.error("カテゴリー別クイズ取得エラー:", event.target.error);
                reject(event.target.error);
            };
    
            request.onsuccess = (event) => {
                const quizzes = event.target.result.filter(quiz => quiz.type === type);
                console.log(`カテゴリー ${category} とタイプ ${type} のクイズ:`, JSON.stringify(quizzes));
                
                // 正解情報の存在チェック
                quizzes.forEach((quiz, index) => {
                    if (!quiz.correctAnswers || quiz.correctAnswers.length === 0) {
                        console.warn(`警告: クイズID ${quiz.id} に正解情報がありません`);
                    }
                });
                
                resolve(quizzes);
            };
        });
    }

    async addMultipleChoiceQuiz(category, question, options, correctAnswers, image = null) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizzes'], 'readwrite');
            const store = transaction.objectStore('quizzes');
            
            if (!Array.isArray(correctAnswers) || correctAnswers.length === 0) {
                console.error("正解情報が正しく設定されていません");
                reject(new Error("正解情報は空でない配列である必要があります"));
                return;
            }
    
            const newQuiz = {
                id: Date.now(),
                type: 'multipleChoice',
                category,
                question,
                options,
                correctAnswers,
                image
            };
            console.log('保存するクイズデータ:', JSON.stringify(newQuiz));
            const request = store.add(newQuiz);
    
            request.onerror = (event) => {
                console.error("クイズの追加エラー:", event.target.error);
                reject(event.target.error);
            };
    
            request.onsuccess = (event) => {
                console.log("クイズが正常に追加されました");
                resolve(newQuiz);
            };
        });
    }

    async addAnswerQuiz(category, question, answers, image = null) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizzes'], 'readwrite');
            const store = transaction.objectStore('quizzes');
            const newQuiz = {
                id: Date.now(),
                type: 'answer',
                category,
                question,
                answers: Array.isArray(answers) ? answers : [answers], // 常に配列として保存
                image
            };
            const request = store.add(newQuiz);

            request.onerror = (event) => {
                console.error("Error adding answer quiz:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                console.log("Answer quiz added successfully");
                resolve(newQuiz);
            };
        });
    }

    async addNormalQuiz(category, question, answer, image = null) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizzes'], 'readwrite');
            const store = transaction.objectStore('quizzes');
            const newQuiz = {
                id: Date.now(),
                type: 'normal',
                category,
                question,
                answer,
                image
            };
            const request = store.add(newQuiz);

            request.onerror = (event) => {
                console.error("Error adding normal quiz:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                console.log("Normal quiz added successfully");
                resolve(newQuiz);
            };
        });
    }

    async getQuizById(quizId) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizzes'], 'readonly');
            const store = transaction.objectStore('quizzes');
            const request = store.get(quizId);

            request.onerror = (event) => {
                console.error("Error getting quiz:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                const quiz = event.target.result;
                if (quiz) {
                    resolve(quiz);
                } else {
                    reject(new Error("Quiz not found"));
                }
            };
        });
    }

    async deleteQuiz(quizId) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizzes'], 'readwrite');
            const store = transaction.objectStore('quizzes');
            const request = store.delete(quizId);

            request.onerror = (event) => {
                console.error("Error deleting quiz:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                console.log("Quiz deleted successfully");
                resolve(true);
            };
        });
    }

    async updateQuiz(quizId, category, question, answer, image = null) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizzes'], 'readwrite');
            const store = transaction.objectStore('quizzes');
            const getRequest = store.get(quizId);

            getRequest.onerror = (event) => {
                console.error("Error getting quiz for update:", event.target.error);
                reject(event.target.error);
            };

            getRequest.onsuccess = (event) => {
                const quiz = event.target.result;
                if (quiz) {
                    quiz.category = category;
                    quiz.question = question;
                    quiz.answer = answer;
                    quiz.image = image;

                    const updateRequest = store.put(quiz);

                    updateRequest.onerror = (event) => {
                        console.error("Error updating quiz:", event.target.error);
                        reject(event.target.error);
                    };

                    updateRequest.onsuccess = (event) => {
                        console.log("Quiz updated successfully");
                        resolve(true);
                    };
                } else {
                    reject(new Error("Quiz not found"));
                }
            };
        });
    }

    async updateMultipleChoiceQuiz(quizId, category, question, options, correctAnswers, image = null) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizzes'], 'readwrite');
            const store = transaction.objectStore('quizzes');
            const getRequest = store.get(quizId);
    
            getRequest.onerror = (event) => {
                console.error("クイズの取得エラー:", event.target.error);
                reject(event.target.error);
            };
    
            getRequest.onsuccess = (event) => {
                const quiz = event.target.result;
                if (quiz && quiz.type === 'multipleChoice') {
                    quiz.category = category;
                    quiz.question = question;
                    quiz.options = options;
                    quiz.correctAnswers = correctAnswers;
                    quiz.image = image;
    
                    const updateRequest = store.put(quiz);
    
                    updateRequest.onerror = (event) => {
                        console.error("クイズの更新エラー:", event.target.error);
                        reject(event.target.error);
                    };
    
                    updateRequest.onsuccess = (event) => {
                        console.log("多肢選択クイズが正常に更新されました");
                        resolve(true);
                    };
                } else {
                    reject(new Error("多肢選択クイズが見つからないか、タイプが一致しません"));
                }
            };
        });
    }

    async deleteCategory(categoryId, type) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['categories', 'quizzes'], 'readwrite');
            const categoryStore = transaction.objectStore('categories');
            const quizStore = transaction.objectStore('quizzes');
    
            // カテゴリーを削除
            const deleteCategoryRequest = categoryStore.delete(categoryId);
    
            deleteCategoryRequest.onerror = (event) => {
                console.error("Error deleting category:", event.target.error);
                reject(event.target.error);
            };
    
            deleteCategoryRequest.onsuccess = () => {
                // 関連するクイズを削除
                const getAllQuizzesRequest = quizStore.getAll();
    
                getAllQuizzesRequest.onerror = (event) => {
                    console.error("Error getting quizzes:", event.target.error);
                    reject(event.target.error);
                };
    
                getAllQuizzesRequest.onsuccess = (event) => {
                    const quizzes = event.target.result;
                    const deletePromises = quizzes
                        .filter(quiz => quiz.category === categoryId && quiz.type === type)
                        .map(quiz => quizStore.delete(quiz.id));
    
                    Promise.all(deletePromises)
                        .then(() => {
                            console.log("Category and related quizzes deleted successfully");
                            resolve(true);
                        })
                        .catch((error) => {
                            console.error("Error deleting related quizzes:", error);
                            reject(error);
                        });
                };
            };
        });
    }

    async getClassificationQuizData(categoryId) {
        const db = await this.openDatabase();
        
        try {
            const classifications = await this.getClassificationsByCategory(db, categoryId);
            const items = await this.getItemsByCategory(db, categoryId);

            return { classifications, items };
        } catch (error) {
            console.error('Error fetching classification quiz data:', error);
            throw error;
        }
    }

    getClassificationsByCategory(db, categoryId) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['classifications'], 'readonly');
            const store = transaction.objectStore('classifications');
            const request = store.getAll();

            request.onsuccess = (event) => {
                const classifications = event.target.result.filter(c => c.categoryId === categoryId);
                resolve(classifications);
            };

            request.onerror = (event) => {
                console.error('Error fetching classifications:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    getItemsByCategory(db, categoryId) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['items'], 'readonly');
            const store = transaction.objectStore('items');
            const request = store.getAll();

            request.onsuccess = (event) => {
                const items = event.target.result.filter(item => item.categoryId === categoryId);
                resolve(items);
            };

            request.onerror = (event) => {
                console.error('Error fetching items:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    async loadQuizData() {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizzes'], 'readonly');
            const store = transaction.objectStore('quizzes');
            const request = store.getAll();

            request.onerror = (event) => {
                console.error("Error loading quiz data:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                const quizzes = event.target.result;
                const quizData = {
                    normal: {},
                    answer: {},
                    multipleChoice: {},
                    classification: {}
                };

                quizzes.forEach(quiz => {
                    if (!quizData[quiz.type]) {
                        quizData[quiz.type] = {};
                    }
                    if (!quizData[quiz.type][quiz.category]) {
                        quizData[quiz.type][quiz.category] = [];
                    }
                    quizData[quiz.type][quiz.category].push(quiz);
                });

                console.log("Quiz data loaded successfully");
                resolve(quizData);
            };
        });
    }

    async saveQuizSession(sessionData) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizSessions'], 'readwrite');
            const store = transaction.objectStore('quizSessions');
            const request = store.add(sessionData);

            request.onerror = (event) => {
                console.error("Error saving quiz session:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                console.log("Quiz session saved successfully");
                resolve(sessionData);
            };
        });
    }

    async saveNormalQuizSession(sessionData) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizSessions'], 'readwrite');
            const store = transaction.objectStore('quizSessions');
            const request = store.add(sessionData);

            request.onerror = (event) => {
                console.error("Error saving normal quiz session:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                console.log("Normal quiz session saved successfully");
                resolve(sessionData);
            };
        });
    }

    async saveAnswerQuizSession(sessionData) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizSessions'], 'readwrite');
            const store = transaction.objectStore('quizSessions');
            const request = store.add(sessionData);
    
            request.onerror = (event) => {
                console.error("Error saving answer quiz session:", event.target.error);
                reject(event.target.error);
            };
    
            request.onsuccess = (event) => {
                console.log("Answer quiz session saved successfully");
                resolve(sessionData);
            };
        });
    }
    
    async saveMultipleChoiceQuizSession(sessionData) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizSessions'], 'readwrite');
            const store = transaction.objectStore('quizSessions');
            const request = store.add(sessionData);
    
            request.onerror = (event) => {
                console.error("Error saving multiple choice quiz session:", event.target.error);
                reject(event.target.error);
            };
    
            request.onsuccess = (event) => {
                console.log("Multiple choice quiz session saved successfully");
                resolve(sessionData);
            };
        });
    }

    async saveClassificationQuizSession(sessionData) {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizSessions'], 'readwrite');
            const store = transaction.objectStore('quizSessions');
            const request = store.add(sessionData);
    
            request.onerror = (event) => {
                console.error("Error saving classification quiz session:", event.target.error);
                reject(event.target.error);
            };
    
            request.onsuccess = (event) => {
                console.log("Classification quiz session saved successfully");
                resolve(sessionData);
            };
        });
    }

    async getQuizSessions() {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizSessions'], 'readonly');
            const store = transaction.objectStore('quizSessions');
            const request = store.getAll();

            request.onerror = (event) => {
                console.error("Error getting quiz sessions:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    }

    async getQuizzes() {
        const db = await this.openDatabase();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['quizzes'], 'readonly');
            const store = transaction.objectStore('quizzes');
            const request = store.getAll();

            request.onerror = (event) => {
                console.error("Error getting quizzes:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
        });
    }
}

