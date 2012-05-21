(function () {
  "use strict";
  
  var debug = true;
  var prefs = (function () {
    var key = 'mattlunn-settings'; // Avoid a key conflict
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
    }).closest('.suggested-edit').hide();
    
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
    // A match for "'.suggested-edit:first", so the approval/ rejects that usually get thrown in at the top
    // get hidden inside this container instead
    $('body').prepend('<div style="display: none;"><div class="suggested-edit" /></div>');
    
    // Below is the only working hack I could find that made it seem final reject/ approve votes didn't hide
    // the suggested edit. It works by cloning the suggested edit and positioning it behind the visible/ original
    // edit. When the edit is approved and is removed, its actually the cloned edit you see. 
    $('.suggested-edit:visible').each(function () {
      var self = $(this);
      var clone = self.clone();
      var wrapper = $('<div class="wrapper" />');
      
      wrapper.insertBefore(self);
      wrapper.css({
        height: self.outerHeight() + 50,
        position: 'relative'
      });
      
      clone.removeProp('id');
      clone.find('*').removeProp('id');
      clone.css({
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: -2
      });
      
      wrapper.append(self, clone);
    });
    
    $(document).on('mousedown', '.actions input', function () {
      $(this).closest('.wrapper').fadeTo(500, 0.3);
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