// Sets the chosen color mode (light or dark) before the page is drawn, so it does not flash.
// The choice is made with the button in the top bar and kept in this browser only. Nothing is sent anywhere.
(function () {
  var set = function (t) { if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t); };
  try { set(localStorage.getItem("mau-theme")); } catch (e) {}
  // the playground preview is another page of this site: it follows a change made in the main page
  addEventListener("storage", function (e) { if (e.key === "mau-theme") set(e.newValue); });
})();
