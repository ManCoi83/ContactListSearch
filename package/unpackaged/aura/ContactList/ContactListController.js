({   
    Init: function(component, event, helper) {    
        $(".select2Class").select2({
            placeholder: "Select Multiple values"
        });
        var opts = ['All','Secondary','Tertiary','Primary'];
        component.set('v.picklistOptsList', opts);  
        var selectedLevels = $('[id$=picklist]').select2("val");
        component.set("v.objContact.Level__c",JSON.stringify(selectedLevels));        
        var recordsPerPage = component.get('v.recordsPerPages');
        var pageNumber = component.get("v.pageNumber");
        component.set('v.recordsPerPages', recordsPerPage);
        component.set('v.pageNumber', pageNumber);     
        helper.fetchContacts(component, recordsPerPage, pageNumber);
    },
    
    searchContactList: function(component, event, helper) {   
        var selectedLevels = $('[id$=picklist]').select2("val");
        component.set("v.objContact.Level__c",JSON.stringify(selectedLevels));
        //change page num
        component.set('v.pageNumber', 1);
        helper.fetchContacts(component, component.get('v.recordsPerPages'),  component.get('v.pageNumber'));      
    },
    
        Clear: function(component, event, helper) {  
            var contact = component.get("v.objContact");
            contact.AccountId = null;
            contact.Name = null;
            contact.Phone = null;
            contact.Email = null;
            contact.Level__c = null;
            contact.BirthdateFrom__c = null;  
            contact.BirthdateTo__c = null;
            $('[id$=picklist]').val(null).trigger('change');     
            component.set("v.selectedLookUpRecord.Name", null);
            component.set("v.selectedLookUpRecord.Id", null);
            component.set("v.objContact",contact);      
    },
    
    handleRowAction: function (cmp, event, helper) {
        var action = event.getParam('action');      
        var row = event.getParam('row');
        
        switch (action.name) {               
            case 'edit':
 
                var editRecordEvent = $A.get("e.force:editRecord");         
                editRecordEvent.setParams({
                    "recordId": row.Id
        });
        editRecordEvent.fire();
                break;
            case 'delete':
            var showModal = cmp.get('v.showModal');
            cmp.set('v.IdforDelete', row.Id);
            cmp.set('v.showModal', !showModal);
           
                //helper.removeContact(cmp, event);
                break;
        }
    },
    
    apexcall : function(component, event, helper) {
        var hideModal = component.get('v.showModal');
        component.set('v.showModal', !hideModal);
       helper.removeContact(component, event);
    },
    
   closeModal : function(component, event, helper) {
        var showModal = component.get('v.showModal');
        component.set('v.showModal', !showModal);
    },
    
    updateColumnSorting: function(component, event, helper) {
        var fieldName = event.getParam('fieldName');
        var sortDirection = event.getParam('sortDirection');
        // assign the latest attribute with the sorted column fieldName and sorted direction
        component.set("v.sortedBy", fieldName);
        component.set("v.sortedDirection", sortDirection);
        helper.sortData(component, fieldName, sortDirection);
    },
        
    // Function used to update the contacts
    editContacts: function(component, event, helper) {
        // Getting the button element
        var btn = event.getSource();
        // Getting the value in the name attribute
        var name = btn.get('v.name');
        // Getting the record view form and the record edit form elements
        var recordViewForm = component.find('recordViewForm');
        var recordEditForm = component.find('recordEditForm'); 
        // If button is edit
        if(name=='edit') {
            // Hiding the recordView Form and making the recordEdit form visible
            $A.util.addClass(recordViewForm,'formHide');
            $A.util.removeClass(recordEditForm,'formHide');
            // Changing the button name and label
            btn.set('v.name','save');
            btn.set('v.label','Save');
        }
        else if(name=='save') {
            // Calling saveContacts if the button is save
            helper.saveContacts(component, event, helper);
        }
    },
    
     
    updateListExport: function (cmp, event) {
        var selectedRows = event.getParam('selectedRows');
        cmp.set('v.selectedRowsExport', selectedRows);
    },
    
    handleUpload : function(component, event, helper){
        helper.readCSV(component);
    },
    
    onSelectChange: function(component, event, helper) {
        var recordsPerPage = component.find("recordSize").get("v.value");
        component.set('v.recordsPerPages', recordsPerPage);
        component.set('v.pageNumber', 1);
        helper.fetchContacts(component, recordsPerPage, component.get("v.pageNumber"));
   },
    
    navigate: function(component, event, helper) {
      // this function call on click on the previous page button  
      var pageNumber = component.get("v.pageNumber");
      // get the previous button label  
      var direction = event.getSource().get("v.label");
      // get the select option (drop-down) values.  
      var recordsPerPage = component.find("recordSize").get("v.value");
      // set the current page,(using ternary operator.)  
      pageNumber = direction === "Previous" ? (pageNumber - 1) : (pageNumber + 1);
      // call the helper function
      component.set("v.pageNumber", pageNumber);
      helper.fetchContacts(component, recordsPerPage, pageNumber);
 
   },
    
    // ## function call on Click on the "Download As CSV" Button. 
    downloadSelectedCsv : function(component,event,helper){
        
        // get the Records [contact] list from 'ListOfContact' attribute 
        var contactList = component.get("v.contactList");
        var selectedRowsExport = component.get("v.selectedRowsExport");
          
        if(selectedRowsExport.length > 0){
            contactList = selectedRowsExport;
        }
        console.log('contactList' + contactList);
        // call the helper function which "return" the CSV data as a String  
        var csv = helper.convertArrayOfObjectsToCSV(component,contactList);   
        if (csv == null){return;} 
        
        // ####--code for create a temp. <a> html tag [link tag] for download the CSV file--####     
        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        hiddenElement.target = '_self'; // 
        hiddenElement.download = 'ExportData.csv';  // CSV file Name* you can change it.[only name not .csv] 
        document.body.appendChild(hiddenElement); // Required for FireFox browser
        hiddenElement.click(); // using click() js function to download csv file
    },
    
        // ## function call on Click on the "Download As CSV" Button. 
    downloadAllCsv : function(component,event,helper){
        
        // get the Records [contact] list from 'ListOfContact' attribute 
        var exportListContact = component.get("v.exportListContact");
        console.log('exportListContact' + exportListContact);
        // call the helper function which "return" the CSV data as a String  
        var csv = helper.convertArrayOfObjectsToCSV(component,exportListContact);   
        if (csv == null){return;} 
        
        // ####--code for create a temp. <a> html tag [link tag] for download the CSV file--####     
        var hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
        hiddenElement.target = '_self'; // 
        hiddenElement.download = 'ExportData.csv';  // CSV file Name* you can change it.[only name not .csv] 
        document.body.appendChild(hiddenElement); // Required for FireFox browser
        hiddenElement.click(); // using click() js function to download csv file
    }
})