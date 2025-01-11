const NSUserCard = {
    init() {
        console.log('[NS助手] 初始化用户卡片增强功能');

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

            const card = await NSUtils.waitForElement('.hover-user-card');
            if (!card) {
                console.log('[NS助手] 未找到卡片');
                return;
            }

            console.log('[NS助手] 找到卡片，等待内容加载...');
            const statBlock = await NSUtils.waitForElement('.stat-block', card, 3000);
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

            // 获取注册天数
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

            const nextLevelInfo = NSUtils.calculateNextLevelInfo(userData.level, userData.chickenLegs);


            const activity = NSUtils.calculateActivity(
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

window.NSUserCard = NSUserCard; 