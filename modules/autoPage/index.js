(function() {
    'use strict';
    
    console.log('[NS助手] autoPage 模块开始加载');

    const NSAutoPage = {
        id: 'autoPage',
        name: '自动翻页',
        description: '浏览列表时自动加载下一页',

        settings: {
            items: [
                {
                    id: 'postList',
                    label: '帖子列表',
                    type: 'switch',
                    default: false,
                    value: () => GM_getValue('autoPage_postList_enabled', true)
                }
            ],
            handleChange(id, value) {
                if (id === 'postList') {
                    GM_setValue('autoPage_postList_enabled', value);
                    if (!value) {
                        window.removeEventListener('scroll', this._boundScrollHandler);
                    } else {
                        this.initAutoLoading();
                    }
                }
            }
        },

        isRequesting: false,
        _boundScrollHandler: null,
        beforeScrollTop: 0,

        windowScroll(callback) {
            let _this = this;
            this.beforeScrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
            
            this._boundScrollHandler = function(e) {
                const afterScrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
                const delta = afterScrollTop - _this.beforeScrollTop;
                
                if (delta === 0) return false;
                
                callback(delta > 0 ? 'down' : 'up', e);
                _this.beforeScrollTop = afterScrollTop;
            };

            setTimeout(() => {
                window.addEventListener('scroll', this._boundScrollHandler, false);
            }, 1000);
        },

        initAutoLoading() {
            if (!GM_getValue('autoPage_postList_enabled', true)) {
                console.log('[NS助手] 自动加载已禁用');
                return;
            }
            
            if (!/^\/($|node\/|search|page-)/.test(location.pathname)) {
                console.log('[NS助手] 不在目标页面');
                return;
            }

            console.log('[NS助手] 初始化自动加载');
            let _this = this;
            
            this.windowScroll((direction, e) => {
                if (direction === 'down') {
                    const scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
                    const scrollHeight = document.documentElement.scrollHeight;
                    const clientHeight = document.documentElement.clientHeight;
                    
                    if (scrollHeight <= clientHeight + scrollTop + 200 && !_this.isRequesting) {
                        console.log('[NS助手] 触发加载下一页');
                        _this.loadNextPage();
                    }
                }
            });
        },

        async loadNextPage() {
            const nextPageLink = document.querySelector('.nsk-pager .pager-next');
            if (!nextPageLink || !nextPageLink.href) {
                console.log('[NS助手] 没有下一页');
                return;
            }

            const nextUrl = nextPageLink.href;
            this.isRequesting = true;
            console.log('[NS助手] 开始加载下一页:', nextUrl);

            try {
                const response = await fetch(nextUrl);
                const text = await response.text();
                const doc = new DOMParser().parseFromString(text, 'text/html');

                const postList = document.querySelector('.topic-list');
                const newPosts = doc.querySelector('.topic-list');

                if (postList && newPosts) {
                    postList.append(...newPosts.childNodes);

                    const topPager = document.querySelector('.nsk-pager');
                    const bottomPager = document.querySelector('.nsk-pager.pager-bottom');
                    const newTopPager = doc.querySelector('.nsk-pager');
                    const newBottomPager = doc.querySelector('.nsk-pager.pager-bottom');

                    if (topPager && newTopPager) {
                        topPager.innerHTML = newTopPager.innerHTML;
                    }
                    if (bottomPager && newBottomPager) {
                        bottomPager.innerHTML = newBottomPager.innerHTML;
                    }

                    history.pushState(null, null, nextUrl);
                    console.log('[NS助手] 下一页加载完成');
                }
            } catch (error) {
                console.error('[NS助手] 加载下一页失败:', error);
            } finally {
                this.isRequesting = false;
            }
        },

        init() {
            console.log('[NS助手] 初始化自动翻页模块');
            this.initAutoLoading();
        }
    };

    console.log('[NS助手] 等待模块系统就绪');
    let retryCount = 0;
    const maxRetries = 50;

    const waitForNS = () => {
        retryCount++;
        console.log(`[NS助手] 第 ${retryCount} 次尝试注册 autoPage 模块`);
        
        if (typeof window.NSRegisterModule === 'function') {
            console.log('[NS助手] 模块系统就绪，开始注册 autoPage');
            window.NSRegisterModule(NSAutoPage);
            console.log('[NS助手] autoPage 模块注册请求已发送');
        } else {
            console.log('[NS助手] 模块系统未就绪');
            if (retryCount < maxRetries) {
                setTimeout(waitForNS, 100);
            } else {
                console.error('[NS助手] 模块系统等待超时，autoPage 模块注册失败');
            }
        }
    };

    waitForNS();
    console.log('[NS助手] autoPage 模块加载完成 v0.0.2');
})(); 