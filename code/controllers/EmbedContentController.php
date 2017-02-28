<?php
/**
 * EmbedContentController
 *
 * @package EmbedContent
 * @author Vivakaran, Raj
 **/
class EmbedContentController extends Controller
{
    private static $allowed_actions = array(
        'EmbedContentForm',
        'PreviewEmbedContent'
    );

    private static $embedTemplates = array();
    private static $embedTemplatesInlines = array();
    private static $cssClasses = array(' ' => 'None');

    /**
     * Provides a GUI for the insert embed content popup
     * @return Form
     **/
    public function EmbedContentForm()
    {
        if (!Permission::check('CMS_ACCESS_CMSMain')) {
            return;
        }
        $contenttype = $this->request->requestVar('EmbedContentType');
        $allContentTypes = array('Container' => 'Empty Block',
                                    'Page' => 'Pages in the Site Tree',
                                    'DataObject' => 'Other Data Object in the site',
                                    'External' => 'External site content');
        $headerField = CompositeField::create(
            LiteralField::create(
                'Heading',
                sprintf('<h3 class="htmleditorfield-embedcontentform-heading insert">%s</h3>', "Insert Content")
            )
        )->addExtraClass('CompositeField composite cms-content-header nolabel');
        $fields = array(
            DropdownField::create('EmbedContentType', 'Embed Content Type', $allContentTypes, $contenttype)
                ->setHasEmptyDefault(true)
                ->addExtraClass('reloadFormOnSelect')
        );
        if ($contenttype) {
            if ($contenttype == 'External') {
                $fields[] = TextField::create('ExternalURL', 'External URL', $this->request->requestVar('ExternalURL'));
            } elseif ($contenttype == 'DataObject' || $contenttype == 'Page') {
                $allDataObjectClasses = ClassInfo::subclassesFor($contenttype);
                $dataobjecttype = $this->request->requestVar('EmbedContentDataObjectType');
                $fields[] = DropdownField::create('EmbedContentDataObjectType', 'Data Object Type', $allDataObjectClasses, $dataobjecttype)
                                ->setHasEmptyDefault(true)
                                ->addExtraClass('reloadFormOnSelect');
                if ($dataobjecttype) {
                    $fields[] = DropdownField::create('EmbedContentDataObjectID', 'Please choose an object', Dataobject::get($dataobjecttype)->map("ID", "Title"), $this->request->requestVar('EmbedContentDataObjectID'))
                                ->setHasEmptyDefault(true);
                }
            }

            if ($contenttype != 'Container') {
                $fields[] = DropdownField::create('EmbedTemplate', 'Please choose an View', self::getTemplates($contenttype), $this->request->requestVar('EmbedTemplate'))
                    ->setHasEmptyDefault(false);
            }

            if (!self::isInlineTemplate($contenttype, $this->request->requestVar('EmbedTemplate')) || $contenttype == 'Container') {
                $widthField = new FieldGroup(
                    TextField::create('EmbedWidth', 'Value', $this->request->requestVar('EmbedWidth')),
                    DropdownField::create('EmbedWidthUnit',
                                            'Unit',
                                            array('px' => 'Pixel',
                                                    'em' => 'Font Size',
                                                    '%' => 'Percent'),
                                            $this->request->requestVar('EmbedWidthUnit'))
                );
                $widthField->setTitle("Width");
                $fields[] = $widthField;
                $heightField = new FieldGroup(
                    TextField::create('EmbedHeight', 'Value', $this->request->requestVar('EmbedHeight'))->addExtraClass('clear'),
                    DropdownField::create('EmbedHeightUnit',
                                            'Unit',
                                            array('px' => 'Pixel',
                                                    'em' => 'Font Size',
                                                    '%' => 'Percent'),
                                            $this->request->requestVar('EmbedHeightUnit'))
                );
                $heightField->setTitle("Height");
                $fields[] = $heightField;
                $fields[] = DropdownField::create('EmbedFloat',
                                                    'Align(Float)',
                                                    array(' ' => 'None',
                                                            'left' => 'Left',
                                                            'right' => 'Right'),
                                                    $this->request->requestVar('EmbedFloat'));
            }
            if (self::hasCSSClasses()) {
                $fields[] = DropdownField::create('EmbedCSSClass',
                                                    'CSS Class',
                                                    self::getCSSClasses(),
                                                    $this->request->requestVar('EmbedCSSClass'));
            }
        }

        // essential fields
        $fields = FieldList::create(array(
            $headerField,
            CompositeField::create($fields)->addExtraClass('ss-embedcontent-fields')
        ));

        $ActionName = "Insert/Update Content";

        // actions
        $actions = FieldList::create(array(
            FormAction::create('insert', _t('Embedcontent.BUTTONINSERTSHORTCODE', $ActionName))
                ->addExtraClass('ss-ui-action-constructive')
                ->setAttribute('data-icon', 'accept')
                ->setUseButtonTag(true)
        ));

        // form
        $form = Form::create($this, "EmbedContentForm", $fields, $actions)
            ->loadDataFrom($this)
            ->addExtraClass('htmleditorfield-form htmleditorfield-embedcontent cms-dialog-content');
        
        return $form;
    }

