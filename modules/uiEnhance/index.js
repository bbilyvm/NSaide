(function() {
    'use strict';
    
    console.log('[NS助手] uiEnhance 模块开始加载');

    const NSUIEnhance = {
        id: 'uiEnhance',
        name: 'UI美化',
        description: '提供网站界面美化和自定义主题功能',

        config: {
            storage: {
                THEME: 'ns_ui_theme',
                BG_COLOR: 'ns_ui_bg_color',
                CUSTOM_CSS: 'ns_ui_custom_css'
            }
        },

        settings: {
            items: [
                {
                    id: 'theme',
                    type: 'select',
                    label: '主题模式',
                    default: 'default',
                    value: () => GM_getValue('ns_ui_theme', 'default'),
                    options: [
                        { value: 'default', label: '默认主题' },
                        { value: 'dark', label: '深色主题' },
                        { value: 'light', label: '浅色主题' },
                        { value: 'custom', label: '自定义主题' }
                    ]
                },
                {
                    id: 'bgColor',
                    type: 'text',
                    label: '背景颜色',
                    default: '#ffffff',
                    value: () => GM_getValue('ns_ui_bg_color', '#ffffff')
                },
                {
                    id: 'customCSS',
                    type: 'text',
                    label: '自定义CSS',
                    default: '',
                    value: () => GM_getValue('ns_ui_custom_css', '')
                },
                {
                    id: 'apply',
                    type: 'button',
                    label: '应用样式',
                    onClick: () => NSUIEnhance.applyStyles()
                }
            ],
            
            handleChange(settingId, value, settingsManager) {
                settingsManager.cacheValue(`ns_ui_${settingId}`, value);
            }
        },

        applyStyles() {
            console.log('[NS助手] 开始应用UI样式');
            const theme = GM_getValue(this.config.storage.THEME, 'default');
            const bgColor = GM_getValue(this.config.storage.BG_COLOR, '#ffffff');
            const customCSS = GM_getValue(this.config.storage.CUSTOM_CSS, '');

            let styles = '';

            switch (theme) {
                case 'dark':
                    styles += `
                        body {
                            background-color: #1a1a1a !important;
                            color: #ffffff !important;
                        }
                        .card {
                            background-color: #2d2d2d !important;
                            border-color: #3d3d3d !important;
                        }
                    `;
                    break;
                case 'light':
                    styles += `
                        body {
                            background-color: #f5f5f5 !important;
                            color: #333333 !important;
                        }
                        .card {
                            background-color: #ffffff !important;
                            border-color: #e8e8e8 !important;
                        }
                    `;
                    break;
                case 'custom':
                    styles += `
                        body {
                            background-color: ${bgColor} !important;
                        }
                        ${customCSS}
                    `;
                    break;
            }

            const styleId = 'ns-ui-enhance-styles';
            let styleElement = document.getElementById(styleId);

            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                document.head.appendChild(styleElement);
            }

            styleElement.textContent = styles;
            console.log('[NS助手] UI样式应用完成');
        },

        init() {
            console.log('[NS助手] 初始化UI增强模块');
            this.applyStyles();
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