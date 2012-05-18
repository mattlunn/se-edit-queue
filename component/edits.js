(function () {
  "use strict";
  
  var debug = true;
  var prefs = (function () {
    var key = 'settings';
    var prefs = JSON.parse(localStorage.getItem(key)) || {
      ignoredAction: 0,
      reviewedAction: 0,
      ignoredList: []
    };
    
    prefs.save = function () {
      localStorage.setItem(key, JSON.stringify(this));
    };
    
    return prefs;
  }());
  
  function l(str) {
    debug && console.log(str);
  }
  
  /**
   * Save preferences and ignored between page loads
   */
  $(window).on('beforeunload', function () {
    prefs.save();
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
    }).hide();
    
    l('Hidden ' + reviewed.length + ' edits that have been reviewed already and ' + hidden.length + ' that have been ignored.');
  });
  
  /**
   * Ignore Button
   */
  jQuery(document).ready(function ($) {
  
    $('input.approve-edit').before('<input type="button" class="ignore-edit" value="Ignore" style="margin-right:8px;"/>');
    
    $(document).on('click', 'input.ignore-edit', function () {
      var id = $(this).closest('.suggested-edit').find('.post-id').text();
      
      prefs.ignoredList.push(id);
    });
  });
  
  /**
   * Move Edits with votes to the top
   */
  jQuery(document).ready(function ($) {
    var moved = $('.actions input[value$=")"]').closest('.suggested-edit').detach().prependTo('#questions');
    
    l('Moved ' + moved.length + ' suggestions with pending votes to the top of the queue.');
  });  
  
  /**
   * Voting annoyances
   */
  jQuery(document).ready(function ($) {
    $(document).on('mousedown', '.actions input', function () {
      $(this).closest('.suggested-edit').fadeTo(500, 0.3);
    });
    
    $('.suggested-edit').each(function () {
      var wrapper = $('<div class="wrapper"/>');
      var self = $(this);
      
      wrapper.css('minHeight', self.outerHeight());
      
      self.wrap(wrapper);
    });
  });
  
  /**
   * Purge old ignores
   */
  jQuery(document).ready(function ($) {
    // If there are enough suggested edits to fit on one page, we can safety removes suggested-edits from the ignored list
    // which are no longer pending.
    if ($('.bottom-notice').length) {
      return;
    }
    
    l('Purging the queue');
    
    prefs.ignoredList = prefs.ignoredList.filter(function (val, i) {
      return $('#suggested-edit-' + val).length;
    });
  });

}());