    /**
     * Provides a API for the preview embed content
     * @return HTML
     **/
    public function PreviewEmbedContent()
    {
        if (!Permission::check('CMS_ACCESS_CMSMain')) {
            return;
        }
        $params = $this->request->requestVars();
        $html = self::get_embed_content($params);
        /*if((isset($params['EmbedWidth']) && trim($params['EmbedWidth']) != '')
            ||(isset($params['EmbedHeight']) && trim($params['EmbedHeight']) != '')
            || (isset($params['EmbedFloat']) && trim($params['EmbedFloat']) != '')
            || (isset($params['EmbedCSSClass']) && trim($params['EmbedCSSClass']) != '')){
            $style = array();
            if(isset($params['EmbedWidth']) && trim($params['EmbedWidth']) != ''){
                $style[] = 'width:'.$params['EmbedWidth'].$params['EmbedWidthUnit'];
            }
            if(isset($params['EmbedHeight']) && trim($params['EmbedHeight']) != ''){
                $style[] = 'height:'.$params['EmbedHeight'].$params['EmbedHeightUnit'];
            }
            if(isset($params['EmbedFloat']) && trim($params['EmbedFloat']) != ''){
                $style[] = 'float:'.$params['EmbedFloat'];
            }
            if(count($style)){
                $style = "style='".implode(';', $style)."'";
            }
            else{
                $style = '';
            }
            $class = '';
            if(isset($params['EmbedCSSClass']) && trim($params['EmbedCSSClass']) != ''){
                $class = trim($params['EmbedCSSClass']);
            }
            $html = "<div class='embedcontent-block $class' $style>".$html."</div>";
        }*/
        return $html;
    }

    /**
     * Replace a "[EmbedContent ..]" with corresponding Page/DataObject/External template view.
     *
     * @param array $arguments
     * @param mixed $content
     * @param object|null $parser
     * @return string|void
     */
    public static function get_embed_content($arguments, $content = null, $parser = null)
    {
        $embedTemplatePath = 'EmbedContent/';
        if (count($arguments) && isset($arguments['EmbedContentType'])) {
            if ($arguments['EmbedContentType'] == 'External' && isset($arguments['EmbedTemplate'])) {
                $controller = Controller::curr();
                return $controller->customise($arguments)->renderWith($embedTemplatePath.$arguments['EmbedTemplate']);
            } elseif (isset($arguments['EmbedContentDataObjectType']) && isset($arguments['EmbedContentDataObjectType'])
                    && is_numeric($arguments['EmbedContentDataObjectID']) && isset($arguments['EmbedTemplate'])) {
                //Remove the extra ::inline
                $arguments['EmbedTemplate'] = str_replace('::inline', '', $arguments['EmbedTemplate']);

                $object = DataObject::get_by_id($arguments['EmbedContentDataObjectType'], $arguments['EmbedContentDataObjectID']);
                return $object->renderWith(array(
                        $embedTemplatePath.$arguments['EmbedContentDataObjectType'].'_'.$arguments['EmbedTemplate'],
                        $embedTemplatePath.$arguments['EmbedTemplate']));
            }
        }
        return "Embed content is not set correctly or do not have preview";
    }


