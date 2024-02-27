
/**
 * Progress panel designed to show modal activity (like an ajax call).
 */
function AjaxProgress(panelMessage) {
	this.panel_requestInProcess = null;
	if ( panelMessage == null ) {
		this.panelMessage = pss_text('psx.js.scripts.ajaxprogress.your_request_is_being_processed');
	} else {
		this.panelMessage = panelMessage;
	}

	this.setPanelMessage = function ( panelMessage ) {
		this.panelMessage = panelMessage;
	}
	
	this.showProgress = function() {
		if ( this.panel_requestInProcess != null ) {
			this.panel_requestInProcess.hide();
		}
		
		this.panel_requestInProcess = new YAHOO.widget.Dialog("panel_progress",
			{
				width:"240px",
				//underlay:"shadow",
				close:false,
				visible:false,
				draggable:true,
				modal:true,
				fixedcenter: true,
				constraintoviewport:true
			} );
		this.panel_requestInProcess.setHeader("<div class='tl'></div><span>"+this.panelMessage+"</span><div class='tr'></div>");
		this.panel_requestInProcess.setBody("<center><img src=\"/images/UI_images/rel_interstitial_loading.gif\"></center>");
		this.panel_requestInProcess.render(document.body);

		this.panel_requestInProcess.show();
		var div = document.getElementById("panel_progress")
		div.style.background="transparent";
	}
	this.hideProgress = function() {
		this.panel_requestInProcess.hide();
	}
	
}
