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
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    
    console.log('[NS助手] 脚本开始加载');

    const MODULES = [
        {
            name: 'userCard',
            url: 'https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/userCard/index.js'
        },
        {
            name: 'editorEnhance',
            url: 'https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/editorEnhance/index.js'
        }
    ];

    const loadModule = (moduleInfo) => {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `${moduleInfo.url}?t=${Date.now()}`,
                onload: (response) => {
                    if (response.status === 200) {
                        try {
                            console.log(`[NS助手] 模块 ${moduleInfo.name} 加载成功`);
                            eval(response.responseText);
                            resolve();
                        } catch (error) {
                            console.error(`[NS助手] 模块 ${moduleInfo.name} 执行失败:`, error);
                            reject(error);
                        }
                    } else {
                        console.error(`[NS助手] 模块 ${moduleInfo.name} 加载失败:`, response.status);
                        reject(new Error(`模块加载失败: ${response.status}`));
                    }
                },
                onerror: (error) => {
                    console.error(`[NS助手] 模块 ${moduleInfo.name} 请求失败:`, error);
                    reject(error);
                }
            });
        });
    };

    const createNS = () => {
        window.NS = {
            version: GM_info.script.version,
            modules: new Map(),
            isReady: false,
            
            registerModule(moduleDefinition) {
                console.log(`[NS助手] 尝试注册模块: ${moduleDefinition.id}`);
                
                if (!moduleDefinition || !moduleDefinition.id || !moduleDefinition.init) {
                    console.error('[NS助手] 模块注册失败: 无效的模块定义', moduleDefinition);
                    return;
                }

                const module = {
                    ...moduleDefinition,
                    enabled: GM_getValue(`module_${moduleDefinition.id}_enabled`, true)
                };

                this.modules.set(moduleDefinition.id, module);
                console.log(`[NS助手] 模块注册成功: ${module.name} (${module.id})`);
                console.log('[NS助手] 当前已注册模块列表:', Array.from(this.modules.keys()));
            },

            init() {
                if (this.isReady) {
                    console.log('[NS助手] 已经初始化过，跳过');
                    return;
                }

                console.log('[NS助手] 开始初始化...');
                console.log('[NS助手] 当前模块数量:', this.modules.size);
                
                this.modules.forEach((module, id) => {
                    try {
                        if (module.enabled) {
                            console.log(`[NS助手] 正在初始化模块: ${module.name} (${id})`);
                            module.init();
                            console.log(`[NS助手] 模块初始化成功: ${module.name} (${id})`);
                        } else {
                            console.log(`[NS助手] 模块已禁用: ${module.name} (${id})`);
                        }

                        GM_registerMenuCommand(
                            `${module.enabled ? '✅' : '❌'} ${module.name}`,
                            () => {
                                module.enabled = !module.enabled;
                                GM_setValue(`module_${id}_enabled`, module.enabled);
                                location.reload();
                            }
                        );
                    } catch (error) {
                        console.error(`[NS助手] 模块 ${module.name} (${id}) 初始化失败:`, error);
                    }
                });

                this.isReady = true;
            }
        };

        window.NSRegisterModule = (moduleDefinition) => {
            console.log('[NS助手] 收到模块注册请求:', moduleDefinition.id);
            window.NS.registerModule(moduleDefinition);
        };
    };

    createNS();

    const initializeModules = async () => {
        try {
            console.log('[NS助手] 开始加载模块...');
            await Promise.all(MODULES.map(loadModule));
            console.log('[NS助手] 所有模块加载完成');
            
            if (window.NS.modules.size > 0) {
                console.log('[NS助手] 开始初始化模块');
                window.NS.init();
            } else {
                console.error('[NS助手] 未检测到已注册的模块');
            }
        } catch (error) {
            console.error('[NS助手] 模块加载失败:', error);
        }
    };

    if (document.readyState === 'loading') {
        console.log('[NS助手] 文档加载中，等待 DOMContentLoaded');
        document.addEventListener('DOMContentLoaded', initializeModules);
    } else {
        console.log('[NS助手] 文档已加载，开始加载模块');
        initializeModules();
    }
})();
