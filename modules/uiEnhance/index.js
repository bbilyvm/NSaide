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
                OPACITY_VALUE: 'ns_ui_opacity_value'
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
                    const numValue = parseInt(value);
                    if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
                        GM_setValue('ns_ui_opacity_value', numValue);
                        const otherInputId = settingId === 'opacityValue' ? 'opacityNumber' : 'opacityValue';
                        const otherInput = document.querySelector(`[data-setting-id="${otherInputId}"]`);
                        if (otherInput) {
                            otherInput.value = numValue;
                        }
                    }
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
            const isDarkMode = document.body.classList.contains('dark-layout');

            console.log('[NS助手] 当前设置状态:', { enabled, imageUrl, opacityEnabled, opacityValue, isDarkMode });

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

            if (opacityEnabled) {
                const alpha = opacityValue / 100;
                const mainColor = isDarkMode ? '39, 39, 39' : '255, 255, 255';
                const specialColor = isDarkMode ? '59, 59, 59' : '255, 255, 255';
                styles += `
                    #nsk-body, header, .card, .user-card, .post-content, .topic-content, .navbar, .sidebar {
                        background-color: rgba(${mainColor}, ${alpha}) !important;
                    }
                    footer {
                        background-color: rgba(${mainColor}, ${alpha * 0.2}) !important;
                    }
                    .tag, .pagination .page-item .page-link, .editor-toolbar, .CodeMirror, 
                    .user-info-card, .stat-block, .badge, .dropdown-menu,
                    .md-editor, .user-stat, .search-box, .pure-form,
                    .btn.new-discussion, .nav-item-btn, .submit.btn.focus-visible,
                    .pager-pos, .btn, .form-control {
                        background-color: rgba(${specialColor}, ${alpha}) !important;
                    }
                    .md-editor-preview {
                        background-color: rgba(${mainColor}, ${alpha}) !important;
                    }
                    .btn:hover, .nav-item-btn:hover {
                        background-color: rgba(${specialColor}, ${Math.min(alpha + 0.1, 1)}) !important;
                    }
                `;
            }

            styleElement.textContent = styles;
            console.log('[NS助手] 样式应用完成');
        },

        init() {
            console.log('[NS助手] 初始化UI增强模块');
            this.applyStyles();

            const observer = new MutationObserver(() => {
                if (document.body.classList.contains('dark-layout')) {
                    console.log('[NS助手] 检测到切换到暗色模式');
                } else {
                    console.log('[NS助手] 检测到切换到亮色模式');
                }
                this.applyStyles();
            });

            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });

            console.log('[NS助手] UI增强模块初始化完成');
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