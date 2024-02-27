
function CourseRequestPopup ( panelid, datatableid, datachange_callback, selectionchange_callback )
{
	this.panelid = panelid;
	this.datatableid = datatableid;
	this.datachange_callback = datachange_callback;
	this.selectionchange_callback = selectionchange_callback;

	this.dataSource = null;
	this.dataTable = null;
	this.ss = new SortStack();

	this.popup = null;

	this.callerid = null;		// Allows the caller to stash data about itself for safekeeping (we don't care what!)
	this.isSingleSelect = false;
	this.isImmutable = 0;
	this.currentSelRows = new Array();	// So we can clear them all in one fell swoop ...

	this.init = function () {
		// Create an empty data source to start with (no records to list ...)
		this.dataSource = new YAHOO.util.LocalDataSource({
			found: 0,
			total: 0,
			data: []
		});
		this.dataSource.responseType = YAHOO.util.DataSource.TYPE_JSON;

		this.dataSource.responseSchema = {
			resultsList: "data",
			fields: [ "cnum", "cname", "credits", "isRec", "isValid", "prereqNote", "isSelected", "alerts", "recs" ]
		};

		var myColumnDefs = [
			{ key: "isSelected", label: "<span id='isSelectedHeader'></span>", formatter: selectFormat,
			 		sortable: true, width: 20},
			{ key: "cname", label: pss_text('psx.js.scripts_course-prereqs.CourseRequestPopup.course_name'), parser: "string", formatter: courseNameFormat,
					sortable: true, resizeable: false, width: 150 },
			{ key: "cnum", label: pss_text('psx.js.scripts_course-prereqs.CourseRequestPopup.number'), formatter: courseNumberFormat,
					sortable: true, resizeable: false, width: 60 },
			{ key: "cdesc", label: pss_text('psx.js.scripts_course-prereqs.CourseRequestPopup.course_description'), parser: "string", formatter: courseDescFormat,
					sortable: true, resizeable: false, width: 195 },
			{ key: "credits", label: pss_text('psx.js.scripts_course-prereqs.CourseRequestPopup.credits'), parser: "string", formatter: creditsFormat,
					sortable: true, resizeable: false, width: 55 },
			{ key: "prereqNote", label: "<img border=0 alt='' src='"+imgsrc_Prerequisite+"'> "+pss_text('psx.js.scripts_course-prereqs.CourseRequestPopup.prerequisite_note'), parser: "string", formatter: noteFormat,
					sortable: true, resizeable: false, width: 195 },
			{ key: "alerts", label: pss_text('psx.js.scripts_course-prereqs.CourseRequestPopup.alerts'), sortable: true, formatter: alertsFormat, width: 100 }
		];

		var tblConfig = {
				//initialRequest: "startIndex = 0 & size = 15 & isGetAll = true ",
				//dynamicData: true,
				sortedBy: {
					key: "alerts",
					dir: "asc"
				},
				paginator: new YAHOO.widget.Paginator({
					rowsPerPage: 10,
					totalRecords: 100,
					containers: ["pag","toppag"]
				}),
				selectionMode: 'single'
		};

		// DataTable constructor syntax
		this.dataTable = new YAHOO.widget.DataTable(this.datatableid, myColumnDefs, this.dataSource, tblConfig);
		this.dataTable.crpReference = this;

		// Hook into the multi-column sort stack ...
		this.ss.hookIntoDataTable(this.dataTable);

		// No serialization of sort order ...
		// var ps_ss = new PSSerializer(this.ss);
		// if (!ps_ss.restoreSavedState(sortstack_savedvalue)) {
		// 	// Apply default sort if none saved ...
		 	this.ss.addToSortStack("alerts", false);
		 	this.ss.addToSortStack("cname", false);
		// }

	}

	this.setData = function ( title, callerid, isSingleSelect, isImmutable, data ) {
		var oRequest = "";
		var oResponse = { "results": data, "error":false };
		var oPayload = {};

		this.callerid = callerid;
		this.isSingleSelect = isSingleSelect;

		// Define the new label for the 'isSelected' column header (single check or multi):
		var label = null;
		if ( isSingleSelect ) {
			label = "<img alt='' src='"+imgsrc_SingleCheckHead+"' border=0>";
		} else {
			label = "<img alt='' src='"+imgsrc_MultiCheckHead+"' border=0>";
		}
		var firstCol = this.dataTable.getColumnSet().getColumn("isSelected");
		if ( firstCol ) {
			// Note: setting 'firstCol.label' is needed only if a column is added/removed later on, but
			//	doesn't affect the current label.  We'll do that by updating the contents of the header.
			firstCol.label = "<span id='isSelectedHeader'>" + label + "</span>";
		}
		// Actually sets the label header in DOM:
		var isSelectedHeader = document.getElementById("isSelectedHeader");
		if ( isSelectedHeader ) {
			isSelectedHeader.innerHTML = label;
		}

		this.isImmutable = isImmutable;
		this.currentSelRows = new Array();	// So we can clear them all in one fell swoop ...
		for ( var selidx in data ) {
			var row = data[selidx]
			if ( row.isSelected ) {
				this.currentSelRows["c"+row.cnum] = row;
			}
		}

		this.dataTable.onDataReturnInitializeTable ( oRequest, oResponse, oPayload );

		var bodyEl = document.getElementById(this.panelid);
		var panelParams = { width:"1000px", modal:true, draggable:true, fixedcenter:false, constraintoviewport:false, buttons:{} }
		this.popup = createDirectPopup ( panelParams, bodyEl, title );
		hidePopupFooter();
		this.popup.center();	// This will start it off "centered", but will allow the user to scroll up/down if the panel is larger than the screen ...

		var records = this.dataTable.getRecordSet().getRecords();
		var firstSelIndex = -1;
		for ( var recidx in records ) {
			var record = records[recidx];
			if ( record.getData("isSelected") ) {
				syncRecordIsSelected ( record, this );
				if ( firstSelIndex == -1 ) {
					firstSelIndex = parseInt(recidx);
				}
			}
		}

		this.ensureIndexIsVisible ( firstSelIndex );
		// this.ss.reapplySortToDataTable();
		// this.dataTable.render();

		// Kill the default scroll up/down actions of the key presses ...  Note these are BOTH needed to work on FF and Safari!
		addKeyHandlerToPopup ( makeKillKeydownHandler({ keys:[38,40,36,35,33,34] }));
		addKeyHandlerToPopup ( makeKillKeypressHandler({ keys:[38,40,36,35,33,34] }));
		if ( !this.isImmutable ) {
			addKeyHandlerToPopup (
				new YAHOO.util.KeyListener(
					document,
					{ keys:38 },  // Up arrow
					{ fn:this.keyup, scope:this, correctScope:true }
				)
			);
			addKeyHandlerToPopup (
				new YAHOO.util.KeyListener(
					document,
					{ keys:40 }, 	// Down arrow
					{ fn:this.keydown, scope:this, correctScope:true }
				)
			);
			addKeyHandlerToPopup (
				new YAHOO.util.KeyListener(
					document,
					{ keys:36 },  // Home
					{ fn:this.keyhome, scope:this, correctScope:true }
				)
			);
			addKeyHandlerToPopup (
				new YAHOO.util.KeyListener(
					document,
					{ keys:35 }, 	// End
					{ fn:this.keyend, scope:this, correctScope:true }
				)
			);
		}
		// These keys are for shifting the view, so even on immutable popups use them:
		addKeyHandlerToPopup (
			new YAHOO.util.KeyListener(
				document,
				{ keys:33 },  // Page Up
				{ fn:this.keypageup, scope:this, correctScope:true }
			)
		);
		addKeyHandlerToPopup (
			new YAHOO.util.KeyListener(
				document,
				{ keys:34 },  // Page Down
				{ fn:this.keypagedown, scope:this, correctScope:true }
			)
		);
		addKeyHandlerToPopup (
			new YAHOO.util.KeyListener(
				document,
				{ keys:13 }, 	// Enter
				{ fn:this.acceptpopup, scope:this, correctScope:true }
			)
		);
		addKeyHandlerToPopup (
			new YAHOO.util.KeyListener(
				document,
				{ keys:27 }, 	// Escape
				{ fn:this.cancelpopup, scope:this, correctScope:true }
			)
		);

		if ( this.selectionchange_callback ) this.selectionchange_callback ( this, this.callerid, this.getSelectedCount() );
		this.popup.center();	// This will start it off "centered", but will allow the user to scroll up/down if the panel is larger than the screen ...
	}

	this.keyup = function(ce,args) {
		if ( !this.isImmutable ) {
			var firstIndex = this.getFirstSelectedRow();
			if ( firstIndex > 0 ) {
				var firstTry = firstIndex-1;
				var doSelect = this.retreatToSelectable ( firstTry );
				if ( doSelect >= 0 ) {
					this.doSingleRowSelectByIndex ( doSelect );
				}
			}
		}
	}
	this.keydown = function(ce,args) {
		if ( !this.isImmutable ) {
			var firstIndex = this.getFirstSelectedRow();
			var firstTry = firstIndex+1;	// note, if we had -1, we'll try 0 ...  if we had the last we'll try beyond it and fail ...
			var doSelect = this.advanceToSelectable ( firstTry );
			if ( doSelect >= 0 ) {
				this.doSingleRowSelectByIndex ( doSelect );
			}
		}
	}
	this.keyhome = function(ce,args) {
		if ( !this.isImmutable ) {
			var doSelect = this.advanceToSelectable ( 0 );
			if ( doSelect >= 0 ) {
				this.doSingleRowSelectByIndex ( doSelect );
			}
		}
	}
	this.keyend = function(ce,args) {
		if ( !this.isImmutable ) {
			var lastrow = this.dataTable.getRecordSet().getRecords().length-1;
			var doSelect = this.retreatToSelectable ( lastrow );
			if ( doSelect >= 0 ) {
				this.doSingleRowSelectByIndex ( doSelect );
			}
		}
	}
	this.keypageup = function(ce,args) {
		var paginator = this.dataTable.get("paginator");
		if ( paginator ) {
			var newPage = paginator.getPreviousPage();
			if ( newPage ) {
				paginator.setPage ( newPage );
			}
		}
	}
	this.keypagedown = function(ce,args) {
		var paginator = this.dataTable.get("paginator");
		if ( paginator ) {
			var newPage = paginator.getNextPage();
			if ( newPage ) {
				paginator.setPage ( newPage );
			}
		}
	}

	this.advanceToSelectable = function (startindex) {
		var records = this.dataTable.getRecordSet().getRecords();
		for ( var index=startindex; index<records.length; index++ ) {
			var record = records[index];
			if ( record.getData("isValid") ) {
				return index;
			}
		}
		return -1;
	}
	this.retreatToSelectable = function (startindex) {
		var records = this.dataTable.getRecordSet().getRecords();
		for ( var index=startindex; index>=0; index-- ) {
			var record = records[index];
			if ( record.getData("isValid") ) {
				return index;
			}
		}
		return -1;
	}

	this.getSelectedCount = function() {
		var count = 0;
		for ( var selrow in this.currentSelRows ) {
			var value = this.currentSelRows[selrow];
			if ( value != null ) {
				count++;
			}
		}
		return count;
	}
	this.getFirstSelectedRow = function() {
		// if ( this.currentSelRows == null || this.currentSelRows.length == 0 ) {
		// 	return -1;	// no selection ...
		// }

		var records = this.dataTable.getRecordSet().getRecords();
		var firstSelIndex = -1;
		for ( var recidx in records ) {
			var record = records[recidx];
			if ( record.getData("isSelected") ) {
				if ( firstSelIndex == -1 ) {
					firstSelIndex = recidx;
					break;
				}
			}
		}
		return parseInt(firstSelIndex);
	}

	this.doSingleRowSelectByIndex = function ( recindex ) {
		this.doSingleRowSelectByRecord ( this.dataTable.getRecordSet().getRecords()[recindex] );
		this.ensureIndexIsVisible ( recindex );
	}
	this.doSingleRowSelectByRecord = function ( record ) {
		// Deselect all the others ...
		for ( var selidx in this.currentSelRows ) {
			var selrow = this.currentSelRows[selidx];
			if ( selrow ) {
			    var creationCode = selrow.getData("creationCode");
			    var isAdminCreated = IsCreatedByAdmin(creationCode);
			    if (isAdminCreated) {
			        // if deselecting admin created request, then add that course in deleteErrors.adminCreated
			        var courseNumber = selrow.getData("cnum");
			        var groupId = selrow.getData("groupId");
			        if (courseNumber && groupId >= 0) {
    			        var group = groupById[groupId];
	    		        if (group) {
		    	            var index = group.deleteErrors.adminCreated.indexOf(courseNumber);
			                if (index < 0) {
			                    group.deleteErrors.adminCreated.push(courseNumber);
			                }
			            }
			        }
			    }
				selrow.setData ( "isSelected", false );
			}
		}
		this.currentSelRows = new Array();

		syncRecordIsSelected ( record, this );
		record.setData("isSelected", true );

		this.dataTable.render();
	}

	this.ensureIndexIsVisible = function ( selIndex ) {
		// Now make sure the first page with selected records is showing ...
		if ( selIndex >= 0 ) {
			var paginator = this.dataTable.get("paginator");
			if ( paginator ) {
				var recperpage = paginator.getRowsPerPage();
				if ( recperpage > 0 ) {
					var pagenum = Math.floor(selIndex / recperpage);
					paginator.setPage(1+pagenum);
				}
			}
		}
	}

	this.cancelpopup = function() {
		removePopup();
	}

	this.acceptpopup = function() {
		if ( this.datachange_callback ) {
			this.datachange_callback ( this, this.callerid );
		}
		removePopup();
	}
}

