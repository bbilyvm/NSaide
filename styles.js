const customCSS = `
    .enhanced-user-card {
        position: fixed;
        width: 260px !important;
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        overflow: visible !important;
        transition: box-shadow 0.3s ease;
        cursor: move;
        user-select: none;
    }
    .enhanced-user-card.dragging {
        opacity: 0.95;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }
    .enhanced-user-card:hover {
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }
    .user-card-extension {
        background: #fff;
        border-top: 1px solid rgba(0,0,0,0.06);
        padding: 12px;
        margin-top: 5px;
        font-size: 13px;
        color: #666;
        border-radius: 0 0 8px 8px;
    }
    .next-level-info {
        padding: 12px;
        background: linear-gradient(135deg, #f6f8ff 0%, #f0f4ff 100%);
        border-radius: 6px;
        margin-bottom: 10px;
        border: 1px solid rgba(0,157,255,0.1);
        position: relative;
        overflow: hidden;
    }
    .next-level-info.max-level {
        background: linear-gradient(135deg, #fff9f0 0%, #fff4e6 100%);
        border: 1px solid rgba(255,171,0,0.1);
    }
    .next-level-title {
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
        font-size: 14px;
    }
    .next-level-detail {
        color: #666;
        font-size: 12px;
    }
    .activity-info {
        padding: 12px;
        background: #fafafa;
        border-radius: 6px;
        margin-top: 5px;
        border: 1px solid rgba(0,0,0,0.06);
        transition: all 0.3s ease;
    }
    .activity-title {
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .activity-score {
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 10px;
        font-weight: normal;
    }
    .activity-detail {
        font-size: 12px;
        color: #666;
        line-height: 1.8;
    }
    .activity-high {
        background: linear-gradient(135deg, #f0f9eb 0%, #e7f6df 100%);
        border: 1px solid rgba(103,194,58,0.1);
    }
    .activity-high .activity-score {
        background: rgba(103,194,58,0.1);
        color: #67C23A;
    }
    .activity-medium {
        background: linear-gradient(135deg, #fdf6ec 0%, #faf0e6 100%);
        border: 1px solid rgba(230,162,60,0.1);
    }
    .activity-medium .activity-score {
        background: rgba(230,162,60,0.1);
        color: #E6A23C;
    }
    .activity-low {
        background: linear-gradient(135deg, #f4f4f5 0%, #f0f0f2 100%);
        border: 1px solid rgba(144,147,153,0.1);
    }
    .activity-low .activity-score {
        background: rgba(144,147,153,0.1);
        color: #909399;
    }
    .next-level-progress {
        margin-top: 8px;
        height: 6px;
        background: rgba(0,157,255,0.1);
        border-radius: 3px;
        overflow: hidden;
        position: relative;
    }
    .next-level-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #009dff 0%, #33b1ff 100%);
        transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
    }
    .next-level-progress-bar::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.3) 50%,
            rgba(255,255,255,0) 100%
        );
        animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer {
        0% {
            transform: translateX(-100%);
        }
        100% {
            transform: translateX(100%);
        }
    }
`;


GM_addStyle(customCSS); 