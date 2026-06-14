<template>
  <header class="topbar">
    <!-- 左侧：标题 -->
    <div class="topbar-left">
      <span class="logo-icon">◆</span>
      <h1 class="title">排版工具</h1>
      <span class="version">v{{ version }}</span>
    </div>

    <!-- 中间：操作按钮组 -->
    <div class="topbar-center">
      <button class="tb-btn" @click="handleUndo" :disabled="!canUndo" title="撤销 (Ctrl+Z)">
        <span class="tb-icon">↩</span> 撤销
      </button>
      <button class="tb-btn" @click="handleRedo" :disabled="!canRedo" title="重做 (Ctrl+Y)">
        <span class="tb-icon">↪</span> 重做
      </button>
      <div class="tb-divider"></div>
      <button class="tb-btn" @click="handleClear" title="清空编辑区">
        <span class="tb-icon">🗑</span> 清空
      </button>
      <button class="tb-btn" @click="handleExport" title="导出完整 HTML">
        <span class="tb-icon">📤</span> 导出
      </button>
      <button class="tb-btn tb-btn-primary" @click="handleCopy" title="一键复制（公众号兼容格式）">
        <span class="tb-icon">📋</span> 复制
      </button>

      <!-- 微信 AppID 输入 -->
      <div class="wechat-input-group">
        <input
          v-model="appId"
          type="text"
          placeholder="微信公众号AppID..."
          class="appid-input"
          @blur="saveAppId"
        />
        <button class="tb-btn tb-btn-success" @click="handlePushToWechat" :disabled="!appId" title="推送到公众号草稿箱">
          推送草稿
        </button>
      </div>
    </div>

    <!-- 右侧 -->
    <div class="topbar-right">
      <span v-if="userStatus" class="user-badge">{{ userStatus }}</span>
      <button class="tb-btn tb-btn-link" @click="goToWechat" title="回到微信公众号后台">
        回到公众号 →
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const version = '1.0.0';
const canUndo = ref(false);
const canRedo = ref(false);
const appId = ref('');
const userStatus = ref('');

onMounted(() => {
  // 从 localStorage 读取缓存的 appId
  const saved = localStorage.getItem('wechat_appid');
  if (saved) appId.value = saved;
  const status = localStorage.getItem('user_status');
  if (status) userStatus.value = status;
});

const saveAppId = () => {
  if (appId.value) {
    localStorage.setItem('wechat_appid', appId.value.trim());
  }
};

const handleUndo = () => { document.execCommand('undo'); };
const handleRedo = () => { document.execCommand('redo'); };
const handleClear = () => {
  if (confirm('确定要清空所有内容吗？')) {
    // TODO: 触发清空事件
  }
};
const handleExport = () => { /* TODO */ };
const handleCopy = () => { /* TODO */ };
const handlePushToWechat = () => { /* TODO: 调用后端 API */ };
const goToWechat = () => { window.open('https://mp.weixin.qq.com', '_blank'); };
</script>

<style scoped>
.topbar {
  height: 52px;
  background: #fff;
  border-bottom: 1px solid #e8eaed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  gap: 16px;
  z-index: 100;
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 180px;
}

.logo-icon {
  color: var(--theme-color, #0066ff);
  font-size: 18px;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
}

.version {
  font-size: 11px;
  background: #ff4757;
  color: #fff;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

/* 中间按钮区 */
.topbar-center {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
  overflow-x: auto;
}

.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #d9dce1;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #444;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.tb-btn:hover:not(:disabled) {
  border-color: var(--theme-color, #0066ff);
  color: var(--theme-color, #0066ff);
  background: var(--theme-light, #f0f7ff);
}

.tb-btn:active:not(:disabled) {
  transform: scale(0.97);
}

.tb-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.tb-btn-primary {
  background: var(--theme-color, #0066ff);
  color: #fff;
  border-color: var(--theme-color, #0066ff);
}
.tb-btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  color: #fff;
}

.tb-btn-success {
  background: #2ed573;
  color: #fff;
  border-color: #2ed573;
}
.tb-btn-success:hover:not(:disabled) {
  background: #26b862;
  color: #fff;
}

.tb-btn-link {
  border: none;
  background: none;
  color: var(--theme-color, #0066ff);
  font-size: 13px;
}
.tb-btn-link:hover {
  text-decoration: underline;
}

.tb-divider {
  width: 1px;
  height: 20px;
  background: #e8eaed;
  margin: 0 4px;
}

.tb-icon {
  font-size: 14px;
}

/* 微信输入组 */
.wechat-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.appid-input {
  width: 200px;
  padding: 6px 10px;
  border: 1px solid #d9dce1;
  border-radius: 6px;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s;
}
.appid-input:focus {
  border-color: var(--theme-color, #0066ff);
  box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.08);
}
.appid-input::placeholder {
  color: #bbb;
}

/* 右侧 */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  justify-content: flex-end;
}

.user-badge {
  font-size: 12px;
  color: #999;
  background: #f5f5f5;
  padding: 3px 8px;
  border-radius: 10px;
}
</style>
