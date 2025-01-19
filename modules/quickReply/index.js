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
                ENABLE_QUICK_SEND: 'ns_quick_reply_enable_send',
                CUSTOM_PRESETS: 'ns_quick_reply_presets'
            },
            defaultPresets: [
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
                },
                {
                    id: 'manage_presets',
                    type: 'button',
                    label: '管理快捷回复',
                    onClick: () => {
                        NSQuickReply.utils.showPresetsManager();
                    }
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

            getPresets() {
                const savedPresets = GM_getValue(NSQuickReply.config.storage.CUSTOM_PRESETS);
                return savedPresets ? JSON.parse(savedPresets) : NSQuickReply.config.defaultPresets;
            },

            savePresets(presets) {
                GM_setValue(NSQuickReply.config.storage.CUSTOM_PRESETS, JSON.stringify(presets));
            },

            showConfirmDialog(options) {
                const { title, content, onConfirm, onCancel, confirmText = '确定', cancelText = '取消', type = 'info' } = options;
                
                const dialog = document.createElement('div');
                dialog.className = 'ns-quick-reply-dialog';
                
                dialog.innerHTML = `
                    <div class="ns-quick-reply-dialog-content ${type}">
                        <div class="ns-quick-reply-dialog-icon">
                            ${type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'}
                        </div>
                        <div class="ns-quick-reply-dialog-header">${title}</div>
                        <div class="ns-quick-reply-dialog-body">${content}</div>
                        <div class="ns-quick-reply-dialog-footer">
                            <button class="ns-quick-reply-dialog-btn cancel">${cancelText}</button>
                            <button class="ns-quick-reply-dialog-btn confirm ${type}">${confirmText}</button>
                        </div>
                    </div>
                `;
                
                const confirmBtn = dialog.querySelector('.confirm');
                const cancelBtn = dialog.querySelector('.cancel');
                
                confirmBtn.onclick = () => {
                    onConfirm?.();
                    dialog.remove();
                };
                
                cancelBtn.onclick = () => {
                    onCancel?.();
                    dialog.remove();
                };
                
                dialog.onclick = (e) => {
                    if (e.target === dialog) {
                        dialog.remove();
                        onCancel?.();
                    }
                };
                
                document.body.appendChild(dialog);
                
                cancelBtn.focus();
            },

            showPresetsManager() {
                const modal = document.createElement('div');
                modal.className = 'ns-quick-reply-modal';
                
                const content = document.createElement('div');
                content.className = 'ns-quick-reply-modal-content';
                if (document.body.classList.contains('dark-layout')) {
                    content.classList.add('dark');
                }
                
                const title = document.createElement('div');
                title.className = 'ns-quick-reply-modal-title';
                title.textContent = '管理快捷回复';
                
                const closeBtn = document.createElement('div');
                closeBtn.className = 'ns-quick-reply-modal-close';
                closeBtn.textContent = '×';
                closeBtn.onclick = () => modal.remove();
                
                const presetsList = document.createElement('div');
                presetsList.className = 'ns-quick-reply-presets-list';
                
                const presets = this.getPresets();
                
                const renderPreset = (preset, index) => {
                    const item = document.createElement('div');
                    item.className = 'ns-quick-reply-preset-item';
                    
                    const inputsContainer = document.createElement('div');
                    inputsContainer.className = 'ns-quick-reply-inputs-container';
                    
                    const iconInput = document.createElement('input');
                    iconInput.type = 'text';
                    iconInput.className = 'ns-quick-reply-input icon';
                    iconInput.value = preset.icon;
                    iconInput.placeholder = '图标';
                    
                    const labelInput = document.createElement('input');
                    labelInput.type = 'text';
                    labelInput.className = 'ns-quick-reply-input label';
                    labelInput.value = preset.label;
                    labelInput.placeholder = '按钮文字';
                    
                    const textInput = document.createElement('input');
                    textInput.type = 'text';
                    textInput.className = 'ns-quick-reply-input text';
                    textInput.value = preset.text;
                    textInput.placeholder = '回复内容';
                    
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'ns-quick-reply-delete-btn';
                    deleteBtn.textContent = '删除';
                    deleteBtn.onclick = () => {
                        this.showConfirmDialog({
                            title: '删除确认',
                            content: `确定要删除"${preset.label}"这个快捷回复吗？`,
                            type: 'warning',
                            onConfirm: () => {
                                presets.splice(index, 1);
                                this.savePresets(presets);
                                item.remove();
                            }
                        });
                    };
                    
                    [iconInput, labelInput, textInput].forEach(input => {
                        input.onchange = () => {
                            presets[index] = {
                                icon: iconInput.value,
                                label: labelInput.value,
                                text: textInput.value
                            };
                            this.savePresets(presets);
                        };
                    });
                    
                    inputsContainer.appendChild(iconInput);
                    inputsContainer.appendChild(labelInput);
                    inputsContainer.appendChild(textInput);
                    item.appendChild(inputsContainer);
                    item.appendChild(deleteBtn);
                    
                    return item;
                };
                
                presets.forEach((preset, index) => {
                    presetsList.appendChild(renderPreset(preset, index));
                });
                
                const addBtn = document.createElement('button');
                addBtn.className = 'ns-quick-reply-add-btn';
                addBtn.textContent = '添加快捷回复';
                addBtn.onclick = () => {
                    const newPreset = { icon: '💬', label: '新按钮', text: '新回复内容' };
                    presets.push(newPreset);
                    this.savePresets(presets);
                    presetsList.appendChild(renderPreset(newPreset, presets.length - 1));
                };
                
                const resetBtn = document.createElement('button');
                resetBtn.className = 'ns-quick-reply-reset-btn';
                resetBtn.textContent = '恢复默认';
                resetBtn.onclick = () => {
                    this.showConfirmDialog({
                        title: '恢复默认确认',
                        content: '确定要恢复默认快捷回复吗？当前的自定义内容将被清除。',
                        type: 'warning',
                        onConfirm: () => {
                            this.savePresets(NSQuickReply.config.defaultPresets);
                            presetsList.innerHTML = '';
                            NSQuickReply.config.defaultPresets.forEach((preset, index) => {
                                presetsList.appendChild(renderPreset(preset, index));
                            });
                        }
                    });
                };
                
                content.appendChild(title);
                content.appendChild(closeBtn);
                content.appendChild(presetsList);
                content.appendChild(addBtn);
                content.appendChild(resetBtn);
                modal.appendChild(content);
                
                document.body.appendChild(modal);
                
                modal.onclick = (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                };
            },

            createQuickReplyButtons() {
                const buttonsContainer = document.createElement('div');
                buttonsContainer.className = 'ns-quick-reply-buttons';
                if (document.body.classList.contains('dark-layout')) {
                    buttonsContainer.classList.add('dark');
                }
                
                const presets = this.getPresets();
                presets.forEach(preset => {
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
                
                const observer = new MutationObserver((mutations) => {
                    let themeChanged = false;
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                            themeChanged = true;
                        }
                    });

                    if (themeChanged) {
                        const isDarkMode = document.body.classList.contains('dark-layout');
                        const buttons = document.querySelectorAll('.ns-quick-reply-buttons');
                        buttons.forEach(btn => {
                            btn.classList.toggle('dark', isDarkMode);
                        });
                    }

                    this.utils.addQuickReplyButtons();
                });
                
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['class']
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
    console.log('[NS助手] quickReply 模块加载完成 v0.0.7');
})(); 