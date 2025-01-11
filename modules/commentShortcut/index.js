(function(window) {
    'use strict';

    const NSCommentShortcut = {
        id: 'commentShortcut',
        name: '评论快捷键',
        description: '添加评论框快捷键支持',

        init() {
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


    if (typeof unsafeWindow === 'undefined') {
        window.NSModules = window.NSModules || {};
        window.NSModules.commentShortcut = NSCommentShortcut;
    } else {
        unsafeWindow.NSModules = unsafeWindow.NSModules || {};
        unsafeWindow.NSModules.commentShortcut = NSCommentShortcut;
    }
})(typeof unsafeWindow !== 'undefined' ? unsafeWindow : window); 