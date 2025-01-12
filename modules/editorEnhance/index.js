(function() {
    'use strict';
    
    console.log('[NS助手] editorEnhance 模块开始加载');

    const NSEditorEnhance = {
        id: 'editorEnhance',
        name: '编辑器增强',
        description: '为编辑器添加快捷键和格式化功能',

        config: {
            storage: {
                SHORTCUTS_ENABLED: 'editorEnhance.shortcutsEnabled'
            }
        },

        utils: {
            isMac() {
                return /macintosh|mac os x/i.test(navigator.userAgent);
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
            }
        },

        shortcuts: {
            'Ctrl+B': {
                description: '加粗',
                handler: (editor) => {
                    const selection = editor.getSelection();
                    const content = selection || '粗体文本';
                    editor.replaceSelection(`**${content}**`);
                    if (!selection) {
                        const cursor = editor.getCursor();
                        editor.setCursor(cursor.line, cursor.ch - 2);
                    }
                }
            },
            'Ctrl+I': {
                description: '斜体',
                handler: (editor) => {
                    const selection = editor.getSelection();
                    const content = selection || '斜体文本';
                    editor.replaceSelection(`*${content}*`);
                    if (!selection) {
                        const cursor = editor.getCursor();
                        editor.setCursor(cursor.line, cursor.ch - 1);
                    }
                }
            },
            'Ctrl+K': {
                description: '链接',
                handler: (editor) => {
                    const selection = editor.getSelection();
                    const content = selection || '链接文本';
                    editor.replaceSelection(`[${content}](url)`);
                    if (!selection) {
                        const cursor = editor.getCursor();
                        editor.setCursor(cursor.line, cursor.ch - 4);
                    }
                }
            },
            'Ctrl+`': {
                description: '代码',
                handler: (editor) => {
                    const selection = editor.getSelection();
                    const content = selection || '代码';
                    editor.replaceSelection(`\`${content}\``);
                    if (!selection) {
                        const cursor = editor.getCursor();
                        editor.setCursor(cursor.line, cursor.ch - 1);
                    }
                }
            },
            'Ctrl+L': {
                description: '无序列表',
                handler: (editor) => {
                    const cursor = editor.getCursor();
                    const line = editor.getLine(cursor.line);
                    editor.replaceRange('- ', {line: cursor.line, ch: 0});
                }
            },
            'Ctrl+Alt+L': {
                description: '有序列表',
                handler: (editor) => {
                    const cursor = editor.getCursor();
                    const line = editor.getLine(cursor.line);
                    editor.replaceRange('1. ', {line: cursor.line, ch: 0});
                }
            },
            'Ctrl+Q': {
                description: '引用',
                handler: (editor) => {
                    const cursor = editor.getCursor();
                    const line = editor.getLine(cursor.line);
                    editor.replaceRange('> ', {line: cursor.line, ch: 0});
                }
            },
            'Ctrl+Alt+C': {
                description: '代码块',
                handler: (editor) => {
                    const selection = editor.getSelection();
                    const content = selection || '代码块';
                    editor.replaceSelection(`\`\`\`\n${content}\n\`\`\``);
                    if (!selection) {
                        const cursor = editor.getCursor();
                        editor.setCursor(cursor.line - 1, cursor.ch);
                    }
                }
            },
            'Ctrl+H': {
                description: '标题',
                handler: (editor) => {
                    const cursor = editor.getCursor();
                    const line = editor.getLine(cursor.line);
                    editor.replaceRange('# ', {line: cursor.line, ch: 0});
                }
            }
        },

        renderSettings() {
            const settingsDiv = document.createElement('div');
            settingsDiv.className = 'ns-editor-settings';

            const shortcutsDiv = document.createElement('div');
            shortcutsDiv.className = 'ns-editor-shortcuts';

            const viewShortcutsBtn = document.createElement('button');
            viewShortcutsBtn.className = 'ns-editor-shortcut-btn';
            viewShortcutsBtn.textContent = '查看快捷键列表';
            viewShortcutsBtn.onclick = () => this.showShortcutsList();

            shortcutsDiv.appendChild(viewShortcutsBtn);
            settingsDiv.appendChild(shortcutsDiv);

            return settingsDiv;
        },

        showShortcutsList() {
            const overlay = document.createElement('div');
            overlay.className = 'ns-editor-shortcut-overlay';

            const modal = document.createElement('div');
            modal.className = 'ns-editor-shortcut-list';

            const header = document.createElement('div');
            header.className = 'ns-editor-shortcut-header';

            const title = document.createElement('div');
            title.className = 'ns-editor-shortcut-title';
            title.textContent = '编辑器快捷键列表';

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

            Object.entries(this.shortcuts).forEach(([key, { description }]) => {
                const item = document.createElement('div');
                item.className = 'ns-editor-shortcut-item';

                const desc = document.createElement('div');
                desc.className = 'ns-editor-shortcut-desc';
                desc.textContent = description;

                const keySpan = document.createElement('div');
                keySpan.className = 'ns-editor-shortcut-key';
                keySpan.textContent = this.utils.isMac() ? key.replace('Ctrl', '⌘') : key;

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
        },

        init() {
            console.log('[NS助手] 初始化编辑器增强功能');

            console.log('[NS助手] 开始加载编辑器样式');
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/editorEnhance/style.css',
                onload: (response) => {
                    if (response.status === 200) {
                        console.log('[NS助手] 编辑器样式加载成功');
                        GM_addStyle(response.responseText);
                    } else {
                        console.error('[NS助手] 加载编辑器样式失败:', response.status);
                    }
                },
                onerror: (error) => {
                    console.error('[NS助手] 加载编辑器样式出错:', error);
                }
            });

            document.addEventListener('click', async (e) => {
                if (e.target.matches('textarea[name="content"]')) {
                    console.log('[NS助手] 检测到编辑器点击');
                    const editor = await this.utils.waitForElement('.CodeMirror');
                    if (!editor) {
                        console.log('[NS助手] 未找到编辑器实例');
                        return;
                    }

                    const cm = editor.CodeMirror;
                    if (!cm) {
                        console.log('[NS助手] 未找到 CodeMirror 实例');
                        return;
                    }

                    Object.entries(this.shortcuts).forEach(([key, { handler }]) => {
                        const keys = this.utils.isMac() ? key.replace('Ctrl', 'Cmd') : key;
                        cm.setOption('extraKeys', {
                            ...cm.getOption('extraKeys'),
                            [keys]: handler.bind(this, cm)
                        });
                    });

                    console.log('[NS助手] 快捷键注册完成');
                }
            });

            console.log('[NS助手] 编辑器增强模块初始化完成');
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