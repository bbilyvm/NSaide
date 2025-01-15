// ==UserScript==
// @name         星渊NS助手
// @namespace    https://www.nodeseek.com/
// @version      0.1.0
// @description  NodeSeek论坛增强脚本
// @author       stardeep
// @license      GPL-3.0
// @match        https://www.nodeseek.com/*
// @icon         https://drstth.com/download/favicon.ico
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_info
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('[NS助手] 脚本开始加载');

    const CONFIG_URL = 'https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/config.json';

    const loadConfig = () => {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${CONFIG_URL}?t=${Date.now()}`,
                nocache: true,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                onload: (response) => {
                    if (response.status === 200) {
                        try {
                            const config = JSON.parse(response.responseText);
                            resolve(config);
                        } catch (error) {
                            reject(error);
                        }
                    } else {
                        reject(new Error(`配置加载失败: ${response.status}`));
                    }
                },
                onerror: reject
            });
        });
    };

    const loadModule = (moduleInfo) => {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${moduleInfo.url}?t=${Date.now()}`,
                nocache: true,
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                onload: (response) => {
                    if (response.status === 200) {
                        try {
                            eval(response.responseText);
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    } else {
                        reject(new Error(`模块加载失败: ${response.status}`));
                    }
                },
                onerror: reject
            });
        });
    };

    const createNS = () => {
        window.NS = {
            version: GM_info.script.version,
            modules: new Map(),
            isReady: false,
            
            registerModule(moduleDefinition) {
                if (!moduleDefinition || !moduleDefinition.id || !moduleDefinition.init) {
                    return;
                }

                const module = {
                    ...moduleDefinition,
                    enabled: GM_getValue(`module_${moduleDefinition.id}_enabled`, true)
                };

                this.modules.set(moduleDefinition.id, module);
            },

            init() {
                if (this.isReady) {
                    return;
                }

                this.modules.forEach((module, id) => {
                    try {
                        if (module.enabled) {
                            module.init();
                        }
                    } catch (error) {
                        console.error(`[NS助手] 模块 ${module.name} (${id}) 初始化失败:`, error);
                    }
                });

                this.isReady = true;
            }
        };

        window.NSRegisterModule = (moduleDefinition) => {
            window.NS.registerModule(moduleDefinition);
        };
    };

    createNS();

    const initializeModules = async () => {
        try {
            const config = await loadConfig();
            await Promise.all(config.modules.map(loadModule));
            
            if (window.NS.modules.size > 0) {
                window.NS.init();
            }
        } catch (error) {
            console.error('[NS助手] 初始化失败:', error);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeModules);
    } else {
        initializeModules();
    }
})();
