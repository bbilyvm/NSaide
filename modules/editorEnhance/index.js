(function() {
    'use strict';
    
    console.log('[NS助手] editorEnhance 模块开始加载');

    const NSEditorEnhance = {
        id: 'editorEnhance',
        name: '编辑器增强',
        description: '为编辑器添加快捷键等增强功能',

        config: {
            storage: {
                SHOW_TOAST: 'ns_editor_show_toast',
                SHOW_SHORTCUT_BTN: 'ns_editor_show_shortcut_btn',
                QUICK_COMMENT_ENABLED: 'ns_editor_quick_comment_enabled'
            },
            shortcuts: {
                submit: {
                    windows: 'Ctrl-Enter',
                    mac: 'Cmd-Enter'
                },
                format: {
                    bold: {
                        windows: 'Ctrl-B',
                        mac: 'Cmd-B',
                        format: '**{text}**',
                        description: '粗体'
                    },
                    italic: {
                        windows: 'Ctrl-I',
                        mac: 'Cmd-I',
                        format: '*{text}*',
                        description: '斜体'
                    },
                    code: {
                        windows: 'Ctrl-K',
                        mac: 'Cmd-K',
                        format: '`{text}`',
                        description: '行内代码'
                    },
                    codeBlock: {
                        windows: 'Shift-Ctrl-K',
                        mac: 'Shift-Cmd-K',
                        format: '```\n{text}\n```',
                        description: '代码块'
                    },
                    codeBlockWithLang: {
                        windows: 'Alt-Ctrl-K',
                        mac: 'Alt-Cmd-K',
                        format: '```javascript\n{text}\n```',
                        description: 'JS代码块'
                    },
                    link: {
                        windows: 'Ctrl-L',
                        mac: 'Cmd-L',
                        format: '[{text}]()',
                        description: '链接'
                    },
                    image: {
                        windows: 'Shift-Ctrl-I',
                        mac: 'Shift-Cmd-I',
                        format: '![{text}]()',
                        description: '图片'
                    },
                    quote: {
                        windows: 'Ctrl-Q',
                        mac: 'Cmd-Q',
                        format: '> {text}',
                        description: '引用'
                    },
                    multiQuote: {
                        windows: 'Shift-Ctrl-Q',
                        mac: 'Shift-Cmd-Q',
                        format: '>> {text}',
                        description: '多级引用'
                    },
                    strikethrough: {
                        windows: 'Alt-S',
                        mac: 'Alt-S',
                        format: '~~{text}~~',
                        description: '删除线'
                    },
                    list: {
                        windows: 'Ctrl-U',
                        mac: 'Cmd-U',
                        format: '- {text}',
                        description: '无序列表'
                    },
                    orderedList: {
                        windows: 'Shift-Ctrl-O',
                        mac: 'Shift-Cmd-O',
                        format: '1. {text}',
                        description: '有序列表'
                    },
                    heading1: {
                        windows: 'Shift-Ctrl-1',
                        mac: 'Shift-Cmd-1',
                        format: '# {text}',
                        description: '一级标题'
                    },
                    heading2: {
                        windows: 'Shift-Ctrl-2',
                        mac: 'Shift-Cmd-2',
                        format: '## {text}',
                        description: '二级标题'
                    },
                    heading3: {
                        windows: 'Shift-Ctrl-3',
                        mac: 'Shift-Cmd-3',
                        format: '### {text}',
                        description: '三级标题'
                    },
                    heading4: {
                        windows: 'Shift-Ctrl-4',
                        mac: 'Shift-Cmd-4',
                        format: '#### {text}',
                        description: '四级标题'
                    },
                    table: {
                        windows: 'Shift-Ctrl-T',
                        mac: 'Shift-Cmd-T',
                        format: '| 表头 | 表头 |\n| --- | --- |\n| 内容 | 内容 |',
                        description: '表格'
                    }
                }
            }
        },

        settings: {
            items: [
                {
                    id: 'show_toast',
                    type: 'switch',
                    label: '显示加载提示',
                    default: true,
                    value: () => GM_getValue('ns_editor_show_toast', true)
                },
                {
                    id: 'show_shortcut_btn',
                    type: 'switch',
                    label: '显示编辑器快捷键按钮',
                    default: true,
                    value: () => GM_getValue('ns_editor_show_shortcut_btn', true)
                },
                {
                    id: 'quick_comment_enabled',
                    type: 'switch',
                    label: '启用快捷回复',
                    default: true,
                    value: () => GM_getValue('ns_editor_quick_comment_enabled', true)
                },
                {
                    id: 'view_shortcuts',
                    type: 'button',
                    label: '查看快捷键列表',
                    onClick: () => {
                        const modal = NSEditorEnhance.utils.createShortcutGuide();
                        document.body.appendChild(modal);
                    }
                }
            ],
            
            handleChange(settingId, value, settingsManager) {
                if (settingId === 'show_toast') {
                    settingsManager.cacheValue('ns_editor_show_toast', value);
                } else if (settingId === 'show_shortcut_btn') {
                    settingsManager.cacheValue('ns_editor_show_shortcut_btn', value);
                } else if (settingId === 'quick_comment_enabled') {
                    settingsManager.cacheValue('ns_editor_quick_comment_enabled', value);
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

            isMac() {
                return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
            },

            showToast(message, type = 'info') {
                const toast = document.createElement('div');
                toast.className = `ns-editor-toast ns-editor-toast-${type}`;
                toast.textContent = message;
                document.body.appendChild(toast);
                
                toast.offsetHeight;
                
                requestAnimationFrame(() => {
                    toast.classList.add('ns-editor-toast-show');
                    
                    setTimeout(() => {
                        toast.classList.add('ns-editor-toast-fade-out');
                        setTimeout(() => toast.remove(), 300);
                    }, 3000);
                });
            },

            createShortcutGuide() {
                const isMac = this.isMac();
                const modal = document.createElement('div');
                modal.className = 'ns-editor-modal';
                
                const content = document.createElement('div');
                content.className = 'ns-editor-modal-content';
                
                const title = document.createElement('div');
                title.className = 'ns-editor-modal-title';
                title.textContent = 'Markdown快捷键';
                
                const closeBtn = document.createElement('div');
                closeBtn.className = 'ns-editor-modal-close';
                closeBtn.textContent = '×';
                closeBtn.onclick = () => modal.remove();
                
                const shortcuts = document.createElement('div');
                shortcuts.className = 'ns-editor-shortcuts-list';
                
                Object.entries(NSEditorEnhance.config.shortcuts.format).forEach(([key, config]) => {
                    const shortcut = document.createElement('div');
                    shortcut.className = 'ns-editor-shortcut-item';
                    shortcut.innerHTML = `
                        <span class="ns-editor-shortcut-desc">${config.description}</span>
                        <span class="ns-editor-shortcut-key">${isMac ? config.mac.replace('Cmd', '⌘').replace('Shift', '⇧').replace('Alt', '⌥').replace('-', ' + ') : config.windows.replace('-', ' + ')}</span>
                    `;
                    shortcuts.appendChild(shortcut);
                });

                content.appendChild(title);
                content.appendChild(closeBtn);
                content.appendChild(shortcuts);
                modal.appendChild(content);
                
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        modal.remove();
                    }
                });
                
                return modal;
            }
        },

        async init() {
            console.log('[NS助手] 初始化编辑器增强模块');
            
            try {
                console.log('[NS助手] 开始加载编辑器增强样式');
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/editorEnhance/style.css',
                    onload: (response) => {
                        if (response.status === 200) {
                            console.log('[NS助手] 编辑器增强样式加载成功');
                            GM_addStyle(response.responseText);
                        } else {
                            console.error('[NS助手] 加载编辑器增强样式失败:', response.status);
                        }
                    },
                    onerror: (error) => {
                        console.error('[NS助手] 加载编辑器增强样式出错:', error);
                    }
                });

                const editorSetupResult = await this.setupEditor();
                if (editorSetupResult) {
                    console.log('[NS助手] 编辑器增强模块初始化完成');
                    if (GM_getValue('ns_editor_show_toast', true)) {
                        this.utils.showToast('编辑器增强已启用', 'success');
                    }
                } else {
                    console.log('[NS助手] 当前页面无编辑器，跳过增强');
                }
            } catch (error) {
                console.error('[NS助手] 编辑器增强模块初始化失败:', error);
            }
        },

        async setupEditor() {
            console.log('[NS助手] 等待编辑器加载...');
            
            const codeMirrorElement = await this.utils.waitForElement('.CodeMirror');
            if (!codeMirrorElement) {
                console.log('[NS助手] 未找到编辑器，跳过增强');
                return false;
            }

            const btnSubmit = await this.utils.waitForElement('.topic-select button.submit.btn.focus-visible');
            if (!btnSubmit) {
                console.log('[NS助手] 未找到提交按钮，跳过增强');
                return false;
            }

            if (GM_getValue('ns_editor_quick_comment_enabled', true)) {
                this.setupQuickComment();
            }

            const codeMirrorInstance = codeMirrorElement.CodeMirror;
            if (!codeMirrorInstance) {
                console.log('[NS助手] 未找到CodeMirror实例，跳过增强');
                return false;
            }

            const isMac = this.utils.isMac();
            const submitKey = isMac ? this.config.shortcuts.submit.mac : this.config.shortcuts.submit.windows;
            const submitText = isMac ? '⌘+Enter' : 'Ctrl+Enter';

            const topicSelect = btnSubmit.parentElement;
            if (GM_getValue('ns_editor_show_shortcut_btn', true)) {
                const shortcutBtn = document.createElement('button');
                shortcutBtn.className = 'ns-editor-shortcut-btn';
                shortcutBtn.textContent = 'MD快捷键';
                shortcutBtn.onclick = () => {
                    const modal = this.utils.createShortcutGuide();
                    document.body.appendChild(modal);
                };
                topicSelect.insertBefore(shortcutBtn, topicSelect.firstChild);
            }

            if (!btnSubmit.textContent.includes(submitText)) {
                btnSubmit.innerText = `发布评论 (${submitText})`;
            }

            const keyMap = {
                [submitKey]: (cm) => {
                    btnSubmit.click();
                }
            };

            Object.entries(this.config.shortcuts.format).forEach(([key, config]) => {
                const shortcutKey = isMac ? config.mac : config.windows;
                keyMap[shortcutKey] = (cm) => {
                    const selectedText = cm.getSelection() || '';
                    const cursor = cm.getCursor();
                    const formatted = config.format.replace('{text}', selectedText);
                    cm.replaceSelection(formatted);
                    
                    if (!selectedText) {
                        const cursorPos = cursor.ch + formatted.indexOf('{text}');
                        cm.setCursor({ line: cursor.line, ch: cursorPos });
                    }
                };
            });

            codeMirrorInstance.setOption('extraKeys', keyMap);
            return true;
        },

        async setupQuickComment() {
            if (!document.querySelector('#fast-nav-button-group #back-to-parent')) {
                console.log('[NS助手] 未找到快捷回复按钮位置，跳过');
                return;
            }

            const commentDiv = document.querySelector('#fast-nav-button-group #back-to-parent').cloneNode(true);
            commentDiv.id = 'back-to-comment';
            commentDiv.innerHTML = '<svg class="iconpark-icon" style="width: 24px; height: 24px;"><use href="#comments"></use></svg>';
            commentDiv.setAttribute('title', '快捷回复');
            
            commentDiv.addEventListener("click", this.handleQuickComment.bind(this));
            
            
            document.querySelector('#back-to-parent').before(commentDiv);


            document.querySelectorAll('.nsk-post .comment-menu,.comment-container .comments')
                .forEach(x => x.addEventListener("click", 
                    (event) => {
                        if(!["引用", "回复", "编辑"].includes(event.target.textContent)) return;
                        this.handleQuickComment(event);
                    }, 
                    true
                ));
        },

        handleQuickComment(e) {
            if (this.is_show_quick_comment) {
                return;
            }
            e.preventDefault();

            const mdEditor = document.querySelector('.md-editor');
            if (!mdEditor) return;

            console.log('[NS助手] 准备显示快捷回复窗口');
            
            const clientHeight = document.documentElement.clientHeight;
            const clientWidth = document.documentElement.clientWidth;
            const mdWidth = Math.min(800, clientWidth * 0.8);
            const mdHeight = Math.min(500, clientHeight * 0.6);
            const top = (clientHeight * 0.6) - (mdHeight / 2);
            const left = (clientWidth / 2) - (mdWidth / 2);

            const editorWrapper = document.createElement('div');
            editorWrapper.className = 'ns-quick-comment-wrapper';
            editorWrapper.style.cssText = `
                position: fixed;
                top: ${top}px;
                left: ${left}px;
                width: ${mdWidth}px;
                height: ${mdHeight}px;
                z-index: 9999;
                background: #fff;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                overflow: hidden;
            `;

            const originalParent = mdEditor.parentElement;
            this._originalEditorParent = originalParent;
            this._originalEditorNextSibling = mdEditor.nextSibling;

            editorWrapper.appendChild(mdEditor);
            document.body.appendChild(editorWrapper);

            mdEditor.style.cssText = `
                width: 100%;
                height: 100%;
                margin: 0;
                border-radius: 8px;
            `;

            const moveEl = mdEditor.querySelector('.tab-select.window_header');
            if (moveEl) {
                moveEl.style.cursor = "move";
                moveEl.addEventListener('mousedown', this.startDrag.bind(this));
            }

            this.addEditorCloseButton();
            this.is_show_quick_comment = true;
        },

        addEditorCloseButton() {
            const fullScreenToolbar = document.querySelector('#editor-body .window_header > :last-child');
            if (!fullScreenToolbar) return;

            const cloneToolbar = fullScreenToolbar.cloneNode(true);
            cloneToolbar.setAttribute('title', '关闭');
            cloneToolbar.querySelector('span').classList.replace('i-icon-full-screen-one', 'i-icon-close');
            cloneToolbar.querySelector('span').innerHTML = '<svg width="16" height="16" viewBox="0 0 48 48" fill="none"><path d="M8 8L40 40" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 40L40 8" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
            
            const _this = this;
            cloneToolbar.addEventListener("click", function (e) {
                console.log('[NS助手] 关闭快捷回复窗口');
                const mdEditor = document.querySelector('.md-editor');
                const wrapper = document.querySelector('.ns-quick-comment-wrapper');
                
                if (mdEditor && wrapper) {
                    mdEditor.style = "";
                    if (_this._originalEditorParent) {
                        if (_this._originalEditorNextSibling) {
                            _this._originalEditorParent.insertBefore(mdEditor, _this._originalEditorNextSibling);
                        } else {
                            _this._originalEditorParent.appendChild(mdEditor);
                        }
                    }
                    wrapper.remove();
                }

                const moveEl = mdEditor.querySelector('.tab-select.window_header');
                if (moveEl) {
                    moveEl.style.cursor = "";
                    moveEl.removeEventListener('mousedown', _this.startDrag);
                }

                this.remove();
                _this.is_show_quick_comment = false;
            });
            
            fullScreenToolbar.after(cloneToolbar);
        },

        startDrag(event) {
            if (event.button !== 0) return;
            console.log('[NS助手] 开始拖拽快捷回复窗口');

            const wrapper = document.querySelector('.ns-quick-comment-wrapper');
            if (!wrapper) return;

            const rect = wrapper.getBoundingClientRect();
            const initialX = event.clientX - rect.left;
            const initialY = event.clientY - rect.top;
            
            const onMouseMove = (event) => {
                const newX = event.clientX - initialX;
                const newY = event.clientY - initialY;
                
                const maxX = window.innerWidth - wrapper.offsetWidth;
                const maxY = window.innerHeight - wrapper.offsetHeight;
                
                wrapper.style.left = `${Math.max(0, Math.min(maxX, newX))}px`;
                wrapper.style.top = `${Math.max(0, Math.min(maxY, newY))}px`;
            };
            
            const onMouseUp = () => {
                console.log('[NS助手] 结束拖拽快捷回复窗口');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        },
    };

    console.log('[NS助手] 等待模块系统就绪');
    let retryCount = 0;
    const maxRetries = 50;

    const waitForNS = () => {
        retryCount++;
        console.log(`[NS助手] 第 ${retryCount} 次尝试注册 editorEnhance 模块`);
        
        if (typeof window.NSRegisterModule === 'function') {
            console.log('[NS助手] 模块系统就绪，开始注册 editorEnhance');
            window.NSRegisterModule(NSEditorEnhance);
            console.log('[NS助手] editorEnhance 模块注册请求已发送');
        } else {
            console.log('[NS助手] 模块系统未就绪');
            if (retryCount < maxRetries) {
                setTimeout(waitForNS, 100);
            } else {
                console.error('[NS助手] 模块系统等待超时，editorEnhance 模块注册失败');
            }
        }
    };

    waitForNS();
    console.log('[NS助手] editorEnhance 模块加载完成 v0.0.3');
})(); 