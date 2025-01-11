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
// @grant        unsafeWindow
// @require      https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/userCard/index.js
// @require      https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/commentShortcut/index.js
// ==/UserScript==

unsafeWindow.NSModules = unsafeWindow.NSModules || {};

(function() {
    'use strict';
 
    const initModules = () => {
        const modules = Object.values(unsafeWindow.NSModules);
        console.log('[NS助手] 已加载的模块:', Object.keys(unsafeWindow.NSModules));
        
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
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModules);
    } else {
        initModules();
    }
})();
