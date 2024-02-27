
/**
 * SortStack implementation which hooks directly into a DataTable instance.
 *
 * USAGE:
 *
 *	// ... initialize data table ...
 *	myDataTableId = new YAHOO.widget.DataTable("dataTableContainer", myColumnDefs, myDataSource, tblConfig);
 *	var ss = new SortStack();
 *	ss.hookIntoDataTable (myDataTableId);
 *	ss.addToSortStack ( "courseNumber", false );		// Call this to let us know about any initial sort from the database ...
 */
function SortStack() {
	this.sortStack = new Array();
	this.topSort = null;
	this.topSortOrder = false;
	
	this._attachedDT = null;
	
	this._chained_doBeforeSortColumn = null;
	this._chained_handleDataReturnPayload = null;
	
	
	/**
	 * If you have a properly initialized data table, call this method and you are done!
	 */
	this.hookIntoDataTable = function ( datatable ) {
		this._attachedDT = datatable;
		
		this._chained_doBeforeSortColumn = this._attachedDT.doBeforeSortColumn;
		this._attachedDT.doBeforeSortColumn = this._bind_doBeforeSortColumn();
		
		this._chained_handleDataReturnPayload = this._attachedDT.handleDataReturnPayload;
		this._attachedDT.handleDataReturnPayload = this._bind_handleDataReturnPayload();
		
		// Examine all sortable columns ...
		var cols = datatable.getColumnSet().getDefinitions();
		for ( colidx in cols ) {
			var column = cols[colidx];
			this._attachSortFunction(column);
		}
		// Done!
	}

	this._attachSortFunction = function ( column ) {
		if ( column && column.sortable ) {
			if ( column.sortOptions == null ) column.sortOptions = {};
			
			if ( column.sortOptions.sortFunction == null ) {
				column.sortOptions.sortFunction = this.hookin;
			}
		}
	}

	////
	// SERIALIZATION SUPPORT
	////
	this._serializer = null;
	this._isInReapply = false;
	
	this.setSerializer = function ( serializer ) {
		this._serializer = serializer;
	}

	/**
	 * Form a JSON string for use in setStackFromJSON to persist
	 * this stack settings.
	 */
	this.getAsJSON = function() {
		var jsonArray = new Array();
		for ( ssidx in this.sortStack ) {
			var item = this.sortStack[ssidx];
			var jsonItem = { colid:item.colid, desc:item.desc };
			jsonArray.push(jsonItem);
		}
		return { stack:jsonArray };
	}
	
	/**
	 * Read in the sortStack as it was saved by getStackAsJSON ...
	 */
	this.setFromJSON = function(json) {
		if ( YAHOO.lang.isString ( json ) ) {
			json = YAHOO.lang.JSON.parse ( json );
		}
		var stack = json.stack;
		for ( var idx=stack.length-1; idx >= 0; idx-- ) {
			var item = stack[idx];
			this.addToSortStack ( item.colid, item.desc );
		}
		
		// Call the sort function on the table ...
		this.reapplySortToDataTable();
	}
	
	this.reapplySortToDataTable = function() {
		this._isInReapply = true;
		if ( this._attachedDT && this.topSort && this.topSort != "") {
			var lastSortColumn = this._attachedDT.getColumn ( this.topSort );
			if ( lastSortColumn ) {
				this._attachedDT.showTableMessage(pss_text('psx.js.scripts.SortStack.resorting_based_on_saved_criteria_'));
				this._attachedDT.sortColumn ( lastSortColumn, (this.topSortOrder ? YAHOO.widget.DataTable.CLASS_DESC : YAHOO.widget.DataTable.CLASS_ASC ) );
//				this._attachedDT.hideTableMessage();
			}
		}
		this._isInReapply = false;
	}


	this.makeFn = function () {
		var _sortStackInstance_ = this;	// Give 'this' a unique name so it remains accessible ...
		var sortfn = function(a, b, desc) { return _sortStackInstance_._doSort ( a, b, desc ); }
		
		return sortfn;
	}
	this.hookin = this.makeFn();
	
	this.doBeforeSortColumn = function ( oColumn, sSortDir ) {

		// If a data table is hidden/reshown apparently the columns get redefined from original params!
		// So, failsafe:  if we get here without this attached as the column sort function, do it now!
		this._attachSortFunction(oColumn);
		
		var colid = oColumn.key;
		var desc = ( sSortDir == YAHOO.widget.DataTable.CLASS_DESC );

		this.addToSortStack ( colid, desc );

		// Let our serializer know that our sort has changed (unless we're in our own reapplication of the sort ...)
		if ( this._serializer && !this._isInReapply ) {
			this._serializer.serializableChange(this);
		}

		// then continue in the next handler in the chain (if any) ...
		if ( this._chained_doBeforeSortColumn ) {
			this._chained_doBeforeSortColumn.call ( this._attachedDT, oColumn, sSortDir );
		}

		return true;
	}
	this._bind_doBeforeSortColumn = function () {
		var _sortStackInstance_ = this;	// Give 'this' a unique name so it remains accessible ...
		var sortfn = function(oColumn, sSortDir) { return _sortStackInstance_.doBeforeSortColumn(oColumn, sSortDir); }
		return sortfn;
	}
	
	this.handleDataReturnPayload = function ( oRequest, oResponse, oPayload ) {
		this.reapplySortToDataTable();

		if ( oPayload ) {
			var sortInstructions = this.getTopVisibleColumn();
			if ( sortInstructions ) {
				oPayload.sortedBy = {
					dir : ( sortInstructions.desc ? YAHOO.widget.DataTable.CLASS_DESC : YAHOO.widget.DataTable.CLASS_ASC ),
					key : sortInstructions.colid
				};
			}
		}

		if ( this._chained_handleDataReturnPayload ) {
			return this._chained_handleDataReturnPayload.call ( this._attachedDT, oRequest, oResponse, oPayload );
		}

		return oPayload;
	}
	this.getTopVisibleColumn = function() {
		for ( var idx in this.sortStack ) {
			var sortInstructions = this.sortStack[idx];
			var lastSortColumn = this._attachedDT.getColumn ( sortInstructions.colid );
			if ( lastSortColumn ) {
				return sortInstructions;
			}
		}
		return null;
	}
	this._bind_handleDataReturnPayload = function () {
		var _sortStackInstance_ = this;	// Give 'this' a unique name so it remains accessible ...
		var handlerfn = function(oRequest, oResponse, oPayload) { return _sortStackInstance_.handleDataReturnPayload ( oRequest, oResponse, oPayload ); }
		return handlerfn;
	}
	
	this.addToSortStack = function ( colid, desc ) {
		if ( colid != this.topSort || desc != this.topSortOrder ) {
			for ( var idx in this.sortStack ) {
				var sortInstructions = this.sortStack[idx];
				if ( sortInstructions.colid == colid ) {
					this.sortStack.splice ( idx, 1 );
					break;
				}
			}

			var sortInstructions = { colid: colid, desc: desc };
			
			// put the new item at the "bottom" of the array (first to evaluate)
			this.sortStack.splice ( 0, 0, sortInstructions );
			this.topSort = colid;
			this.topSortOrder = desc;
		}
	}
	
	this._doSort = function ( a, b, desc ) {
		// Ignore 'desc' ...
		for ( var idx in this.sortStack ) {
			var sortInstructions = this.sortStack[idx];
			var retval = this._defaultSortImpl ( a, b, sortInstructions.colid, sortInstructions.desc );
			if ( retval != 0 ) {
				return retval;
			}
		}
		return 0;
	}

	this._defaultSortImpl = function ( a, b, datakey, desc ) {
    // Deal with empty values
    if(!YAHOO.lang.isValue(a)) {
        return (!YAHOO.lang.isValue(b)) ? 0 : 1;
    }
    else if(!YAHOO.lang.isValue(b)) {
        return -1;
    }

    // Do simple data comparison ...
    return YAHOO.util.Sort.compare ( a.getData( datakey ), b.getData( datakey ), desc );
	}
	
}

/**
 * NOTE:  Should only ever be executed within the context of the SortStack!
 */
function sortstack_sortfn ( a, b, desc ) {
	return this._doSort ( a, b, desc );
}


