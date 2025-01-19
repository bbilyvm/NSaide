(function() {
    'use strict';
    
    console.log('[NS助手] quickReply 模块开始加载');

    const NSQuickReply = {
        id: 'quickReply',
        name: '快捷回复',
        description: '快速填充预设文本并发送回复',

        config: {
            storage: {
                ENABLE_QUICK_FILL: 'ns_quick_reply_enable_fill',
                ENABLE_QUICK_SEND: 'ns_quick_reply_enable_send'
            },
            presets: [
                { text: '感谢分享', label: '感谢', icon: '👍' },
                { text: '顶一下', label: '顶', icon: '⬆️' },
                { text: '收藏了，谢谢', label: '收藏', icon: '⭐' },
                { text: '学习了，感谢分享', label: '学习', icon: '📚' }
            ]
        },

        settings: {
            items: [
                {
                    id: 'enable_fill',
                    type: 'switch',
                    label: '启用快捷填充',
                    default: false,
                    value: () => GM_getValue('ns_quick_reply_enable_fill', false)
                },
                {
                    id: 'enable_send',
                    type: 'switch',
                    label: '启用快速发送',
                    default: false,
                    value: () => GM_getValue('ns_quick_reply_enable_send', false)
                }
            ],
            
            handleChange(settingId, value, settingsManager) {
                if (settingId === 'enable_fill') {
                    settingsManager.cacheValue('ns_quick_reply_enable_fill', value);
                } else if (settingId === 'enable_send') {
                    settingsManager.cacheValue('ns_quick_reply_enable_send', value);
                }
            }
        },

        utils: {
            async waitForElement(selector, parent = document, timeout = 10000) {
                const element = parent.querySelector(selector);
                if (element) return element;
            
                return new Promise((resolve) => {
                    const observer = new MutationObserver((mutations, obs) => {
                        const element = parent.querySelector(selector);
                        if (element) {
                            obs.disconnect();
                            resolve(element);
                        }
                    });
            
                    observer.observe(parent, {
                        childList: true,
                        subtree: true
                    });

                    setTimeout(() => {
                        observer.disconnect();
                        resolve(null);
                    }, timeout);
                });
            },

            createQuickReplyButtons() {
                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'ns-quick-reply-buttons';
                
                NSQuickReply.config.presets.forEach(preset => {
                    const button = document.createElement('button');
                    button.className = 'ns-quick-reply-btn';
                    button.innerHTML = `<span class="ns-quick-reply-icon">${preset.icon}</span>${preset.label}`;
                    button.title = preset.text;
                    button.onclick = async () => {
                        const codeMirror = document.querySelector('.CodeMirror');
                        if (!codeMirror || !codeMirror.CodeMirror) return;
                        
                        const cm = codeMirror.CodeMirror;
                        const currentContent = cm.getValue();
                        const newContent = currentContent 
                            ? currentContent.trim() + '\n' + preset.text
                            : preset.text;
                        
                        cm.setValue(newContent);
                        cm.setCursor(cm.lineCount(), 0);
                        
                        if (GM_getValue('ns_quick_reply_enable_send', false)) {
                            const submitBtn = document.querySelector('.topic-select button.submit.btn');
                            if (submitBtn) {
                                submitBtn.click();
                            }
                        }
                    };
                    buttonsContainer.appendChild(button);
                });
                
                return buttonsContainer;
            },

            addQuickReplyButtons() {
                const contentItems = document.querySelectorAll('.content-item');
                contentItems.forEach(item => {
                    if (item.querySelector('.ns-quick-reply-buttons')) return;
                    
                    const menu = item.querySelector('.comment-menu');
                    if (menu) {
                        const buttons = this.createQuickReplyButtons();
                        menu.parentNode.insertBefore(buttons, menu.nextSibling);
                    }
                });
            }
        },

        async init() {
            console.log('[NS助手] 初始化快捷回复模块');
            
            try {
                if (!GM_getValue('ns_quick_reply_enable_fill', false)) {
                    console.log('[NS助手] 快捷填充未启用，跳过初始化');
                    return;
                }

                console.log('[NS助手] 加载快捷回复样式');
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/quickReply/style.css',
                    onload: (response) => {
                        if (response.status === 200) {
                            console.log('[NS助手] 快捷回复样式加载成功');
                            GM_addStyle(response.responseText);
                        } else {
                            console.error('[NS助手] 加载快捷回复样式失败:', response.status);
                        }
                    },
                    onerror: (error) => {
                        console.error('[NS助手] 加载快捷回复样式出错:', error);
                    }
                });
                
                const observer = new MutationObserver(() => {
                    this.utils.addQuickReplyButtons();
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });
                
                this.utils.addQuickReplyButtons();
                console.log('[NS助手] 快捷回复模块初始化完成');
                
            } catch (error) {
                console.error('[NS助手] 快捷回复模块初始化失败:', error);
            }
        }
    };

    console.log('[NS助手] 等待模块系统就绪');
    let retryCount = 0;
    const maxRetries = 50;

    const waitForNS = () => {
        retryCount++;
        console.log(`[NS助手] 第 ${retryCount} 次尝试注册 quickReply 模块`);
        
        if (typeof window.NSRegisterModule === 'function') {
            console.log('[NS助手] 模块系统就绪，开始注册 quickReply');
            window.NSRegisterModule(NSQuickReply);
            console.log('[NS助手] quickReply 模块注册请求已发送');
        } else {
            console.log('[NS助手] 模块系统未就绪');
            if (retryCount < maxRetries) {
                setTimeout(waitForNS, 100);
            } else {
                console.error('[NS助手] 模块系统等待超时，quickReply 模块注册失败');
            }
        }
    };

    waitForNS();
    console.log('[NS助手] quickReply 模块加载完成 v0.0.3');
})(); 