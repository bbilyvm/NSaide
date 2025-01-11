(function() {
    'use strict';

    const NSCommentShortcut = {
        id: 'commentShortcut',
        name: '评论快捷键',
        description: '添加评论框快捷键支持',

        init() {
            console.log('[NS助手] 初始化评论快捷键模块');
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    const editor = document.querySelector('.md-editor');
                    if (!editor) return;
                    
                    const submitBtn = editor.querySelector('button.submit');
                    if (submitBtn) {
                        e.preventDefault();
                        submitBtn.click();
                    }
                }
            });
        }
    };

    const waitForNS = () => {
        if (typeof window.NSRegisterModule === 'function') {
            window.NSRegisterModule(NSCommentShortcut);
        } else {
            setTimeout(waitForNS, 100);
        }
    };

    waitForNS();
})(); 