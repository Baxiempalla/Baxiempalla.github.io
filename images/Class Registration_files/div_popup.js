
// ------------------------------------------------------
// JS compatible with YUi Versions 2.5.1 / 2.6.0
// ------------------------------------------------------

document.write("<script type=\"text/javascript\" src=\"/scripts/http_errors.js\"></script>");

var div_popup = null; // initialize 
var hasRendered = false;
var div_popup_oldBodyParent = null;
var div_popup_body = null;

/**
 * Provided for backwards compatibility:  always does an RPC to get the contents of the popup ...
 */
var createPopup = function( url_in, title, width, x, y, 
							modal, fixedcenter, draggable, 
							constraintoviewport, underlay,
							__beforeDraw__, __afterDraw__ ) {
	var params = {
		fixedcenter: fixedcenter, 
		modal: modal, 
		x: x,
		y: y,
		width: width,
		draggable: draggable,
		constraintoviewport: constraintoviewport, 
		underlay: underlay
	}
	var bodyEl = document.getElementById(url_in);
	if (bodyEl) {
		// Introduced by PT 1.6:  if given element on page, use direct popup model
		return createPopupCore ( params, "Direct", bodyEl, title, { onBeforeDisplay: __beforeDraw__, onAfterDisplay:__afterDraw__}, undefined );
	} else {
		return createPopupCore ( params, "URL", url_in, title, { onBeforeDisplay: __beforeDraw__, onAfterDisplay:__afterDraw__}, undefined );
	}
}

var createPopupHideFooter = function( url_in, title, width, x, y,
							modal, fixedcenter, draggable,
							constraintoviewport, underlay,
							__beforeDraw__, __afterDraw__ ) {

    var returnPopup = createPopup(url_in, title, width, x, y, modal, fixedcenter, draggable, constraintoviewport, underlay, __beforeDraw__, __afterDraw__);
    hidePopupFooter();
    return returnPopup;
};

var createHTMLPopup = function( html, title, width, x, y, 
                            modal, fixedcenter, draggable, 
                            constraintoviewport, underlay,
                            __beforeDraw__, __afterDraw__ ) {
    var params = {
        fixedcenter: fixedcenter, 
        modal: modal, 
        x: x,
        y: y,
        width: width,
        draggable: draggable,
        constraintoviewport: constraintoviewport, 
        underlay: underlay
    }
    return createPopupCore ( params, "Direct", html, title, { onBeforeDisplay: __beforeDraw__, onAfterDisplay:__afterDraw__}, undefined );
}

/**
* MonteRosa specific popup
**/
var createPopup2 = function( url_in, title, width, x, y, 
							modal, fixedcenter, draggable, 
							constraintoviewport, underlay,
                            overrideSuccess, overrideFailure, overrideCallBack) {

    var handleSuccess = function(o) {
		if(o.responseText != undefined) {
	        div_popup.setBody( o.responseText );
	    }
	}
    if (overrideSuccess!=undefined && overrideSuccess!=null) handleSuccess = overrideSuccess;

    var handleFailure = function(o) {
		div_popup.setBody( returnError(o) );
	}
    if (overrideFailure!=undefined && overrideFailure!=null) handleFailure = overrideFailure;

    var callback = {
	    success:handleSuccess,
	    failure:handleFailure,
	    timeout:10000
	}
    if (overrideCallBack!=undefined && overrideCallBack!=null) callback = overrideCallBack;

    // Check values and set to default if not set.
	if (url_in==undefined) url_in="/images/spacer.gif";
	if (title==undefined) title="";
	if (width==undefined || width<0) width="100%";
	if (x==undefined) x=0;
	if (y==undefined) y=0;
	if (modal==undefined) modal=true;
	if (fixedcenter==undefined) fixedcenter=false;
	if (draggable==undefined) draggable=false;
	if (constraintoviewport==undefined) constraintoviewport=true;
	if (underlay==undefined) underlay="shadow";
		
	div_popup = new YAHOO.widget.Dialog( "div_popup", 
   					{ 	fixedcenter: fixedcenter, 
                    	modal: modal, 
                        x: x, y: y,
                        width: width,
                        draggable: draggable,
                        constraintoviewport: constraintoviewport, 
                        underlay: underlay } );
                                                   		
	div_popup.setHeader("<div class='tl'></div><span>"+title+"</span><div class='tr'></div>");
	div_popup.setBody("<center><h1>"+pss_text('psx.js.scripts.div_popup.loading')+"</h1></center>");
	YAHOO.util.Connect.asyncRequest('GET', url_in, callback);
	div_popup.render( document.body );
	div_popup.show();

    var closeEl = YAHOO.util.Dom.getElementsByClassName("container-close","div","div_popup_c");
    if (closeEl.length>0) {
        closeEl[0].setAttribute("id","div_popup_close");
        closeEl[0].setAttribute("type","button");
        closeEl[0].setAttribute("aria-label",pss_text('psx.js.scripts.div_popup.close2'));
        closeEl[0].tabIndex = 0;
    }
    YAHOO.util.Event.addListener("div_popup_close", "click", removePopup);
    YAHOO.util.Event.addListener("div_popup_close", "keypress", removePopup);
}




