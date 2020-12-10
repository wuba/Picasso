(function (e, t) {
    function n() {
        var t = r.getBoundingClientRect().width,
            n = t / 7.5;
        r.style.fontSize = n + "px", d.rem = e.rem = n
    }
    var i, o = e.document,
        r = o.documentElement,
        a = 0,
        d = t.flexible || (t.flexible = {}),
        s = e.navigator.appVersion.match(/iphone/gi),
        m = e.devicePixelRatio;
    a = s ? m >= 3 && (!a || a >= 3) ? 3 : m >= 2 && (!a || a >= 2) ? 2 : 1 : 1, r.setAttribute("data-dpr", a), "complete" === o.readyState ? o.body.style.fontSize = "12px" : o.addEventListener("DOMContentLoaded", function () {
        o.body.style.fontSize = "12px"
    }, !1);
    var p = "onorientationchange" in window ? "orientationchange" : "resize";
    e.addEventListener(p, function () {
        clearTimeout(i), i = setTimeout(n, 300)
    }, !1), e.addEventListener("pageshow", function (e) {
        e.persisted && (clearTimeout(i), i = setTimeout(n, 300))
    }, !1), n(), d.dpr = e.dpr = a, d.refreshRem = n, d.rem2px = function (e) {
        var t = parseFloat(e) * this.rem;
        return "string" == typeof e && e.match(/rem$/) && (t += "px"), t
    }, d.px2rem = function (e) {
        var t = parseFloat(e) / this.rem;
        return "string" == typeof e && e.match(/px$/) && (t += "rem"), t
    }
})(window, window.lib || (window.lib = {}));
