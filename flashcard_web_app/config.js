// config.js
const config = {
    apiUrl: 'https://api.quizapp.com', // APIのベースURL（実際のURLに置き換えてください）
    defaultQuizDuration: 300, // デフォルトのクイズ時間（秒）
    maxQuestions: 10, // 1回のセッションでの最大問題数
    minPassScore: 70, // 合格点（％）
    themes: {
        light: {
            primary: '#4CAF50',
            secondary: '#2196F3',
            background: '#f0f0f0',
            text: '#333'
        },
        dark: {
            primary: '#45a049',
            secondary: '#1e88e5',
            background: '#333',
            text: '#f0f0f0'
        }
    },
    supportedLanguages: ['ja', 'en', 'es', 'fr'], // サポートされる言語
    defaultLanguage: 'ja',
    feedbackDelay: 1500, // フィードバック表示の遅延時間（ミリ秒）
    analyticsEnabled: true, // 分析機能の有効/無効
    maxFileUploadSize: 5 * 1024 * 1024, // 最大ファイルアップロードサイズ（5MB）
    sessionTimeout: 30 * 60 * 1000, // セッションタイムアウト（30分）
    debugMode: false // デバッグモードの有効/無効
};

// 設定をグローバルに公開
window.appConfig = config;