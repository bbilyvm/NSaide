(function() {
    'use strict';
    
    console.log('[NS助手] autoSignIn 模块开始加载');

    const NSAutoSignIn = {
        id: 'autoSignIn',
        name: '自动签到',
        description: '自动完成每日签到，支持随机和固定模式',

        config: {
            storage: {
                STATUS: 'ns_signin_status',
                LAST_DATE: 'ns_signin_last_date'
            },
            modes: {
                DISABLED: 0,
                RANDOM: 1,
                FIXED: 2
            },
            timeout: 10000,
            errors: {
                ALREADY_SIGNED: '今天已完成签到，请勿重复操作'
            }
        },

        settings: [
            {
                id: 'mode',
                type: 'select',
                label: '签到模式',
                default: 0,
                value: () => GM_getValue('ns_signin_status', 0),
                options: [
                    { value: 0, label: '禁用自动签到' },
                    { value: 1, label: '随机签到模式' },
                    { value: 2, label: '固定签到模式' }
                ],
                onChange: (value) => {
                    NSSettings.settingsCache.set('ns_signin_status', parseInt(value));
                    NSSettings.needsSave = true;
                    document.querySelector('.ns-settings-save-bar').classList.add('ns-settings-save-bar-active');
                }
            },
            {
                id: 'retry',
                type: 'button',
                label: '立即签到',
                onClick: async () => {
                    const status = GM_getValue('ns_signin_status', 0);
                    if (status === 0) return;
                    
                    GM_setValue('ns_signin_last_date', '');
                    await NSAutoSignIn.executeAutoSignIn();
                }
            }
        ],

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

            checkLoginStatus() {
                console.log('[NS助手] 开始检查登录状态');
                
                const userCard = document.querySelector('.user-card');
                if (!userCard) {
                    console.log('[NS助手] 未找到用户卡片元素');
                    return false;
                }

                const username = userCard.querySelector('.Username');
                if (!username) {
                    console.log('[NS助手] 未找到用户名元素');
                    return false;
                }
                console.log('[NS助手] 当前用户:', username.textContent);

                const statBlock = userCard.querySelector('.stat-block');
                if (!statBlock) {
                    console.log('[NS助手] 未找到用户状态栏');
                    return false;
                }

                const levelInfo = statBlock.querySelector('span[data-v-0f04b1f4]');
                if (!levelInfo || !levelInfo.textContent.includes('等级')) {
                    console.log('[NS助手] 未找到等级信息');
                    return false;
                }
                console.log('[NS助手] 用户等级:', levelInfo.textContent);

                console.log('[NS助手] 登录状态检查通过');
                return true;
            },

            showToast(message, type = 'info') {
                const toast = document.createElement('div');
                toast.className = `ns-signin-toast ns-signin-toast-${type}`;
                toast.textContent = message;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.classList.add('ns-signin-toast-fade-out');
                    setTimeout(() => toast.remove(), 300);
                }, 3000);
            }
        },

        async init() {
            console.log('[NS助手] 初始化自动签到模块');
            await this.setupSignIn();
            console.log('[NS助手] 自动签到模块初始化完成');
        },

        async setupSignIn() {
            console.log('[NS助手] 检查登录状态...');
            
            if (!this.utils.checkLoginStatus()) {
                console.log('[NS助手] 未检测到完整的用户信息，跳过签到');
                return false;
            }

            console.log('[NS助手] 用户已登录，继续执行签到');
            await this.executeAutoSignIn();
            return true;
        },

        async executeAutoSignIn() {
            const status = GM_getValue(this.config.storage.STATUS, this.config.modes.DISABLED);
            if (status === this.config.modes.DISABLED) {
                console.log('[NS助手] 自动签到已禁用');
                return;
            }

            const today = new Date().toLocaleDateString();
            const lastSignDate = GM_getValue(this.config.storage.LAST_DATE);

            console.log('[NS助手] 上次签到日期:', lastSignDate);
            console.log('[NS助手] 当前日期:', today);

            if (lastSignDate !== today) {
                console.log('[NS助手] 开始执行今日签到');
                await this.performSignIn(status === this.config.modes.RANDOM);
                GM_setValue(this.config.storage.LAST_DATE, today);
            } else {
                console.log('[NS助手] 今日已签到，跳过');
            }
        },

        async performSignIn(isRandom) {
            try {
                console.log(`[NS助手] 执行${isRandom ? '随机' : '固定'}签到`);
                console.log('[NS助手] 当前页面URL:', window.location.href);

                const response = await this.sendSignInRequest(isRandom);
                console.log('[NS助手] 签到响应:', response);
                
                if (response.success) {
                    console.log(`[NS助手] 签到成功！获得${response.gain}个鸡腿，当前共有${response.current}个鸡腿`);
                    this.utils.showToast(`签到成功！获得${response.gain}个鸡腿`, 'success');
                    GM_setValue(this.config.storage.LAST_DATE, new Date().toLocaleDateString());
                } else if (response.message === this.config.errors.ALREADY_SIGNED) {
                    console.log('[NS助手] 今日已签到');
                    this.utils.showToast('今日已签到', 'info');
                    GM_setValue(this.config.storage.LAST_DATE, new Date().toLocaleDateString());
                } else {
                    console.log('[NS助手] 签到失败:', response.message);
                    this.utils.showToast(`签到失败: ${response.message}`, 'error');
                }
            } catch (error) {
                console.error('[NS助手] 签到请求出错:', error);
                console.log('[NS助手] 错误详情:', error.message);
                this.utils.showToast('签到失败，请稍后重试', 'error');
            }
        },

        async sendSignInRequest(isRandom) {
            const url = `/api/attendance?random=${isRandom}`;
            console.log('[NS助手] 发送签到请求:', url);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json, text/plain, */*',
                        'content-type': 'application/json',
                        'x-requested-with': 'XMLHttpRequest'
                    },
                    credentials: 'same-origin'
                });

                const data = await response.json();
                
                if (!response.ok && !data.message) {
                    throw new Error(`请求失败: ${response.status}`);
                }

                return data;
            } catch (error) {
                console.error('[NS助手] 请求失败:', error);
                throw error;
            }
        }
    };

    console.log('[NS助手] 等待模块系统就绪');
    let retryCount = 0;
    const maxRetries = 50;

    const waitForNS = () => {
        retryCount++;
        console.log(`[NS助手] 第 ${retryCount} 次尝试注册 autoSignIn 模块`);
        
        if (typeof window.NSRegisterModule === 'function') {
            console.log('[NS助手] 模块系统就绪，开始注册 autoSignIn');
            window.NSRegisterModule(NSAutoSignIn);
            console.log('[NS助手] autoSignIn 模块注册请求已发送');
        } else {
            console.log('[NS助手] 模块系统未就绪');
            if (retryCount < maxRetries) {
                setTimeout(waitForNS, 100);
            } else {
                console.error('[NS助手] 模块系统等待超时，autoSignIn 模块注册失败');
            }
        }
    };

    waitForNS();
    console.log('[NS助手] autoSignIn 模块加载完成');
})();