/**
 * Creates a popup from a directly-obtained element
 */
var createDirectPopup = function( params, bodyEl, title, __beforeDraw__, __afterDraw__ ) {
	return createPopupCore ( params, "Direct", bodyEl, title, { onBeforeDisplay: __beforeDraw__, onAfterDisplay:__afterDraw__}, undefined );
}

/**
 * Does an RPC to get the contents of the popup ...
 */
var createURLPopup = function( params, url_in, title, timeout, __beforeDraw__, __afterDraw__ ) {
	return createPopupCore ( params, "URL", url_in, title, { onBeforeDisplay: __beforeDraw__, onAfterDisplay:__afterDraw__}, timeout );
}

/**
 * Does an RPC to get the contents of the popup, then hooks into the form ...
 *
 * formEvents: {
 * 		formId - id tag identifying the form in DOM once it has been pulled from the URL
 *		isJSONForm - if true, will parse out the form submit response to a JSON object before calling onFormSubmitSuccess
 * 		onBeforeDisplay(div_popup,o) - Called when the URL comes in but before it is drawn (rare)
 * 		onAfterDisplay(div_popup,o) - Called when the URL comes in and has been drawn / DOM is available
 * 		onBeforeFormSubmit(div_popup,form) - Called when the user clicks "submit" on the form (onsubmit), return false to stop submit
 * 		onAfterFormSubmit(div_popup,form) - Called after the form has been submitted and popup removed from the screen (good time to put up an in-progress indicator)
 * 		onFormSubmitSuccess(o) - Called when the form submission returns successfully (although perhaps with an AJAX error)
 * 		onFormSubmitFailure(o) - Called when the form submission returns unsuccessfully (unreachable server)
 * 		}
 */
var createURLFormPopup = function( params, url_in, title, formEvents ) {
	return createPopupCore ( params, "URL", url_in, title, formEvents );
}



// NOTE:  Keycodes see http://www.cambiaresearch.com/c4/702b8cd1-e5b0-42e6-83ac-25f0306e3e25/Javascript-Char-Codes-Key-Codes.aspx
var keyHandlersForPopup = new Array();
/**
 * Hooks into the Escape key to close just this popup
 */
var hookEscapeToClosePopup = function() {
	// key 27 is 'Esc' key ...
	var keyHandler = new YAHOO.util.KeyListener(document, { keys:27 },  							
												  { fn:removePopup,
														scope:div_popup,
														correctScope:true } );

	addKeyHandlerToPopup ( keyHandler );
}

/**
 * Hooks into the Enter or Return keys to close this popup
 */
var hookEnterToClosePopup = function() {
	// key 13 is 'Enter' (or 'Return') key ...
	var keyHandler = new YAHOO.util.KeyListener(document, { keys:13 },  							
												  { fn:div_popup.hide,
														scope:div_popup,
														correctScope:true } );

	addKeyHandlerToPopup ( keyHandler );
}

