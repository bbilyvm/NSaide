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
                    default: true,
                    value: () => GM_getValue('autoPage_postList_enabled', true)
                }
            ],
            handleChange(id, value) {
                if (id === 'postList') {
                    GM_setValue('autoPage_postList_enabled', value);
                    if (!value) {
                        window.removeEventListener('scroll', this.scrollHandler);
                    } else {
                        this.initAutoLoading();
                    }
                }
            }
        },

        isRequesting: false,
        scrollHandler: null,

        initAutoLoading() {
            if (!GM_getValue('autoPage_postList_enabled', true)) return;
            
            if (!/^\/($|node\/|search)/.test(location.pathname)) return;

            const threshold = 200;
            this.scrollHandler = this.handleScroll.bind(this);
            
            setTimeout(() => {
                window.addEventListener('scroll', this.scrollHandler, false);
            }, 1000);
        },

        handleScroll() {
            if (this.isRequesting) return;

            const scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight;
            const clientHeight = document.documentElement.clientHeight;

            if (scrollHeight <= clientHeight + scrollTop + 200) {
                this.loadNextPage();
            }
        },

        async loadNextPage() {
            const nextPageLink = document.querySelector('.pagination a[rel="next"]');
            if (!nextPageLink) return;

            const nextUrl = nextPageLink.href;
            this.isRequesting = true;

            try {
                const response = await fetch(nextUrl);
                const text = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');

                const postList = document.querySelector('.topic-list');
                const newPosts = doc.querySelector('.topic-list');

                if (postList && newPosts) {
                    
                    const newPostNodes = Array.from(newPosts.children);
                    postList.append(...newPostNodes);

                    const pagination = document.querySelector('.pagination');
                    const newPagination = doc.querySelector('.pagination');
                    if (pagination && newPagination) {
                        pagination.innerHTML = newPagination.innerHTML;
                    }

                    
                    history.pushState(null, null, nextUrl);
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
    console.log('[NS助手] autoPage 模块加载完成');
})(); 