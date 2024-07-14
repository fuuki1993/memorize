class CSSManager {
    static enableCSS(files) {
        // すべてのCSSを無効化
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            link.disabled = true;
        });

        // 指定されたCSSファイルを有効化
        files.forEach(href => {
            let link = document.querySelector(`link[href="${href}"]`);
            if (link) {
                link.disabled = false;
            } else {
                link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                document.head.appendChild(link);
            }
        });
    }

    static resetCSS() {
        // すべてのCSSを有効化
        document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
            link.disabled = false;
        });
    }
}

export default CSSManager;