(function () {
  var scripts = document.querySelectorAll("script[data-form]");
  scripts.forEach(function (script) {
    var slug = script.getAttribute("data-form");
    if (!slug) return;

    var container = script.previousElementSibling;
    if (!container || container.id !== "gudform-" + slug) return;

    var iframe = document.createElement("iframe");
    iframe.src = script.src.replace("/embed.js", "/f/" + slug);
    iframe.style.width = "100%";
    iframe.style.height = "600px";
    iframe.style.border = "none";
    iframe.style.borderRadius = "8px";
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowfullscreen", "true");

    container.appendChild(iframe);
  });
})();
