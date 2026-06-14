<template>
  <header class="topbar">
    <!-- 左侧：标题 + 版本号 -->
    <div class="topbar-left">
      <span class="logo-icon">◆</span>
      <h1 class="title">公众号排版工具</h1>
      <span class="version">v{{ version }}</span>
    </div>

    <!-- 中间：操作按钮组 -->
    <div class="topbar-center">
      <button class="tb-btn" @click="$emit('clear')" title="清空编辑区">
        🗑 清空
      </button>
      <button class="tb-btn" @click="$emit('export')" title="导出完整 HTML">
        📤 导出
      </button>
      <button class="tb-btn tb-btn-primary" @click="$emit('copy')" title="一键复制（公众号兼容格式）">
        📋 复制
      </button>
    </div>

    <!-- 右侧：账号管理 + 同步 -->
    <div class="topbar-right">
      <!-- 账号选择器 -->
      <div class="account-selector" ref="accountDropdownRef">
        <button class="account-btn" @click="toggleAccountMenu" :class="{ active: showAccountMenu }">
          <span class="account-star">★</span>
          <span class="account-name">{{ currentAccount.name }}</span>
          <span class="account-arrow">▾</span>
        </button>

        <!-- 下拉菜单 -->
        <transition name="dropdown">
          <div v-if="showAccountMenu" class="account-dropdown">
            <div
              v-for="acc in accounts"
              :key="acc.id"
              class="account-item"
              :class="{ selected: acc.id === currentAccountId }"
              @click="selectAccount(acc.id)"
            >
              <span class="acc-star">{{ acc.id === currentAccountId ? '★' : '☆' }}</span>
              <span class="acc-name">{{ acc.name }}</span>
              <span class="acc-id">{{ acc.appIdMasked }}</span>
            </div>
            <button class="account-add-btn" @click="showAddAccount = true; showAccountMenu = false">
              <span>＋</span> 添加新账号
            </button>
          </div>
        </transition>
      </div>

      <!-- 同步到公众号 -->
      <button class="sync-btn" @click="$emit('push-wechat', { accountId: currentAccountId, account: currentAccount })" :disabled="!hasValidAppId" title="推送到公众号草稿箱">
        同步到公众号
      </button>
    </div>

    <!-- 添加账号弹窗 -->
    <transition name="modal">
      <div v-if="showAddAccount" class="modal-overlay" @click.self="showAddAccount = false">
        <div class="modal-box">
          <h3 class="modal-title">添加公众号账号</h3>
          <div class="modal-field">
            <label>账号昵称</label>
            <input v-model="newAccName" type="text" placeholder="如：我的公众号" class="modal-input" />
          </div>
          <div class="modal-field">
            <label>AppID</label>
            <input v-model="newAccAppId" type="text" placeholder="输入微信公众号 AppID" class="modal-input" />
          </div>
          <div class="modal-field">
            <label>AppSecret</label>
            <input v-model="newAccSecret" type="password" placeholder="输入 AppSecret" class="modal-input" />
          </div>
          <div class="modal-actions">
            <button class="modal-btn modal-cancel" @click="showAddAccount = false">取消</button>
            <button class="modal-btn modal-confirm" @click="addAccount" :disabled="!newAccName || !newAccAppId || !newAccSecret">确认添加</button>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const emit = defineEmits(['copy', 'export', 'clear', 'push-wechat']);

const version = '20260614-15';
const showAccountMenu = ref(false);
const showAddAccount = ref(false);
const accountDropdownRef = ref(null);

// 账号数据
const currentAccountId = ref('');
const accounts = ref([]);

// 新增账号表单
const newAccName = ref('');
const newAccAppId = ref('');
const newAccSecret = ref('');

const currentAccount = computed(() => {
  const found = accounts.value.find(a => a.id === currentAccountId.value);
  return found || { name: '未登录', appIdMasked: '' };
});

const hasValidAppId = computed(() => {
  const acc = accounts.value.find(a => a.id === currentAccountId.value);
  return acc && !!acc.appId;
});

