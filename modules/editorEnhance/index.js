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
                        format: '**{text}**'
                    },
                    italic: {
                        windows: 'Ctrl-I',
                        mac: 'Cmd-I',
                        format: '*{text}*'
                    },
                    code: {
                        windows: 'Ctrl-K',
                        mac: 'Cmd-K',
                        format: '`{text}`'
                    },
                    codeBlock: {
                        windows: 'Shift-Ctrl-K',
                        mac: 'Shift-Cmd-K',
                        format: '```\n{text}\n```'
                    },
                    codeBlockWithLang: {
                        windows: 'Alt-Ctrl-K',
                        mac: 'Alt-Cmd-K',
                        format: '```javascript\n{text}\n```'
                    },
                    link: {
                        windows: 'Ctrl-L',
                        mac: 'Cmd-L',
                        format: '[{text}]()'
                    },
                    image: {
                        windows: 'Shift-Ctrl-I',
                        mac: 'Shift-Cmd-I',
                        format: '![{text}]()'
                    },
                    quote: {
                        windows: 'Ctrl-Q',
                        mac: 'Cmd-Q',
                        format: '> {text}'
                    },
                    multiQuote: {
                        windows: 'Shift-Ctrl-Q',
                        mac: 'Shift-Cmd-Q',
                        format: '>> {text}'
                    },
                    strikethrough: {
                        windows: 'Alt-S',
                        mac: 'Alt-S',
                        format: '~~{text}~~'
                    },
                    list: {
                        windows: 'Ctrl-U',
                        mac: 'Cmd-U',
                        format: '- {text}'
                    },
                    orderedList: {
                        windows: 'Shift-Ctrl-O',
                        mac: 'Shift-Cmd-O',
                        format: '1. {text}'
                    },
                    taskList: {
                        windows: 'Ctrl-T',
                        mac: 'Cmd-T',
                        format: '- [ ] {text}'
                    },
                    taskListDone: {
                        windows: 'Shift-Ctrl-D',
                        mac: 'Shift-Cmd-D',
                        format: '- [x] {text}'
                    },
                    heading1: {
                        windows: 'Shift-Ctrl-1',
                        mac: 'Shift-Cmd-1',
                        format: '# {text}'
                    },
                    heading2: {
                        windows: 'Shift-Ctrl-2',
                        mac: 'Shift-Cmd-2',
                        format: '## {text}'
                    },
                    heading3: {
                        windows: 'Shift-Ctrl-3',
                        mac: 'Shift-Cmd-3',
                        format: '### {text}'
                    },
                    heading4: {
                        windows: 'Shift-Ctrl-4',
                        mac: 'Shift-Cmd-4',
                        format: '#### {text}'
                    },
                    table: {
                        windows: 'Shift-Ctrl-T',
                        mac: 'Shift-Cmd-T',
                        format: '| 表头 | 表头 |\n| --- | --- |\n| 内容 | 内容 |'
                    },
                    table3Cols: {
                        windows: 'Alt-Ctrl-T',
                        mac: 'Alt-Cmd-T',
                        format: '| 表头 | 表头 | 表头 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |'
                    },
                    horizontalRule: {
                        windows: 'Shift-Ctrl-H',
                        mac: 'Shift-Cmd-H',
                        format: '\n---\n'
                    },
                    superscript: {
                        windows: 'Shift-Ctrl-Up',
                        mac: 'Shift-Cmd-Up',
                        format: '^{text}^'
                    },
                    subscript: {
                        windows: 'Shift-Ctrl-Down',
                        mac: 'Shift-Cmd-Down',
                        format: '~{text}~'
                    },
                    details: {
                        windows: 'Shift-Ctrl-/',
                        mac: 'Shift-Cmd-/',
                        format: '<details>\n<summary>{text}</summary>\n\n</details>'
                    },
                    keyboard: {
                        windows: 'Alt-K',
                        mac: 'Alt-K',
                        format: '<kbd>{text}</kbd>'
                    },
                    highlight: {
                        windows: 'Alt-H',
                        mac: 'Alt-H',
                        format: '=={text}=='
                    },
                    definition: {
                        windows: 'Alt-D',
                        mac: 'Alt-D',
                        format: '{text}\n: 定义内容'
                    },
                    footnote: {
                        windows: 'Alt-F',
                        mac: 'Alt-F',
                        format: '{text}[^1]\n\n[^1]: 脚注内容'
                    },
                    abbreviation: {
                        windows: 'Alt-A',
                        mac: 'Alt-A',
                        format: '*[{text}]: 缩写说明'
                    }
                }
            },
            timeout: 10000
        },

        utils: {
            isMac() {
                return navigator.platform.toLowerCase().includes('mac');
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
            },

            showToast(message, type = 'info') {
                const toast = document.createElement('div');
                toast.className = `ns-toast ns-toast-${type}`;
                toast.textContent = message;
                document.body.appendChild(toast);

                setTimeout(() => {
                    toast.classList.add('ns-toast-show');
                    setTimeout(() => {
                        toast.classList.remove('ns-toast-show');
                        setTimeout(() => toast.remove(), 300);
                    }, 3000);
                }, 100);
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

                await this.setupEditor();
                console.log('[NS助手] 编辑器增强模块初始化完成');
                this.utils.showToast('编辑器增强已启用', 'success');
            } catch (error) {
                console.error('[NS助手] 编辑器增强模块初始化失败:', error);
                this.utils.showToast('编辑器增强启用失败', 'error');
            }
        },

        async setupEditor() {
            console.log('[NS助手] 等待编辑器加载...');
            
            const codeMirrorElement = await this.utils.waitForElement('.CodeMirror');
            if (!codeMirrorElement) {
                throw new Error('编辑器加载超时');
            }

            const btnSubmit = await this.utils.waitForElement('.topic-select button.submit.btn.focus-visible');
            if (!btnSubmit) {
                throw new Error('提交按钮加载超时');
            }

            const codeMirrorInstance = codeMirrorElement.CodeMirror;
            if (!codeMirrorInstance) {
                throw new Error('CodeMirror实例未找到');
            }

            const isMac = this.utils.isMac();
            const submitKey = isMac ? this.config.shortcuts.submit.mac : this.config.shortcuts.submit.windows;
            const submitText = isMac ? '⌘+Enter' : 'Ctrl+Enter';

            if (!btnSubmit.textContent.includes(submitText)) {
                btnSubmit.innerText = `发布评论 (${submitText})`;
            }

            const keyMap = {
                [submitKey]: (cm) => {
                    btnSubmit.click();
                }
            };

            Object.entries(this.config.shortcuts.format).forEach(([name, config]) => {
                const key = isMac ? config.mac : config.windows;
                keyMap[key] = (cm) => {
                    const selection = cm.getSelection();
                    if (selection) {
                        const formatted = config.format.replace('{text}', selection);
                        cm.replaceSelection(formatted);
                        if (name === 'link') {
                            const cursor = cm.getCursor();
                            cm.setCursor({line: cursor.line, ch: cursor.ch - 1});
                        }
                    } else {
                        const cursor = cm.getCursor();
                        const line = cm.getLine(cursor.line);
                        if (['list', 'orderedList', 'quote'].includes(name)) {
                            const formatted = config.format.replace('{text}', line);
                            cm.replaceRange(formatted, {line: cursor.line, ch: 0}, {line: cursor.line, ch: line.length});
                        } else {
                            const placeholder = config.format.replace('{text}', '');
                            cm.replaceRange(placeholder, cursor);
                            if (name === 'link') {
                                cm.setCursor({line: cursor.line, ch: cursor.ch + 1});
                            } else if (name === 'codeBlock') {
                                cm.setCursor({line: cursor.line + 1, ch: 0});
                            } else {
                                const newCursor = cm.getCursor();
                                cm.setCursor({line: newCursor.line, ch: newCursor.ch - placeholder.length / 2});
                            }
                        }
                    }
                };
            });

            codeMirrorInstance.addKeyMap(keyMap);
            
            console.log('[NS助手] 编辑器增强设置完成');
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