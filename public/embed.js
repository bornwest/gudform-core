(function () {
  var scripts = document.querySelectorAll("script[data-form]");
  scripts.forEach(function (script) {
    var slug = script.getAttribute("data-form");
    if (!slug) return;

    var container = script.previousElementSibling;
    if (!container || container.id !== "gudform-" + slug) return;

    var iframe = document.createElement("iframe");
    iframe.src = script.src.replace("/embed.js", "/f/" + slug) + "?embed=1";
    iframe.style.width = "100%";
    iframe.style.maxWidth = "100%";
    iframe.style.height = "600px";
    iframe.style.border = "none";
    iframe.style.borderRadius = "8px";
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute("scrolling", "no");
    iframe.title = "GudForm";

    window.addEventListener("message", function (event) {
      var data = event.data;
      if (!data || data.type !== "gudform:resize") return;
      if (typeof data.height !== "number" || data.height <= 0) return;
      iframe.style.height = Math.max(320, Math.round(data.height)) + "px";
    });

    container.appendChild(iframe);
  });
})();
