"""
wechat_editor 备份脚本
用法:
  python backup.py                  → 自动生成 backups/v20260618-auto/
  python backup.py "修复了加粗"      → backups/v20260618-修复了加粗/
"""

import sys
import os
import shutil
from datetime import datetime

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(PROJECT_ROOT, "frontend", "src")
BACKUPS = os.path.join(PROJECT_ROOT, "backups")

# 核心文件列表（相对于 frontend/src/）
CORE_FILES = [
    "App.vue",
    "stores/editor.js",
    "components/Editor.vue",
    "components/RightPanel.vue",
    "components/LeftSidebar.vue",
]


def main():
    # 备份目录名
    desc = sys.argv[1] if len(sys.argv) > 1 else "auto"
    date = sys.argv[2] if len(sys.argv) > 2 else datetime.now().strftime("%Y%m%d")
    dirname = f"v{date}-{desc}"
    dest = os.path.join(BACKUPS, dirname)

    if os.path.exists(dest):
        print(f"[跳过] 已存在: {dest}")
        return

    os.makedirs(dest, exist_ok=True)
    copied = 0

    for f in CORE_FILES:
        src_file = os.path.join(SRC, f)
        dst_file = os.path.join(dest, os.path.basename(f))
        if os.path.exists(src_file):
            shutil.copy2(src_file, dst_file)
            copied += 1
            print(f"  ✅ {f}")

    print(f"\n备份完成: {dest}（{copied} 个文件）")


if __name__ == "__main__":
    main()
