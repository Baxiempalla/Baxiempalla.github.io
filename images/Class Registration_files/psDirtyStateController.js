'use strict';
/**
 * The dirty state controller finds all elemements within a container with the class = "watchDirtyState"
 * and adds listeners to elements within to decide if they are dirty or not. When links are clicked on the
 * page, a dialog pops up if the page is dirty to ask if the user would like to leave, or stay on the page
 * so they can first submit.
 *
 * On pages with no forms, add the class 'noDirtyDialog' to the button and it will allow submission without
 * checking the dirty state.
 * 
 * To exclude an input from being tracked, add the class 'ignoreDirtyState' to the input.
 */
define(['jquery','underscore','psUnloadHandler'], function($j, _, psUnloadHandler) {
    var isInitializedAlready = false;
    var originalTitle = ''; //Original title of the page
    var currentTitle = ''; //Current title of the page which may have been changed from the original.

    //stores a reference to each object that has been changed.
    var changedElements = {};

    //used for letting an element rember which index it is stored in changedElements.
    var nextIndex = 0;

    // used by angular in order to force a dirty state
    var manualDirtyState = false;
    /**
     * Private isDirty method. returns true if there have been
     * changes on the page.
     */
    var getIsDirty = function() {
        return (manualDirtyState || _.size(changedElements) > 0);
    };

    /**
     * Compares the currentValue to the initialValue. If they are different,
     * it adds to the changeElements object. If they are the same, it ensures
     * that the change is removed from the changeElements object.
     */
    var handleChange = function(currentValue, initialValue, inputIndex) {
        //You NEED an input index for this method to work.
        if(_.isUndefined(inputIndex) || _.isNull(inputIndex)) {
            return;
        }

        //console.log('inputIndex: ' + inputIndex);
        //console.log('Current Value: ' + currentValue + ' type: ' + typeof(currentValue));
        //console.log('Initial Value: ' + initialValue + ' type: ' + typeof(initialValue));

        if(initialValue === currentValue) {
            delete changedElements[inputIndex];
        }
        else {
            changedElements[inputIndex] = 1;
        }

        updateTitle();
    };

    /**
     * Updates the title based on the state of changedElements.
     */
    var updateTitle = function() {
        var newTitle;
        if(getIsDirty()) {
            newTitle = '*' + originalTitle;
        }
        else {
            newTitle = originalTitle.toString();
        }

        if(currentTitle !== newTitle) {
            if(_.isUndefined(newTitle) || _.isNull(newTitle)) {
                // do nothing. Avoid major IE8/IE9 bug
            }
            else if(newTitle.length > 1) {
                $j('title', top.document).text(newTitle);
                currentTitle = newTitle;
            }
        }
    };

    var setOriginalTitle = function() {
        if (!isInitializedAlready) {
            originalTitle = $j('title', top.document).text();
        }
    };

    var setOriginalTitleWith = function(newTitle) {
        originalTitle = newTitle;
    }

    /**
     * private function for handling state.
     */
    var handleDirtyState = function() {
        if(getIsDirty()) {
            pss_get_texts('psx.js.scripts.psDirtyStateController.', 'psx.js.scripts.psDirtyStateController.unsaved_message');
            _.defer(function() {
                //defers until after the dialog goes away
                _.defer(function() {
                    //defers until after any ajax errors from changing pages are handled
                    delete psUnloadHandler.unloadingPage;
                });
            });
            return pss_text('psx.js.scripts.psDirtyStateController.unsaved_message');
        }
        //return nothing so no dialog shows up
    };

    var initialize = function(containers) {
        //console.log('--- Initializing Dirty State Controller ---');
        if(_.isUndefined($j('title', top.document).text()) || _.isNull($j('title', top.document).text())) {
            // Avoid major IE8/IE9 bug
            originalTitle = '';
        }
        else {
            setOriginalTitle();
        }

        var containersToHandle = $j(containers);
        if(containersToHandle.size() === 0) {
            return;
        }

        //All listeners need to exclude jqgrid stuff as those things will be handled
        //by the jqgrids themselves.

        // * * * * Save Initial Data on element that starts focused when the page loads
        dirtyStateController.ensureInitialValueSaved($j(
            'input[type=text]:focus:not(.ui-jqgrid input, .ignoreDirtyState input, .ignoreDirtyState), ' +
            'input[type=password]:focus:not(.ui-jqgrid input, .ignoreDirtyState input, .ignoreDirtyState), ' +
            'textarea:focus:not(.ui-jqgrid textarea, .ignoreDirtyState textarea, .ignoreDirtyState), ' +
            'select:focus:not(.ui-jqgrid select, .ignoreDirtyState select, .ignoreDirtyState)', containersToHandle
        ).first());

        // * * * * Save Initial Data on first use listeners * * * *
        $j('input[type=text]:not(.ui-jqgrid input, .ignoreDirtyState input, .ignoreDirtyState), ' +
           'input[type=password]:not(.ui-jqgrid input, .ignoreDirtyState input, .ignoreDirtyState), ' +
           'textarea:not(.ui-jqgrid textarea, .ignoreDirtyState textarea, .ignoreDirtyState), ' +
           'select:not(.ui-jqgrid select, .ignoreDirtyState select, .ignoreDirtyState)', containersToHandle).on('focus', containersToHandle, _.bind(function(event) {
            //first time it gets focus, save it's initial value and give it an index.
            var element = $j(event.target);
            dirtyStateController.ensureInitialValueSaved(element);
        }, dirtyStateController));

        // * * * * Save Initial Data on first use listeners of type=file * * * *
        $j('input[type=file]:not(.ui-jqgrid input, .ignoreDirtyState input, .ignoreDirtyState)', containersToHandle).on('focus', containersToHandle, _.bind(function(event) {
            var element = $j(event.target);
            dirtyStateController.ensureInitialFileNameSaved(element);
        }, dirtyStateController));

        //Inputs that have the class .NonEnterableFields never receive focus when using 'Associate' buttons to select an option in a new window (such as scheduleedit.html)
        var nonEnterableFields = $j('input[type=text].NonEnterableFields:not(.ui-jqgrid input, .ignoreDirtyState input, .ignoreDirtyState), ' +
            'textarea.NonEnterableFields:not(.ui-jqgrid textarea, .ignoreDirtyState textarea, .ignoreDirtyState)');
        $j(nonEnterableFields).each(function(index, element) {dirtyStateController.ensureInitialValueSaved($j(element))});

        containersToHandle.on('mousedown', 'input[type=radio]:not(.ui-jqgrid input, .ignoreDirtyState input, .ignoreDirtyState)', _.bind(function(event) {
            var target = $j(event.target);
            var targetsInContainers;
            if(target.attr('name').includes('$')) {
                //Handle Student generaldemographics.html page checkbox
                targetsInContainers = $j("[name='" + target.attr('name') + "']", containersToHandle);
            } else {
                targetsInContainers = $j('[name=' + target.attr('name') + ']', containersToHandle);
            }
            targetsInContainers.each(_.bind(function(index, element) {
                //first time it gets focus, save it's initial value and give it an index.
                var $element = $j(element);
                dirtyStateController.ensureInitialCheckValueSaved($element, false);
            }, dirtyStateController));
        }, dirtyStateController));

        // * * * * Add listeners to handle data changes * * * *
        //Check Boxes save initial data when handling data changes too.
        containersToHandle.on('click', 'input[type=checkbox]:not(.ui-jqgrid input, .ignoreDirtyState input, .ignoreDirtyState)', _.bind(function(event) {
            var element = $j(event.target);
            //first time it gets focus, save it's initial value and give it an index.
            dirtyStateController.ensureInitialCheckValueSaved(element, true);
            dirtyStateController.handleCheckedChanged(element);
        }, dirtyStateController));

        //things that use .val() for their value
        containersToHandle.on('keyup change paste blur input',
            'input[type=text]:not(.ui-jqgrid input, .ignoreDirtyState input, .ignoreDirtyState), ' +
            'input[type = password]:not(.ui - jqgrid input, .ignoreDirtyState input, .ignoreDirtyState), ' +
            'textarea:not(.ui - jqgrid textarea, .ignoreDirtyState textarea, .ignoreDirtyState), ' +
            'select:not(.ui - jqgrid select, .ignoreDirtyState select, .ignoreDirtyState)', _.bind(function(event) {
            dirtyStateController.handleValueChanged($j(event.target));
        }, dirtyStateController));

        //Radio buttons
        containersToHandle.on('click', 'input[type=radio]:not(.ui-jqgrid input, .ignoreDirtyState input, .ignoreDirtyState)', _.bind(function(event) {
            var target = $j(event.target);
            var targetsInContainers;
            if(target.attr('name').includes('$')) {
                //Handle Student generaldemographics.html page checkbox
                targetsInContainers = $j("[name='" + target.attr('name') + "']", containersToHandle);
            } else {
                targetsInContainers = $j('[name=' + target.attr('name') + ']', containersToHandle);
            }
            targetsInContainers.each(_.bind(function(index, element) {
                dirtyStateController.handleCheckedChanged($j(element));
            }, dirtyStateController));
        }, dirtyStateController));

        //Input type='file'
        containersToHandle.on('change', 'input[type=file]:not(.ui-jqgrid input, .ignoreDirtyState input, .ignoreDirtyState)', _.bind(function(event) {
            var element = $j(event.target);
            if(_.isUndefined(element)) {
                return;
            }
            element.data('new_name', element.context.files.length ? _.first(element.context.files).name : '');
            
            dirtyStateController.handleFilenameChanged(element);
        }, dirtyStateController));

        //Things that submit need to be omitted from checking for dirty state.
        $j(containersToHandle.parent()).on('submit', 'form', function() {
            $j(window).off('beforeunload');
        });

        //Add a listener to throw up a dialog if anything changes.
        psUnloadHandler.registerDirtyStateHandlerUnloadFn(function() {
            return handleDirtyState();
        });

        $j(window).on('unload', dirtyStateController.onUnloadFunction);
        isInitializedAlready = true;
    };

    var dirtyStateController = {
        initPDSDetailView: function(forms) {
            initialize(forms);
        },
        init: function() {
            initialize('.watchDirtyState');
        },
        onUnloadFunction: function() {
            //The title needs to go back when leaving the page
            //because in a frame situation, the title won't change.
            if(_.isUndefined(originalTitle) || _.isNull(originalTitle)) {
                // do nothing. Avoid major IE8/IE9 bug
            }
            else if(originalTitle.length > 1) {
                $j('title', top.document).text(originalTitle);
            }
        },
        isDirty: function() {
            return getIsDirty();
        },

        /**
         * I did some research and found out that jqgrid does track dirty state handleing... sometimes.
         * When it does the dirty state handling it does so by adding the class 'edited' to the <tr>
         * and adds the class 'dirty-cell' to the <td>
         * This implementation of the dirty state handler will check for those classes. If they are there,
         * the state will be dirty.
         *
         * All jqGrid implementations of PowerSchool that do not automatically put those classes in
         * will need to do so.
         */
        handleJqGridUpdate: function() {
            var changes = $j('.ui-jqgrid .edited, .ui-jqgrid .dirty-cell').size();
            if(changes > 0) {
                changedElements.jqGrid = 1;
            }
            else {
                delete changedElements.jqGrid;
            }

            updateTitle();
        },
        /**
         * Similar to the above JqGrid implementation, but the classed elements can be anywhere
         * */
        handleGenericUpdate: function() {
            var changes = $j('.edited, .dirty-cell').size();
            if(changes > 0) {
                changedElements.generic = 1;
            }
            else {
                delete changedElements.generic;
            }

            updateTitle();
        },
        /**
         * Handles changes from text boxes, radio buttons, combo boxes, and multi select boxes
         * @param element - a jQuery Object
         */
        handleValueChanged: function(element) {
            if(_.isUndefined(element)) {
                return;
            }
            handleChange(element.val(), element.data('initial_value'), element.data('inputIndex'));
        },
        /**
         * Handles changes from checkboxes
         * @param element a jQuery Object
         */
        handleCheckedChanged: function(element) {
            if(_.isUndefined(element)) {
                return;
            }
            handleChange(element.prop('checked'), element.data('initial_value'), element.data('inputIndex'));
        },
        /**
         * Handles changes from file uploads
         * @param element a jQuery Object
         */
        handleFilenameChanged: function(element) {
            if(_.isUndefined(element)) {
                return;
            }
            handleChange(element.data('new_name'), element.data('initial_name'), element.data('inputIndex'));
        },
        /**
         * @param - a jQueryObject that is governed by the .val() value.
         */
        ensureInitialValueSaved: function(element) {
            if(_.isUndefined(element)) {
                return;
            }
            var index = element.data('inputIndex');
            if(_.isUndefined(index)) {
                element.data('inputIndex', nextIndex++);
                element.attr('data-psDirtyStateNamespace', '');
                element.data('initial_value', element.val());
            }
        },
        /**
         * @param - a jQueryObject that is governed by the .prop('checked') value.
         * @param - boolean - determines if the initial value should be the opposite of the actual value
         *                    true - saves the opposite of the actual value
         *                    false - saves the value of .checked()
         */
        ensureInitialCheckValueSaved: function(element, reversed) {
            if(_.isUndefined(element)) {
                return;
            }
            var index = element.data('inputIndex');
            if(_.isUndefined(index)) {
                element.data('inputIndex', nextIndex++);
                element.attr('data-psDirtyStateNamespace', '');
                if(reversed) {
                    //It's initial value is the opposite of what just got set.
                    element.data('initial_value', !element.prop('checked'));
                }
                else {
                    //It's initial value is the opposite of what just got set.
                    element.data('initial_value', element.prop('checked'));
                }
            }
        },
        /**
         * @param - a jQueryObject of type=file that is governed by the element.context.files.name
         */
         ensureInitialFileNameSaved: function(element) {
            if(_.isUndefined(element)) {
                return;
            }
            var index = element.data('inputIndex');
            if(_.isUndefined(index)) {
                element.data('inputIndex', nextIndex++);
                element.attr('data-psDirtyStateNamespace', '');
                element.data('initial_name', element.context.files.length ? _.first(element.context.files).name : '');
            }
        },
        /*
        * function for initializing dirty state controller in a state so that a external caller will determine
        * the state of the controller (whether it is 'dirty'). Used by pssValidationForm widget.
        */
        manualInit: function() {
            setOriginalTitle();
            $j(window).on('beforeunload', handleDirtyState);
            $j(window).on('unload', this.onUnloadFunction);
            isInitializedAlready = true;
            debugConsole.debug('psDirtyStateController is attached. Manual Init detected.');
        },
        changeManualDirtyState: function(state) {
            manualDirtyState = state;
            updateTitle();
        },
        reset: function() {
            if (isInitializedAlready) {
                changedElements = {};
                var elements = $j('[data-psDirtyStateNamespace]');
                elements.removeData('inputIndex');
                elements.removeAttr('data-inputIndex');
                updateTitle();
            }
        },
        resetOriginalTitle: function(newTitle) {
            setOriginalTitleWith(newTitle);
        }
    };

    return dirtyStateController;
});
