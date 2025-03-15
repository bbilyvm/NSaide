(function() {
    'use strict';
    
    console.log('[NS助手] levelTag 模块开始加载');

    const NSLevelTag = {
        id: 'levelTag',
        name: '等级标签',
        description: '为用户名和帖子添加等级标签显示',

        settings: {
            items: [
                {
                    id: 'enable_level_tag',
                    type: 'switch',
                    label: '显示用户等级标签',
                    default: true,
                    value: () => GM_getValue('ns_leveltag_enable_level_tag', true)
                },
                {
                    id: 'level_tag_position',
                    type: 'select',
                    label: '等级标签位置',
                    options: [
                        { value: 'before_name', label: '用户名前' },
                        { value: 'after_name', label: '用户名后' },
                        { value: 'after_tags', label: '所有标签后' }
                    ],
                    default: 'before_name',
                    value: () => GM_getValue('ns_leveltag_level_tag_position', 'before_name')
                },
                {
                    id: 'enable_post_level_tag',
                    type: 'switch',
                    label: '显示帖子列表等级标签',
                    default: true,
                    value: () => GM_getValue('ns_leveltag_enable_post_level_tag', true)
                },
                {
                    id: 'post_level_tag_position',
                    type: 'select',
                    label: '帖子列表等级标签位置',
                    options: [
                        { value: 'before_title', label: '标题前' },
                        { value: 'before_name', label: '用户名前' },
                        { value: 'after_name', label: '用户名后' }
                    ],
                    default: 'after_name',
                    value: () => GM_getValue('ns_leveltag_post_level_tag_position', 'after_name')
                }
            ],
            
            handleChange(settingId, value, settingsManager) {
                if (settingId === 'enable_level_tag') {
                    settingsManager.cacheValue('ns_leveltag_enable_level_tag', value);
                    if (!value) {
                        document.querySelectorAll('.ns-level-tag').forEach(tag => tag.remove());
                    } else {
                        NSLevelTag.enhancePageUserLevels();
                    }
                } else if (settingId === 'level_tag_position') {
                    settingsManager.cacheValue('ns_leveltag_level_tag_position', value);
                    NSLevelTag.enhancePageUserLevels();
                } else if (settingId === 'enable_post_level_tag') {
                    settingsManager.cacheValue('ns_leveltag_enable_post_level_tag', value);
                    if (!value) {
                        document.querySelectorAll('.ns-post-level-tag').forEach(tag => tag.remove());
                    } else {
                        NSLevelTag.enhancePostLevels();
                    }
                } else if (settingId === 'post_level_tag_position') {
                    settingsManager.cacheValue('ns_leveltag_post_level_tag_position', value);
                    NSLevelTag.enhancePostLevels();
                }
            }
        },

        utils: {
            userDataCache: new Map(),
            maxCacheSize: 100,
            processingUsers: new Set(),
            requestQueue: new Map(),
            concurrentRequests: 0,
            MAX_CONCURRENT: 3,

            clearOldCache() {
                if (this.userDataCache.size > this.maxCacheSize) {
                    const entries = Array.from(this.userDataCache.entries());
                    const halfSize = Math.floor(this.maxCacheSize / 2);
                    entries.slice(0, entries.length - halfSize).forEach(([key]) => {
                        this.userDataCache.delete(key);
                    });
                }
            },

            async processQueue(userId) {
                if (this.requestQueue.has(userId)) return this.requestQueue.get(userId);
                
                const promise = new Promise(async (resolve) => {
                    while (this.concurrentRequests >= this.MAX_CONCURRENT) {
                        await new Promise(r => setTimeout(r, 50));
                    }
                    
                    this.concurrentRequests++;
                    try {
                        const result = await this._fetchUserInfo(userId);
                        resolve(result);
                    } finally {
                        this.concurrentRequests--;
                    }
                });

                this.requestQueue.set(userId, promise);
                return promise;
            },

            async _fetchUserInfo(userId) {
                try {
                    console.log(`[NS助手] 获取用户数据: ${userId}`);
                    const response = await fetch(`https://www.nodeseek.com/api/account/getInfo/${userId}`, {
                        method: 'GET',
                        credentials: 'include',
                        headers: { 'Accept': 'application/json' }
                    });
                    
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const data = await response.json();
                    if (!data.success) throw new Error('Failed to get user info');
                    
                    this.clearOldCache();
                    this.userDataCache.set(userId, data.detail);
                    return data.detail;
                } catch (error) {
                    console.error('[NS助手] 获取用户信息失败:', error);
                    return null;
                } finally {
                    this.requestQueue.delete(userId);
                    this.processingUsers.delete(userId);
                }
            },

            async getUserInfo(userId) {
                if (this.userDataCache.has(userId)) {
                    return this.userDataCache.get(userId);
                }

                if (this.processingUsers.has(userId)) {
                    return this.requestQueue.get(userId);
                }

                this.processingUsers.add(userId);
                return this.processQueue(userId);
            }
        },

        async enhancePageUserLevels() {
            try {
                if (!GM_getValue('ns_leveltag_enable_level_tag', true)) return;

                const authorInfoElements = Array.from(document.querySelectorAll('.author-info:not([data-ns-level-processed]'));
                const position = GM_getValue('ns_leveltag_level_tag_position', 'before_name');
                
                const processBatch = async (batch) => {
                    for (const authorInfo of batch) {
                        const authorLink = authorInfo.querySelector('a.author-name');
                        if (!authorLink) continue;

                        const userId = authorLink.getAttribute('href').split('/').pop();
                        const userInfo = await this.utils.getUserInfo(userId);
                        if (!userInfo) continue;

                        authorInfo.querySelectorAll('.ns-level-tag').forEach(tag => tag.remove());

                        const levelTag = document.createElement('span');
                        levelTag.className = 'nsk-badge role-tag ns-level-tag';
                        levelTag.innerHTML = `Lv.${userInfo.rank}`;
                        levelTag.setAttribute('data-level', userInfo.rank);
                        levelTag.setAttribute('data-user-id', userId);

                        const tooltip = document.createElement('div');
                        tooltip.className = 'ns-level-tooltip';
                        tooltip.innerHTML = `
                            <div class="ns-level-tooltip-item">
                                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                                注册时间：${userInfo.created_at_str}
                            </div>
                            <div class="ns-level-tooltip-item">
                                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4z"/></svg>
                                发帖数量：${userInfo.nPost}
                            </div>
                            <div class="ns-level-tooltip-item">
                                <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                                评论数量：${userInfo.nComment}
                            </div>
                        `;
                        document.body.appendChild(tooltip);

                        const updateTooltipPosition = () => {
                            const rect = levelTag.getBoundingClientRect();
                            const tooltipRect = tooltip.getBoundingClientRect();
                            
                            let left = rect.left + (rect.width - tooltipRect.width) / 2;
                            let top = rect.bottom + 5;

                            if (left < 10) left = 10;
                            if (left + tooltipRect.width > window.innerWidth - 10) {
                                left = window.innerWidth - tooltipRect.width - 10;
                            }
                            if (top + tooltipRect.height > window.innerHeight - 10) {
                                top = rect.top - tooltipRect.height - 5;
                            }

                            tooltip.style.left = `${left}px`;
                            tooltip.style.top = `${top}px`;
                        };

                        levelTag.addEventListener('mouseenter', () => {
                            tooltip.classList.add('show');
                            updateTooltipPosition();
                        });

                        levelTag.addEventListener('mouseleave', () => {
                            tooltip.classList.remove('show');
                        });

                        window.addEventListener('scroll', () => {
                            if (tooltip.classList.contains('show')) {
                                updateTooltipPosition();
                            }
                        }, { passive: true });
                        
                        switch (position) {
                            case 'before_name':
                                authorLink.parentNode.insertBefore(levelTag, authorLink);
                                break;
                            case 'after_name':
                                authorLink.parentNode.insertBefore(levelTag, authorLink.nextSibling);
                                break;
                            case 'after_tags':
                                authorInfo.appendChild(levelTag);
                                break;
                        }
                        
                        authorInfo.setAttribute('data-ns-level-processed', 'true');
                    }
                };

                const BATCH_SIZE = 5;
                for (let i = 0; i < authorInfoElements.length; i += BATCH_SIZE) {
                    const batch = authorInfoElements.slice(i, i + BATCH_SIZE);
                    await new Promise(resolve => requestIdleCallback(() => {
                        processBatch(batch).finally(resolve);
                    }));
                }
            } catch (error) {
                console.error('[NS助手] 增强页面用户等级显示时出错:', error);
            }
        },

        async enhancePostLevels() {
            try {
                if (!GM_getValue('ns_leveltag_enable_post_level_tag', true)) return;

                const postListContents = Array.from(document.querySelectorAll('.post-list-content:not([data-ns-level-processed]'));
                const position = GM_getValue('ns_leveltag_post_level_tag_position', 'after_name');
                
                const processBatch = async (batch) => {
                    for (const postContent of batch) {
                        const authorLink = postContent.querySelector('.info-author a');
                        if (!authorLink) continue;

                        const userId = authorLink.getAttribute('href').split('/').pop();
                        const userInfo = await this.utils.getUserInfo(userId);
                        if (!userInfo) continue;

                        postContent.querySelectorAll('.ns-post-level-tag').forEach(tag => tag.remove());

                        const levelTag = document.createElement('span');
                        levelTag.className = 'nsk-badge role-tag ns-level-tag ns-post-level-tag';
                        levelTag.innerHTML = `Lv.${userInfo.rank}`;
                        levelTag.setAttribute('data-level', userInfo.rank);
                        levelTag.setAttribute('data-user-id', userId);

                        const tooltip = document.createElement('div');
                        tooltip.className = 'ns-level-tooltip';
                        tooltip.innerHTML = `
                            <div class="ns-level-tooltip-item">
                                <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                                注册时间：${userInfo.created_at_str}
                            </div>
                            <div class="ns-level-tooltip-item">
                                <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-7-2h2v-4h4v-2h-4V7h-2v4H8v2h4z"/></svg>
                                发帖数量：${userInfo.nPost}
                            </div>
                            <div class="ns-level-tooltip-item">
                                <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
                                评论数量：${userInfo.nComment}
                            </div>
                        `;
                        document.body.appendChild(tooltip);

                        const updateTooltipPosition = () => {
                            const rect = levelTag.getBoundingClientRect();
                            const tooltipRect = tooltip.getBoundingClientRect();
                            
                            let left = rect.left + (rect.width - tooltipRect.width) / 2;
                            let top = rect.bottom + 5;

                            if (left < 10) left = 10;
                            if (left + tooltipRect.width > window.innerWidth - 10) {
                                left = window.innerWidth - tooltipRect.width - 10;
                            }
                            if (top + tooltipRect.height > window.innerHeight - 10) {
                                top = rect.top - tooltipRect.height - 5;
                            }

                            tooltip.style.left = `${left}px`;
                            tooltip.style.top = `${top}px`;
                        };

                        levelTag.addEventListener('mouseenter', () => {
                            tooltip.classList.add('show');
                            updateTooltipPosition();
                        });

                        levelTag.addEventListener('mouseleave', () => {
                            tooltip.classList.remove('show');
                        });

                        window.addEventListener('scroll', () => {
                            if (tooltip.classList.contains('show')) {
                                updateTooltipPosition();
                            }
                        }, { passive: true });
                        
                        switch (position) {
                            case 'before_title':
                                const titleElement = postContent.querySelector('.post-title');
                                if (titleElement) {
                                    titleElement.insertBefore(levelTag, titleElement.firstChild);
                                }
                                break;
                            case 'before_name':
                                authorLink.parentNode.insertBefore(levelTag, authorLink);
                                break;
                            case 'after_name':
                                authorLink.parentNode.insertBefore(levelTag, authorLink.nextSibling);
                                break;
                        }
                        
                        postContent.setAttribute('data-ns-level-processed', 'true');
                    }
                };

                const BATCH_SIZE = 5;
                for (let i = 0; i < postListContents.length; i += BATCH_SIZE) {
                    const batch = postListContents.slice(i, i + BATCH_SIZE);
                    await new Promise(resolve => requestIdleCallback(() => {
                        processBatch(batch).finally(resolve);
                    }));
                }
            } catch (error) {
                console.error('[NS助手] 增强帖子列表等级显示时出错:', error);
            }
        },

        init() {
            console.log('[NS助手] 初始化等级标签模块');
            
            this.enhancePageUserLevels = this.enhancePageUserLevels.bind(this);
            this.enhancePostLevels = this.enhancePostLevels.bind(this);

            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/levelTag/style.css',
                onload: (response) => {
                    if (response.status === 200) {
                        GM_addStyle(response.responseText + `
                            .ns-level-tag {
                                will-change: transform;
                                contain: content;
                                transition: opacity 0.2s;
                            }
                            .ns-level-tag:hover {
                                opacity: 0.9;
                            }
                        `);
                    }
                }
            });

            const mutationDebounce = (func, wait = 150) => {
                let timeout;
                return (...args) => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), wait);
                };
            };

            const handleMutation = mutationDebounce((mutations) => {
                let shouldEnhanceLevels = false;
                let shouldEnhancePostLevels = false;
                let themeChanged = false;

                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            if (node.nodeType === 1) {
                                if (node.matches?.('.author-info') || node.querySelector?.('.author-info')) {
                                    shouldEnhanceLevels = true;
                                }
                                if (node.matches?.('.post-list-content') || node.querySelector?.('.post-list-content')) {
                                    shouldEnhancePostLevels = true;
                                }
                            }
                        });
                    } else if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        themeChanged = true;
                    }
                });

                if (shouldEnhanceLevels && GM_getValue('ns_leveltag_enable_level_tag', true)) {
                    this.enhancePageUserLevels();
                }

                if (shouldEnhancePostLevels && GM_getValue('ns_leveltag_enable_post_level_tag', true)) {
                    this.enhancePostLevels();
                }

                if (themeChanged) {
                    const newTheme = document.body.classList.contains('dark-layout') ? 'dark' : 'light';
                    const tags = document.querySelectorAll('.ns-level-tag');
                    tags.forEach(tag => {
                        tag.style.backgroundColor = newTheme === 'dark' ? '#111b26' : '#e6f4ff';
                        tag.style.borderColor = newTheme === 'dark' ? '#153450' : '#91d5ff';
                    });
                }
            });

            const observer = new MutationObserver(mutations => {
                handleMutation(mutations);
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });

            if (GM_getValue('ns_leveltag_enable_level_tag', true)) this.enhancePageUserLevels();
            if (GM_getValue('ns_leveltag_enable_post_level_tag', true)) this.enhancePostLevels();
        }
    };

    let retryCount = 0;
    const maxRetries = 50;
    const waitForNS = () => {
        retryCount++;
        if (typeof window.NSRegisterModule === 'function') {
            window.NSRegisterModule(NSLevelTag);
        } else if (retryCount < maxRetries) {
            setTimeout(waitForNS, 100);
        }
    };
    waitForNS();
    console.log('[NS助手] levelTag 模块加载完成 v0.1.2');
})();
