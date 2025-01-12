(() => {
    const STORAGE_KEYS = {
        STATUS: 'signin_status',
        LAST_DATE: 'signin_last_date'
    };

    const SIGN_MODES = {
        DISABLED: 0,
        RANDOM: 1,
        FIXED: 2
    };

    class SignInManager {
        constructor() {
            this.isLoggedIn = this.checkLoginStatus();
        }

        checkLoginStatus() {
            return document.querySelector('.user-info') !== null;
        }

        init() {
            if (!this.isLoggedIn) return;
            this.registerMenuItems();
            this.executeAutoSignIn();
        }

        registerMenuItems() {
            const status = GM_getValue(STORAGE_KEYS.STATUS, SIGN_MODES.DISABLED);
            const modes = ['已禁用', '随机模式', '固定模式'];
            
            GM_registerMenuCommand(`签到状态: ${modes[status]}`, () => {
                const nextStatus = (status + 1) % Object.keys(modes).length;
                GM_setValue(STORAGE_KEYS.STATUS, nextStatus);
                location.reload();
            });
        }

        executeAutoSignIn() {
            const status = GM_getValue(STORAGE_KEYS.STATUS, SIGN_MODES.DISABLED);
            if (status === SIGN_MODES.DISABLED) return;

            const today = new Date().toLocaleDateString();
            const lastSignDate = GM_getValue(STORAGE_KEYS.LAST_DATE);

            if (lastSignDate !== today) {
                this.performSignIn(status === SIGN_MODES.RANDOM);
                GM_setValue(STORAGE_KEYS.LAST_DATE, today);
            }
        }

        async performSignIn(isRandom) {
            try {
                const response = await this.sendSignInRequest(isRandom);
                if (response.success) {
                    this.showMessage('success', `获得${response.gain}鸡腿，当前总计${response.current}鸡腿`);
                }
            } catch (error) {
                this.showMessage('error', '签到失败');
            }
        }

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

        showMessage(type, content) {
            unsafeWindow.mscAlert(type === 'success' ? '成功' : '错误', content);
        }
    }

    window.NSRegisterModule({
        id: 'autoSignIn',
        name: 'AutoSignIn',
        init: () => new SignInManager().init()
    });
})(); 