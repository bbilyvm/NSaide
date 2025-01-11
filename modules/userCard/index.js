(function() {
    'use strict';

    if (!window._NS) return;

    const NSUserCard = {
        id: 'userCard',
        name: '用户卡片增强',
        description: '增强用户信息卡片，添加等级进度和活跃度统计',

        utils: {
            async waitForElement(selector, parent = document, timeout = 10000) {
                const element = parent.querySelector(selector);
                if (element) return element;
            
                return new Promise((resolve) => {
                    const observer = new MutationObserver((mutations, obs) => {
                        const element = parent.querySelector(selector);
                        if (element) {
                            obs.disconnect();
                            resolve(element);
                        }
                    });
            
                    observer.observe(parent, {
                        childList: true,
                        subtree: true
                    });

                    setTimeout(() => {
                        observer.disconnect();
                        resolve(null);
                    }, timeout);
                });
            },

            calculateNextLevelInfo(currentLevel, currentChickenLegs) {
                if (currentLevel >= 6) {
                    return {
                        isMaxLevel: true,
                        nextLevel: 6,
                        remaining: 0,
                        progress: 100
                    };
                }
            
                const nextLevel = currentLevel + 1;
                const requiredChickenLegs = 100 * Math.pow(nextLevel, 2);
                const remaining = Math.max(0, requiredChickenLegs - currentChickenLegs);
                const progress = Math.min(100, (currentChickenLegs / requiredChickenLegs) * 100);
            
                return {
                    isMaxLevel: false,
                    nextLevel,
                    remaining: Math.round(remaining),
                    progress: Math.round(progress)
                };
            },

            calculateActivity(joinDays, posts, comments, chickenLegs) {
                const hasJoinDays = joinDays > 0;
                let interactionScore = 0;
                let chickenScore = 0;
                let timeScore = 0;
                
                if (hasJoinDays) {
                    const dailyInteraction = ((posts + comments) / joinDays).toFixed(2);

                    if (dailyInteraction >= 1) interactionScore = 30;
                    else if (dailyInteraction >= 0.5) interactionScore = 25;
                    else if (dailyInteraction >= 0.2) interactionScore = 20;
                    else if (dailyInteraction >= 0.1) interactionScore = 15;
                    else interactionScore = 10;

                    const chickenEfficiency = (chickenLegs / joinDays).toFixed(2);

                    if (chickenEfficiency >= 2) chickenScore = 40;
                    else if (chickenEfficiency >= 1.5) chickenScore = 35;
                    else if (chickenEfficiency >= 1) chickenScore = 30;
                    else if (chickenEfficiency >= 0.5) chickenScore = 25;
                    else chickenScore = 20;

                    timeScore = 30 - Math.floor(joinDays / 365) * 7;
                    timeScore = Math.max(0, timeScore);
                    
                    return {
                        score: interactionScore + chickenScore + timeScore,
                        level: this.getActivityLevel(interactionScore + chickenScore + timeScore),
                        dailyInteraction,
                        chickenEfficiency,
                        details: {
                            hasJoinDays: true,
                            interactionScore,
                            chickenScore,
                            timeScore
                        }
                    };
                } else {
                    const totalInteractions = posts + comments;

                    if (totalInteractions >= 300) interactionScore = 45;
                    else if (totalInteractions >= 200) interactionScore = 40;
                    else if (totalInteractions >= 100) interactionScore = 35;
                    else if (totalInteractions >= 50) interactionScore = 30;
                    else interactionScore = 25;

                    if (chickenLegs >= 1000) chickenScore = 55;
                    else if (chickenLegs >= 500) chickenScore = 50;
                    else if (chickenLegs >= 200) chickenScore = 45;
                    else if (chickenLegs >= 100) chickenScore = 40;
                    else chickenScore = 35;
                    
                    return {
                        score: interactionScore + chickenScore,
                        level: this.getActivityLevel(interactionScore + chickenScore),
                        totalInteractions,
                        chickenLegs,
                        details: {
                            hasJoinDays: false,
                            interactionScore,
                            chickenScore
                        }
                    };
                }
            },

            getActivityLevel(score) {
                if (score >= 80) return 'high';
                if (score >= 50) return 'medium';
                return 'low';
            }
        },

        init() {
            console.log('[NS助手] 初始化用户卡片增强功能');
            
            this.waitAndEnhance = this.waitAndEnhance.bind(this);
            this.enhance = this.enhance.bind(this);
            this.enableDragging = this.enableDragging.bind(this);

            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://raw.githubusercontent.com/stardeep925/NSaide/main/modules/userCard/style.css',
                onload: (response) => {
                    if (response.status === 200) {
                        GM_addStyle(response.responseText);
                    } else {
                        console.error('[NS助手] 加载用户卡片样式失败');
                    }
                },
                onerror: (error) => {
                    console.error('[NS助手] 加载用户卡片样式出错:', error);
                }
            });

            document.addEventListener('click', (e) => {
                const avatarLink = e.target.closest('a[href^="/space/"]');
                if (avatarLink && avatarLink.querySelector('img.avatar-normal')) {
                    console.log('[NS助手] 检测到头像点击');
                    this.waitAndEnhance();
                }
            });
        },

        enableDragging(cardElement) {
            let isDragging = false;
            let startX;
            let startY;
            let startLeft;
            let startTop;

            const dragStart = (e) => {
                if (e.target.tagName.toLowerCase() === 'a' || 
                    e.target.tagName.toLowerCase() === 'button' ||
                    e.target.closest('a') || 
                    e.target.closest('button')) {
                    return;
                }

                const rect = cardElement.getBoundingClientRect();
                startLeft = rect.left;
                startTop = rect.top;

                startX = e.clientX;
                startY = e.clientY;

                if (e.target === cardElement || cardElement.contains(e.target)) {
                    isDragging = true;
                    cardElement.classList.add('dragging');
                }
            };

            const dragEnd = () => {
                if (!isDragging) return;
                isDragging = false;
                cardElement.classList.remove('dragging');
            };

            const drag = (e) => {
                if (!isDragging) return;
                e.preventDefault();

                const moveX = e.clientX - startX;
                const moveY = e.clientY - startY;

                cardElement.style.left = `${startLeft + moveX}px`;
                cardElement.style.top = `${startTop + moveY}px`;
            };

            cardElement.addEventListener('mousedown', dragStart);
            document.addEventListener('mousemove', drag);
            document.addEventListener('mouseup', dragEnd);

            return () => {
                cardElement.removeEventListener('mousedown', dragStart);
                document.removeEventListener('mousemove', drag);
                document.removeEventListener('mouseup', dragEnd);
            };
        },

        async waitAndEnhance() {
            try {
                console.log('[NS助手] 等待卡片出现...');

                document.querySelectorAll('.hover-user-card').forEach(card => {
                    card.classList.remove('enhanced');
                    card.classList.remove('enhanced-user-card');

                    const extension = card.querySelector('.user-card-extension');
                    if (extension) {
                        extension.remove();
                    }
                });

                const card = await this.utils.waitForElement('.hover-user-card');
                if (!card) {
                    console.log('[NS助手] 未找到卡片');
                    return;
                }

                console.log('[NS助手] 找到卡片，等待内容加载...');

                const statBlock = await this.utils.waitForElement('.stat-block', card, 3000);
                if (!statBlock) {
                    console.log('[NS助手] 卡片内容加载超时');
                    return;
                }

                console.log('[NS助手] 卡片内容加载完成，开始增强');
                this.enhance(card);
              
                this.enableDragging(card);

            } catch (error) {
                console.error('[NS助手] 等待卡片时出错:', error);
            }
        },

        enhance(cardElement) {
            if (cardElement.classList.contains('enhanced')) {
                console.log('[NS助手] 卡片已增强，跳过');
                return;
            }

            console.log('[NS助手] 开始增强卡片');
            cardElement.classList.add('enhanced');
            cardElement.classList.add('enhanced-user-card');

            try {
                const userData = {
                    level: 0,
                    chickenLegs: 0,
                    posts: 0,
                    comments: 0,
                    joinDays: 0
                };

                const joinedText = cardElement.querySelector('div[style*="color: rgb(136, 136, 136)"]')?.textContent || '';
                const daysMatch = joinedText.match(/(\d+)days/);
                if (daysMatch) {
                    userData.joinDays = parseInt(daysMatch[1]);
                }

                const spans = cardElement.querySelectorAll('span[data-v-0f04b1f4]');
                spans.forEach(span => {
                    const text = span.textContent.trim();
                    if (text.includes('等级')) {
                        const match = text.match(/Lv (\d+)/);
                        if (match) userData.level = parseInt(match[1]);
                    } else if (text.includes('鸡腿')) {
                        const match = text.match(/鸡腿 (\d+)/);
                        if (match) userData.chickenLegs = parseInt(match[1]);
                    } else if (text.includes('主题帖')) {
                        const match = text.match(/主题帖 (\d+)/);
                        if (match) userData.posts = parseInt(match[1]);
                    } else if (text.includes('评论数')) {
                        const match = text.match(/评论数 (\d+)/);
                        if (match) userData.comments = parseInt(match[1]);
                    }
                });

                console.log('[NS助手] 提取的用户数据:', userData);

                const nextLevelInfo = this.utils.calculateNextLevelInfo(userData.level, userData.chickenLegs);

                const activity = this.utils.calculateActivity(
                    userData.joinDays,
                    userData.posts,
                    userData.comments,
                    userData.chickenLegs
                );

                const extensionDiv = document.createElement('div');
                extensionDiv.className = 'user-card-extension';

                const nextLevelDiv = document.createElement('div');
                nextLevelDiv.className = nextLevelInfo.isMaxLevel ?
                    'next-level-info max-level' :
                    'next-level-info';

                if (nextLevelInfo.isMaxLevel) {
                    nextLevelDiv.innerHTML = `
                        <div class="next-level-title">🌟 最高等级</div>
                        <div class="next-level-detail">
                            此用户已达到最高等级 Lv.6
                        </div>
                    `;
                } else {
                    nextLevelDiv.innerHTML = `
                        <div class="next-level-title">⭐ 等级进度</div>
                        <div class="next-level-detail">
                            距离 Lv.${nextLevelInfo.nextLevel} 还需 ${nextLevelInfo.remaining} 鸡腿
                        </div>
                        <div class="next-level-progress">
                            <div class="next-level-progress-bar" style="width: ${nextLevelInfo.progress}%"></div>
                        </div>
                    `;
                }

                const activityDiv = document.createElement('div');
                activityDiv.className = `activity-info activity-${activity.level}`;

                let activityHtml = `
                    <div class="activity-title">
                        ${activity.level === 'high' ? '🔥' : activity.level === 'medium' ? '⭐' : '💫'}
                        活跃指数
                        <span class="activity-score">${activity.score}分</span>
                    </div>
                    <div class="activity-detail">
                `;

                if (activity.details.hasJoinDays) {
                    activityHtml += `
                        📊 互动频率：${activity.dailyInteraction}次/天 (${activity.details.interactionScore}分)
                        <br>
                        🎯 鸡腿效率：${activity.chickenEfficiency}个/天 (${activity.details.chickenScore}分)
                        <br>
                        ⌛ 注册时长：${userData.joinDays}天 (${activity.details.timeScore}分)
                    `;
                } else {
                    activityHtml += `
                        📊 互动总量：${activity.totalInteractions}次 (${activity.details.interactionScore}分)
                        <br>
                        🎯 鸡腿总量：${activity.chickenLegs}个 (${activity.details.chickenScore}分)
                    `;
                }

                activityHtml += `</div>`;
                activityDiv.innerHTML = activityHtml;

                extensionDiv.appendChild(nextLevelDiv);
                extensionDiv.appendChild(activityDiv);
                cardElement.appendChild(extensionDiv);
                console.log('[NS助手] 卡片增强完成');

            } catch (error) {
                console.error('[NS助手] 数据处理错误:', error);
            }
        }
    };

    window._NS.registerModule(NSUserCard);
})();