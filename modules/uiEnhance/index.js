(function() {
    'use strict';
    
    console.log('[NS助手] uiEnhance 模块开始加载');

    const NSUIEnhance = {
        id: 'uiEnhance',
        name: 'UI美化',
        description: '提供网站界面美化和自定义主题功能',

        config: {
            storage: {
                BG_IMAGE_ENABLED: 'ns_ui_bg_image_enabled',
                BG_IMAGE_URL: 'ns_ui_bg_image_url',
                OPACITY_ENABLED: 'ns_ui_opacity_enabled',
                OPACITY_VALUE: 'ns_ui_opacity_value',
                BLUR_ENABLED: 'ns_ui_blur_enabled',
                BLUR_VALUE: 'ns_ui_blur_value',
                TEXT_ENHANCE_ENABLED: 'ns_ui_text_enhance_enabled'
            }
        },

        settings: {
            items: [
                {
                    id: 'bgImageEnabled',
                    type: 'switch',
                    label: '启用背景图片',
                    default: false,
                    value: () => GM_getValue('ns_ui_bg_image_enabled', false)
                },
                {
                    id: 'bgImageUrl',
                    type: 'text',
                    label: '背景图片链接',
                    default: '',
                    value: () => GM_getValue('ns_ui_bg_image_url', '')
                },
                {
                    id: 'opacityEnabled',
                    type: 'switch',
                    label: '启用组件透明',
                    default: false,
                    value: () => GM_getValue('ns_ui_opacity_enabled', false)
                },
                {
                    id: 'opacityValue',
                    type: 'range',
                    label: '透明度',
                    default: 100,
                    min: 1,
                    max: 100,
                    value: () => GM_getValue('ns_ui_opacity_value', 100)
                },
                {
                    id: 'opacityNumber',
                    type: 'number',
                    label: '透明度数值',
                    default: 100,
                    min: 1,
                    max: 100,
                    value: () => GM_getValue('ns_ui_opacity_value', 100)
                },
                {
                    id: 'blurEnabled',
                    type: 'switch',
                    label: '启用磨砂效果',
                    default: false,
                    value: () => GM_getValue('ns_ui_blur_enabled', false)
                },
                {
                    id: 'blurValue',
                    type: 'range',
                    label: '模糊程度',
                    default: 10,
                    min: 1,
                    max: 20,
                    value: () => GM_getValue('ns_ui_blur_value', 10)
                },
                {
                    id: 'blurNumber',
                    type: 'number',
                    label: '模糊数值',
                    default: 10,
                    min: 1,
                    max: 20,
                    value: () => GM_getValue('ns_ui_blur_value', 10)
                },
                {
                    id: 'textEnhanceEnabled',
                    type: 'switch',
                    label: '启用文字增强',
                    default: false,
                    value: () => GM_getValue('ns_ui_text_enhance_enabled', false)
                }
            ],
            
            handleChange(settingId, value, settingsManager) {
                if (settingId === 'bgImageEnabled') {
                    GM_setValue('ns_ui_bg_image_enabled', value);
                } else if (settingId === 'bgImageUrl') {
                    GM_setValue('ns_ui_bg_image_url', value);
                } else if (settingId === 'opacityEnabled') {
                    GM_setValue('ns_ui_opacity_enabled', value);
                } else if (settingId === 'opacityValue' || settingId === 'opacityNumber') {
                    let numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                        numValue = Math.max(1, Math.min(100, numValue));
                        GM_setValue('ns_ui_opacity_value', numValue);
                        const otherInputId = settingId === 'opacityValue' ? 'opacityNumber' : 'opacityValue';
                        const currentInput = document.querySelector(`[data-setting-id="${settingId}"]`);
                        const otherInput = document.querySelector(`[data-setting-id="${otherInputId}"]`);
                        if (currentInput) {
                            currentInput.value = numValue;
                        }
                        if (otherInput) {
                            otherInput.value = numValue;
                        }
                    }
                } else if (settingId === 'blurEnabled') {
                    GM_setValue('ns_ui_blur_enabled', value);
                } else if (settingId === 'blurValue' || settingId === 'blurNumber') {
                    let numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                        numValue = Math.max(1, Math.min(20, numValue));
                        GM_setValue('ns_ui_blur_value', numValue);
                        const otherInputId = settingId === 'blurValue' ? 'blurNumber' : 'blurValue';
                        const currentInput = document.querySelector(`[data-setting-id="${settingId}"]`);
                        const otherInput = document.querySelector(`[data-setting-id="${otherInputId}"]`);
                        if (currentInput) {
                            currentInput.value = numValue;
                        }
                        if (otherInput) {
                            otherInput.value = numValue;
                        }
                    }
                } else if (settingId === 'textEnhanceEnabled') {
                    GM_setValue('ns_ui_text_enhance_enabled', value);
                }
                NSUIEnhance.applyStyles();
            }
        },

        applyStyles() {
            console.log('[NS助手] 开始应用样式');
            const enabled = GM_getValue(this.config.storage.BG_IMAGE_ENABLED, false);
            const imageUrl = GM_getValue(this.config.storage.BG_IMAGE_URL, '');
            const opacityEnabled = GM_getValue(this.config.storage.OPACITY_ENABLED, false);
            const opacityValue = GM_getValue(this.config.storage.OPACITY_VALUE, 100);
            const blurEnabled = GM_getValue(this.config.storage.BLUR_ENABLED, false);
            const blurValue = GM_getValue(this.config.storage.BLUR_VALUE, 10);
            const textEnhanceEnabled = GM_getValue(this.config.storage.TEXT_ENHANCE_ENABLED, false);
            const isDarkMode = document.body.classList.contains('dark-layout');

            console.log('[NS助手] 当前设置状态:', { enabled, imageUrl, opacityEnabled, opacityValue, blurEnabled, blurValue, textEnhanceEnabled, isDarkMode });

            const styleId = 'ns-ui-enhance-styles';
            let styleElement = document.getElementById(styleId);

            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                document.head.appendChild(styleElement);
            }

            let styles = '';

            if (enabled && imageUrl) {
                styles += `
                    body {
                        background-image: url('${imageUrl}') !important;
                        background-size: cover !important;
                        background-position: center top !important;
                        background-repeat: no-repeat !important;
                        background-attachment: fixed !important;
                    }
                `;
            }

            if (opacityEnabled || blurEnabled) {
                const mainColor = isDarkMode ? '39, 39, 39' : '255, 255, 255';
                const specialColor = isDarkMode ? '59, 59, 59' : '255, 255, 255';
                const alpha = opacityEnabled ? opacityValue / 100 : 1;
                const blur = blurEnabled ? `backdrop-filter: blur(${blurValue}px) !important;` : '';

                const mainElements = `
                    body #nsk-body,
                    body header,
                    body .card,
                    body .user-card,
                    body .post-content,
                    body .topic-content,
                    body .navbar,
                    body .sidebar,
                    body .user-info-card,
                    body footer {
                        ${opacityEnabled ? `background-color: rgba(${mainColor}, ${alpha * 0.2}) !important;` : ''}
                        ${blur}
                        ${textEnhanceEnabled ? `border: 1px solid rgba(${isDarkMode ? '255, 255, 255, 0.1' : '0, 0, 0, 0.1'}) !important;` : ''}
                    }

                    ${textEnhanceEnabled ? `
                    body .post-content,
                    body .topic-content,
                    body .card-body,
                    body .user-card-body {
                        color: ${isDarkMode ? '#fff' : '#000'} !important;
                        text-shadow: ${isDarkMode ? '0 0 2px rgba(0, 0, 0, 0.8)' : '0 0 2px rgba(255, 255, 255, 0.8)'} !important;
                    }

                    body .post-content a,
                    body .topic-content a,
                    body .card-body a,
                    body .user-card-body a {
                        text-shadow: none !important;
                        background-color: ${isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)'} !important;
                        padding: 0 4px !important;
                        border-radius: 2px !important;
                    }
                    ` : ''}
                `;

                const specialElements = `
                    body .tag,
                    body .pagination .page-item .page-link,
                    body .editor-toolbar,
                    body .CodeMirror,
                    body .badge,
                    body .dropdown-menu,
                    body .md-editor,
                    body .search-box,
                    body .pure-form,
                    body .nav-item-btn,
                    body .form-control,
                    body .md-editor-toolbar,
                    body .editor-toolbar,
                    body .CodeMirror,
                    body .editor-preview,
                    body .editor-preview-side,
                    body .editor-statusbar,
                    body .md-editor-content {
                        ${opacityEnabled ? `background-color: rgba(${specialColor}, ${alpha}) !important;` : ''}
                        ${blur}
                    }
                `;

                const previewElements = `
                    body .md-editor-preview,
                    body .editor-preview,
                    body .editor-preview-side {
                        ${opacityEnabled ? `background-color: rgba(${mainColor}, ${alpha}) !important;` : ''}
                        ${blur}
                    }
                `;

                const hoverElements = opacityEnabled ? `
                    body .btn:hover,
                    body .nav-item-btn:hover,
                    body .page-link:hover {
                        background-color: rgba(${specialColor}, ${Math.min(alpha + 0.1, 1)}) !important;
                    }
                ` : '';

                const editorElements = `
                    body .CodeMirror *,
                    body .editor-toolbar *,
                    body .editor-statusbar * {
                        background-color: transparent !important;
                    }
                `;

                styles += mainElements + specialElements + previewElements + hoverElements + editorElements;
            }

            styleElement.textContent = styles;
            console.log('[NS助手] 样式应用完成');
        },

        init() {
            console.log('[NS助手] 初始化UI增强模块');
            this.applyStyles();

            const addInputConstraints = () => {
                const inputs = document.querySelectorAll('input[type="number"][data-setting-id]');
                inputs.forEach(input => {
                    const settingId = input.getAttribute('data-setting-id');
                    if (settingId.includes('opacity')) {
                        input.addEventListener('input', (e) => {
                            let value = parseInt(e.target.value);
                            if (value < 1) e.target.value = 1;
                            if (value > 100) e.target.value = 100;
                        });
                    } else if (settingId.includes('blur')) {
                        input.addEventListener('input', (e) => {
                            let value = parseInt(e.target.value);
                            if (value < 1) e.target.value = 1;
                            if (value > 20) e.target.value = 20;
                        });
                    }
                });
            };

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach((node) => {
                            if (node.classList && node.classList.contains('ns-settings-panel')) {
                                addInputConstraints();
                            }
                        });
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            const themeObserver = new MutationObserver(() => {
                if (document.body.classList.contains('dark-layout')) {
                    console.log('[NS助手] 检测到切换到暗色模式');
                } else {
                    console.log('[NS助手] 检测到切换到亮色模式');
                }
                this.applyStyles();
            });

            themeObserver.observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });

            console.log('[NS助手] UI增强模块初始化完成 v0.0.4');
        }
    };

    console.log('[NS助手] 等待模块系统就绪');
    let retryCount = 0;
    const maxRetries = 50;

    const waitForNS = () => {
        retryCount++;
        console.log(`[NS助手] 第 ${retryCount} 次尝试注册 uiEnhance 模块`);
        
        if (typeof window.NSRegisterModule === 'function') {
            console.log('[NS助手] 模块系统就绪，开始注册 uiEnhance');
            window.NSRegisterModule(NSUIEnhance);
            console.log('[NS助手] uiEnhance 模块注册请求已发送');
        } else {
            console.log('[NS助手] 模块系统未就绪');
            if (retryCount < maxRetries) {
                setTimeout(waitForNS, 100);
            } else {
                console.error('[NS助手] 模块系统等待超时，uiEnhance 模块注册失败');
            }
        }
    };

    waitForNS();
    console.log('[NS助手] uiEnhance 模块加载完成');
})(); 