/**
 * Hooks into the Enter or Return keys to a specific YUI button
 *
 * NOTE:  ONLY works if the button is set up with an 'onclick' event (such as all 'push' buttons)
 *
 * NOTE:  If 'default' button highlighting is not working, it is most likely because you have not included:
 *   <link rel="stylesheet" type="text/css" href="/scripts/yui/2.6.0/container/assets/skins/sam/container.css"/>
 * -OR- because the button is not in the 'ft' (div_popup.footer).
 *
 */
var hookEnterToButton = function (__buttonRef) {
	// key 13 is 'Enter' (or 'Return') key ...
	var keyHandler = new YAHOO.util.KeyListener(document, { keys:13 },  							
												  { fn: function(e) {
															__buttonRef.fireEvent("click");
														},
														scope:__buttonRef,
														correctScope:false
													} );

	__buttonRef.addClass("default");			// Style it as the default button ...
	addKeyHandlerToPopup ( keyHandler );
}

/**
 * Generally not recommended, but gets rid of the footer on the popup.
 */
var hidePopupFooter = function() {
	if ( div_popup && div_popup.footer ) {
		div_popup.footer.style.display = "none";
	}
}

/**
 * Add a key handler which will be disabled (and forgotten) when the div hides.
 */
var addKeyHandlerToPopup = function ( keyHandler ) {
	keyHandler.enable();
	keyHandlersForPopup.push(keyHandler);
}

var removePopupKeyHandlers = function () {
	for ( khidx in keyHandlersForPopup ) {
		var keyHandler = keyHandlersForPopup[khidx];
		if ( keyHandler && keyHandler.disable ) {
			keyHandler.disable();
		}
	}
	keyHandlersForPopup = new Array();
}

/**
 * Create a popup.
 *
 *	* params:  YUI Panel params structure.  Typically includes width, modal, draggable, etc.
 * 	* type:  Either 'URL' or 'Direct'.  If 'URL' then 'bodySrc' must
 *					be a string containing the URL to be fetched.  If 'Direct'
 *					then 'bodySrc' may be either the HTML string of contents
 *					to be displayed OR an HTML string which should be parsed
 *					to display the body.
 *	* bodySrc: See 'type'.  String or DOM Element.
 *	* title:  The title to display for this dialog.
 *	* width:  The width string, such as "700px".
 *	* x/y:  Location of top-left corner.  Ignored if fixedCenter is true.
 *	* modal:  If true, "gray out" the background
 *	* fixedCenter:  If true, center the popup on the screen
 *	* etc:  Standard Panel config items
 */
