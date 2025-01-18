(function() {
    'use strict';
    
    console.log('[NS助手] autoPage 模块开始加载');

    const NSAutoPage = {
        id: 'autoPage',
        name: '自动翻页',
        description: '浏览帖子列表时自动加载下一页',

        settings: {
            items: [
                {
                    id: 'postList',
                    label: '帖子列表',
                    type: 'switch',
                    default: false,
                    value: () => GM_getValue('autoPage_postList_enabled', true)
                },
                {
                    id: 'scrollThreshold',
                    label: '滚动触发距离(像素)',
                    type: 'number',
                    default: 200,
                    value: () => GM_getValue('autoPage_scroll_threshold', 200)
                }
            ],
            handleChange(id, value) {
                if (id === 'postList') {
                    GM_setValue('autoPage_postList_enabled', value);
                    if (!value) {
                        window.removeEventListener('scroll', NSAutoPage._boundScrollHandler);
                    } else {
                        NSAutoPage.initAutoLoading();
                    }
                } else if (id === 'scrollThreshold') {
                    const threshold = parseInt(value) || 200;
                    GM_setValue('autoPage_scroll_threshold', threshold);
                    console.log('[NS助手] 更新滚动触发距离:', threshold);
                }
            }
        },

        isRequesting: false,
        _boundScrollHandler: null,
        beforeScrollTop: 0,

        windowScroll(fn1) {
            this.beforeScrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
            
            this._boundScrollHandler = (e) => {
                const afterScrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
                const delta = afterScrollTop - this.beforeScrollTop;
                if (delta === 0) return false;
                fn1(delta > 0 ? 'down' : 'up', e);
                this.beforeScrollTop = afterScrollTop;
            };

            setTimeout(() => {
                window.addEventListener('scroll', this._boundScrollHandler, false);
                console.log('[NS助手] 滚动监听已启动');
            }, 1000);
        },

        initAutoLoading() {
            if (!GM_getValue('autoPage_postList_enabled', true)) {
                console.log('[NS助手] 自动加载已禁用');
                return;
            }

            if (!/^\/($|node\/|search|page-)/.test(location.pathname)) {
                console.log('[NS助手] 不在帖子列表页面');
                return;
            }

            console.log('[NS助手] 初始化帖子列表自动加载');
            
            this.windowScroll((direction, e) => {
                if (direction === 'down') {
                    const scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
                    const scrollHeight = document.documentElement.scrollHeight;
                    const clientHeight = document.documentElement.clientHeight;
                    const threshold = GM_getValue('autoPage_scroll_threshold', 200);
                    
                    if (scrollHeight <= clientHeight + scrollTop + threshold && !this.isRequesting) {
                        console.log('[NS助手] 触发加载下一页, 阈值:', threshold);
                        this.loadNextPage();
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

                const postList = document.querySelector('.post-list');
                const newPosts = doc.querySelector('.post-list');

                if (postList && newPosts) {
                    const posts = Array.from(newPosts.children).filter(post => post.classList.contains('post-list-item'));
                    console.log('[NS助手] 找到新帖子数量:', posts.length);

                    posts.forEach(post => {
                        const postTitle = post.querySelector('.post-title a');
                        if (postTitle) {
                            const postHref = postTitle.getAttribute('href');
                            if (!postList.querySelector(`.post-title a[href="${postHref}"]`)) {
                                const clonedPost = post.cloneNode(true);
                                postList.appendChild(clonedPost);
                                console.log('[NS助手] 追加帖子:', postHref);
                            }
                        }
                    });

                    const pagers = document.querySelectorAll('.nsk-pager');
                    const newPagers = doc.querySelectorAll('.nsk-pager');
                    
                    pagers.forEach((pager, index) => {
                        if (newPagers[index]) {
                            pager.innerHTML = newPagers[index].innerHTML;
                        }
                    });

                    history.pushState(null, null, nextUrl);
                    console.log('[NS助手] 下一页加载完成');
                } else {
                    console.log('[NS助手] 未找到帖子列表容器');
                }
            } catch (error) {
                console.error('[NS助手] 加载下一页失败:', error);
            } finally {
                setTimeout(() => {
                    this.isRequesting = false;
                    console.log('[NS助手] 重置请求状态');
                }, 500);
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
    console.log('[NS助手] autoPage 模块加载完成 v0.0.7');
})(); 