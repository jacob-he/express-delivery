
!function ($) {

    "use strict"; // jshint ;_;


    /* POPOVER PUBLIC CLASS DEFINITION
     * =============================== */

    var AjaxPopover = function (element, options) {
        this.init('ajaxpopover', element, options)
    }


    /* NOTE: POPOVER EXTENDS BOOTSTRAP-TOOLTIP.js
       ========================================== */

    AjaxPopover.prototype = $.extend({}, $.fn.popover.Constructor.prototype, {

        constructor: AjaxPopover

        , show: function () {
            var $tip
              , inside
              , pos
              , actualWidth
              , actualHeight
              , placement
              , tp
              , click
              , self

            if (this.hasContent() && this.enabled) {
                $tip = this.tip()
                this.setContent()

                if (this.options.animation) {
                    $tip.addClass('fade')
                }

                placement = typeof this.options.placement == 'function' ?
                  this.options.placement.call(this, $tip[0], this.$element[0]) :
                  this.options.placement

                inside = /in/.test(placement)

                $tip
                  .remove()
                  .css({ top: 0, left: 0, display: 'block' })
                  .appendTo(inside ? this.$element : document.body)

                pos = this.getPosition(false)

                actualWidth = $tip[0].offsetWidth
                actualHeight = $tip[0].offsetHeight

                switch (inside ? placement.split(' ')[1] : placement) {
                    case 'bottom':
                        tp = { top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2 }
                        break
                    case 'top':
                        tp = { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2 }
                        break
                    case 'left':
                        tp = { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth }
                        break
                    case 'right':
                        tp = { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width }
                        break
                }

                $tip
                  .css(tp)
                  .addClass(placement)
                  .addClass('in')

                self = this
                click = this.options.click

                if (typeof click == 'function') {
                    $tip.click(function (e) {
                        click.call(self, e)
                    })
                }
                // request data from sever then update popover content
                self.xhr = $.ajax({
                    url: self.options.url,
                    data: JSON.stringify(self.options.data || {}),
                    dataType: 'html'
                }).success(function(data){
                    $tip.find('.popover-content > *').html(data)
                }).done(function(){
                    self.xhr = null
                })
            }
        }
        , hide: function () {
            var that = this
            , $tip = this.tip()
            
            if(this.xhr) {
                this.xhr.abort();
                this.xhr = null
            }
            
            $tip.removeClass('in')

            function removeWithAnimation() {
                var timeout = setTimeout(function () {
                    $tip.off($.support.transition.end).remove()
                }, 500)

                $tip.one($.support.transition.end, function () {
                    clearTimeout(timeout)
                    $tip.remove()
                })
            }

            $.support.transition && this.$tip.hasClass('fade') ?
                removeWithAnimation() :
                $tip.remove()
        }

    })


    /* POPOVER PLUGIN DEFINITION
     * ======================= */

    $.fn.ajaxpopover = function (option) {
        return this.each(function () {
            var $this = $(this)
              , data = $this.data('ajaxpopover')
              , options = typeof option == 'object' && option
            if (!data) $this.data('ajaxpopover', (data = new AjaxPopover(this, options)))
            if (typeof option == 'string') data[option]()
        })
    }

    $.fn.ajaxpopover.Constructor = AjaxPopover

    $.fn.ajaxpopover.defaults = $.extend({}, $.fn.popover.defaults, {
        click: false
        , uuid: null
    })

}(window.jQuery);