var createPopupCore = function( params, type, bodySrc, title, formEvents, timeout ) {

	var isRPC = false;
	var url_in = "";
	if ( type == "URL" | type == "URLForm" ) {
		isRPC = true;
		url_in = bodySrc;
		bodySrc = "<center><h1>"+pss_text('psx.js.scripts.div_popup.loading1')+"</h1></center>";
	}

	// Check values and set to default if not set.
	if (url_in==undefined) url_in="/images/spacer.gif";
	if (title==undefined) title="";
	if (timeout==undefined) timeout=10000;	// 10 seconds timeout ...
	if (formEvents==undefined) formEvents={};
	
	if (params==undefined) params={};
	if (params.width==undefined || params.width<0) params.width="100%";
	if (params.x==undefined) params.x=0;
	if (params.y==undefined) params.y=0;
	if (params.modal==undefined) params.modal=true;
	if (params.fixedcenter==undefined) params.fixedcenter=false;
	if (params.draggable==undefined) params.draggable=false;
	if (params.constraintoviewport==undefined) params.constraintoviewport=true;
	if (params.underlay==undefined) params.underlay="shadow";
	if (params.buttons==undefined) params.buttons = {
		left: null,
		right: [{
			id:        "btnClose",
			label:     "<button type='button' title='"+pss_text('psx.js.scripts.div_popup.close2')+"'>"+pss_text('psx.js.scripts.div_popup.close1')+"</button>",
			title:     null,
			container: "btnClose_c",
			type:      "simple",
			onclick:   { fn: removePopup, obj: div_popup, scope: div_popup },	// Needed for the key handlers!
			isDefault: true,
			isCancel:  true
		}
		]
	}	// Default is a single 'close' button in the aqua style, on the right.
	
	var __forceResize__ = false;
	
	titleWidth = stringWidth(title,"tl")
						
	if (titleWidth > params.width)
	{
		params.width = titleWidth + 80 //add pixels to account for close button
		
		//IE adds extra pixes, need to realign sections
		if (YAHOO.env.ua.ie)
		{
			__forceResize__ = true;
		}
	}
			
	// if one is already up, then destroy it first.
	if (div_popup != null){removePopup();}
	
	div_popup = new YAHOO.widget.Dialog( "div_popup", params );
	div_popup.toDestroy = false;
	div_popup.formEvents = formEvents;
	
	popup_setTitle ( title );
	if ( bodySrc )
	{
		if ( bodySrc && !YAHOO.lang.isString ( bodySrc ) ) {
			div_popup_body = bodySrc;
			div_popup_oldBodyParent = bodySrc.parentNode;
		} else {
			div_popup_body = null;
			div_popup_oldBodyParent = null;
		}
		div_popup.setBody(bodySrc);
	}
	if ( params.buttons ) {
		var canceldefault = makeDialogFooterButtons ( div_popup, params.buttons.left, params.buttons.right );
		if ( canceldefault ) {
			if ( canceldefault.cancelBtn && canceldefault.cancelBtn.onclick ) {
				// key 27 is 'Esc' key ...
				var keyHandler = new YAHOO.util.KeyListener(document, { keys:27 }, canceldefault.cancelBtn.onclick );
				addKeyHandlerToPopup ( keyHandler );
			}
		}
	}
	
	if ( isRPC ) {
		
		var __resetWidth__ = params.width;
		var __recenter__ = (params.fixedcenter != undefined && (params.fixedcenter == 'contained' || params.fixedcenter)) || params.center;
		var handleURLBackSuccess = function(o) {
			if ( div_popup.formEvents.onBeforeDisplay ) div_popup.formEvents.onBeforeDisplay( div_popup, o );
			if(o.responseText != undefined) {
				div_popup.setBody( o.responseText );
	    }
			div_popup.render(document.body);

			// For some unknown reason, IE7 adds 10 pixels to the body width in some situations (Invalid Requests page) but 
			// not others (guardian/teachercomments.html or New Course on Course List page).  Forcing it back to the right 
			// width fixes the IE7 redraw issue.  However, doing the same on FF/Safari messes it up worse!  So, only "fix"
			// things if they are broken (the header is not centered over the body)
			var headerRegion = YAHOO.util.Dom.getRegion ( div_popup.header );
			var bodyRegion = YAHOO.util.Dom.getRegion ( div_popup.body );
			var loffset = headerRegion.left - bodyRegion.left;
			var roffset = bodyRegion.right - headerRegion.right;
			if ( loffset != roffset || __forceResize__) {			
				div_popup.header.style.width = __resetWidth__;
				div_popup.footer.style.width = __resetWidth__;
				div_popup.body.style.width = __resetWidth__;
			}
			div_popup.sizeMask();
			div_popup.sizeUnderlay();
			
			if ( __recenter__ ) {
				div_popup.center();		// Because the panel had been centered only according to the initial loading message ...
			}
			
			if ( div_popup.formEvents.formId ) {
				var form = document.getElementById ( div_popup.formEvents.formId );
				if ( form ) {
					form.__submit = form.submit;
					
					// Keep the form from submitting before we hook in!
					form.__action = form.action;
					form.action = "http://localhost/noaction";
					
					form.submit = function(e) { this.onsubmit(e); }
					form.onsubmit = function(e) { stop_submit(e,this); popup_submitForm(this); return false; }
					if ( selectFirstFocusableInForm ) {
						selectFirstFocusableInForm(form);	// Included in the PowerSchool footers across the site ...
					}
				}
			}

			if ( div_popup.formEvents.onAfterDisplay ) div_popup.formEvents.onAfterDisplay( div_popup, o );
		}

		var handleURLBackFailure = function(o) {
			div_popup.setBody( returnError(o) );

			div_popup.body.style.width = __resetWidth__;
			if ( __recenter__ ) {
				div_popup.center();		// Because the panel had been centered only according to the initial loading message ...
			}
			div_popup.sizeMask();
			div_popup.sizeUnderlay();
		}

		var callback = {
		    success:handleURLBackSuccess,
		    failure:handleURLBackFailure,
		    timeout:timeout
		}

		// Fire off the URL which will replace the contents of our popup when it returns ...
		YAHOO.util.Connect.asyncRequest('GET', url_in, callback);
	}
	
	// Now show the popup ...
	div_popup.render( document.body );
	div_popup.show();
	if ( params.center ) {
		div_popup.center();		// Allows us to center the loading message without using fixedcenter
	}

	// hook into the close buttons ...
	var closeEl = YAHOO.util.Dom.getElementsByClassName("container-close","div","div_popup_c");
	if (closeEl.length>0) {
		closeEl[0].setAttribute("id","div_popup_close");
		closeEl[0].setAttribute("type","button");
		closeEl[0].setAttribute("aria-label",pss_text('psx.js.scripts.div_popup.close2'));
		closeEl[0].tabIndex = 0;
	}
	YAHOO.util.Event.addListener("div_popup_close", "click", removePopup);
	YAHOO.util.Event.addListener("div_popup_close", "keypress", removePopup);

	// Directly hook into the container's hideEvent (doesn't seem to work with Event.addListener?) to remove handlers on hide.
	div_popup.hideEvent.subscribe(removePopupHandler);
	
	return div_popup;
}

