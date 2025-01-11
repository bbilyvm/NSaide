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
// @grant        GM_info
// @require      https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/userCard/index.js
// @require      https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/commentShortcut/index.js
// ==/UserScript==

(function() {
    'use strict';

    window.NSRegisterModule = (moduleDefinition) => {
        if (!moduleDefinition || !moduleDefinition.id || !moduleDefinition.init) {
            console.error('[NS助手] 模块注册失败: 无效的模块定义');
            return;
        }

        if (!window.NS) {
            window.NS = {
                version: GM_info.script.version,
                modules: new Map()
            };
        }

        window.NS.modules.set(moduleDefinition.id, {
            ...moduleDefinition,
            enabled: GM_getValue(`module_${moduleDefinition.id}_enabled`, true)
        });

        console.log(`[NS助手] 模块已注册: ${moduleDefinition.name}`);
    };

    const NS = {
        version: GM_info.script.version,
        modules: window.NS ? window.NS.modules : new Map(),

        init() {
            console.log('[NS助手] 开始初始化...');
            this.loadModules();
        },

        loadModules() {
            console.log('[NS助手] 已注册的模块:', Array.from(this.modules.keys()));

            this.modules.forEach((module) => {
                try {
                    if (module.enabled) {
                        console.log(`[NS助手] 正在初始化模块: ${module.name}`);
                        module.init();
                    }

                    GM_registerMenuCommand(
                        `${module.enabled ? '✅' : '❌'} ${module.name}`,
                        () => {
                            module.enabled = !module.enabled;
                            GM_setValue(`module_${module.id}_enabled`, module.enabled);
                            location.reload();
                        }
                    );
                } catch (error) {
                    console.error(`[NS助手] 模块 ${module.name} 初始化失败:`, error);
                }
            });
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => NS.init(), 0);
        });
    } else {
        setTimeout(() => NS.init(), 0);
    }
})();
