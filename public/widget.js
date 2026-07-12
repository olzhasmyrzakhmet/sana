/* SANA embed — честная одна строка: <script src="https://<домен>/widget.js" data-pack="auto"></script>
   Монтирует плавающую кнопку и iframe /embed поверх любой BI. */
(function () {
  if (window.__sanaWidgetMounted) return;
  window.__sanaWidgetMounted = true;

  var self = document.currentScript;
  if (!self) {
    var ss = document.getElementsByTagName("script");
    for (var i = 0; i < ss.length; i++) {
      if (ss[i].src && ss[i].src.indexOf("widget.js") > -1) { self = ss[i]; break; }
    }
  }
  var base = self && self.src ? new URL(self.src).origin : window.location.origin;
  var pack = (self && self.getAttribute("data-pack")) || "auto";

  var Z = 2147483000;

  var panel = document.createElement("div");
  panel.style.cssText =
    "position:fixed;bottom:88px;right:20px;width:390px;max-width:calc(100vw - 40px);height:600px;max-height:calc(100vh - 120px);" +
    "background:#fff;border:1px solid #e2e8e5;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.25);overflow:hidden;" +
    "display:none;z-index:" + Z + ";";
  var iframe = document.createElement("iframe");
  iframe.src = base + "/embed?pack=" + encodeURIComponent(pack);
  iframe.style.cssText = "width:100%;height:100%;border:0;";
  panel.appendChild(iframe);

  var btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Открыть SANA");
  btn.innerHTML = "✦ Спросить SANA";
  btn.style.cssText =
    "position:fixed;bottom:20px;right:20px;z-index:" + (Z + 1) + ";cursor:pointer;border:0;" +
    "background:#0b0f0e;color:#22d3ee;font:600 14px/1 ui-sans-serif,system-ui,sans-serif;" +
    "padding:14px 18px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,.35);";

  var open = false;
  btn.addEventListener("click", function () {
    open = !open;
    panel.style.display = open ? "block" : "none";
    btn.innerHTML = open ? "✕ Закрыть" : "✦ Спросить SANA";
  });

  function mount() {
    document.body.appendChild(panel);
    document.body.appendChild(btn);
  }
  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