/**
 * Make a single "footer" button for a dialog.  Definition should look like:
 *	btnConfig = 	{
		id:        "btnSave",												// A uniue ID for the button
		label:     "Okay",													// Text to display
		title:     "Accept your changes", 					// Tooltip
		container: "btnSave_c",											// A unique id for the container (need not exist)
		type:      "push",													// 'push' is prefered, but may be 'link' or 'simple' (non-YUI)
		onclick:   { fn: rdd_submitSaveRequest, obj: this, scope:this },
		isDefault: false,														// True to style this as the default button
		isCancel:  false														// True to style this as the cancel button
	};
 * We'll populate the following value to the structure:
 *   buttonRef					// The YUI Button instance
 */
var makeDialogButton = function ( div, btnConfig ) {
	var btnContainer = document.createElement("span");
	btnContainer.id = btnConfig.container;
	div.appendChild(btnContainer);
	if ( btnConfig.type == "simple" ) {
		if ( btnConfig.href ) {
			var a = document.createElement("a");
			a.href = btnConfig.href;
			a.innerHTML = btnConfig.label;
			a.title = btnConfig.title;
			btnContainer.appendChild(a);
		} else {
			btnContainer.innerHTML = btnConfig.label;
			btnContainer.style.cursor = "pointer";
			btnContainer.btnConfig = btnConfig;
			if ( btnConfig.onclick && btnConfig.onclick.fn ) {
				if ( btnConfig.onclick.scope ) {
					btnContainer.onclick = function(e) { this.btnConfig.onclick.fn.call ( this.btnConfig.onclick.scope, this.btnConfig.onclick.obj ); }
				} else {
					btnContainer.onclick = function(e) { this.btnConfig.onclick.fn ( this.btnConfig.onclick.obj ); }
				}
			}
		}
	} else {
		var btn = new YAHOO.widget.Button(btnConfig);
		if ( btnConfig.isDefault ) {
			btn.addClass("default");
		}
		if ( btnConfig.isCancel ) {
			btn.addClass("cancel");
		}
	
		btnConfig.buttonRef = btn;
	}
}
/**
 * Make "footer" buttons for a dialog ...
 */
