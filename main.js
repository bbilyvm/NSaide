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
// @grant        GM_xmlhttpRequest
// @require      https://raw.githubusercontent.com/stardeep925/NSaide/main/styles.js
// @require      https://raw.githubusercontent.com/stardeep925/NSaide/main/utils.js
// @require      https://raw.githubusercontent.com/stardeep925/NSaide/main/userCard.js
// ==/UserScript==

(function() {
    'use strict';

    async function init() {
        console.log('[NS助手] 脚本开始初始化');
        await NSUtils.waitForElement('body');

        NSUserCard.init();
        console.log('[NS助手] 脚本初始化完成');
    }

    init();
})();
