#!/usr/bin/env python3
"""Camp Memories 构建产物验证脚本。

用法：
    python projects/camp-memories/scripts/verify-deploy.py [path]

path 可以是：
    - 一个具体的 JS 文件（如 dist/assets/index-XXXX.js）
    - 一个目录（自动在其中的 index-*.js 里选最新的）
    - 省略：默认查找 Camp Memories 的 deploy/assets/index-*.js

检查构建产物是否包含预期的功能特征字符串（用于确认部署产物已含最新功能）。
"""
import sys
import glob
import os

# 检查构建产物是否包含预期的功能特征（字符串字面量在 minify 后稳定保留）
checks = [
    "SHOT #",                    # 画廊照片编号
    "gallery.filter",            # 画廊删除
    "camp_seeded",               # 首次 seed 标记（重复 seed 修复）
    "Camp Memories",             # 应用名
    "corkboard",                 # 软木板 UI
]


def resolve_js_path(arg):
    if arg is None:
        # 默认：Camp Memories 产品目录 deploy/assets/
        base = os.path.normpath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "deploy", "assets")
        )
    elif os.path.isfile(arg):
        return arg
    else:
        base = arg

    candidates = sorted(
        glob.glob(os.path.join(base, "index-*.js")),
        key=os.path.getmtime,
        reverse=True,
    )
    if not candidates:
        print(f"ERROR: no index-*.js found under {base}")
        sys.exit(1)
    return candidates[0]


def main():
    js_path = resolve_js_path(sys.argv[1] if len(sys.argv) > 1 else None)
    print(f"Verifying: {js_path}")
    with open(js_path, "r", encoding="utf-8") as f:
        c = f.read()

    ok = True
    for s in checks:
        if s in c:
            print(f"  OK: {s[:50]}...")
        else:
            print(f"  MISSING: {s[:50]}...")
            ok = False

    if ok:
        print("All checks passed!")
    else:
        print("SOME CHECKS FAILED!")
        sys.exit(1)


if __name__ == "__main__":
    main()