var makeDialogFooterButtons = function( popup, aLeftBtns, aRightBtns )
{
	var canceldefault = {};
	
	var footer = document.createElement("div");

	var btnright = document.createElement("div");
	btnright.className="floatright";
	footer.appendChild(btnright);

	var btnleft = document.createElement("div");
	btnleft.className="floatleft";
	footer.appendChild(btnleft);

	var clearall = document.createElement("div");
	clearall.className = "clearit";
	footer.appendChild(clearall);

	// Now create and render our buttons.
	if ( aLeftBtns ) {
		for ( var bidx in aLeftBtns ) {
			var btnConfig = aLeftBtns[bidx];
			makeDialogButton ( btnleft, btnConfig );
			if ( btnConfig.isCancel ) {
				canceldefault.cancelBtn = btnConfig;
			}
			if ( btnConfig.isDefault ) {
				canceldefault.defaultBtn = btnConfig;
			}
		}
	}
	if ( aRightBtns ) {
		for ( var bidx in aRightBtns ) {
			var btnConfig = aRightBtns[bidx];
			makeDialogButton ( btnright, btnConfig );
			if ( btnConfig.isCancel ) {
				canceldefault.cancelBtn = btnConfig;
			}
			if ( btnConfig.isDefault ) {
				canceldefault.defaultBtn = btnConfig;
			}
		}
	}

	popup.setFooter ( footer );
	
	return canceldefault;
}

var stop_submit = function (e, el) {
	ev = YAHOO.util.Event.getEvent(e, el);
	YAHOO.util.Event.stopEvent(ev);
}

var popup_setTitle = function ( title ) {
	div_popup.setHeader("<div class='tl'></div><span>"+title+"</span><div class='tr'></div>");
}

var popup_submitForm = function(form) {
	if ( form == null ) {
		if ( div_popup.formEvents.formId ) {
			form = document.getElementById ( div_popup.formEvents.formId );
		}
	}
	if ( form ) {
		form.action = form.__action;
		var submit = true;
		if ( div_popup.formEvents.onBeforeFormSubmit ) {
			submit = div_popup.formEvents.onBeforeFormSubmit ( div_popup, form );
		}
		
		if ( submit ) {
			YAHOO.util.Connect.setForm(form);
			var action = form.realaction;	// Works for IE7
			if ( action == null && form.getAttribute ) {
				action = form.getAttribute("realaction");	// Works for Safari / Firefox
			}
			if ( action == null ) {
				action = form.action;	// Not advised; will lead to double-submits on non-standards-complient Internet Explorers!!!
			}
			var cObj = YAHOO.util.Connect.asyncRequest('GET', action, { success: div_popup.formEvents.onFormSubmitSuccess, failure: div_popup.formEvents.onFormSubmitFailure } );

			var oldPopup = div_popup;
			
			removePopup();

			if ( oldPopup.formEvents.onAfterFormSubmit ) {
				submit = oldPopup.formEvents.onAfterFormSubmit ( oldPopup, form );
			}
			
		}

		return false;
	}
}

var destroyPopup = function() {
	var my_div_popup = div_popup;
	if ( div_popup && div_popup.toDestroy ) {
		div_popup.toDestroy = false;
		div_popup = null;
		my_div_popup.destroy();
	}
}

// Called whenever the popup is hidden.  Move the body out and destroy and remove all key handlers ...
var removePopupHandler = function( e ) {
	removePopupKeyHandlers();
	
	// Move the body element back out to its (hopefully invisible!) parent element ...
	if ( div_popup_oldBodyParent ) {
		div_popup_oldBodyParent.appendChild ( div_popup_body );
	}
	
	// Note that if the popup gets recreated in the meantime, div_popup.toDestroy will get set to 'false' ...
	div_popup.toDestroy = true;
	setTimeout ( "destroyPopup();", 100 );
	if ( e ) {
		YAHOO.util.Event.stopEvent(e);
	}
}

