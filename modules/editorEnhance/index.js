(function() {
    'use strict';
    
    console.log('[NS助手] editorEnhance 模块开始加载');

    const NSEditorEnhance = {
        id: 'editorEnhance',
        name: '编辑器增强',
        description: '为编辑器添加快捷键等增强功能',

        config: {
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
                toast.className = `ns-editor-toast ns-editor-${type}`;
                toast.textContent = message;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.classList.add('ns-editor-show');
                }, 100);

                setTimeout(() => {
                    toast.classList.remove('ns-editor-show');
                    setTimeout(() => toast.remove(), 300);
                }, 3000);
            },

            createShortcutGuide() {
                const isMac = this.isMac();
                const overlay = document.createElement('div');
                overlay.className = 'ns-editor-shortcut-overlay';
                
                const modal = document.createElement('div');
                modal.className = 'ns-editor-shortcut-list';
                
                const header = document.createElement('div');
                header.className = 'ns-editor-shortcut-header';
                
                const title = document.createElement('div');
                title.className = 'ns-editor-shortcut-title';
                title.textContent = 'Markdown快捷键';
                
                const closeBtn = document.createElement('div');
                closeBtn.className = 'ns-editor-shortcut-close';
                closeBtn.textContent = '×';
                closeBtn.onclick = () => {
                    overlay.classList.remove('ns-editor-show');
                    modal.classList.remove('ns-editor-show');
                    setTimeout(() => overlay.remove(), 300);
                };
                
                header.appendChild(title);
                header.appendChild(closeBtn);
                
                const content = document.createElement('div');
                content.className = 'ns-editor-shortcut-content';
                
                const grid = document.createElement('div');
                grid.className = 'ns-editor-shortcut-grid';
                
                Object.entries(NSEditorEnhance.config.shortcuts.format).forEach(([key, config]) => {
                    const item = document.createElement('div');
                    item.className = 'ns-editor-shortcut-item';
                    
                    const desc = document.createElement('div');
                    desc.className = 'ns-editor-shortcut-desc';
                    desc.textContent = config.description;
                    
                    const keySpan = document.createElement('div');
                    keySpan.className = 'ns-editor-shortcut-key';
                    keySpan.textContent = isMac ? config.mac.replace('Cmd', '⌘').replace('Shift', '⇧').replace('Alt', '⌥').replace('-', ' + ') : config.windows.replace('-', ' + ');
                    
                    item.appendChild(desc);
                    item.appendChild(keySpan);
                    grid.appendChild(item);
                });

                content.appendChild(grid);
                modal.appendChild(header);
                modal.appendChild(content);
                overlay.appendChild(modal);
                document.body.appendChild(overlay);
                
                setTimeout(() => {
                    overlay.classList.add('ns-editor-show');
                    modal.classList.add('ns-editor-show');
                }, 100);
                
                return overlay;
            }
        },

        renderSettings(container) {
            const settingsHtml = `
                <div class="ns-editor-settings">
                    <div class="ns-editor-shortcuts">
                        <button class="ns-editor-shortcut-btn">查看快捷键列表</button>
                    </div>
                </div>
            `;
            
            container.innerHTML = settingsHtml;
            
            const viewShortcutsBtn = container.querySelector('.ns-editor-shortcut-btn');
            viewShortcutsBtn.addEventListener('click', () => {
                this.utils.createShortcutGuide();
            });
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
                    this.utils.showToast('编辑器增强已启用', 'success');
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

            const codeMirrorInstance = codeMirrorElement.CodeMirror;
            if (!codeMirrorInstance) {
                console.log('[NS助手] 未找到CodeMirror实例，跳过增强');
                return false;
            }

            const isMac = this.utils.isMac();
            const submitKey = isMac ? this.config.shortcuts.submit.mac : this.config.shortcuts.submit.windows;
            const submitText = isMac ? '⌘+Enter' : 'Ctrl+Enter';

            const topicSelect = btnSubmit.parentElement;
            const shortcutBtn = document.createElement('button');
            shortcutBtn.className = 'ns-editor-shortcut-btn';
            shortcutBtn.textContent = 'MD快捷键';
            shortcutBtn.onclick = () => {
                this.utils.createShortcutGuide();
            };
            topicSelect.insertBefore(shortcutBtn, topicSelect.firstChild);

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
        }
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
    console.log('[NS助手] editorEnhance 模块加载完成');
})(); 