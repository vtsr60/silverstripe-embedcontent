(function() {
	var each = tinymce.each;

	tinymce.create('tinymce.plugins.embedcontent', {
		getInfo : function() {
			return {
				longname : 'Shortcodable - Embed content UI plugin for SilverStripe',
				author : 'Vivakaran, Raj',
				version : "1.0"
			};
		},

		init : function(ed, url) {
            ed.onInit.add(function() {
                ed.formatter.register('embedContentFormat', {inline: 'div', classes : ['mceEmbedContent'] } );
                ed.formatter.register('inlineEmbedContentFormat', {inline: 'span', classes : ['mceEmbedContent'] } );
                ed.onNodeChange.add(function(ed, cm, node) {
                    active = jQuery(node).hasClass('mceEmbedContent');
                    control = ed.controlManager.get('embedcontent').setActive(active);
                    data = ed.selection.getContent({format : 'text'});
                });
                ed.dom.loadCSS('embedcontent/css/tinymce_embedcontent.css');
            });

            ed.onSaveContent.add(function(ed, o) {
                var content = jQuery('<div>'+o.content+'</div>');
                content.find('.mceNonEditable').removeClass('mceNonEditable');
                content.find('.mceEmbedContent').removeClass('mceEmbedContent');
                content.find('.embedcontent-block').each(function(){
                    jQuery(this).html(jQuery(this).attr('data-embed-info'));
                });
                o.content = content.html();
            });

            ed.onBeforeSetContent.add(function(ed, o) {
                var content = jQuery('<div>'+o.content+'</div>');
                content.find('.mceNonEditable').removeClass('mceNonEditable');
                content.find('.mceEmbedContent').removeClass('mceEmbedContent');
                content.find('.embedcontent-block').addClass('mceEmbedContent');
                content.find('.embedcontent-block').addClass('mceNonEditable');
                content.find('.embedcontent-empty-block').addClass('mceEmbedContent');
                content.find('.embedcontent-block').html('<p>Loading ...</p>')
                content.find('.embedcontent-block').each(function(){
                    var previewURL = 'EmbedContentController/PreviewEmbedContent/forTemplate';
                    var data = jQuery(this).attr('data-embed-info');
                    var currentelement = jQuery(this);
                    if(jQuery.trim(data) != ''){
                        var getdata = {};
                        data = data.replace('[EmbedContent,', '');
                        data = data.replace('"]', '');
                        data = data.replace(/="/g, '=');
                        data = data.replace(/",/g, ',');
                        previewURL += '?'+data.split(',').join('&');
                        jQuery.ajax({
                            url: previewURL,
                            async: false,
                            success: function (data) {
                                currentelement.html(data);
                            }
                        });
                    }
                });
                o.content = content.html();

            });

			ed.addButton('embedcontent', {title : 'Insert Content', cmd : 'embedcontent', 'class' : 'mce_embedcontent'});

			ed.addCommand('embedcontent', function(ui, v) {
                data = ed.selection.getContent({format : 'text'});
				jQuery('#' + this.id).entwine('ss').openEmbedContentDialog(data, ed.selection.getNode());
			});

		}
	});

	// Adds the plugin class to the list of available TinyMCE plugins
	tinymce.PluginManager.add("embedcontent", tinymce.plugins.embedcontent);
})();
