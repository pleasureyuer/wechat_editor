import re

with open('F:/wechat_editor/frontend/src/App.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 方案：直接在所有组件的 editable-block div 里加 data-style 属性
# 用正则匹配并替换

replacements = [
    # (old_pattern, new_html_with_data_style)
    # numberTitle
    ('<div class="editable-block style-number-title">',
     '<div class="editable-block" data-style="numberTitle">'),
    # gradientTitle
    ('<div class="editable-block style-gradient-title">',
     '<div class="editable-block" data-style="gradientTitle">'),
    # tagTitle
    ('<div class="editable-block style-tag-title">',
     '<div class="editable-block" data-style="tagTitle">'),
    # pillTitle
    ('<div class="editable-block style-pill-title">',
     '<div class="editable-block" data-style="pillTitle">'),
    # softPillTitle
    ('<div class="editable-block style-soft-pill-title">',
     '<div class="editable-block" data-style="softPillTitle">'),
    # leftLineTitle
    ('<div class="editable-block style-left-line-title"',
     '<div class="editable-block" data-style="leftLineTitle"'),
    # rightLineTitle
    ('<div class="editable-block style-right-line-title"',
     '<div class="editable-block" data-style="rightLineTitle"'),
    # centerLineTitle
    ('<div class="editable-block style-center-title"',
     '<div class="editable-block" data-style="centerLineTitle"'),
    # circleIconTitle
    ('<div class="editable-block style-circle-icon-title"',
     '<div class="editable-block" data-style="circleIconTitle"'),
    # dotLine
    ('<div class="editable-block style-dot-line">',
     '<div class="editable-block" data-style="dotLine">'),
    # underlineTitle
    ('<div class="editable-block style-underline-title"',
     '<div class="editable-block" data-style="underlineTitle"'),
    # cardTitle
    ('<div class="editable-block style-card-title"',
     '<div class="editable-block" data-style="cardTitle"'),
    # stepTitle
    ('<div class="editable-block style-step-title"',
     '<div class="editable-block" data-style="stepTitle"'),
    # cardBox
    ('<div class="editable-block style-card-box">',
     '<div class="editable-block" data-style="cardBox">'),
    # highlightBlock
    ('<div class="editable-block style-highlight-block">',
     '<div class="editable-block" data-style="highlightBlock">'),
    # quoteBlock
    ('<div class="editable-block style-quote-block">',
     '<div class="editable-block" data-style="quoteBlock">'),
    # infoBox
    ('<div class="editable-block style-info-box"',
     '<div class="editable-block" data-style="infoBox"'),
    # disclaimer
    ('<div class="editable-block style-disclaimer">',
     '<div class="editable-block" data-style="disclaimer">'),
    # dividerSolid
    ('<div class="editable-block style-divider" style="height:1px;background:',
     '<div class="editable-block" data-style="dividerSolid" style="height:1px;background:'),
    # dividerDashed
    ('<div class="editable-block style-divider" style="height:1px;background:repeating-linear',
     '<div class="editable-block" data-style="dividerDashed" style="height:1px;background:repeating-linear'),
    # dividerDot
    ('<div class="editable-block style-divider" style="height:1px;background:repeating-linear-gradient(90deg,${TL} 0,${TL} 3px',
     '<div class="editable-block" data-style="dividerDot" style="height:1px;background:repeating-linear-gradient(90deg,${TL} 0,${TL} 3px'),
    # dividerThick
    ('<div class="editable-block style-divider" style="height:2px;background:${T};opacity:0.25',
     '<div class="editable-block" data-style="dividerThick" style="height:2px;background:${T};opacity:0.25'),
]

count = 0
for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        count += 1
        print(f'  替换: {old[:50]}...')
    else:
        print(f'  SKIP: {old[:50]}... (未找到)')

print(f'\n共替换 {count} 处')

# 验证
ds_count = content.count('data-style=')
print(f'data-style 属性总数: {ds_count}')

with open('F:/wechat_editor/frontend/src/App.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('\n文件已保存')