var courseNameFormat = function(elCell, oRecord, oColumn, oData) {
	elCell.innerHTML = oData;
	addCellClassname ( elCell, oRecord );
	elCell.className += " datatable_coursename";
}

var courseDescFormat = function(elCell, oRecord, oColumn, oData) {
	elCell.innerHTML = oData;
	addCellClassname ( elCell, oRecord );
	elCell.className += " datatable_coursedesc";
}

var courseNumberFormat = function(elCell, oRecord, oColumn, oData) {
	elCell.innerHTML = oData;
	addCellClassname ( elCell, oRecord );
	elCell.className += " datatable_coursenum";
}

var creditsFormat = function(elCell, oRecord, oColumn, oData) {
	elCell.innerHTML = localizeNumber(oData);
	addCellClassname ( elCell, oRecord );
}

var noteFormat = function(elCell, oRecord, oColumn, oData) {
	elCell.innerHTML = oData;
	addCellClassname ( elCell, oRecord );
}

var alertsFormat = function(elCell, oRecord, oColumn, oData) {
	var isRec = oRecord.getData("isRec");
	var isSelected = oRecord.getData("isSelected");
	var isValid = oRecord.getData("isValid");
	var imgsrc_thisInvalid = ( isSelected ? imgsrc_InvalidExisting : imgsrc_Invalid );
	var text = "";
	if ( isRec && !isValid ) {
		text = "<img alt='' border=0 src='"+imgsrc_thisInvalid+"'> <img border=0 src='"+imgsrc_Recommendation+"'> "+pss_text('psx.js.scripts_course-prereqs.CourseRequestPopup.recommended_but_prerequisites_have_not_been_met');
	} else if ( isRec ) {
		text = pss_text('psx.js.scripts_course-prereqs.CourseRequestPopup.recommended');
	} else if ( !isValid ) {
		text = "<img alt='' border=0 src='"+imgsrc_thisInvalid+"'> "+pss_text('psx.js.scripts_course-prereqs.CourseRequestPopup.prerequisites_have_not_been_met');
	}
	elCell.innerHTML = text;

	var recs = oRecord.getData("recs");
	if ( isRec && recs ) {
		for ( var recidx in recs ) {
			var rec = recs[recidx];
			var recby = rec.recby;
			if ( recby ) {
				if ( text != "" ) {
					elCell.appendChild ( document.createElement("br") );
				}
				var span = document.createElement("span");
				span.innerHTML = "<img alt='' border=0 src='"+imgsrc_Recommendation+"'> " + recby;
				elCell.appendChild(span);
			}
		}
	}
	addCellClassname ( elCell, oRecord );
}

