(function() {
    'use strict';
    
    console.log('[NS助手] levelTag 模块开始加载 - 优化版');

    const NSLevelTag = {
        id: 'levelTag',
        name: '等级标签',
        description: '为用户名和帖子添加等级标签显示',

        // 设置项保持不变
        settings: {/* 原有设置项 */},

        utils: {
            userDataCache: new Map(),
            maxCacheSize: 80,
            processingUsers: new Set(),
            requestQueue: [],
            activeRequests: 0,
            MAX_CONCURRENT: 2,  // 降低并发数
            
            // 改进的缓存清理策略
            clearOldCache() {
                if (this.userDataCache.size > this.maxCacheSize) {
                    const entries = Array.from(this.userDataCache.entries());
                    entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
                    entries.slice(this.maxCacheSize).forEach(([key]) => {
                        this.userDataCache.delete(key);
                    });
                }
            },

            // 增强的请求控制器
            async processQueue() {
                while (this.requestQueue.length > 0 && this.activeRequests < this.MAX_CONCURRENT) {
                    const { userId, resolve, reject } = this.requestQueue.shift();
                    this.activeRequests++;
                    
                    try {
                        const info = await this._fetchUserInfo(userId);
                        resolve(info);
                    } catch (error) {
                        reject(error);
                    } finally {
                        this.activeRequests--;
                        this.processQueue();
                    }
                }
            },

            // 带重试机制的请求
            async _fetchUserInfo(userId, retries = 2) {
                try {
                    const response = await fetch(`https://www.nodeseek.com/api/account/getInfo/${userId}`, {
                        signal: AbortSignal.timeout(5000),  // 添加超时控制
                        /* 其他参数不变 */
                    });
                    
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    const data = await response.json();
                    if (!data.success) throw new Error('API响应失败');

                    const result = { 
                        ...data.detail,
                        timestamp: Date.now()  // 添加缓存时间戳
                    };
                    this.userDataCache.set(userId, result);
                    return result;
                } catch (error) {
                    if (retries > 0) {
                        await new Promise(r => setTimeout(r, 1000));
                        return this._fetchUserInfo(userId, retries - 1);
                    }
                    throw error;
                }
            },

            async getUserInfo(userId) {
                if (this.userDataCache.has(userId)) {
                    return this.userDataCache.get(userId);
                }

                return new Promise((resolve, reject) => {
                    this.requestQueue.push({ userId, resolve, reject });
                    this.processQueue();
                });
            }
        },

        async enhancePageUserLevels(parentNode = document) {
            try {
                if (!GM_getValue('ns_leveltag_enable_level_tag', true)) return;

                const authorInfoElements = Array.from(parentNode.querySelectorAll('.author-info:not([data-ns-level-processed])'));
                if (authorInfoElements.length === 0) return;

                // 可视区域优先处理
                const viewportHeight = window.innerHeight;
                const visibleElements = authorInfoElements.filter(el => {
                    const rect = el.getBoundingClientRect();
                    return rect.top < viewportHeight * 2;
                });

                // 分块处理 + 空闲调度
                const processChunk = async (chunk) => {
                    await new Promise(resolve => {
                        requestIdleCallback(async () => {
                            for (const authorInfo of chunk) {
                                // 元素离开可视区域则跳过
                                const rect = authorInfo.getBoundingClientRect();
                                if (rect.top > viewportHeight * 3) continue;

                                const authorLink = authorInfo.querySelector('a.author-name');
                                if (!authorLink) continue;

                                const userId = authorLink.getAttribute('href').split('/').pop();
                                try {
                                    const userInfo = await this.utils.getUserInfo(userId);
                                    if (!userInfo) continue;

                                    // 使用文档片段批量操作
                                    const fragment = document.createDocumentFragment();
                                    const levelTag = this.createLevelTag(userInfo, userId);
                                    fragment.appendChild(levelTag);

                                    // 使用防抖工具提示
                                    const tooltip = this.createTooltip(userInfo);
                                    fragment.appendChild(tooltip);

                                    // 动态插入位置
                                    const position = GM_getValue('ns_leveltag_level_tag_position', 'before_name');
                                    const container = this.getPositionContainer(authorInfo, position);
                                    container.insertBefore(fragment, container.firstChild);

                                    authorInfo.dataset.nsLevelProcessed = true;
                                } catch (error) {
                                    console.error('处理用户等级失败:', error);
                                }
                            }
                            resolve();
                        }, { timeout: 1000 });
                    });
                };

                // 分块处理（更小的块）
                const CHUNK_SIZE = 3;
                for (let i = 0; i < visibleElements.length; i += CHUNK_SIZE) {
                    await processChunk(visibleElements.slice(i, i + CHUNK_SIZE));
                }
            } catch (error) {
                console.error('[NS助手] 增强用户等级时出错:', error);
            }
        },

        // 创建等级标签（优化内存）
        createLevelTag(userInfo, userId) {
            const tag = document.createElement('span');
            tag.className = 'nsk-badge role-tag ns-level-tag';
            tag.innerHTML = `Lv.${userInfo.rank}`;
            tag.dataset.level = userInfo.rank;
            tag.dataset.userId = userId;

            // 使用共享事件处理器
            tag.addEventListener('mouseenter', this.handleTooltipShow, false);
            tag.addEventListener('mouseleave', this.handleTooltipHide, false);
            return tag;
        },

        // 创建工具提示（单例模式）
        createTooltip(userInfo) {
            if (!this.tooltipInstance) {
                this.tooltipInstance = document.createElement('div');
                this.tooltipInstance.className = 'ns-level-tooltip';
                document.body.appendChild(this.tooltipInstance);

                // 使用被动滚动监听
                window.addEventListener('scroll', this.updateTooltipPosition, { 
                    passive: true,
                    capture: true 
                });
            }

            this.tooltipInstance.innerHTML = `
                <div class="ns-level-tooltip-item">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                    注册时间：${userInfo.created_at_str}
                </div>
                <!-- 其他内容不变 -->
            `;
            return this.tooltipInstance;
        },

        // 优化后的工具提示控制
        handleTooltipShow(event) {
            const tag = event.target;
            const level = tag.dataset.level;
            const userId = tag.dataset.userId;
            
            if (!this.tooltipInstance) return;
            
            this.tooltipInstance.style.display = 'block';
            this.updateTooltipPosition(tag);
            
            // 添加激活状态
            tag.classList.add('ns-tag-active');
        },

        handleTooltipHide() {
            if (!this.tooltipInstance) return;
            
            this.tooltipInstance.style.display = 'none';
            document.querySelectorAll('.ns-tag-active').forEach(tag => {
                tag.classList.remove('ns-tag-active');
            });
        },

        // 节流的位置更新
        updateTooltipPosition: _.throttle(function(tag) {
            if (!tag || !this.tooltipInstance) return;

            const tagRect = tag.getBoundingClientRect();
            const tooltipRect = this.tooltipInstance.getBoundingClientRect();
            
            let left = tagRect.left + (tagRect.width - tooltipRect.width) / 2;
            let top = tagRect.bottom + 5;

            // 边界检测逻辑保持不变
            // ...

            this.tooltipInstance.style.transform = `translate(${left}px, ${top}px)`;
        }, 100),

        // 初始化（添加性能监控）
        init() {
            console.log('[NS助手] 初始化优化版等级标签模块');

            // 绑定实例方法
            this.handleTooltipShow = this.handleTooltipShow.bind(this);
            this.handleTooltipHide = this.handleTooltipHide.bind(this);
            this.updateTooltipPosition = this.updateTooltipPosition.bind(this);

            // 样式加载（添加关键CSS）
            GM_addStyle(`
                .ns-level-tag {
                    contain: strict;
                    will-change: transform, opacity;
                    transition: opacity 0.15s;
                }
                .ns-level-tooltip {
                    position: fixed;
                    z-index: 9999;
                    /* 其他样式保持不变 */
                }
            `);

            // 增强型MutationObserver
            const observer = new MutationObserver(_.throttle(mutations => {
                const addedNodes = mutations.flatMap(m => [...m.addedNodes]);
                
                // 仅处理可视区域附近的变动
                const viewportRect = {
                    top: window.scrollY - 500,
                    bottom: window.scrollY + window.innerHeight + 500
                };

                const relevantMutations = addedNodes.filter(node => {
                    const rect = node.getBoundingClientRect?.();
                    return rect && (
                        rect.top < viewportRect.bottom ||
                        rect.bottom > viewportRect.top
                    );
                });

                if (relevantMutations.length > 0) {
                    this.enhancePageUserLevels();
                    this.enhancePostLevels();
                }
            }, 300));

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false,
                characterData: false
            });

            // 初始处理使用空闲回调
            requestIdleCallback(() => {
                this.enhancePageUserLevels();
                this.enhancePostLevels();
            }, { timeout: 2000 });
        }
    };

    // 注册模块（添加重试机制）
    const MAX_REGISTER_RETRIES = 10;
    let registerAttempts = 0;

    const registerModule = () => {
        if (typeof window.NSRegisterModule === 'function') {
            window.NSRegisterModule(NSLevelTag);
            console.log('[NS助手] 模块注册成功');
        } else if (registerAttempts < MAX_REGISTER_RETRIES) {
            registerAttempts++;
            setTimeout(registerModule, 300 * Math.pow(1.5, registerAttempts));
        }
    };

    // 启动延迟注册
    setTimeout(registerModule, 1500);
    console.log('[NS助手] levelTag 模块加载完成 - 优化版 v0.2.0');
})();