var removePopup = function() {
	div_popup.hide();
	div_popup=null;// properly null this out
}

var stringWidth = function(str, elemClass)
{
    var span = document.createElement('SPAN');    
    span.innerHTML = str;
    span.className  = elemClass;
    document.body.appendChild(span);
    var width = getWidth(span);
    document.body.removeChild(span);
    return width;
}

var getWidth = function(elem) {
    if(elem.style.width){
        xPos = elem.style.width;
    }
    else {
        xPos = elem.offsetWidth;
    }
    return xPos;
}

// ------------------------------------------------------
// Popup Dialog - handles centering and allows invocation of other functions
// ------------------------------------------------------
	
var createPopup3 = function(url_in, title, width, x, y, 
							modal, fixedcenter, draggable, 
							constraintoviewport, underlay, 
							successHandlerAddOn) {
						
	var bodySrc = "<center><h1>Loading</h1></center>";
	var timeout=10000;	// 10 seconds timeout ...
	var __beforeDraw__ = undefined;
	var __afterDraw__ = undefined;
	
	// Check values and set to default if not set.
	if (url_in==undefined) url_in="/images/spacer.gif";
	if (title==undefined) title="";
	if (width==undefined || width<0) width="100%";
	if (x==undefined) x=0;
	if (y==undefined) y=0;
	if (modal==undefined) modal=true;
	if (fixedcenter==undefined) fixedcenter=false;
	if (draggable==undefined) draggable=false;
	if (constraintoviewport==undefined) constraintoviewport=true;
	if (underlay==undefined) underlay="shadow";
	
	var params = {
		fixedcenter: fixedcenter, 
		modal: modal, 
		x: x,
		y: y,
		width: width,
		draggable: draggable,
		constraintoviewport: constraintoviewport, 
		underlay: underlay
	};
	
	if (params.buttons==undefined) params.buttons = {
		left: null,
		right: [{
			id:        "btnClose",
			label:     "<button type='button' title='Close'>Close</button>",
			title:     null,
			container: "btnClose_c",
			type:      "simple",
			onclick:   { fn: removePopup, obj: div_popup, scope: div_popup },	// Needed for the key handlers!
			isDefault: true,
			isCancel:  true
		}
		]
	}	// Default is a single 'close' button in the aqua style, on the right.
	
	var __forceResize__ = false;
	
	titleWidth = stringWidth(title,"tl");
						
	if (titleWidth > params.width)
	{
		params.width = titleWidth + 80 //add pixels to account for close button
		
		//IE adds extra pixes, need to realign sections
		if (YAHOO.env.ua.ie)
		{
			__forceResize__ = true;
		}
	}
			
	// if one is already up, then destroy it first.
	if (div_popup != null){removePopup();}
	
	div_popup = new YAHOO.widget.Dialog( "div_popup", params );
	div_popup.toDestroy = false;
	div_popup.formEvents = { onBeforeDisplay: __beforeDraw__, onAfterDisplay: __afterDraw__};
	
	popup_setTitle ( title );
	div_popup_body = null;
	div_popup_oldBodyParent = null;
	div_popup.setBody(bodySrc);
	
	if ( params.buttons ) {
		var canceldefault = makeDialogFooterButtons ( div_popup, params.buttons.left, params.buttons.right );
		if ( canceldefault ) {
			if ( canceldefault.cancelBtn && canceldefault.cancelBtn.onclick ) {
				// key 27 is 'Esc' key ...
				var keyHandler = new YAHOO.util.KeyListener(document, { keys:27 }, canceldefault.cancelBtn.onclick );
				addKeyHandlerToPopup ( keyHandler );
			}
			if ( canceldefault.defaultBtn && canceldefault.defaultBtn.onclick ) {
				// key 13 is 'Enter' key ...
				var keyHandler = new YAHOO.util.KeyListener(document, { keys:13 }, canceldefault.defaultBtn.onclick );
				addKeyHandlerToPopup ( keyHandler );
			}
		}
	}
	
	var __resetWidth__ = params.width;
	var __recenter__ = (params.fixedcenter != undefined && (params.fixedcenter == 'contained' || params.fixedcenter)) || params.center;
	var handleURLBackSuccess = function(o) {
		if ( div_popup.formEvents.onBeforeDisplay ) div_popup.formEvents.onBeforeDisplay( div_popup, o );
		if(o.responseText != undefined) {
			div_popup.setBody( o.responseText );
		}
		div_popup.render(document.body);
		
		// Success handler add-ons
		successHandlerAddOn();

		// For some unknown reason, IE7 adds 10 pixels to the body width in some situations (Invalid Requests page) but 
		// not others (guardian/teachercomments.html or New Course on Course List page).  Forcing it back to the right 
		// width fixes the IE7 redraw issue.  However, doing the same on FF/Safari messes it up worse!  So, only "fix"
		// things if they are broken (the header is not centered over the body)
		var headerRegion = YAHOO.util.Dom.getRegion ( div_popup.header );
		var bodyRegion = YAHOO.util.Dom.getRegion ( div_popup.body );
		var loffset = headerRegion.left - bodyRegion.left;
		var roffset = bodyRegion.right - headerRegion.right;
		if ( loffset != roffset || __forceResize__) {			
			div_popup.header.style.width = __resetWidth__;
			div_popup.footer.style.width = __resetWidth__;
			div_popup.body.style.width = __resetWidth__;
		}
		div_popup.sizeMask();
		div_popup.sizeUnderlay();
		
		if ( __recenter__ ) {
			div_popup.center();		// Because the panel had been centered only according to the initial loading message ...
		}
		
		if ( div_popup.formEvents.formId ) {
			var form = document.getElementById ( div_popup.formEvents.formId );
			if ( form ) {
				form.__submit = form.submit;
				
				// Keep the form from submitting before we hook in!
				form.__action = form.action;
				form.action = "http://localhost/noaction";
				
				form.submit = function(e) { this.onsubmit(e); }
				form.onsubmit = function(e) { stop_submit(e,this); popup_submitForm(this); return false; }
				if ( selectFirstFocusableInForm ) {
					selectFirstFocusableInForm(form);	// Included in the PowerSchool footers across the site ...
				}
			}
		}
		
		if ( div_popup.formEvents.onAfterDisplay ) div_popup.formEvents.onAfterDisplay( div_popup, o );
	}

	var handleURLBackFailure = function(o) {
		div_popup.setBody( returnError(o) );

		div_popup.body.style.width = __resetWidth__;
		if ( __recenter__ ) {
			div_popup.center();		// Because the panel had been centered only according to the initial loading message ...
		}
		div_popup.sizeMask();
		div_popup.sizeUnderlay();
	}

	var callback = {
		success:handleURLBackSuccess,
		failure:handleURLBackFailure,
		timeout:timeout
	}

	// Fire off the URL which will replace the contents of our popup when it returns ...
	YAHOO.util.Connect.asyncRequest('GET', url_in, callback);
	
	// Now show the popup ...
	div_popup.render( document.body );
	div_popup.show();
	if ( params.center ) {
		div_popup.center();		// Allows us to center the loading message without using fixedcenter
	}

	// hook into the close buttons ...
	var closeEl = YAHOO.util.Dom.getElementsByClassName("container-close","div","div_popup_c");
	if (closeEl.length>0) {
		closeEl[0].setAttribute("id","div_popup_close");
		closeEl[0].setAttribute("type","button");
		closeEl[0].setAttribute("aria-label",pss_text('psx.js.scripts.div_popup.close2'));
		closeEl[0].tabIndex = 0;
	}
	YAHOO.util.Event.addListener("div_popup_close", "click", removePopup);
	YAHOO.util.Event.addListener("div_popup_close", "keypress", removePopup);
	
	// Directly hook into the container's hideEvent (doesn't seem to work with Event.addListener?) to remove handlers on hide.
	div_popup.hideEvent.subscribe(removePopupHandler);
	
	return div_popup;
}


// -END--------------------------------------------------
