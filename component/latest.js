(function () {
  "use strict";

  var debug = true;
  var prefs = (function () {
    var key = 'mattlunn-settings'; // Avoid a key conflict
    var latest = 5;

    try {
      prefs = JSON.parse(localStorage.getItem(key));
    } catch (e) {};

    // Check the settings are restored correctly.
    if (typeof prefs !== "object" || prefs === null) {
      prefs = {};
    }

    // Upgrade paths from previous versions.
    switch (prefs.version) {
      case undefined:
        prefs.ignoredList = [];
        prefs.pref = {
          reaction: 'fade'
        };
      case 2:
        prefs.pref.promote = true;
      case 3:
      case 4:
        prefs.pref.sideBySideTitle = true;
    }

    prefs.version = latest;
    prefs.save = function () {
      localStorage.setItem(key, JSON.stringify(this));
    };

    return prefs;
  }());

  function l(str) {
    debug && console.log(str);
  }

  /**
   * Show the correct UI when a edit has been handled (accepted, rejected or ignored).
   */
  function handleAction(edit, action) {
    var opt = prefs.pref.reaction;

    if (!edit.jquery) {
      edit = $(edit);
    }

    edit = edit.closest('.suggested-edit');

    if (opt === "prepend") {
      // First as we add our own hyperlink for title UI improvement
      var details = edit.find('a.question-hyperlink,a.answer-hyperlink').first();
      var href = details.prop('href');
      var title = details.clone().find('.diff-add').remove().end().text();
      var description = action + (action.slice(-1) === 'e' ? 'd' : 'ed');

      if (edit.is('.post-type-id-4,.post-type-id-5')) {
        title = edit.find('div.revision + a.post-tag').text() + ' ' + title;
      }

      edit.fadeOut('slow', function () {
          $('.suggested-edit:first').before([
            "<div class='answer-summary question-summary'><div class='summary'>",
            "<a href=\"" + href + "\" class=\"question-hyperlink\">" + title + "</a> ",
            "(<a href='" + edit.find('a.link').prop('href') + "'>" + description + "</a>)</div></div>"
          ].join('')).fadeIn("fast");

          $(this).remove();
      });
    } else {
      edit.fadeTo(500, 0.3);
    }
  }

  /**
   * Settings form
   */
  jQuery(document).ready(function ($) {
    // Used to ensure we don't add any duplicate field names to the page.
    var prefix = 'se-edit-2-';

    $('#questions').parent().append([
      '<form id="se-edit-2-settings" style="padding:5px; background: #eee; border: 1px solid #ccc; margin-top: 20px; clear:both;">',
          '<p><strong>Suggested Edit Queue 2.0 Extension Settings (Note page may need to be refreshed for changes to take affect)</strong></p>',
          '<p>',
            '<label>',
                'When an action is taken on an edit:',
                '<select name="se-edit-2-reaction" class="pref">',
                    '<option value="fade">Fade out</option>',
                    '<option value="prepend">Add to the top</option>',
                '</select>',
            '</label>',
          '</p>',
          '<p>',
            '<label>',
                'Move edits with pending votes to the top:',
                '<input type="checkbox" name="se-edit-2-promote" class="pref">',
            '</label>',
          '</p>',
          '<p>',
            '<label>',
                'Show title diff side by side:',
                '<input type="checkbox" name="se-edit-2-sideBySideTitle" class="pref">',
            '</label>',
          '</p>',
      '</form>'
    ].join(''));

    // When a pref is updated, update the preferences object.
    var theForm = $('#se-edit-2-settings').on('change', '.pref', function () {
      prefs.pref[this.name.slice(prefix.length)] = (this.type === 'checkbox' ? this.checked : this.value);
      prefs.save();
    });

    // Show the correct options in the form on page load.
    Object.keys(prefs.pref).forEach(function (key) {
      var val = this[key];
      var el = theForm.find('.pref[name="' + prefix + key + '"]');

      if (el.prop('type') === 'checkbox') {
        el.prop('checked', val);
      } else {
        el.val(val);
      }
    }, prefs.pref);
  });

  /**
   * Remove suggested edits from the queue on startup
   */
  jQuery(document).ready(function ($) {
    var ids = prefs.ignoredList;

    var reviewed = $('div.suggested-edit').filter(function () {
      return !$(this).find('.approve-edit').length;
    }).hide();

    var hidden = $('div.post-id').filter(function () {
      return ids.indexOf(this.textContent) >= 0;
    }).closest('.suggested-edit').hide();

    l('Hidden ' + reviewed.length + ' edits that have been reviewed already and ' + hidden.length + ' that have been ignored.');
  });

  /**
   * Ignore Button
   */
  jQuery(document).ready(function ($) {
    $('input.approve-edit').before('<input type="button" class="ignore-edit" value="Ignore" style="margin-right:8px;"/>');

    $(document).on('click', 'input.ignore-edit', function () {
      var edit = $(this).closest('.suggested-edit');

      handleAction(edit, 'ignore');

      prefs.ignoredList.push(edit.prop('id').slice('suggested-edit-'.length));
      prefs.save();
    });
  });
  
  /**
   * Move Edits with votes to the top
   */
  jQuery(document).ready(function ($) {
    if (prefs.pref.promote) {
      var moved = $('.actions input[value$=")"]').closest('.suggested-edit').detach().prependTo('#questions');

      l('Moved ' + moved.length + ' suggestions with pending votes to the top of the queue.');
    } else l('Not moving suggestions to the top, as pref disabled.');
  });

  /**
   * Consistent review effect
   */
  jQuery(document).ready(function ($) {
    // Listen for AJAX requests, check whether it's one to review a suggested edit. If it is, add a data
    // filter to mangle the response to always show the response for "1 more vote" etc... so that the edit
    // isn't removed.
    $(document).ajaxSend(function (e, xhr, opts) {
      var matches = opts.url.match(/\/suggested-edit\/(\d+)\/vote\//);

      // If it's a suggested edit AJAX request....
      if (matches !== null) {
        opts.dataFilter = function (data, type) {
          var id = matches[1];

          try {
            var obj = JSON.parse(data);
            var wasApproved = /( approval |>approved<)/.test(obj.Message || obj.MiniHtml);
            var wasRejected = /( reject |>rejected<)/.test(obj.Message || obj.MiniHtml);

            xhr.done(function () {
              // Very specific over approval/ reject as AJAX messages such as out-of-votes, or already-approved (and
              // who knows what else) can be received.
              if (wasApproved || wasRejected) {
                handleAction($('#suggested-edit-' + id), wasApproved ? 'approve' : 'reject');
              }
            });

            if (obj.Success && obj.MiniHtml && (wasApproved || wasRejected)) {
              obj.Success = false;
              obj.Message = 'This suggestion has been ' + (wasApproved ? 'approved' : 'rejected');

              return JSON.stringify(obj);
            }
          } catch (e) {};

          // Return the data unchanged
          return data;
        }
      }
    });
  });

  /**
   * Purge old ignores
   */
  jQuery(document).ready(function ($) {
    // If there are enough suggested edits to fit on one page, we can safety removes suggested-edits from the ignored list
    // which are no longer pending.
    if ($('.bottom-notice').length || $('a.page-numbers').length) {
      return;
    }

    l('Purging the queue');

    prefs.ignoredList = prefs.ignoredList.filter(function (val, i) {
      return $('#suggested-edit-' + val).length;
    });

    prefs.save();
  });

  /**
   * http://meta.stackoverflow.com/questions/112724/please-keep-title-edits-display-consistent-with-content-edits
   */
  jQuery(document).ready(function ($) {
    if (prefs.pref.sideBySideTitle) {
      $('a.question-hyperlink,a.answer-hyperlink').each(function () {
        var self = $(this);
        var additions = self.children('.diff-add');
        var deletions = self.children('.diff-delete');

        if (additions.length && deletions.length) {
          var other = self.clone();
          
          // Only hide, as the "Consistent review effect" implementation uses the title when "move-to-top" is enabled.
          // If we removed the additions, we'd get dodgy titles.
          additions.hide();
          other.find('.diff-delete').hide();

          var diff = $([
            '<div class="body-diffs">',
              '<table class="full-html-diff">',
                '<tbody>',
                  '<tr>',
                    '<td class="post-text"></td>',
                    '<td class="gutter"></td>',
                    '<td class="post-text"></td>',
                  '</tr>',
                '</tbody>',
              '</table>',
            '</div>'
          ].join('')).insertBefore(self);

          diff.find('.post-text').first().append(self).end().last().append(other);
        }
      });
    }
  });

}());