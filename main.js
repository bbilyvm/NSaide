// ==UserScript==
// @name         星渊NS助手
// @namespace    https://www.nodeseek.com/
// @version      0.1.0
// @description  NodeSeek论坛增强脚本
// @author       stardeep
// @match        https://www.nodeseek.com/*
// @icon         https://www.nodeseek.com/favicon.ico
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @require      https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/userCard/index.js
// @require      https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/commentShortcut/index.js
// ==/UserScript==

(function() {
    'use strict';
    
    if (typeof window.NSModules === 'undefined') {
        window.NSModules = {};
    }
    
    const modules = Object.values(window.NSModules);
    
    modules.forEach(module => {
        try {
            const isEnabled = GM_getValue(`module_${module.id}_enabled`, true);
            if (isEnabled) {
                console.log(`[NS助手] 正在初始化模块: ${module.name}`);
                module.init();
            }
            
            GM_registerMenuCommand(
                `${isEnabled ? '✅' : '❌'} ${module.name}`,
                () => {
                    const newState = !isEnabled;
                    GM_setValue(`module_${module.id}_enabled`, newState);
                    location.reload();
                }
            );
        } catch (error) {
            console.error(`[NS助手] 模块 ${module.name} 初始化失败:`, error);
        }
    });
})();
