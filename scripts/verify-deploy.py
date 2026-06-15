import sys
f = open("F:/codex/personanDB/memories/assets/index-CnynpGyu.js", "r", encoding="utf-8")
c = f.read()

checks = [
    "async function Wk(n)",
    "Wk(J).catch(console.error)",
    "gallery:n.gallery.filter((x,i)=>i!==_)",
    "async function Xk(n)",
    "function wx(n)",
    "function iC()",
    'children:["SHOT #",_+1]}),g.jsx("button",{onClick:e=>{e.stopPropagation();i({...n,gallery:n.gallery.filter((x,i)=>i!==_)})'
]
ok = True
for s in checks:
    idx = c.find(s)
    if idx > 0:
        print(f"  OK: {s[:50]}...")
    else:
        print(f"  MISSING: {s[:50]}...")
        ok = False

if ok:
    print("All checks passed!")
else:
    print("SOME CHECKS FAILED!")
