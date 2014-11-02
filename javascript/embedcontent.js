(function($) {
	$.entwine('ss', function($) {
        var currentSelectedNode = [];
		// add embedcode controller url to cms-editor-dialogs
		$('#cms-editor-dialogs').entwine({
			onmatch: function(){
                this.attr('data-baseurl-embedcontentform', 'EmbedContentController/EmbedContentForm/forTemplate');
				this.attr('data-url-embedcontentform', 'EmbedContentController/EmbedContentForm/forTemplate');
                this.attr('data-loadedurl-embedcontentform', '');
			}
		});

        function parseStyleAttribute(element){
            if(element.attr('style') != 'undefined' &&
                $.trim(element.attr('style')) != ''){
                var stylestemp = element.attr('style').split(';');
                var styles = {};
                var c = '';
                for (var x = 0, l = stylestemp.length; x < l; x++) {
                    c = stylestemp[x].split(':');
                    if($.inArray($.trim(c[0]), ['width', 'height']) != -1){
                        styles[$.trim(c[0])] = {'value': $.trim(c[1]).replace(/[^0-9]+/ig, ''),
                                                'unit': $.trim(c[1]).replace(/[0-9]+/ig, '')};
                    }
                    else {
                        styles[$.trim(c[0])] = $.trim(c[1]);
                    }
                }
                return styles;
            }
            return false;
        }
		// open shortcode dialog
		$('textarea.htmleditor').entwine({
            openEmbedContentDialog: function(data, node) {
                if($(node).hasClass('mceEmbedContent')){
                    currentBlock = $(node);
                }
                else {
                    currentBlock = $(node).parents('.mceEmbedContent');
                }
                data = $.trim(currentBlock.attr('data-embed-info'));
                currentSelectedNode = currentBlock;
                if(currentBlock.hasClass('embedcontent-block') && data != ''
                    && data.substr(0, '[EmbedContent,'.length) == '[EmbedContent,'){
                    data = data.replace('[EmbedContent,', '');
                    data = data.replace('"]', '');
                    data = data.replace(/="/g, '=');
                    data = data.replace(/",/g, ',');
                    $('#cms-editor-dialogs').attr('data-url-embedcontentform', $('#cms-editor-dialogs').attr('data-baseurl-embedcontentform')+'?'+ $.trim(data).split(',').join('&')+'&updateAction=true');
                }
                else if(currentBlock.hasClass('embedcontent-empty-block') &&
                    $(node).hasClass('embedcontent-empty-block')){
                    contianerdata = ['EmbedContentType=Container'];

                    styles = parseStyleAttribute(currentBlock);
                    if(styles){
                        if(styles.width != undefined && styles.width.value != undefined
                            && $.trim(styles.width.value) != ''){
                            contianerdata[contianerdata.length] = 'EmbedWidth='+styles.width.value;
                            contianerdata[contianerdata.length] = 'EmbedWidthUnit='+styles.width.unit;
                        }
                        if(styles.height != undefined && styles.height.value != undefined
                            && $.trim(styles.height.value) != ''){
                            contianerdata[contianerdata.length] = 'EmbedHeight='+styles.height.value;
                            contianerdata[contianerdata.length] = 'EmbedHeightUnit='+styles.height.unit;
                        }
                        if(styles.float != undefined && styles.float != undefined){
                            contianerdata[contianerdata.length] = 'EmbedFloat='+styles.float;
                        }
                    }
                    classesParser = /embedcontent-class-start (.*) embedcontent-class-end/m.exec($(node).attr('class'));
                    if(classesParser && classesParser.length > 1 && $.trim(classesParser[1] != '')){
                        contianerdata[contianerdata.length] = 'EmbedCSSClass='+classesParser[1];
                    }
                    $('#cms-editor-dialogs').attr('data-url-embedcontentform', $('#cms-editor-dialogs').attr('data-baseurl-embedcontentform')+'?'+contianerdata.join('&')+'&updateAction=true');
                }
                else {
                    currentSelectedNode = [];
                    $('#cms-editor-dialogs').attr('data-url-embedcontentform', $('#cms-editor-dialogs').attr('data-baseurl-embedcontentform'));
                }
                if($('form.htmleditorfield-embedcontent').length > 0){
                    $('form.htmleditorfield-embedcontent').refreshform();
                }
				this.openDialog('embedcontent');
            }
		});

        // handle change on shortcode-type field
        $('select.reloadFormOnSelect').entwine({
            onchange: function(){
                this.parents('form:first').reloadForm();
            }
        });

        $('a.ui-dialog-titlebar-close').entwine({
            onclick: function(){
                if(currentSelectedNode.length > 0){
                    //Hack to remove the bogus P tags added around the empty block
                    if(currentSelectedNode.prev().children('br[data-mce-bogus]').length > 0 &&
                        currentSelectedNode.prev().children('br[data-mce-bogus]').length == currentSelectedNode.prev().children().length){
                        currentSelectedNode.prev().remove();
                    }
                    if(currentSelectedNode.next().children('br[data-mce-bogus]').length > 0 &&
                        currentSelectedNode.next().children('br[data-mce-bogus]').length  == currentSelectedNode.next().children().length){
                        currentSelectedNode.next().remove();
                    }
                    currentSelectedNode = [];
                }
            }
        });

        $('form.htmleditorfield-form.htmleditorfield-embedcontent').entwine({
            refreshform: function() {
                if($('#cms-editor-dialogs').attr('data-url-embedcontentform') != $('#cms-editor-dialogs').attr('data-loadedurl-embedcontentform')){
                    $('#cms-editor-dialogs').attr('data-loadedurl-embedcontentform', $('#cms-editor-dialogs').attr('data-url-embedcontentform'));
                    $('form.htmleditorfield-embedcontent').addClass('loading');
                    $.get($('#cms-editor-dialogs').attr('data-url-embedcontentform')).done(function(data){
                        var form = $('form.htmleditorfield-embedcontent');
                        form.find('fieldset').replaceWith($(data).find('fieldset')).show();
                        form.removeClass('loading');
                    });
                }
            },
            reloadForm: function() {
                var getdata = [];
                $(this).serializeArray().map(function(x){getdata[getdata.length] = x.name+'='+x.value;});
                $('#cms-editor-dialogs').attr('data-url-embedcontentform', $('#cms-editor-dialogs').attr('data-baseurl-embedcontentform')+'?'+getdata.join('&'));
                this.refreshform();
                return this;
            },
            onsubmit: function(e) {
                this.embedContent();
                this.getDialog().close();
                return false;
            },
            // insert shortcode into editor
            embedContent: function() {
                this.modifySelection(function(ed){
                    var data = {};
                    var strdata = '';
                    var currentBlock = currentSelectedNode;
                    $(this).serializeArray().map(function(x){data[x.name] = x.value;});
                    if(data.EmbedContentType != undefined){
                        $(this).serializeArray().map(function(x){strdata += ','+x.name+'="'+x.value+'"';});
                        isInline = (/::inline$/.test(data.EmbedTemplate));
                        if(currentBlock.length > 0){
                            updateelement = $(this.generateContentBlock(strdata, isInline, data));
                            if(data.EmbedContentType != 'Container'){
                                if(currentBlock.attr('data-embed-info') != updateelement.attr('data-embed-info')) {
                                    currentBlock.attr('data-embed-info', updateelement.attr('data-embed-info'));
                                    currentBlock.attr('data-embed-key', updateelement.attr('data-embed-key'));
                                    currentBlock.html(updateelement.html());
                                    this.loadPreview(updateelement.attr('data-embed-info'), function (data) {
                                        currentBlock.html(data);
                                    });
                                }
                            }
                            else{
                                //Hack to remove the bogus P tags added around the empty block
                                if(currentBlock.prev().children('br[data-mce-bogus]').length == currentBlock.prev().children().length){
                                    currentBlock.prev().remove();
                                }
                                if(currentBlock.next().children('br[data-mce-bogus]').length  == currentBlock.next().children().length){
                                    currentBlock.next().remove();
                                }
                            }
                            if(updateelement.attr('style') != undefined
                                && $.trim(updateelement.attr('style')) != ''){
                                currentBlock.attr("style", updateelement.attr('style'));
                                currentBlock.attr("data-mce-style", updateelement.attr('style'));
                            }
                            else{
                                currentBlock.removeAttr("style");
                                currentBlock.removeAttr("data-mce-style");
                            }
                            currentBlock.attr('class', updateelement.attr('class'));
                            return false;
                        }
                        else{
                            var htmlContent = this.generateContentBlock(strdata, isInline, data);
                            //console.log(htmlContent);
                            var embedContentStr = '[EmbedContent'+strdata+']';
                            if(isInline){
                                htmlContent += " ";
                            }
                            else {
                                htmlContent += "<br />";
                            }
                            //ed.replaceContent(htmlContent);
                            if(data.EmbedContentType != 'Container') {
                                this.loadPreview(embedContentStr, function (data) {
                                    var embedcontent = $('<div>' + htmlContent + '</div>');
                                    embedcontent.find('.embedcontent-block').html(data);
                                    //console.log(embedcontent.html());
                                    ed.replaceContent(embedcontent.html());
                                });
                            }
                            else {
                                ed.replaceContent(htmlContent);
                            }
                        }
                    }
                    currentSelectedNode = [];
                });
            },
            generateContentBlock: function(strdata, isinline, data) {
                tagname = 'div';
                if(isinline){
                    tagname = 'span';
                }
                blockclass = 'embedcontent-block mceEmbedContent mceNonEditable';
                if(data.EmbedContentType == 'Container'){
                    blockclass = 'embedcontent-empty-block mceEmbedContent';
                }
                if($.trim(data.EmbedCSSClass) != ''){
                    blockclass += ' embedcontent-class-start '+data.EmbedCSSClass+' embedcontent-class-end';
                }

                element = $('<'+tagname+' class="'+blockclass+'" />');
                if(data.EmbedContentType == 'Container'){
                    element.append('<p>&nbsp;</p>');
                }
                else {
                    element.append('<p>Loading ....</p>');
                    element.attr('data-embed-info','[EmbedContent'+strdata+']');
                    element.attr('data-embed-key',this.generateKey('[EmbedContent'+strdata+']'));
                }
                if($.trim(data.EmbedWidth) != ''){
                    element.css('width', data.EmbedWidth+data.EmbedWidthUnit);
                }

                if($.trim(data.EmbedHeight) != ''){
                    element.css('height', data.EmbedHeight+data.EmbedHeightUnit);
                }

                if($.trim(data.EmbedFloat) != ''){
                    element.css('float', data.EmbedFloat);
                }

                return $('<div/>').append(element).html();
            },
            generateKey: function(data){
                data = data.replace('[EmbedContent,', '');
                data = data.replace(/[^a-z0-9]/gmi, '');
                return data;
            },
            loadPreview: function(data, callback){
                var previewURL = 'EmbedContentController/PreviewEmbedContent/forTemplate';
                if($.trim(data) != ''){
                    var getdata = {};
                    data = data.replace('[EmbedContent,', '');
                    data = data.replace('"]', '');
                    data = data.replace(/="/g, '=');
                    data = data.replace(/",/g, ',');
                    previewURL += '?'+data.split(',').join('&');
                    $.ajax({
                        url: previewURL,
                        async: false,
                        success: function (data) {
                            console.log(data);
                            callback(data);
                        }
                    });
                }
            }
        });


	});
})(jQuery);