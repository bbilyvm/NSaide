(function() {
    'use strict';
    
    console.log('[NS助手] contentPreview 模块开始加载');

    const NSContentPreview = {
        id: 'contentPreview',
        name: '内容预览',
        description: '自动获取帖子内容并显示在标题下方',

        config: {
            storage: {
                ENABLED: 'ns_content_preview_enabled'
            }
        },

        settings: {
            items: [
                {
                    id: 'enabled',
                    type: 'switch',
                    label: '启用内容预览',
                    default: true,
                    value: () => GM_getValue('ns_content_preview_enabled', true)
                }
            ],
            handleChange(settingId, value, settingsManager) {
                settingsManager.cacheValue(`ns_content_preview_${settingId}`, value);
            }
        },

        utils: {
            async fetchPostContent(postId, container, toggleBtn, statusSpan, page = 1) {
                return new Promise((resolve, reject) => {
                    const fullUrl = `https://www.nodeseek.com/post-${postId}-${page}`;

                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: fullUrl,
                        onload: function(response) {
                            if (response.status === 200) {
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(response.responseText, 'text/html');
                                const content = doc.querySelector('.post-content');
                                const comments = doc.querySelectorAll('ul.comments > li.content-item');

                                if (content) {
                                    let newContent = '';

                                    if (page === 1) {
                                        newContent = `<div class="ns-preview-post">${content.innerHTML}</div>`;
                                    }

                                    let commentsHtml = `
                                        <div class="ns-preview-comments">
                                            <div class="ns-preview-comments-header">
                                                <span>评论区</span>
                                                <span class="ns-preview-comments-count">第 ${page} 页</span>
                                            </div>
                                    `;

                                    comments.forEach(comment => {
                                        const avatar = comment.querySelector('.avatar-wrapper img');
                                        const avatarSrc = avatar ? avatar.src : '';
                                        const defaultAvatar = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"%3E%3Cpath fill="%23ddd" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/%3E%3C/svg%3E';

                                        const author = comment.querySelector('.author-name');
                                        const authorName = author?.textContent || '匿名用户';
                                        const authorLink = author?.href || '#';
                                        const commentContent = comment.querySelector('.post-content')?.innerHTML || '';

                                        commentsHtml += `
                                            <div class="ns-preview-comment">
                                                <div class="ns-preview-comment-avatar"
                                                     style="background-image: url('${avatarSrc || defaultAvatar}')"
                                                     role="img"
                                                     aria-label="${authorName}的头像"></div>
                                                <div class="ns-preview-comment-content">
                                                    <div class="ns-preview-comment-header">
                                                        <a href="${authorLink}" class="ns-preview-comment-author">${authorName}</a>
                                                    </div>
                                                    <div class="ns-preview-comment-text">${commentContent}</div>
                                                </div>
                                            </div>
                                        `;
                                    });

                                    const paginationLinks = doc.querySelectorAll('.pager-pos');
                                    let totalPages = 1;
                                    paginationLinks.forEach(link => {
                                        const pageNum = parseInt(link.textContent);
                                        if (!isNaN(pageNum) && pageNum > totalPages) {
                                            totalPages = pageNum;
                                        }
                                    });

                                    if (totalPages > 1) {
                                        commentsHtml += `<div class="ns-preview-pagination">`;
                                        if (page > 1) {
                                            commentsHtml += `<span class="ns-preview-page-btn" data-page="${page-1}">←</span>`;
                                        }

                                        for (let i = 1; i <= totalPages; i++) {
                                            if (i === page) {
                                                commentsHtml += `<span class="ns-preview-page-btn active">${i}</span>`;
                                            } else {
                                                commentsHtml += `<span class="ns-preview-page-btn" data-page="${i}">${i}</span>`;
                                            }
                                        }

                                        if (page < totalPages) {
                                            commentsHtml += `<span class="ns-preview-page-btn" data-page="${page+1}">→</span>`;
                                        }
                                        commentsHtml += `</div>`;
                                    }

                                    commentsHtml += '</div>';
                                    container.innerHTML = newContent + commentsHtml;

                                    container.querySelectorAll('.ns-preview-page-btn').forEach(btn => {
                                        if (btn.dataset.page) {
                                            btn.onclick = () => {
                                                const targetPage = parseInt(btn.dataset.page);
                                                if (!isNaN(targetPage) && targetPage !== page) {
                                                    NSContentPreview.utils.fetchPostContent(postId, container, toggleBtn, statusSpan, targetPage);
                                                }
                                            };
                                        }
                                    });

                                    container.hasContent = true;
                                    toggleBtn.classList.remove('loading');
                                    toggleBtn.textContent = '隐藏预览';
                                    statusSpan.textContent = '';

                                    resolve();
                                } else {
                                    reject(new Error('内容解析失败'));
                                }
                            } else {
                                reject(new Error(`HTTP ${response.status}`));
                            }
                        },
                        onerror: reject
                    });
                });
            },

            createImageModal() {
                const modal = document.createElement('div');
                modal.className = 'ns-preview-image-modal';
                modal.onclick = () => modal.style.display = 'none';
                document.body.appendChild(modal);
                return modal;
            },

            showImageModal(imgSrc) {
                let modal = document.querySelector('.ns-preview-image-modal');
                if (!modal) {
                    modal = this.createImageModal();
                }

                modal.innerHTML = `<img src="${imgSrc}" onclick="event.stopPropagation();">`;
                modal.style.display = 'flex';
            },

            setupPreview(item) {
                if (item.hasAttribute('data-preview-initialized')) return;
                item.setAttribute('data-preview-initialized', 'true');

                const titleLink = item.querySelector('a[href^="/post-"]');
                if (!titleLink) return;

                const postUrl = titleLink.getAttribute('href');
                const postId = postUrl.match(/\/post-(\d+)-/)?.[1];
                if (!postId) return;

                const previewContainer = document.createElement('div');
                previewContainer.className = 'ns-preview-content';
                previewContainer.style.display = 'none';

                const titleContainer = item.querySelector('.post-title') || titleLink.parentNode;
                const titleArea = titleContainer.getBoundingClientRect();
                const containerWidth = titleArea.width;

                previewContainer.style.width = `${containerWidth}px`;
                previewContainer.style.maxWidth = 'none';

                const statusSpan = document.createElement('span');
                statusSpan.className = 'ns-preview-status';

                const toggleBtn = document.createElement('span');
                toggleBtn.className = 'ns-preview-toggle';
                toggleBtn.textContent = '显示预览';

                let retryCount = 0;
                const maxRetries = 3;

                toggleBtn.onclick = () => {
                    const isHidden = previewContainer.style.display === 'none';

                    if (isHidden) {
                        previewContainer.style.display = 'block';
                        toggleBtn.textContent = '隐藏预览';

                        if (!previewContainer.hasContent) {
                            toggleBtn.classList.add('loading');
                            toggleBtn.textContent = '加载中...';

                            try {
                                NSContentPreview.utils.fetchPostContent(postId, previewContainer, toggleBtn, statusSpan);
                            } catch (error) {
                                if (retryCount < maxRetries) {
                                    retryCount++;
                                    statusSpan.textContent = `加载失败，正在重试(${retryCount}/${maxRetries})`;
                                    NSContentPreview.utils.fetchPostContent(postId, previewContainer, toggleBtn, statusSpan);
                                } else {
                                    toggleBtn.classList.add('error');
                                    toggleBtn.textContent = '加载失败';
                                    statusSpan.textContent = '已达到最大重试次数';
                                }
                            }
                        }
                    } else {
                        previewContainer.style.display = 'none';
                        toggleBtn.textContent = '显示预览';
                    }
                };

                titleLink.parentNode.appendChild(toggleBtn);
                titleLink.parentNode.appendChild(statusSpan);
                titleLink.parentNode.appendChild(previewContainer);
            }
        },

        init() {
            console.log('[NS助手] 初始化内容预览模块');

            if (!GM_getValue('ns_content_preview_enabled', true)) {
                console.log('[NS助手] 内容预览模块已禁用');
                return;
            }

            console.log('[NS助手] 开始加载内容预览样式');
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/contentPreview/style.css',
                onload: (response) => {
                    if (response.status === 200) {
                        console.log('[NS助手] 内容预览样式加载成功');
                        GM_addStyle(response.responseText);
                    } else {
                        console.error('[NS助手] 加载内容预览样式失败:', response.status);
                    }
                },
                onerror: (error) => {
                    console.error('[NS助手] 加载内容预览样式出错:', error);
                }
            });

            const setupPreviews = () => {
                const postItems = document.querySelectorAll('.post-list-item');
                postItems.forEach(item => this.utils.setupPreview(item));
            };

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length) {
                        setupPreviews();
                    }
                });
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setupPreviews();
            console.log('[NS助手] 内容预览模块初始化完成');
        }
    };

    console.log('[NS助手] 等待模块系统就绪');
    let retryCount = 0;
    const maxRetries = 50;

    const waitForNS = () => {
        retryCount++;
        console.log(`[NS助手] 第 ${retryCount} 次尝试注册 contentPreview 模块`);
        
        if (typeof window.NSRegisterModule === 'function') {
            console.log('[NS助手] 模块系统就绪，开始注册 contentPreview');
            window.NSRegisterModule(NSContentPreview);
            console.log('[NS助手] contentPreview 模块注册请求已发送');
        } else {
            console.log('[NS助手] 模块系统未就绪');
            if (retryCount < maxRetries) {
                setTimeout(waitForNS, 100);
            } else {
                console.error('[NS助手] 模块系统等待超时，contentPreview 模块注册失败');
            }
        }
    };

    waitForNS();
    console.log('[NS助手] contentPreview 模块加载完成 v0.0.2');
})(); 