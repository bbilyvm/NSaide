// ==UserScript==
// @name         星渊NS助手
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  NodeSeek论坛增强脚本
// @author       stardeep
// @match        https://www.nodeseek.com/*
// @icon         https://www.nodeseek.com/favicon.ico
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_xmlhttpRequest
// @require      https://raw.githubusercontent.com/stardeep925/NSaide/main/styles.js
// @require      https://raw.githubusercontent.com/stardeep925/NSaide/main/utils.js
// @require      https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/userCard.js
// @require      https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/settings.js
// ==/UserScript==

(function() {
    'use strict';

    const DEFAULT_SETTINGS = {
        userCard: {
            enabled: true,
            name: '用户卡片增强',
            description: '增强用户信息卡片，添加等级进度和活跃度统计'
        }
    };


    function initSettings() {
        const savedSettings = GM_getValue('moduleSettings', null);
        if (!savedSettings) {
            GM_setValue('moduleSettings', DEFAULT_SETTINGS);
            return DEFAULT_SETTINGS;
        }

        return Object.assign({}, DEFAULT_SETTINGS, savedSettings);
    }


    function registerMenuCommands() {
        const settings = initSettings();

        Object.entries(settings).forEach(([moduleId, config]) => {
            const commandText = `${config.enabled ? '✅' : '❌'} ${config.name}`;
            GM_registerMenuCommand(commandText, () => {
                toggleModule(moduleId);
            });
        });
    }


    function toggleModule(moduleId) {
        const settings = GM_getValue('moduleSettings');
        if (settings[moduleId]) {
            settings[moduleId].enabled = !settings[moduleId].enabled;
            GM_setValue('moduleSettings', settings);
            location.reload();
        }
    }


    async function initModules() {
        const settings = initSettings();
        console.log('[NS助手] 开始初始化模块');

        await NSUtils.waitForElement('body');

        if (settings.userCard.enabled) {
            try {
                NSUserCard.init();
                console.log('[NS助手] 用户卡片模块初始化完成');
            } catch (error) {
                console.error('[NS助手] 用户卡片模块初始化失败:', error);
            }
        }


        console.log('[NS助手] 所有模块初始化完成');
    }

    async function init() {
        try {
            registerMenuCommands();
            await initModules();
        } catch (error) {
            console.error('[NS助手] 初始化失败:', error);
        }
    }

    init();
})();
