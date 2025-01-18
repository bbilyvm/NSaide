(function() {
    'use strict';
    
    console.log('[NS助手] autoPage 模块开始加载');

    const NSAutoPage = {
        id: 'autoPage',
        name: '自动翻页',
        description: '浏览帖子列表和评论时自动加载下一页',

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
                    id: 'postThreshold',
                    label: '帖子列表触发距离',
                    type: 'number',
                    default: 200,
                    value: () => GM_getValue('autoPage_post_threshold', 200)
                },
                {
                    id: 'comment',
                    label: '评论区',
                    type: 'switch',
                    default: false,
                    value: () => GM_getValue('autoPage_comment_enabled', false)
                },
                {
                    id: 'commentThreshold',
                    label: '评论区触发距离',
                    type: 'number',
                    default: 200,
                    value: () => GM_getValue('autoPage_comment_threshold', 200)
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
                } else if (id === 'postThreshold') {
                    const threshold = parseInt(value) || 200;
                    GM_setValue('autoPage_post_threshold', threshold);
                    console.log('[NS助手] 更新帖子列表触发距离:', threshold);
                } else if (id === 'comment') {
                    GM_setValue('autoPage_comment_enabled', value);
                    if (!value) {
                        window.removeEventListener('scroll', NSAutoPage._boundScrollHandler);
                    } else {
                        NSAutoPage.initAutoLoading();
                    }
                } else if (id === 'commentThreshold') {
                    const threshold = parseInt(value) || 200;
                    GM_setValue('autoPage_comment_threshold', threshold);
                    console.log('[NS助手] 更新评论区触发距离:', threshold);
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
            const isPostList = /^\/($|node\/|search|page-)/.test(location.pathname);
            const isComment = /^\/post-\d+/.test(location.pathname);
            
            console.log('[NS助手] 当前页面类型:', isPostList ? '帖子列表' : (isComment ? '评论区' : '其他'));
            
            if (!isPostList && !isComment) {
                console.log('[NS助手] 不在目标页面');
                return;
            }

            if (isPostList && !GM_getValue('autoPage_postList_enabled', false)) {
                console.log('[NS助手] 帖子列表自动加载已禁用');
                return;
            }

            if (isComment && !GM_getValue('autoPage_comment_enabled', false)) {
                console.log('[NS助手] 评论区自动加载已禁用');
                return;
            }

            this.windowScroll((direction, e) => {
                if (direction === 'down') {
                    const scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
                    const scrollHeight = document.documentElement.scrollHeight;
                    const clientHeight = document.documentElement.clientHeight;
                    const threshold = isPostList 
                        ? GM_getValue('autoPage_post_threshold', 200)
                        : GM_getValue('autoPage_comment_threshold', 200);
                    
                    if (scrollHeight <= clientHeight + scrollTop + threshold && !this.isRequesting) {
                        console.log('[NS助手] 触发加载下一页, 阈值:', threshold);
                        this.loadNextPage(isPostList ? 'post' : 'comment');
                    }
                }
            });
        },

        async loadNextPage(type) {
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

                if (type === 'post') {
                    const postList = document.querySelector('.post-list');
                    const newPosts = doc.querySelector('.post-list');

                    if (postList && newPosts) {
                        postList.append(...newPosts.childNodes);
                        console.log('[NS助手] 追加帖子列表');
                    } else {
                        console.log('[NS助手] 未找到帖子列表容器');
                    }
                } else {
                    const scriptEl = doc.getElementById('temp-script');
                    if (scriptEl && scriptEl.textContent) {
                        try {
                            const jsonText = scriptEl.textContent;
                            const conf = JSON.parse(atob(jsonText));
                            if (window.__config__?.postData?.comments) {
                                window.__config__.postData.comments.push(...conf.postData.comments);
                                console.log('[NS助手] 评论数据已更新');
                            }
                        } catch (e) {
                            console.error('[NS助手] 评论数据处理失败:', e);
                        }
                    }

                    const commentList = document.querySelector('.comments');
                    const newComments = doc.querySelector('.comments');

                    if (commentList && newComments) {
                        Array.from(newComments.children).forEach(comment => {
                            const menu = comment.querySelector('.comment-menu');
                            if (menu) {
                                const mount = document.createElement('div');
                                mount.className = 'comment-menu-mount';
                                menu.parentNode.replaceChild(mount, menu);
                            }
                        });

                        commentList.append(...newComments.childNodes);
                        console.log('[NS助手] 追加评论列表');

                        const vue = document.querySelector('.comment-menu')?.__vue__;
                        if (vue && window.__config__) {
                            Array.from(document.querySelectorAll('.content-item')).forEach(function(item, index) {
                                const mount = item.querySelector('.comment-menu-mount');
                                if (!mount) return;

                                const commentId = item.getAttribute('data-comment-id');
                                const comment = window.__config__.postData.comments.find(c => c.commentId.toString() === commentId);
                                if (!comment) return;

                                const instance = new vue.$root.constructor(vue.$options);
                                instance.$data.logined = true;
                                instance.$data.commentArrayIndex = index;
                                instance.$data.isMe = comment.poster.isMe;
                                instance.$data.floorIndex = comment.floorIndex;
                                instance.$data.collectionCount = 0;
                                instance.$data.collected = false;
                                instance.$data.likeCount = comment.likeCount;
                                instance.$data.liked = comment.liked;
                                instance.$data.dislikeCount = comment.dislikeCount;
                                instance.$data.disliked = comment.disliked;
                                instance.$data.pined = comment.pined;
                                instance.$data.canAdmin = false;
                                instance.$data.canPin = true;

                                instance.$mount(mount);
                            });
                        } else {
                            console.error('[NS助手] 无法获取Vue实例或配置数据');
                        }
                    } else {
                        console.log('[NS助手] 未找到评论列表容器');
                    }
                }

                const topPager = document.querySelector('.post-top-pager');
                const bottomPager = document.querySelector('.post-bottom-pager');
                const newTopPager = doc.querySelector('.post-top-pager');
                const newBottomPager = doc.querySelector('.post-bottom-pager');

                if (topPager && newTopPager) {
                    topPager.innerHTML = newTopPager.innerHTML;
                }
                if (bottomPager && newBottomPager) {
                    bottomPager.innerHTML = newBottomPager.innerHTML;
                }

                history.pushState(null, null, nextUrl);
                console.log('[NS助手] 下一页加载完成');
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
    console.log('[NS助手] autoPage 模块加载完成 v0.1.8');
})(); 