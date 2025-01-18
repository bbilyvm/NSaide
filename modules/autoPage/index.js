(function() {
    'use strict';
    
    console.log('[NS助手] autoPage 模块开始加载');

    const NSAutoPage = {
        id: 'autoPage',
        name: '自动翻页',
        description: '浏览帖子列表和评论区时自动加载下一页',

        settings: {
            items: [
                {
                    id: 'postList',
                    label: '帖子列表',
                    type: 'switch',
                    default: false,
                    value: () => GM_getValue('autoPage_postList_enabled', false)
                },
                {
                    id: 'comments',
                    label: '评论区',
                    type: 'switch',
                    default: false,
                    value: () => GM_getValue('autoPage_comments_enabled', false)
                },
                {
                    id: 'scrollThreshold',
                    label: '触发距离',
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
                } else if (id === 'comments') {
                    GM_setValue('autoPage_comments_enabled', value);
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
            const postListEnabled = GM_getValue('autoPage_postList_enabled', false);
            const commentsEnabled = GM_getValue('autoPage_comments_enabled', false);

            if (!postListEnabled && !commentsEnabled) {
                console.log('[NS助手] 自动加载已禁用');
                return;
            }

            const isPostList = /^\/($|node\/|search|page-)/.test(location.pathname);
            const isComments = /^\/post-/.test(location.pathname);

            if (!isPostList && !isComments) {
                console.log('[NS助手] 不在帖子列表或评论页面');
                return;
            }

            if (isPostList && !postListEnabled) {
                console.log('[NS助手] 帖子列表自动加载已禁用');
                return;
            }

            if (isComments && !commentsEnabled) {
                console.log('[NS助手] 评论区自动加载已禁用');
                return;
            }

            console.log('[NS助手] 初始化自动加载');
            
            this.windowScroll((direction, e) => {
                if (direction === 'down') {
                    const scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
                    const scrollHeight = document.documentElement.scrollHeight;
                    const clientHeight = document.documentElement.clientHeight;
                    const threshold = GM_getValue('autoPage_scroll_threshold', 200);
                    
                    if (scrollHeight <= clientHeight + scrollTop + threshold && !this.isRequesting) {
                        console.log('[NS助手] 触发加载下一页, 阈值:', threshold);
                        if (isPostList) {
                            this.loadNextPage();
                        } else if (isComments) {
                            this.loadNextComments();
                        }
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
                const doc = new DOMParser().parseFromString(text, "text/html");

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

        async loadNextComments() {
            const nextPageLink = document.querySelector('.nsk-pager.post-bottom-pager .pager-next');
            if (!nextPageLink || !nextPageLink.href) {
                console.log('[NS助手] 没有下一页评论');
                return;
            }

            const nextUrl = nextPageLink.href;
            this.isRequesting = true;
            console.log('[NS助手] 开始加载下一页评论:', nextUrl);

            try {
                const response = await fetch(nextUrl);
                const text = await response.text();
                const doc = new DOMParser().parseFromString(text, "text/html");

                const tempScript = doc.getElementById('temp-script');
                if (!tempScript) {
                    throw new Error('未找到评论数据脚本');
                }

                const jsonText = tempScript.textContent;
                if (!jsonText) {
                    throw new Error('评论数据为空');
                }

                const conf = JSON.parse(this.b64DecodeUnicode(jsonText));
                if (!conf.postData || !Array.isArray(conf.postData.comments)) {
                    throw new Error('评论数据格式错误');
                }

                if (!window.__config__) {
                    window.__config__ = {};
                }
                if (!window.__config__.postData) {
                    window.__config__.postData = conf.postData;
                } else {
                    window.__config__.postData.comments = window.__config__.postData.comments || [];
                    window.__config__.postData.comments.push(...conf.postData.comments);
                }

                const commentList = document.querySelector('ul.comments');
                const newComments = doc.querySelector('ul.comments');

                if (commentList && newComments) {
                    const currentComments = document.querySelectorAll('.content-item');
                    let startIndex = currentComments.length;

                    const validComments = Array.from(newComments.childNodes).filter(node => 
                        node.nodeType === Node.ELEMENT_NODE && 
                        node.classList.contains('content-item')
                    );
                    
                    validComments.forEach((comment, index) => {
                        commentList.appendChild(comment.cloneNode(true));
                    });

                    const topPager = document.querySelector('.nsk-pager.post-top-pager');
                    const bottomPager = document.querySelector('.nsk-pager.post-bottom-pager');
                    const newTopPager = doc.querySelector('.nsk-pager.post-top-pager');
                    const newBottomPager = doc.querySelector('.nsk-pager.post-bottom-pager');

                    if (topPager && newTopPager) {
                        topPager.innerHTML = newTopPager.innerHTML;
                    }
                    if (bottomPager && newBottomPager) {
                        bottomPager.innerHTML = newBottomPager.innerHTML;
                    }

                    const menuElement = document.querySelector('.comment-menu');
                    if (menuElement && menuElement.__vue__) {
                        const vue = menuElement.__vue__;
                        const newContentItems = Array.from(document.querySelectorAll(".content-item")).slice(startIndex);
                        newContentItems.forEach((item, index) => {
                            const menuMount = item.querySelector(".comment-menu-mount");
                            if (!menuMount) return;

                            try {
                                const commentIndex = startIndex + index;
                                const commentData = window.__config__.postData.comments[commentIndex];
                                if (!commentData) {
                                    console.warn(`[NS助手] 未找到索引 ${commentIndex} 的评论数据`);
                                    return;
                                }

                                let newVue = new vue.$root.constructor(vue.$options);
                                newVue.$data = {
                                    ...newVue.$data,
                                    index: commentIndex,
                                    comment: commentData
                                };
                                newVue.$mount(menuMount);
                            } catch (error) {
                                console.error('[NS助手] 评论菜单挂载失败:', error);
                            }
                        });
                    }

                    history.pushState(null, null, nextUrl);
                    console.log('[NS助手] 下一页评论加载完成');
                } else {
                    console.log('[NS助手] 未找到评论列表容器');
                }
            } catch (error) {
                console.error('[NS助手] 加载下一页评论失败:', error);
            } finally {
                setTimeout(() => {
                    this.isRequesting = false;
                    console.log('[NS助手] 重置请求状态');
                }, 500);
            }
        },

        b64DecodeUnicode(str) {
            return decodeURIComponent(atob(str).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
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
    console.log('[NS助手] autoPage 模块加载完成 v0.2.4');
})(); 