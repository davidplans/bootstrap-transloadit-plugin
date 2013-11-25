!function ($) {

  function makeHttps(url) {
    return url.replace(/^http:\/\//i, 'https://');
  }

  var TransloaditUploader = function (element, options) {
    var self = this;

    self.options = options || {};
    self.$element = $(element);
    self.init();
    self.maybePreview();
  };

  TransloaditUploader.prototype = {

    init: function () {
      var self = this;

      var $el = self.$element;

      // Prepare parameters based on data attributes or passed in options
      var resultsMapping = $el.attr('data-transloadit-results') && JSON.parse($el.attr('data-transloadit-results')) || self.options.resultsMapping;
      var maxSize = $el.attr('data-transloadit-maxsize') || self.options.maxSize;
      var key = $el.attr('data-transloadit-key') || self.options.key;
      var template = $el.attr('data-transloadit-template') || self.options.template;
      var artistName = $el.attr('data-transloadit-artistName') || self.options.artistName;

      if (!key || ! template && window.console && window.console.warn) {
        console.warn('Must specify key or template for upload to work.');
      }

      var transloaditParams = {
        max_size: maxSize,
        auth: {key: key},
        template_id: template
      };

      $el.transloadit({
        params: transloaditParams,
        wait: true,
        modal: false,
        processZeroFiles: false,
        triggerUploadOnFileSelection: false,
        autoSubmit: false,

        onPick: function (assembly) {
          $el.find('.uploader-controls .help-inline.error').remove();
          $el.find('.uploader-button').html('uploading...');
          $el.find('.uploader-progress').show();
          $el.find('.uploader-progress .bar').css('width', '0%');
        },
        onStart: function (assembly) {},
        onProgress: function (bytesReceived, bytesExpected) {
          var progress = (bytesReceived / bytesExpected * 100).toFixed(2);
          progress = Math.min(95, progress);
          if (!isNaN(progress)) {
            $el.find('.uploader-progress .bar').css('width', progress + '%');
          }
        },
        onError: function (error) {
          var $errorsDom = $('<span class="help-inline error"></span>').append(error);
          $el.find('.uploader-side').append($errorsDom);
          $el.find('input[name="uploader_file_input"]').val('');
        },
        onSuccess: function (assembly) {
          console.log(assembly);
          $el.find('.uploader-button').html('done');
          $el.find('.uploader-side .uploader-button').toggleClass("btn-success");
          $el.find('.uploader-progress').fadeOut();
          $el.find('.col-md-10').html('Thank you!');
          setTimeout(function(){window.location.replace("http://www.biobeats.com/artist/thankyou.html")},3000);

          function getResultForStep(stepId) {
            var result = assembly.results[stepId][0];
            result.value = makeHttps(result.url);
            if (result.type == 'audio') {
              result.audio = makeHttps(result.url);
            }
            return result;
          }

          var numResults = 0;
          var mainStepId;
          $.each(assembly.results, function (stepId, stepData) {
            numResults++;
            mainStepId = stepId;
          });
          if (assembly.results[':original'] && numResults > 1) {
            mainStepId = ':original';
          }
          var mainResult = getResultForStep(mainStepId);
          $el.find('.uploader-input-url').val(mainResult.value).trigger('change');

          $.each(resultsMapping, function (fieldName, stepId) {

            $el.closest('form').find('input[name="' + fieldName + '"]').val(getResultForStep(stepId).value).trigger('change');
          });
          self.updatePreview();

          $el.find('input[name="uploader_file_input"]').val('');
        }
      });
    },

    updatePreview: function () {
      var $previewEl = this.$element.find('.uploader-preview');
      var urlVal = this.$element.find('.uploader-input-url').val();
      if (!urlVal) return;

      if ($previewEl.find('img').length > 0) {
        var $image = $previewEl.find('img');
        $image.attr('src', urlVal).show();
      } else if ($previewEl.find('a')) {
        $previewEl.find('a').attr('href', urlVal).text(urlVal.replace(/^.*[\\\/]/, ''));
      }
      $previewEl.css(this.options.previewStyles);
      $previewEl.show();
    },

    maybePreview: function () {
      if (this.$element.find('.uploader-input-url').val()) {
        this.updatePreview();
      } else {
        this.$element.find('.uploader-preview').hide();
      }
    }
  };


  $.fn.transloaditUploader = function (options) {
    return this.each(function () {
      var $this = $(this);
      options = $.extend({}, $.fn.transloaditUploader.defaults, typeof options == 'object' && options);
      var data = $this.data('transloadit.uploader');
      if (!data) $this.data('transloadit.uploader', (data = new TransloaditUploader(this, options)));
    });
  };

  $.fn.transloaditUploader.defaults = {
    maxSize: 10048576,
    resultsMapping: {},
    previewStyles: {}
  };

  $.fn.transloaditUploader.Constructor = TransloaditUploader;

}(window.jQuery);