var selectFormat = function(elCell, oRecord, oColumn, oData) {
	var isSelected = oRecord.getData("isSelected");
	var isSelectable = oRecord.getData("isValid");
	var __crp__ = this.crpReference;
	var __cnum__ = oRecord.getData("cnum");
	var __record__ = oRecord;

	text = "<img alt='"+pss_text('psx.js.scripts_course-prereqs.CourseRequestPopup.click_to_request_this_course')+"' src='"+imgsrc_Unchecked+"' title='"+pss_text('psx.js.scripts_course-prereqs.CourseRequestPopup.click_to_request_this_course')+"'>";
	if ( __crp__.isSingleSelect ) {
	} else {
	}

	if ( !isSelectable ) {
		text = "&nbsp;";
	}

	if ( isSelected ) {
		text = "<img alt='"+pss_text('psx.js.scripts_course-prereqs.CourseRequestPopup.this_course_will_be_requested')+"' src='"+imgsrc_Checked+"' title='"+pss_text('psx.js.scripts_course-prereqs.CourseRequestPopup.this_course_will_be_requested')+"'>";
	}

	elCell.innerHTML = text;
	if ( !__crp__.isImmutable ) {
		elCell.parentNode.parentNode.onclick = function(e) {
			doSelectToggle ( __crp__, __cnum__, __record__ );
			if(e) { e.cancelBubble = true; }
		};
	}

	addCellClassname ( elCell, oRecord );

}

