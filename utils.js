const NSUtils = {
    async waitForElement(selector, parent = document, timeout = 5000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const element = parent.querySelector(selector);
            if (element) return element;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return null;
    },

    calculateLevelChickenLegs(level) {
        return 100 * Math.pow(level, 2);
    },

    calculateNextLevelInfo(currentLevel, currentChickenLegs) {
        console.log(`[NS助手] 计算等级信息 - 当前等级: ${currentLevel}, 当前鸡腿: ${currentChickenLegs}`);

        if (currentLevel >= 6) {
            return {
                isMaxLevel: true,
                currentLevel: 6,
                progress: 100
            };
        }

        const nextLevel = currentLevel + 1;
        const currentLevelRequired = this.calculateLevelChickenLegs(currentLevel);
        const nextLevelRequired = this.calculateLevelChickenLegs(nextLevel);
        const remaining = nextLevelRequired - currentChickenLegs;
        const progress = ((currentChickenLegs - currentLevelRequired) / (nextLevelRequired - currentLevelRequired)) * 100;

        console.log(`[NS助手] 计算结果 - 下一等级: ${nextLevel}, 还需鸡腿: ${remaining}, 进度: ${progress}%`);

        return {
            isMaxLevel: false,
            nextLevel,
            remaining: Math.max(0, remaining),
            progress: Math.min(Math.max(progress, 0), 100)
        };
    },


    calculateActivity(joinDays, posts, comments, chickenLegs) {

        const totalInteractions = posts + comments;
        const hasJoinDays = joinDays > 0;

        let interactionScore, chickenScore, timeScore;

        if (hasJoinDays) {
            const dailyInteraction = totalInteractions / joinDays;
            const chickenEfficiency = chickenLegs / joinDays;

            // 互动率评分（满分40分）
            // 互动率标准：0.05次/天=10分，0.15次/天=20分，0.3次/天=30分，0.5次/天=40分
            if (dailyInteraction >= 0.5) {
                interactionScore = 40;
            } else if (dailyInteraction >= 0.3) {
                interactionScore = 30 + (dailyInteraction - 0.3) * 50;
            } else if (dailyInteraction >= 0.15) {
                interactionScore = 20 + (dailyInteraction - 0.15) * 66.67;
            } else if (dailyInteraction >= 0.05) {
                interactionScore = 10 + (dailyInteraction - 0.05) * 100;
            } else {
                interactionScore = dailyInteraction * 200;
            }

            // 鸡腿效率评分（满分40分）
            // 鸡腿效率标准：0.3个/天=10分，0.8个/天=20分，1.5个/天=30分，2.5个/天=40分
            if (chickenEfficiency >= 2.5) {
                chickenScore = 40;
            } else if (chickenEfficiency >= 1.5) {
                chickenScore = 30 + (chickenEfficiency - 1.5) * 10;
            } else if (chickenEfficiency >= 0.8) {
                chickenScore = 20 + (chickenEfficiency - 0.8) * 14.29;
            } else if (chickenEfficiency >= 0.3) {
                chickenScore = 10 + (chickenEfficiency - 0.3) * 20;
            } else {
                chickenScore = chickenEfficiency * 33.33;
            }

            // 注册时间加权（满分20分）
            // 的时间评分：每年扣除7分，最低0分
            timeScore = Math.max(0, 20 - (joinDays / 365) * 7);

        } else {
            // 无注册天数时的替代计算方式
            // 基于总量而非效率来评分

            // 互动评分（满分40分）
            // 总互动：20次=10分，50次=20分，100次=30分，200次=40分
            if (totalInteractions >= 200) {
                interactionScore = 40;
            } else if (totalInteractions >= 100) {
                interactionScore = 30 + (totalInteractions - 100) * 0.1;
            } else if (totalInteractions >= 50) {
                interactionScore = 20 + (totalInteractions - 50) * 0.2;
            } else if (totalInteractions >= 20) {
                interactionScore = 10 + (totalInteractions - 20) * 0.33;
            } else {
                interactionScore = totalInteractions * 0.5;
            }

            // 鸡腿评分（满分40分）
            // 总鸡腿：100个=10分，300个=20分，600个=30分，1000个=40分
            if (chickenLegs >= 1000) {
                chickenScore = 40;
            } else if (chickenLegs >= 600) {
                chickenScore = 30 + (chickenLegs - 600) * 0.025;
            } else if (chickenLegs >= 300) {
                chickenScore = 20 + (chickenLegs - 300) * 0.033;
            } else if (chickenLegs >= 100) {
                chickenScore = 10 + (chickenLegs - 100) * 0.05;
            } else {
                chickenScore = chickenLegs * 0.1;
            }

            timeScore = 0;
        }

        const totalScore = Math.round(interactionScore + chickenScore + timeScore);

        let level = 'low';
        let description = '较少活跃';

        if (totalScore >= 80) {
            level = 'high';
            description = '非常活跃';
        } else if (totalScore >= 50) {
            level = 'medium';
            description = '正常活跃';
        }


        const details = {
            interactionScore: Math.round(interactionScore),
            chickenScore: Math.round(chickenScore),
            timeScore: Math.round(timeScore),
            hasJoinDays
        };

        return {
            dailyInteraction: hasJoinDays ? (totalInteractions / joinDays).toFixed(2) : null,
            chickenEfficiency: hasJoinDays ? (chickenLegs / joinDays).toFixed(2) : null,
            totalInteractions,
            chickenLegs,
            score: totalScore,
            details,
            level,
            description
        };
    },

    logElement(element, prefix = '') {
        if (!element) {
            console.log(`${prefix}元素不存在`);
            return;
        }
        console.log(`${prefix}元素类名:`, element.className);
        console.log(`${prefix}元素内容:`, element.textContent);
        console.log(`${prefix}元素HTML:`, element.outerHTML);
    }
};


window.NSUtils = NSUtils; 