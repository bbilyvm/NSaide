(() => {
    const SETTING_SIGN_IN_STATUS = 'ns_sign_in_status';
    const SETTING_SIGN_IN_LAST_DATE = 'ns_sign_in_last_date';
    const SETTING_SIGN_IN_IGNORE_DATE = 'ns_sign_in_ignore_date';

    const util = {
        getCurrentDate() {
            return new Date().toLocaleDateString();
        },
        getValue(key) {
            return GM_getValue(key);
        },
        setValue(key, value) {
            GM_setValue(key, value);
        },
        createElement(tag, options = {}) {
            const el = document.createElement(tag);
            if (options.staticClass) el.className = options.staticClass;
            return el;
        },
        data(el, key) {
            return el.dataset[key] === 'true';
        },
        async post(url, data = {}, headers = {}) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'POST',
                    url,
                    headers,
                    data: JSON.stringify(data),
                    onload: response => {
                        try {
                            const json = JSON.parse(response.responseText);
                            resolve(json);
                        } catch (error) {
                            reject(error);
                        }
                    },
                    onerror: reject
                });
            });
        }
    };

    const message = {
        success(text) {
            unsafeWindow.mscAlert('成功', text);
        },
        info(text) {
            unsafeWindow.mscAlert('提示', text);
        }
    };

    class AutoSignIn {
        constructor() {
            this.loginStatus = document.querySelector('.user-info') !== null;
        }

        init() {
            this.addSignInMenu();
            this.autoSignIn();
            this.addSignTips();
        }

        addSignInMenu() {
            const menuStates = ['关闭自动签到', '随机抽鸡腿', '只要5个鸡腿'];
            const currentState = util.getValue(SETTING_SIGN_IN_STATUS) || 0;

            GM_registerMenuCommand(`${currentState === 0 ? '⭕' : '✅'} 自动签到：${menuStates[currentState]}`, () => {
                const newState = (currentState + 1) % menuStates.length;
                util.setValue(SETTING_SIGN_IN_STATUS, newState);
                location.reload();
            });

            GM_registerMenuCommand('🔄 重新签到', () => this.reSignIn());
        }

        autoSignIn(rand) {
            if (!this.loginStatus) return;
            if (util.getValue(SETTING_SIGN_IN_STATUS) === 0) return;

            rand = rand || (util.getValue(SETTING_SIGN_IN_STATUS) === 1);

            const timeNow = util.getCurrentDate();
            const timeOld = util.getValue(SETTING_SIGN_IN_LAST_DATE);
            if (!timeOld || timeOld != timeNow) {
                util.setValue(SETTING_SIGN_IN_LAST_DATE, timeNow);
                this.signInRequest(rand);
            }
        }

        reSignIn() {
            if (!this.loginStatus) return;
            if (util.getValue(SETTING_SIGN_IN_STATUS) === 0) {
                message.info('关闭自动签到状态时不支持重新签到！');
                return;
            }

            util.setValue(SETTING_SIGN_IN_LAST_DATE, '1753/1/1');
            location.reload();
        }

        addSignTips() {
            if (!this.loginStatus) return;
            if (util.getValue(SETTING_SIGN_IN_STATUS) !== 0) return;

            const timeNow = util.getCurrentDate();
            const timeIgnore = util.getValue(SETTING_SIGN_IN_IGNORE_DATE);
            const timeOld = util.getValue(SETTING_SIGN_IN_LAST_DATE);

            if (timeNow === timeIgnore || timeNow === timeOld) return;

            const tip = util.createElement('div', { staticClass: 'nsplus-tip' });
            const tip_p = util.createElement('p');
            tip_p.innerHTML = '今天你还没有签到哦！&emsp;【<a class="sign_in_btn" data-rand="true" href="javascript:;">随机抽个鸡腿</a>】&emsp;【<a class="sign_in_btn" data-rand="false" href="javascript:;">只要5个鸡腿</a>】&emsp;【<a id="sign_in_ignore" href="javascript:;">今天不再提示</a>】';
            tip.appendChild(tip_p);

            tip.querySelectorAll('.sign_in_btn').forEach(item => {
                item.addEventListener('click', e => {
                    const rand = util.data(item, 'rand');
                    this.signInRequest(rand);
                    tip.remove();
                    util.setValue(SETTING_SIGN_IN_LAST_DATE, timeNow);
                });
            });

            tip.querySelector('#sign_in_ignore').addEventListener('click', () => {
                tip.remove();
                util.setValue(SETTING_SIGN_IN_IGNORE_DATE, timeNow);
            });

            document.querySelector('#nsk-frame').before(tip);
        }

        async signInRequest(rand) {
            try {
                const json = await util.post('/api/attendance?random=' + (rand || false), {}, { 'Content-Type': 'application/json' });
                if (json.success) {
                    message.success(`签到成功！今天午饭+${json.gain}个鸡腿; 积攒了${json.current}个鸡腿了`);
                } else {
                    message.info(json.message);
                }
            } catch (error) {
                message.info(error.message || '发生未知错误');
            }
        }
    }

    window.NSRegisterModule({
        id: 'autoSignIn',
        name: '自动签到',
        init: () => new AutoSignIn().init()
    });
})(); 