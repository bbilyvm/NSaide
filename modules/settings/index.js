(function() {
    'use strict';
    
    console.log('[NS助手] settings 模块开始加载');

    const NSSettings = {
        id: 'settings',
        name: '设置面板',
        description: '提供统一的设置界面',

        config: {
            storage: {
                PANEL_POSITION: 'ns_settings_position'
            }
        },

        components: {
            createSwitch(id, checked, onChange) {
                const switchLabel = document.createElement('label');
                switchLabel.className = 'ns-settings-switch';
                switchLabel.innerHTML = `
                    <input type="checkbox" ${checked ? 'checked' : ''}>
                    <span class="ns-settings-switch-slider"></span>
                `;
                
                const input = switchLabel.querySelector('input');
                input.addEventListener('change', () => onChange(input.checked));
                
                return switchLabel;
            },

            createSelect(id, options, value, onChange) {
                const select = document.createElement('select');
                select.className = 'ns-settings-select';
                
                options.forEach(option => {
                    const optElement = document.createElement('option');
                    optElement.value = option.value;
                    optElement.textContent = option.label;
                    optElement.selected = option.value === value;
                    select.appendChild(optElement);
                });
                
                select.addEventListener('change', () => onChange(select.value));
                return select;
            },

            createInput(id, value, onChange, type = 'text') {
                const input = document.createElement('input');
                input.className = 'ns-settings-input';
                input.type = type;
                input.value = value;
                
                input.addEventListener('change', () => onChange(input.value));
                return input;
            },

            createButton(id, label, onClick) {
                const button = document.createElement('button');
                button.className = 'ns-settings-button';
                button.textContent = label;
                button.addEventListener('click', onClick);
                return button;
            },

            createSettingItem(label, component) {
                const container = document.createElement('div');
                container.className = 'ns-settings-item';
                
                const labelElement = document.createElement('span');
                labelElement.className = 'ns-settings-item-label';
                labelElement.textContent = label;
                
                container.appendChild(labelElement);
                container.appendChild(component);
                
                return container;
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

            createSettingsPanel() {
                const panel = document.createElement('div');
                panel.className = 'ns-settings-panel';
                panel.innerHTML = `
                    <div class="ns-settings-header">
                        <h2 class="ns-settings-header-title">NS助手设置</h2>
                        <span class="ns-settings-header-close">×</span>
                    </div>
                    <div class="ns-settings-content">
                        <div class="ns-settings-content-modules"></div>
                    </div>
                `;

                const closeBtn = panel.querySelector('.ns-settings-header-close');
                closeBtn.onclick = () => panel.remove();

                const header = panel.querySelector('.ns-settings-header');
                let isDragging = false;
                let currentX;
                let currentY;
                let initialX;
                let initialY;
                let xOffset = 0;
                let yOffset = 0;

                const dragStart = (e) => {
                    if (e.type === "touchstart") {
                        initialX = e.touches[0].clientX - xOffset;
                        initialY = e.touches[0].clientY - yOffset;
                    } else {
                        initialX = e.clientX - xOffset;
                        initialY = e.clientY - yOffset;
                    }
                    
                    if (e.target === header) {
                        isDragging = true;
                    }
                };

                const dragEnd = () => {
                    initialX = currentX;
                    initialY = currentY;
                    isDragging = false;
                    
                    GM_setValue(NSSettings.config.storage.PANEL_POSITION, {
                        x: xOffset,
                        y: yOffset
                    });
                };

                const drag = (e) => {
                    if (isDragging) {
                        e.preventDefault();
                        
                        if (e.type === "touchmove") {
                            currentX = e.touches[0].clientX - initialX;
                            currentY = e.touches[0].clientY - initialY;
                        } else {
                            currentX = e.clientX - initialX;
                            currentY = e.clientY - initialY;
                        }

                        xOffset = currentX;
                        yOffset = currentY;
                        panel.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
                    }
                };

                header.addEventListener("touchstart", dragStart, false);
                header.addEventListener("touchend", dragEnd, false);
                header.addEventListener("touchmove", drag, false);
                header.addEventListener("mousedown", dragStart, false);
                document.addEventListener("mouseup", dragEnd, false);
                document.addEventListener("mousemove", drag, false);

                const lastPosition = GM_getValue(NSSettings.config.storage.PANEL_POSITION, null);
                if (lastPosition) {
                    xOffset = lastPosition.x;
                    yOffset = lastPosition.y;
                    panel.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
                }

                return panel;
            },

            renderModuleSettings() {
                const modulesContainer = document.querySelector('.ns-settings-content-modules');
                if (!modulesContainer) return;

                modulesContainer.innerHTML = '';
                window.NS.modules.forEach((module) => {
                    const moduleCard = document.createElement('div');
                    moduleCard.className = 'ns-settings-module';
                    
                    const moduleHeader = document.createElement('div');
                    moduleHeader.className = 'ns-settings-module-header';
                    
                    const moduleTitle = document.createElement('h3');
                    moduleTitle.className = 'ns-settings-module-title';
                    moduleTitle.textContent = module.name;
                    
                    const moduleSwitch = NSSettings.components.createSwitch(
                        `module_${module.id}_enabled`,
                        module.enabled,
                        (checked) => {
                            GM_setValue(`module_${module.id}_enabled`, checked);
                            location.reload();
                        }
                    );
                    
                    moduleHeader.appendChild(moduleTitle);
                    moduleHeader.appendChild(moduleSwitch);
                    
                    const moduleDesc = document.createElement('p');
                    moduleDesc.className = 'ns-settings-module-desc';
                    moduleDesc.textContent = module.description;
                    
                    moduleCard.appendChild(moduleHeader);
                    moduleCard.appendChild(moduleDesc);
                    
                    if (module.settings) {
                        const moduleSettings = document.createElement('div');
                        moduleSettings.className = 'ns-settings-module-content';
                        
                        module.settings.forEach(setting => {
                            let component;
                            const value = setting.value ? setting.value() : GM_getValue(`${module.id}_${setting.id}`, setting.default);
                            
                            switch (setting.type) {
                                case 'switch':
                                    component = NSSettings.components.createSwitch(
                                        `${module.id}_${setting.id}`,
                                        value,
                                        (checked) => {
                                            GM_setValue(`${module.id}_${setting.id}`, checked);
                                            if (setting.onChange) setting.onChange(checked);
                                        }
                                    );
                                    break;
                                    
                                case 'select':
                                    component = NSSettings.components.createSelect(
                                        `${module.id}_${setting.id}`,
                                        setting.options,
                                        value,
                                        (newValue) => {
                                            GM_setValue(`${module.id}_${setting.id}`, newValue);
                                            if (setting.onChange) setting.onChange(newValue);
                                        }
                                    );
                                    break;
                                    
                                case 'text':
                                case 'number':
                                    component = NSSettings.components.createInput(
                                        `${module.id}_${setting.id}`,
                                        value,
                                        (newValue) => {
                                            GM_setValue(`${module.id}_${setting.id}`, newValue);
                                            if (setting.onChange) setting.onChange(newValue);
                                        },
                                        setting.type
                                    );
                                    break;

                                case 'button':
                                    component = NSSettings.components.createButton(
                                        `${module.id}_${setting.id}`,
                                        setting.label,
                                        setting.onClick
                                    );
                                    break;
                            }
                            
                            if (component) {
                                moduleSettings.appendChild(
                                    NSSettings.components.createSettingItem(setting.label, component)
                                );
                            }
                        });
                        
                        moduleCard.appendChild(moduleSettings);
                    }
                    
                    modulesContainer.appendChild(moduleCard);
                });
            }
        },

        init() {
            console.log('[NS助手] 初始化设置面板模块');
            
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

            const boundCreateSettingsPanel = this.utils.createSettingsPanel.bind(this.utils);
            const boundRenderModuleSettings = this.utils.renderModuleSettings.bind(this.utils);

            GM_registerMenuCommand('⚙️ 打开设置面板', () => {
                const panel = boundCreateSettingsPanel();
                document.body.appendChild(panel);
                boundRenderModuleSettings();
            });

            console.log('[NS助手] 设置面板模块初始化完成');
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