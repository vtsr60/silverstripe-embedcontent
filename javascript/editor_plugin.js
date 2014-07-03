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
                    if(active && jQuery.trim(data) != '' && !jQuery(node).hasClass('embedcontent-empty-block')){
                        jQuery('#embedContentPreviewBlock').remove();
                        preview = jQuery("<div id='embedContentPreviewBlock' class='message good'><p>Loading...</p></div>");
                        if(preview.entwine('ss').loadPreview(jQuery.trim(data))){
                            jQuery(ed.container).parent().append(preview);
                        }
                    }
                    else {
                        jQuery('#embedContentPreviewBlock').remove();
                    }
                });
                ed.dom.loadCSS('embedcontent/css/tinymce_embedcontent.css');
            });

            ed.onSaveContent.add(function(ed, o) {
                o.content = o.content.replace(/ mceEmbedContent mceNonEditable/g, '');
                o.content = o.content.replace(/ mceEmbedContent/g, '');
            });

            ed.onBeforeSetContent.add(function(ed, o) {
                o.content = o.content.replace(/ mceEmbedContent mceNonEditable/g, '');
                o.content = o.content.replace(/ mceEmbedContent/g, '');
                o.content = o.content.replace(/embedcontent-block/g, 'embedcontent-block mceEmbedContent mceNonEditable');
                o.content = o.content.replace(/embedcontent-empty-block/g, 'embedcontent-empty-block mceEmbedContent');
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
