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
                return document.querySelector('.avatar-normal') !== null;
            },

            showToast(message, type = 'info') {
                const toast = document.createElement('div');
                toast.className = `ns-toast ns-toast-${type}`;
                toast.textContent = message;
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.classList.add('ns-toast-fade-out');
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

        renderSettings(container) {
            const status = GM_getValue(this.config.storage.STATUS, this.config.modes.DISABLED);
            const settingsHtml = `
                <div class="ns-signin-settings">
                    <div class="ns-signin-mode">
                        <label>
                            <input type="radio" name="signin_mode" value="${this.config.modes.DISABLED}" ${status === this.config.modes.DISABLED ? 'checked' : ''}>
                            <span>禁用自动签到</span>
                        </label>
                        <label>
                            <input type="radio" name="signin_mode" value="${this.config.modes.RANDOM}" ${status === this.config.modes.RANDOM ? 'checked' : ''}>
                            <span>随机签到模式</span>
                        </label>
                        <label>
                            <input type="radio" name="signin_mode" value="${this.config.modes.FIXED}" ${status === this.config.modes.FIXED ? 'checked' : ''}>
                            <span>固定签到模式</span>
                        </label>
                    </div>
                    <button class="ns-signin-retry">立即签到</button>
                </div>
            `;
            
            container.innerHTML = settingsHtml;
            
            const radios = container.querySelectorAll('input[type="radio"]');
            radios.forEach(radio => {
                radio.addEventListener('change', () => {
                    GM_setValue(this.config.storage.STATUS, parseInt(radio.value));
                    location.reload();
                });
            });
            
            const retryButton = container.querySelector('.ns-signin-retry');
            retryButton.addEventListener('click', () => this.retrySignIn());
        },

        async executeAutoSignIn() {
            const status = GM_getValue(this.config.storage.STATUS, this.config.modes.DISABLED);
            const lastDate = GM_getValue(this.config.storage.LAST_DATE, '');
            const today = new Date().toDateString();

            if (status === this.config.modes.DISABLED || lastDate === today) {
                console.log('[NS助手] 跳过签到');
                return;
            }

            try {
                const signInBtn = await this.utils.waitForElement('.checkin-btn');
                if (!signInBtn) {
                    console.log('[NS助手] 未找到签到按钮');
                    return;
                }

                if (signInBtn.classList.contains('checked')) {
                    console.log('[NS助手] 今日已签到');
                    GM_setValue(this.config.storage.LAST_DATE, today);
                    return;
                }

                const chickens = status === this.config.modes.RANDOM ? 
                    Math.floor(Math.random() * 5) + 1 : 
                    5;

                const input = await this.utils.waitForElement('input[placeholder="1-5个鸡腿"]');
                if (!input) {
                    console.log('[NS助手] 未找到鸡腿输入框');
                    return;
                }

                input.value = chickens;
                signInBtn.click();

                GM_setValue(this.config.storage.LAST_DATE, today);
                this.utils.showToast('自动签到成功', 'success');
                console.log('[NS助手] 自动签到成功');
            } catch (error) {
                console.error('[NS助手] 自动签到失败:', error);
            }
        },

        async retrySignIn() {
            GM_setValue(this.config.storage.LAST_DATE, '');
            await this.executeAutoSignIn();
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