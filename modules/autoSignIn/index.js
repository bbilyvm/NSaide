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
            timeout: 10000
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
            this.registerMenuItems();
            await this.executeAutoSignIn();
            return true;
        },

        registerMenuItems() {
            const status = GM_getValue(this.config.storage.STATUS, this.config.modes.DISABLED);
            const modes = ['🔴 签到已禁用', '🟢 随机签到模式', '🟡 固定签到模式'];
            const descriptions = ['自动签到已关闭', '每日随机获取鸡腿', '每日固定5个鸡腿'];
            
            GM_registerMenuCommand(`${modes[status]} - ${descriptions[status]}`, () => {
                const nextStatus = (status + 1) % modes.length;
                GM_setValue(this.config.storage.STATUS, nextStatus);
                location.reload();
            });

            GM_registerMenuCommand('🔄 重新签到', () => this.retrySignIn());
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

        async retrySignIn() {
            const status = GM_getValue(this.config.storage.STATUS, this.config.modes.DISABLED);
            if (status === this.config.modes.DISABLED) return;

            console.log('[NS助手] 执行重新签到');
            GM_setValue(this.config.storage.LAST_DATE, '');
            await this.executeAutoSignIn();
        },

        async performSignIn(isRandom) {
            try {
                console.log(`[NS助手] 执行${isRandom ? '随机' : '固定'}签到`);
                console.log('[NS助手] 当前页面URL:', window.location.href);

                const response = await this.sendSignInRequest(isRandom);
                console.log('[NS助手] 签到响应:', response);
                
                if (response.success) {
                    console.log(`[NS助手] 签到成功！获得${response.gain}个鸡腿，当前共有${response.current}个鸡腿`);
                } else {
                    console.log('[NS助手] 签到失败:', response.message);
                }
            } catch (error) {
                console.error('[NS助手] 签到请求出错:', error);
                console.log('[NS助手] 错误详情:', error.message);
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

                if (!response.ok) {
                    throw new Error(`请求失败: ${response.status}`);
                }

                const data = await response.json();
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