var addCellClassname = function ( elCell, record ) {
	if ( elCell.parentNode ) {
		elCell = elCell.parentNode;	// We want to mod the table cell, not the enclosing div ...
	}
	if ( elCell.orig_className == null ) {
		elCell.orig_className = elCell.className;
	}
	if ( elCell.orig_className == null ) {
		elCell.orig_className = "__ignored__";	// Just in case ...
	}
	elCell.className = elCell.orig_className + getCellClassname ( record );
}
var getCellClassname = function ( record ) {
	var classname = "";
	var isSelected = record.getData("isSelected");
	var isRecommended = record.getData("isRec");
	var isInvalid = !record.getData("isValid");

	if ( isSelected )			classname += " yui-dt-highlighted";		// Same effect as dataTable.highlightRow(record) ...
	if ( isRecommended )	classname += " datatable_recommended";
	if ( isInvalid )			classname += " datatable_invalid";

	return classname;
}

function syncRecordIsSelected ( record, crp ) {
	crp.currentSelRows["c"+record.getData("cnum")] = record;
	if ( crp.selectionchange_callback) crp.selectionchange_callback ( crp, crp.callerid, crp.getSelectedCount() );
}
function syncRecordIsDeselected ( record, crp ) {
	crp.currentSelRows["c"+record.getData("cnum")] = undefined;
	if ( crp.selectionchange_callback) crp.selectionchange_callback ( crp, crp.callerid, crp.getSelectedCount() );
}

