<?php

// Adding embedcontent button to HtmlEditorConfig
//Need noneditable plugin

HtmlEditorConfig::get('cms')->enablePlugins('noneditable');
HtmlEditorConfig::get('cms')->enablePlugins(array('embedcontent' => 'embedcontent/javascript/editor_plugin.js'));
HtmlEditorConfig::get('cms')->addButtonsToLine(1, 'embedcontent');

ShortcodeParser::get('default')->register('EmbedContent', array('EmbedContentController', 'get_embed_content'));
