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
            console.log('[NS助手] 初始化自动签到模块');
            
            try {
                console.log('[NS助手] 开始加载签到模块样式');
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: 'https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/autoSignIn/style.css',
                    onload: (response) => {
                        if (response.status === 200) {
                            console.log('[NS助手] 签到模块样式加载成功');
                            GM_addStyle(response.responseText);
                        } else {
                            console.error('[NS助手] 加载签到模块样式失败:', response.status);
                        }
                    },
                    onerror: (error) => {
                        console.error('[NS助手] 加载签到模块样式出错:', error);
                    }
                });

                await this.setupSignIn();
                console.log('[NS助手] 自动签到模块初始化完成');
            } catch (error) {
                console.error('[NS助手] 自动签到模块初始化失败:', error);
            }
        },

        async setupSignIn() {
            console.log('[NS助手] 检查登录状态...');
            
            const loginCheck = await Promise.race([
                this.utils.waitForElement('.user-card'),
                this.utils.waitForElement('.nsk-panel')
            ]);

            if (!loginCheck || loginCheck.querySelector('h4')?.textContent.includes('陌生人')) {
                console.log('[NS助手] 用户未登录，跳过签到');
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
                this.utils.showToast(`已切换为${descriptions[nextStatus]}`, 'success');
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

            if (lastSignDate !== today) {
                console.log('[NS助手] 开始执行今日签到');
                await this.performSignIn(status === this.config.modes.RANDOM);
                GM_setValue(this.config.storage.LAST_DATE, today);
            } else {
                console.log('[NS助手] 今日已签到');
                this.utils.showToast('今日已完成签到', 'info');
            }
        },

        async retrySignIn() {
            const status = GM_getValue(this.config.storage.STATUS, this.config.modes.DISABLED);
            if (status === this.config.modes.DISABLED) {
                this.utils.showToast('请先启用自动签到功能', 'error');
                return;
            }

            GM_setValue(this.config.storage.LAST_DATE, '');
            this.utils.showToast('正在重新签到...', 'info');
            await this.executeAutoSignIn();
        },

        async performSignIn(isRandom) {
            try {
                console.log(`[NS助手] 执行${isRandom ? '随机' : '固定'}签到`);
                const response = await this.sendSignInRequest(isRandom);
                
                if (response.success) {
                    const message = `签到成功！获得${response.gain}个鸡腿，当前共有${response.current}个鸡腿`;
                    console.log('[NS助手]', message);
                    this.utils.showToast(message, 'success');
                } else {
                    console.error('[NS助手] 签到失败:', response.message);
                    this.utils.showToast(response.message || '签到失败', 'error');
                }
            } catch (error) {
                console.error('[NS助手] 签到请求出错:', error);
                this.utils.showToast('签到过程中发生错误', 'error');
            }
        },

        sendSignInRequest(isRandom) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url: '/api/attendance?random=' + isRandom,
                    headers: {'Content-Type': 'application/json'},
                    data: JSON.stringify({}),
                    onload: response => {
                        try {
                            resolve(JSON.parse(response.responseText));
                        } catch (error) {
                            reject(error);
                        }
                    },
                    onerror: reject
                });
            });
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