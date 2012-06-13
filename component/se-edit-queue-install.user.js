// ==UserScript==
// @name           Suggested Edit Queue v2.0
// @namespace      mattlunn
// @version        2.0.0
// @description    Fixes many annoyances with the Suggested Edit queue on Stack Exchange sites
// @include        http://*stackoverflow.com/review/suggested-edits*
// @include        http://*serverfault.com/review/suggested-edits*
// @include        http://*superuser.com/review/suggested-edits*
// @include        http://*stackexchange.com/review/suggested-edits*
// @include        http://*askubuntu.com/review/suggested-edits*
// @include        http://*answers.onstartups.com/review/suggested-edits*
// @include        http://*mathoverflow.net/review/suggested-edits*
// @include        http://discuss.area51.stackexchange.com/review/suggested-edits*
// @include        http://stackapps.com/review/suggested-edits*
// ==/UserScript==

(function () {

  var script = document.createElement("script");
  
  script.type = "text/javascript";
  script.src= "https://github.com/downloads/mattlunn/se-edit-queue/latest.js";
  
  document.body.appendChild(script);
  
}());