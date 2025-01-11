(function() {
    'use strict';
    
    console.log('[NS助手] commentShortcut 模块开始加载');

    const NSCommentShortcut = {
        id: 'commentShortcut',
        name: '评论快捷键',
        description: '添加评论框快捷键支持',

        init() {
            console.log('[NS助手] 初始化评论快捷键模块');
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    const editor = document.querySelector('.md-editor');
                    if (!editor) {
                        console.log('[NS助手] 未找到编辑器');
                        return;
                    }
                    
                    const submitBtn = editor.querySelector('button.submit');
                    if (submitBtn) {
                        console.log('[NS助手] 触发提交按钮点击');
                        e.preventDefault();
                        submitBtn.click();
                    } else {
                        console.log('[NS助手] 未找到提交按钮');
                    }
                }
            });
            console.log('[NS助手] 评论快捷键模块初始化完成');
        }
    };

    console.log('[NS助手] 等待模块系统就绪');
    let retryCount = 0;
    const maxRetries = 50;

    const waitForNS = () => {
        retryCount++;
        console.log(`[NS助手] 第 ${retryCount} 次尝试注册 commentShortcut 模块`);
        
        if (typeof window.NSRegisterModule === 'function') {
            console.log('[NS助手] 模块系统就绪，开始注册 commentShortcut');
            window.NSRegisterModule(NSCommentShortcut);
            console.log('[NS助手] commentShortcut 模块注册请求已发送');
        } else {
            console.log('[NS助手] 模块系统未就绪');
            if (retryCount < maxRetries) {
                setTimeout(waitForNS, 100);
            } else {
                console.error('[NS助手] 模块系统等待超时，commentShortcut 模块注册失败');
            }
        }
    };

    waitForNS();
    console.log('[NS助手] commentShortcut 模块加载完成');
})(); 