    /*
     * Get list of templates for give insert content type
     * @return Array
     */
    public static function getTemplates($type)
    {
        if (!count(self::$embedTemplates)) {
            foreach (Config::inst()->get('EmbedContentController', 'Templates') as $templatetype => $templates) {
                self::$embedTemplates[$templatetype] = array();
                foreach ($templates as $name => $desc) {
                    if (isset($desc['Inline']) && $desc['Inline']) {
                        if (!isset(self::$embedTemplatesInlines[$templatetype])) {
                            self::$embedTemplatesInlines[$templatetype] = array();
                        }
                        $name = $name.'::inline';
                        self::$embedTemplatesInlines[$templatetype][] = $name;
                    }

                    if (isset($desc['Description'])) {
                        self::$embedTemplates[$templatetype][$name] = $desc['Description'];
                    } else {
                        self::$embedTemplates[$templatetype][$name] = $name;
                    }
                }
            }
        }
        return isset(self::$embedTemplates[$type]) ? self::$embedTemplates[$type]: array();
    }

    /*
     * Check if given content type has any template
     * @return Boolean
     */
    public static function hasTemplates($type)
    {
        return isset(self::$embedTemplates[$type]) && count(self::$embedTemplates[$type]);
    }

    /*
     * Check if given content type and template combination is inline template
     * @return Boolean
     */
    public static function isInlineTemplate($type, $template)
    {
        return isset(self::$embedTemplatesInlines[$type]) && in_array($template, self::$embedTemplatesInlines[$type]);
    }

    /*
     * Clear all the template setting information
     *
     */
    public static function clearTemplates($type = false)
    {
        if ($type && isset(self::$embedTemplates[$type])) {
            self::$embedTemplates[$type] = array();
            if (isset(self::$embedTemplatesInlines[$type])) {
                self::$embedTemplatesInlines[$type] = array();
            }
        } else {
            self::$embedTemplates = array();
        }
    }

    /*
     * Get list of CSS Class applied to embed content
     * @return Array
     */
    public static function getCSSClasses()
    {
        if (count(self::$cssClasses) <= 1) {
            self::$cssClasses = array_merge(self::$cssClasses, Config::inst()->get('EmbedContentController', 'Classes'));
        }
        return self::$cssClasses;
    }

    /*
     * Check if any CSS class is present to add to embed content
     * @return Array
     */
    public static function hasCSSClasses()
    {
        self::getCSSClasses();//Make sure the setting is loaded from config
        return count(self::$cssClasses) > 1;
    }

    /*
     * Clear all the CSS classes information
     *
     */
    public static function clearCSSClasses()
    {
        self::$cssClasses = array(' ' => 'None');
    }
}

/*
 * Extension class to added extra CSS to the CMS Admin for preview the embed content
 * Only added ths CSS files if provided in setting
 */
class EmbedContentLeftAndMainExtension extends LeftAndMainExtension
{

    public function init()
    {
        if (Config::inst()->get('EmbedContentController', 'AdminStyleSheet')) {
            Requirements::css(Config::inst()->get('EmbedContentController', 'AdminStyleSheet'));
        }
    }
}

/*
 * Extension class to added extra CSS to the CMS Front end for embed content
 * Only added ths CSS files if provided in setting
 */
class EmbedContentControllerExtension extends Extension
{

    public function onAfterInit()
    {
        if (Config::inst()->get('EmbedContentController', 'FrontStyleSheet')) {
            Requirements::css(Config::inst()->get('EmbedContentController', 'FrontStyleSheet'));
        }
    }
}
