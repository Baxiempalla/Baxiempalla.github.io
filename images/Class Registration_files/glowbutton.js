// ------------------------------------------------------
// Author : Jeffrey Morris
// Company: Pearson / PowerSchool
// Date   : February 11th, 2008
// Ticket : VADIR Project
// ------------------------------------------------------

// ------------------------------------------------------
// JS for the YUi Version 2.5.1
// ------------------------------------------------------

	YAHOO.namespace ("powerschool");
	
	// Setup global variables
	YAHOO.powerschool.GButtons = new Array();
	YAHOO.powerschool.GBCount = 0;
	
	function createGlowButton( oConfig, sColor ) {
		// Assume we have all the correct attriutes
		
		// Check the sColor
		var bkColor = '',
            bkFade = '',
            newButtonAnim;

        sColor = 'grey';
		switch(sColor)
		{
			case "grey":
				bkColor = "#ccc";
				bkFade = "#ccc";
				break;    
			default:
				bkColor = "#b1ddff";
				bkFade = "#016bbd";
		}
		
		// Add to GButtons Array
		YAHOO.powerschool.GButtons[YAHOO.powerschool.GBCount] = new YAHOO.widget.Button( oConfig );
        /*
        YAHOO.powerschool.GButtons[YAHOO.powerschool.GBCount].on("appendTo", function () {
            if (YAHOO.env.ua.ie == 6) {
                YAHOO.powerschool.GButtons[YAHOO.powerschool.GBCount].addClass("ie6");
            }
            newButtonAnim = new YAHOO.util.ColorAnim( oConfig.id, { backgroundColor: { to: bkColor } });
            newButtonAnim.onComplete.subscribe(function () {
                this.attributes.backgroundColor.to = (this.attributes.backgroundColor.to == bkColor) ? bkFade : bkColor;
                this.animate();
            });
            newButtonAnim.animate();
        });
        */
        
		// Increment our GB counter
		YAHOO.powerschool.GBCount++;
		return YAHOO.powerschool.GBCount-1;
	}

// -END--------------------------------------------------
