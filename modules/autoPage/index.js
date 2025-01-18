(function() {
    'use strict';
    
    console.log('[NS助手] autoPage 模块开始加载');

    const NSAutoPage = {
        id: 'autoPage',
        name: '自动翻页',
        description: '自动加载下一页内容，支持帖子列表和评论列表',

        config: {
            storage: {
                STATUS: 'ns_autopage_status',
                SCROLL_THRESHOLD: 'ns_autopage_scroll_threshold'
            },
            post: {
                pathPattern: /^\/(categories\/|page|award|search|$)/,
                scrollThreshold: 200,
                nextPagerSelector: '.nsk-pager a.pager-next',
                postListSelector: 'ul.post-list',
                topPagerSelector: 'div.nsk-pager.pager-top',
                bottomPagerSelector: 'div.nsk-pager.pager-bottom'
            },
            comment: {
                pathPattern: /^\/post-/,
                scrollThreshold: 690,
                nextPagerSelector: '.nsk-pager a.pager-next',
                postListSelector: 'ul.comments',
                topPagerSelector: 'div.nsk-pager.post-top-pager',
                bottomPagerSelector: 'div.nsk-pager.post-bottom-pager'
            }
        },

        settings: {
            items: [
                {
                    id: 'status',
                    type: 'switch',
                    label: '启用自动翻页',
                    default: true,
                    value: () => GM_getValue('ns_autopage_status', true)
                },
                {
                    id: 'scroll_threshold',
                    type: 'number',
                    label: '滚动触发阈值',
                    default: 200,
                    value: () => GM_getValue('ns_autopage_scroll_threshold', 200)
                }
            ],
            
            handleChange(settingId, value, settingsManager) {
                if (settingId === 'status') {
                    settingsManager.cacheValue('ns_autopage_status', value);
                } else if (settingId === 'scroll_threshold') {
                    settingsManager.cacheValue('ns_autopage_scroll_threshold', parseInt(value));
                }
            }
        },

        utils: {
            windowScroll(callback) {
                let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                let ticking = false;
            
                window.addEventListener('scroll', function(e) {
                    let currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    
                    if (!ticking) {
                        window.requestAnimationFrame(function() {
                            let direction = currentScrollTop > lastScrollTop ? 'down' : 'up';
                            callback(direction, e);
                            lastScrollTop = currentScrollTop;
                            ticking = false;
                        });
                        
                        ticking = true;
                    }
                }, { passive: true });
            },

            b64DecodeUnicode(str) {
                return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));
            }
        },

        autoLoading() {
            if (GM_getValue(this.config.storage.STATUS, true) === false) return;
            
            let opt = {};
            if (this.config.post.pathPattern.test(location.pathname)) { 
                opt = this.config.post; 
            }
            else if (this.config.comment.pathPattern.test(location.pathname)) { 
                opt = this.config.comment; 
            }
            else { 
                return; 
            }

            let is_requesting = false;
            let _this = this;

            this.utils.windowScroll(function (direction, e) {
                if (direction === 'down') {
                    let scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
                    let threshold = GM_getValue(_this.config.storage.SCROLL_THRESHOLD, opt.scrollThreshold);
                    
                    if (document.documentElement.scrollHeight <= document.documentElement.clientHeight + scrollTop + threshold && !is_requesting) {
                        let nextButton = document.querySelector(opt.nextPagerSelector);
                        if (!nextButton) return;
                        
                        let nextUrl = nextButton.attributes.href.value;
                        is_requesting = true;

                        GM_xmlhttpRequest({
                            method: 'GET',
                            url: nextUrl,
                            onload: function(response) {
                                if (response.status === 200) {
                                    let doc = new DOMParser().parseFromString(response.responseText, "text/html");
                                    
                                    if (_this.config.comment.pathPattern.test(location.pathname)){
                                        let el = doc.getElementById('temp-script')
                                        let jsonText = el.textContent;
                                        if (jsonText) {
                                            let conf = JSON.parse(_this.utils.b64DecodeUnicode(jsonText))
                                            unsafeWindow.__config__.postData.comments.push(...conf.postData.comments);
                                        }
                                    }

                                    document.querySelector(opt.postListSelector).append(...doc.querySelector(opt.postListSelector).childNodes);
                                    
                                    document.querySelector(opt.topPagerSelector).innerHTML = doc.querySelector(opt.topPagerSelector).innerHTML;
                                    document.querySelector(opt.bottomPagerSelector).innerHTML = doc.querySelector(opt.bottomPagerSelector).innerHTML;
                                    
                                    history.pushState(null, null, nextUrl);
                                    
                                    is_requesting = false;
                                }
                            },
                            onerror: function(error) {
                                is_requesting = false;
                                console.error('[NS助手] 自动加载下一页失败:', error);
                            }
                        });
                    }
                }
            });
        },

        init() {
            console.log('[NS助手] 初始化自动翻页模块');
            this.autoLoading();
            console.log('[NS助手] 自动翻页模块初始化完成');
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
    console.log('[NS助手] autoPage 模块加载完成 v0.3.2');
})();