onMounted(() => {
  loadAccounts();
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

const handleClickOutside = (e) => {
  if (accountDropdownRef.value && !accountDropdownRef.value.contains(e.target)) {
    showAccountMenu.value = false;
  }
};

const loadAccounts = () => {
  try {
    const raw = localStorage.getItem('wechat_accounts');
    if (raw) {
      accounts.value = JSON.parse(raw);
    }
    const savedCurrent = localStorage.getItem('wechat_current_account');
    if (savedCurrent && accounts.value.find(a => a.id === savedCurrent)) {
      currentAccountId.value = savedCurrent;
    } else if (accounts.value.length > 0) {
      currentAccountId.value = accounts.value[0].id;
    }
  } catch {}
};

const saveAccounts = () => {
  localStorage.setItem('wechat_accounts', JSON.stringify(accounts.value));
  localStorage.setItem('wechat_current_account', currentAccountId.value);
};

const toggleAccountMenu = () => {
  showAccountMenu.value = !showAccountMenu.value;
};

const selectAccount = (id) => {
  currentAccountId.value = id;
  saveAccounts();
  showAccountMenu.value = false;
};

const addAccount = () => {
  if (!newAccName.value || !newAccAppId.value || !newAccSecret.value) return;

  const id = 'acc_' + Date.now();
  const masked = newAccAppId.value.length > 8
    ? newAccAppId.value.slice(0, 6) + '___' + newAccAppId.value.slice(-4)
    : newAccAppId.value;

  accounts.value.push({
    id,
    name: newAccName.value,
    appId: newAccAppId.value,
    appSecret: newAccSecret.value,
    appIdMasked: masked
  });

  currentAccountId.value = id;
  saveAccounts();

  newAccName.value = '';
  newAccAppId.value = '';
  newAccSecret.value = '';
  showAddAccount.value = false;
};
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

/* ====== 左侧 ====== */
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
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
}

.version {
  font-size: 11px;
  background: #ff4757;
  color: #fff;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 500;
}

/* ====== 中间按钮区 ====== */
.topbar-center {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  justify-content: center;
}

.tb-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 14px;
  border: 1px solid #d9dce1;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #444;
  white-space: nowrap;
  transition: all 0.15s ease;
}
.tb-btn:hover { border-color: var(--theme-color, #0066ff); color: var(--theme-color, #0066ff); background: var(--theme-light, #f0f7ff); }
.tb-btn:active { transform: scale(0.97); }

.tb-btn-primary {
  background: var(--theme-color, #0066ff);
  color: #fff;
  border-color: var(--theme-color, #0066ff);
}
.tb-btn-primary:hover { opacity: 0.9; }

/* ====== 右侧：账号 + 同步 ====== */
.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 240px;
  justify-content: flex-end;
}

/* 账号选择器 */
.account-selector { position: relative; }

.account-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: 1px solid #d9dce1;
  border-radius: 6px;
  background: #fafbfc;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.account-btn:hover { border-color: #bbb; }
.account-btn.active { border-color: var(--theme-color, #0066ff); box-shadow: 0 0 0 2px rgba(0,102,255,0.08); }

.account-star { color: #f5a623; font-size: 13px; }
.account-name { font-weight: 500; max-width: 80px; overflow: hidden; text-overflow: ellipsis; }
.account-arrow { color: #999; font-size: 11px; margin-left: 2px; }

/* 下拉菜单 */
.account-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 220px;
  background: #fff;
  border: 1px solid #e8eaed;
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.12);
  padding: 6px 0;
  z-index: 200;
}

.account-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  cursor: pointer;
  transition: background 0.12s;
  font-size: 13px;
}
.account-item:hover { background: #f8f9fa; }
.account-item.selected { background: #f0f7ff; }

.acc-star { color: #ccc; font-size: 13px; flex-shrink: 0; }
.account-item.selected .acc-star { color: #f5a623; }
.acc-name { color: #333; font-weight: 500; flex-shrink: 0; }
.acc-id { color: #aaa; font-size: 12px; margin-left: auto; }

.account-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: calc(100% - 20px);
  margin: 4px 10px 6px;
  padding: 8px;
  border: 1px dashed #d9dce1;
  border-radius: 8px;
  background: none;
  color: var(--theme-color, #0066ff);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.account-add-btn:hover { background: #f0f7ff; border-color: var(--theme-color, #0066ff); }

/* 同步按钮 */
.sync-btn {
  padding: 5px 16px;
  border: none;
  border-radius: 6px;
  background: #2ed573;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
}
.sync-btn:hover { background: #26b862; }
.sync-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ====== 弹窗 ====== */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: #fff;
  border-radius: 12px;
  padding: 28px 32px;
  width: 380px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.18);
}

.modal-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 20px;
}

.modal-field { margin-bottom: 14px; }

.modal-field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #555;
  margin-bottom: 5px;
}

.modal-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9dce1;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.modal-input:focus { border-color: var(--theme-color, #0066ff); box-shadow: 0 0 0 2px rgba(0,102,255,0.08); }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 22px;
}

.modal-btn {
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s;
}
.modal-cancel { background: #f5f5f5; color: #666; }
.modal-cancel:hover { background: #eee; }
.modal-confirm { background: var(--theme-color, #0066ff); color: #fff; }
.modal-confirm:hover:not(:disabled) { opacity: 0.88; }
.modal-confirm:disabled { opacity: 0.4; cursor: not-allowed; }

/* 过渡动画 */
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
