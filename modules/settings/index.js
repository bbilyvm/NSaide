(function() {
    'use strict';
    
    console.log('[NS助手] settings 模块开始加载');

    const NSSettings = {
        id: 'settings',
        name: '设置面板',
        description: '提供统一的设置界面',

        config: {
            storage: {
                PANEL_POSITION: 'settings.panelPosition'
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
            }
        },

        createSettingsPanel() {
            const overlay = document.createElement('div');
            overlay.className = 'ns-settings-overlay';

            const panel = document.createElement('div');
            panel.className = 'ns-settings-panel';

            const header = document.createElement('div');
            header.className = 'ns-settings-header';

            const title = document.createElement('div');
            title.className = 'ns-settings-title';
            title.textContent = 'NS助手设置';

            const closeBtn = document.createElement('div');
            closeBtn.className = 'ns-settings-close';
            closeBtn.textContent = '×';
            closeBtn.onclick = () => {
                overlay.classList.remove('ns-settings-show');
                panel.classList.remove('ns-settings-show');
                setTimeout(() => overlay.remove(), 300);
            };

            header.appendChild(title);
            header.appendChild(closeBtn);

            const content = document.createElement('div');
            content.className = 'ns-settings-content ns-settings-scrollbar';

            panel.appendChild(header);
            panel.appendChild(content);
            overlay.appendChild(panel);
            document.body.appendChild(overlay);

            setTimeout(() => {
                overlay.classList.add('ns-settings-show');
                panel.classList.add('ns-settings-show');
            }, 100);

            this.renderModuleSettings(content);
        },

        renderModuleSettings(container) {
            if (!window.NSModules) {
                console.error('[NS助手] 未找到模块列表');
                return;
            }

            Object.values(window.NSModules).forEach(module => {
                if (module.id === this.id) return;

                const moduleCard = document.createElement('div');
                moduleCard.className = 'ns-settings-module';

                const header = document.createElement('div');
                header.className = 'ns-settings-module-header';

                const info = document.createElement('div');
                info.className = 'ns-settings-module-info';

                const title = document.createElement('div');
                title.className = 'ns-settings-module-title';
                title.textContent = module.name;

                const desc = document.createElement('div');
                desc.className = 'ns-settings-module-desc';
                desc.textContent = module.description;

                info.appendChild(title);
                info.appendChild(desc);

                const toggle = document.createElement('div');
                toggle.className = 'ns-settings-module-toggle';
                if (module.enabled) {
                    toggle.classList.add('ns-settings-enabled');
                }

                toggle.onclick = () => {
                    const isEnabled = toggle.classList.contains('ns-settings-enabled');
                    if (isEnabled) {
                        toggle.classList.remove('ns-settings-enabled');
                        window.NSDisableModule(module.id);
                    } else {
                        toggle.classList.add('ns-settings-enabled');
                        window.NSEnableModule(module.id);
                    }
                };

                header.appendChild(info);
                header.appendChild(toggle);

                const moduleContent = document.createElement('div');
                moduleContent.className = 'ns-settings-module-content';

                if (typeof module.renderSettings === 'function') {
                    const settings = module.renderSettings();
                    if (settings) {
                        moduleContent.appendChild(settings);
                        moduleContent.classList.add('ns-settings-show');
                    }
                }

                moduleCard.appendChild(header);
                if (moduleContent.hasChildNodes()) {
                    moduleCard.appendChild(moduleContent);
                }

                container.appendChild(moduleCard);
            });
        },

        init() {
            console.log('[NS助手] 初始化设置面板');

            console.log('[NS助手] 开始加载设置面板样式');
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/settings/style.css',
                onload: (response) => {
                    if (response.status === 200) {
                        console.log('[NS助手] 设置面板样式加载成功');
                        GM_addStyle(response.responseText);
                    } else {
                        console.error('[NS助手] 加载设置面板样式失败:', response.status);
                    }
                },
                onerror: (error) => {
                    console.error('[NS助手] 加载设置面板样式出错:', error);
                }
            });

            GM_registerMenuCommand('NS助手设置', () => {
                this.createSettingsPanel();
            });

            console.log('[NS助手] 设置面板初始化完成');
        }
    };

    console.log('[NS助手] 等待模块系统就绪');
    let retryCount = 0;
    const maxRetries = 50;

    const waitForNS = () => {
        retryCount++;
        console.log(`[NS助手] 第 ${retryCount} 次尝试注册 settings 模块`);
        
        if (typeof window.NSRegisterModule === 'function') {
            console.log('[NS助手] 模块系统就绪，开始注册 settings');
            window.NSRegisterModule(NSSettings);
            console.log('[NS助手] settings 模块注册请求已发送');
        } else {
            console.log('[NS助手] 模块系统未就绪');
            if (retryCount < maxRetries) {
                setTimeout(waitForNS, 100);
            } else {
                console.error('[NS助手] 模块系统等待超时，settings 模块注册失败');
            }
        }
    };

    waitForNS();
    console.log('[NS助手] settings 模块加载完成');
})(); 