var doSelectToggle = function(crp, cnum, record) {
	var isSelected = record.getData("isSelected");
	var isSelectable = record.getData("isValid");
	var creationCode = record.getData("creationCode");
	var isAdminCreated = IsCreatedByAdmin(creationCode);
	var rerender = true;

	// if admin created request, then don't let user to delete it
	if (isAdminCreated) {
	    if (isSelected) {
	        // if user deselects an admin created request, put that in deleteErrors.adminCreated array
            var courseNumber = record.getData("cnum");
            var groupId = record.getData("groupId");
            if (courseNumber && groupId >= 0) {
    	        var group = groupById[groupId];
	            if (group) {
	                var index = group.deleteErrors.adminCreated.indexOf(courseNumber);
	                if (index < 0) {
	                    group.deleteErrors.adminCreated.push(courseNumber);
	                }
	            }
            }
	    } else {
	        // if user selects an admin created request, delete that from deleteErrors.adminCreated array
            var courseNumber = record.getData("cnum");
            var groupId = record.getData("groupId");
            if (courseNumber && groupId >= 0) {
    	        var group = groupById[record.getData("groupId")];
	            if (group) {
	                var index = group.deleteErrors.adminCreated.indexOf(courseNumber);
	                if (index >= 0) {
	                    group.deleteErrors.adminCreated.splice(index, 1);
	                }
	            }
            }
	    }
	}

	if ( !isSelected && isSelectable ) {
		if ( crp.isSingleSelect ) {
			crp.doSingleRowSelectByRecord ( record );
			rerender = false;
		} else {
			syncRecordIsSelected ( record, crp );
			record.setData("isSelected", true );
		}
	} else {
		syncRecordIsDeselected ( record, crp );
		record.setData("isSelected", false );
	}
	if ( rerender ) {
		crp.dataTable.render();
	}
}

var IsCreatedByAdmin = function(creationCode) {
    // if created in PowerScheduler for a single student, then creationCode = 0
    // if created in PowerScheduler for a set of students, then creationCode = 2
    return (creationCode === 0 || creationCode === 2) ? 1 : 0;
}
