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
                BG_IMAGE_URL: 'ns_ui_bg_image_url'
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
                }
            ],
            
            handleChange(settingId, value, settingsManager) {
                settingsManager.cacheValue(`ns_ui_${settingId}`, value);
                NSUIEnhance.applyBackgroundImage();
            }
        },

        applyBackgroundImage() {
            console.log('[NS助手] 开始应用背景图片样式');
            const enabled = GM_getValue(this.config.storage.BG_IMAGE_ENABLED, false);
            const imageUrl = GM_getValue(this.config.storage.BG_IMAGE_URL, '');

            const styleId = 'ns-ui-bg-image-styles';
            let styleElement = document.getElementById(styleId);

            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                document.head.appendChild(styleElement);
            }

            if (enabled && imageUrl) {
                styleElement.textContent = `
                    body::before {
                        content: '';
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: -1;
                        background-image: url('${imageUrl}');
                        background-size: cover;
                        background-position: center center;
                        background-repeat: no-repeat;
                        background-attachment: fixed;
                        opacity: 0.9;
                        pointer-events: none;
                    }
                    body {
                        position: relative;
                        background-color: transparent !important;
                    }
                    .card, .user-card, .post-content, .topic-content {
                        background-color: rgba(255, 255, 255, 0.9) !important;
                        backdrop-filter: blur(10px);
                    }
                `;
            } else {
                styleElement.textContent = '';
            }
            console.log('[NS助手] 背景图片样式应用完成');
        },

        init() {
            console.log('[NS助手] 初始化UI增强模块');
            this.applyBackgroundImage();
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