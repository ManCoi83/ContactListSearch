({
    // Function to fetch data from server called in initial loading of page
    fetchContacts : function(component, recordsPerPage, pageNumber) {
        var actions = [
            { label: 'Edit', name: 'edit' },
            { label: 'Delete', name: 'delete' }
        ];
        component.set('v.mycolumns', [
            {label: 'Name', fieldName: 'Name', type: 'text', sortable: true},
            {label: 'Account Name', fieldName: 'Account.Name', type: 'text'},
            {label: 'Title', fieldName: 'Title', type: 'text'},
            {label: 'Phone', fieldName: 'Phone', type: 'Phone'},
            {label: 'Email', fieldName: 'Email', type: 'Email'},
            {label: 'Level__c', fieldName: 'Level__c', type: 'text'},
            {label:	 'BirthDate', fieldName: 'Birthdate', type: 'Date'},
            {label: 'LeadSource', fieldName: 'LeadSource', type: 'text'},
            {type: 'action', typeAttributes: { rowActions: actions }}
        ]);   	
        
        var conObj = component.get("v.objContact");
        
        if(component.get("v.selectedLookUpRecord").Id != undefined){
            conObj.AccountId = component.get("v.selectedLookUpRecord").Id;
           // conObj.Account.Name = component.get("v.selectedLookUpRecord").Name;
            //alert(conObj.AccountName);
        } else{
            conObj.AccountId = null;
        }
        
        var action = component.get("c.getContactList");
        action.setParams({
            con: JSON.stringify(conObj),                
            recordsPerPage: recordsPerPage,
            pageNumber: pageNumber
        });
        // Callback function to get the response
        action.setCallback(this, function(response) {
            // Getting the response state
            var state = response.getState();
            // Check if response state is success
            if(state === 'SUCCESS') {
                // Getting the list of contacts from response and storing in js variable
                var contactWrapper = response.getReturnValue();
                component.set("v.contactList", contactWrapper.contactList);   
                component.set("v.totalRecords", contactWrapper.totalRecords);  
                component.set('v.totalNumberPages', contactWrapper.totalNumberPages);
                component.set('v.exportListContact', contactWrapper.exportListContact);
            }
            else {
                // Show an alert if the state is incomplete or error
                alert('Error in getting data');
            }
        });
        // Adding the action variable to the global action queue
        $A.enqueueAction(action);
    } , 
    
    sortData: function (component, fieldName, sortDirection) {
        var data = component.get("v.contactList");
        var reverse = sortDirection !== 'asc';
        //sorts the rows based on the column header that's clicked
        data.sort(this.sortBy(fieldName, reverse))
        component.set("v.contactList", data);
    },
    
    removeContact: function (cmp, event) { 
            var rowId =  cmp.get('v.IdforDelete'); 
            var deleteAction = cmp.get("c.deleteContact");
            deleteAction.setParams({
                ids: rowId
            });
            
            deleteAction.setCallback(this, function(response) {
                // Getting the state from response
                var toastEvent = $A.get("e.force:showToast");
                var state = response.getState();
                var dataMap = response.getReturnValue();
               // alert(state);
                if(state === 'SUCCESS') {                       
                    toastEvent.setParams({
                        "title": "Success!",
                        "message": "The record has been updated successfully."
                    });
                    toastEvent.fire();            
                    window.location.reload();
                }
                else {
                    
                    // Checking if the status is success
                    if(dataMap.status=='error') {
                        // Show an alert if the state is incomplete or error
                        toastEvent.setParams({
                            'title': 'Error!',
                            'type': 'error',
                            'mode': 'dismissable',
                            'message': dataMap.Message
                        });
                        toastEvent.fire(); 
                    }
                }
            });
            $A.enqueueAction(deleteAction);
        //}            
    },
    
    sortBy: function (field, reverse, primer) {
        var key = primer ? function(x) {return primer(x[field])} : function(x) {return x[field]};
        //checks if the two rows should switch places
        reverse = !reverse ? 1 : -1;
        return function (a, b) {
            return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
        }
    },
    
    convertArrayOfObjectsToCSV : function(component,objectRecords){
        // declare variables        
        var csvStringResult, counter, keys, columnDivider, lineDivider, strData;
        
        // check if "objectRecords" parameter is null, then return from function
        if (objectRecords == null || !objectRecords.length) {
            return null;
        }
        console.log('objectRecords' + JSON.stringify(objectRecords));
        // store ,[comma] in columnDivider variabel for sparate CSV values and 
        // for start next line use '\n' [new line] in lineDivider varaible  
        columnDivider = ',';
        lineDivider =  '\n';
        
        // in the keys valirable store fields API Names as a key 
        // this labels use in CSV file header  
        keys = ['Name','AccountId','Title','Email','Phone', 'Level__c' , 'LeadSource', 'Birthdate' ];
        
        csvStringResult = '';
        csvStringResult += keys.join(columnDivider);
        csvStringResult += lineDivider;
        
        for(var i=0; i < objectRecords.length; i++){   
            counter = 0;
            
            for(var sTempkey in keys) {
                var skey = keys[sTempkey] ;  
                if(skey == 'Birthdate'){
                    var birthDate = $A.localizationService.formatDate(objectRecords[i][skey], "yyyy/MM/dd");
                    objectRecords[i][skey] = birthDate;
                    console.log(objectRecords[i][skey]);
                 }    
                
                // add , [comma] after every String value,. [except first]
                if(counter > 0){ 
                    csvStringResult += columnDivider; 
                }   
                if(objectRecords[i][skey] != null || objectRecords[i][skey] != 'undefined')
                {
                    csvStringResult += '"'+ objectRecords[i][skey]+'"'; 
                }                
                counter++;                
            } // inner for loop close 
            csvStringResult += lineDivider;
             console.log('csvStringResult' + csvStringResult);
        }// outer main for loop close 
        return csvStringResult;        
    },
    
    readCSV : function(cmp) {
        
        var spinner = cmp.find("csvSpinner");
         //$A.util.toggleClass(spinner, "slds-hide");
        var fileInput = cmp.find("file").getElement();
        var file = fileInput.files[0];
        var self = this;
        if(file.type === 'application/vnd.ms-excel'){
            cmp.set("v.fileTypeError", false);
            var reader = new FileReader();
            reader.readAsText(file);
            reader.onload = loadHandler;
            reader.onerror = errorHandler;
        } else {
            cmp.set("v.fileTypeError", true);
          //  $A.util.toggleClass(spinner, "slds-hide");
        }
        
        function loadHandler(event) {
            var csv = event.target.result;            
            self.processData(cmp, csv);
        }
        
        function errorHandler(evt) {
            if(evt.target.error.name == "NotReadableError") {
                alert("Canno't read file !");
            }
        }
        
    }, 
    parseDate: function (dateStr, format) {
            const regex = format.toLocaleLowerCase()
            .replace(/\bd+\b/, '(?<day>\\d+)')
            .replace(/\bm+\b/, '(?<month>\\d+)')
            .replace(/\by+\b/, '(?<year>\\d+)')
            
            const parts = new RegExp(regex).exec(dateStr) || {};
         const { year, month, day } = parts.groups || {};
         return parts.length === 4 ? new Date(year, month-1, day) : undefined;
        },
    
    processData: function(cmp, csv) {           
        var allLines = csv.split(/\r\n|\n/);
        cmp.set("v.headers", allLines[0].split(','));
        var importList = [];
        var field = ['Name' , 'AccountName', 'Title', 'Email', 'Phone', 'Level__c' , 'LeadSource' , 'BirthDate'];
        var contact = cmp.get("v.dataPost");
       // var objContact = cmp.get("v.contactPost");
        for (var i=1; i<allLines.length; i++) {           
            if(allLines[i].length > 0 )
            { 
                            var data = allLines[i].split(',');
             console.log('data[7]' + data[7]);
   
            var objContact = new Object();
            objContact.Name = data[0];
            objContact.LastName = 'test';
            objContact.AccountId =  data[1];
            objContact.Title = data[2];
            objContact.Email = data[3];
            objContact.Phone = data[4];
            objContact.Level__c = data[5];
            objContact.LeadSource = data[6];
            objContact.Birthdate = Date.parse(data[7]);
            contact.push(objContact);
            }
        }
        cmp.set("v.dataPost", contact);  
        // importList.sobjectType='Contact';      
        console.log('v.dataPost' + JSON.stringify(cmp.get('v.dataPost')));
        
       // var list = JSON.parse(JSON.stringify(importList)) ;
        var action = cmp.get("c.importData");
        action.setParams({
            //importList: JSON.stringify(importList)               
            dataPost: JSON.stringify(cmp.get('v.dataPost'))
        });
        // Callback function to get the response
        action.setCallback(this, function(response) {
            // Getting the response state
            var state = response.getState();
            // Check if response state is success
            if(state === 'SUCCESS') {
                
            }
            else {
                // Show an alert if the state is incomplete or error
                alert('Error in getting data');
            }
        });
        // Adding the action variable to the global action queue
        $A.enqueueAction(action);
    }
})