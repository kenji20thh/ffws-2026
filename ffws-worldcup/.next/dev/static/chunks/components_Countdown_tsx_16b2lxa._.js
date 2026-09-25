(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/components/Countdown.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Countdown
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function Countdown({ target }) {
    _s();
    const [ms, setMs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Countdown.useEffect": ()=>{
            const t = new Date(target).getTime();
            const tick = {
                "Countdown.useEffect.tick": ()=>setMs(Math.max(0, t - Date.now()))
            }["Countdown.useEffect.tick"];
            tick();
            const id = setInterval(tick, 1000);
            return ({
                "Countdown.useEffect": ()=>clearInterval(id)
            })["Countdown.useEffect"];
        }
    }["Countdown.useEffect"], [
        target
    ]);
    const v = ms ?? 0;
    const parts = [
        [
            "Days",
            Math.floor(v / 864e5)
        ],
        [
            "Hours",
            Math.floor(v / 36e5) % 24
        ],
        [
            "Minutes",
            Math.floor(v / 6e4) % 60
        ],
        [
            "Seconds",
            Math.floor(v / 1e3) % 60
        ]
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid grid-cols-4 gap-2 sm:gap-3",
        role: "timer",
        "aria-label": "Countdown to tournament start",
        children: parts.map(([l, n])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border border-line bg-panel px-2 py-3 text-center sm:px-6 sm:py-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "font-display text-3xl tabular-nums sm:text-5xl",
                        children: ms === null ? "--" : String(n).padStart(2, "0")
                    }, void 0, false, {
                        fileName: "[project]/components/Countdown.tsx",
                        lineNumber: 9,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[10px] uppercase tracking-wider text-muted sm:text-xs",
                        children: l
                    }, void 0, false, {
                        fileName: "[project]/components/Countdown.tsx",
                        lineNumber: 9,
                        columnNumber: 122
                    }, this)
                ]
            }, l, true, {
                fileName: "[project]/components/Countdown.tsx",
                lineNumber: 8,
                columnNumber: 29
            }, this))
    }, void 0, false, {
        fileName: "[project]/components/Countdown.tsx",
        lineNumber: 7,
        columnNumber: 11
    }, this);
}
_s(Countdown, "5fMTqj8jei+vDNXDztxvmGmcALY=");
_c = Countdown;
var _c;
__turbopack_context__.k.register(_c, "Countdown");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=components_Countdown_tsx_16b2lxa._.js.map