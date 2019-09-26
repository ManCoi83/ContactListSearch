public class ContactsListController {

   
    @AuraEnabled
    public static ContactDataTableWrapper getContactList(Contact con, Integer recordsPerPage, Integer pageNumber) {
        Integer offset = ((Integer)pageNumber - 1) * recordsPerPage;  
        String sql = '';
        String[] level;
        Integer totalRecords = 0;
        Boolean isEmptyLevel = false;
        
        List<Contact> contactList = new List<Contact>();
        List<Contact> exportListContact = new List<Contact>();
        level = new String[] {con.level__c.replace('"', '\'').subString(1, con.level__c.length() - 1)};  
            for (String s : level) {
                if (s == '') {
                    isEmptyLevel = true;
                    break;
                }
            }       
        if(con.Phone == null && con.Email == null && con.AccountId == null && isEmptyLevel && con.Name == null && con.BirthdateFrom__c == null && con.BirthdateTo__c == null){
            sql = 'SELECT c.Name, c.Account.Name, c.Title, c.Email, c.Phone, c.Level__c, c.LeadSource, c.Birthdate from Contact c';
            totalRecords = [SELECT COUNT() FROM Contact];
            System.debug('totalRecords of All ' + totalRecords);
        } 
        else
        {
            
            con.Email = con.Email == null? '' : con.Email ; 
            con.Phone = con.Phone == null? '' : con.Phone ;   
            sql = 'SELECT c.Name, c.Account.Name, c.Title, c.Email, c.Phone, c.Level__c, c.LeadSource, c.BirthDate from Contact c where (c.Name = \''+ con.Name +'\')';
            if(con.AccountId != null)
            {
                sql += ' or (c.Account.Id = \''+ con.AccountId +'\')';
            } 
            else if(con.Phone != '')
            {
               sql += ' or (c.Phone = \''+ con.Phone +'\')'; 
            } 
            else if(con.Email != '')
            {
				sql += ' or (c.Email = \''+ con.Email +'\')';
            }
            else if (con.BirthdateFrom__c != null)
            {
                string birthdateFrom = DateTime.newInstance(con.BirthdateFrom__c.year(),con.BirthdateFrom__c.month(),con.BirthdateFrom__c.day()+1).format('yyyy-MM-dd'); 
                
                sql += ' or (c.Birthdate >= ' + birthdateFrom + ')';
            }
            else if (con.BirthdateTo__c != null)
            {
                string birthdateTo = DateTime.newInstance(con.BirthdateTo__c.year(),con.BirthdateTo__c.month(),con.BirthdateTo__c.day()+1).format('yyyy-MM-dd'); 
                
                sql += ' or (c.Birthdate < ' + birthdateTo + ')';
            }
            //System.debug('con.level__c' + con.level__c);
            if (!isEmptyLevel) {
                sql += ' or (c.Level__c in ' + level + ')';
            }   
            contactList = Database.query(sql);
            totalRecords = contactList.size();
            System.debug('totalRecords of Search ' + totalRecords);
            // Clear contact List
            contactList.clear();                      
        }
        exportListContact = Database.query(sql);
        sql +=  ' LIMIT :recordsPerPage OFFSET :offset'; 
        System.debug('sql' + sql);
        contactList  = Database.query(sql);
        ContactDataTableWrapper contactWrapper = new ContactDataTableWrapper();
        contactWrapper.totalRecords = totalRecords;
        contactWrapper.contactList =  contactList;
        contactWrapper.totalNumberPages = 1;
        contactWrapper.exportListContact = exportListContact;
        integer Remainder = Math.Mod(totalRecords,recordsPerPage);        
        if(Remainder >= 1){
            contactWrapper.totalNumberPages = totalRecords/recordsPerPage + 1;
        }  
        else if(Remainder == 0 && totalRecords > 0)
            contactWrapper.totalNumberPages = totalRecords/recordsPerPage;
            
            System.debug('Remainder' + Remainder);
        return contactWrapper;
    }
    
    @AuraEnabled
    public static Integer getTotalRecords()
    {     
        Integer total = [select  count()  from Contact];    
         System.debug('totalrecords' + total);
        return total;       
    }
    
    @AuraEnabled
    public static void  importData(String dataPost) {
        try {
        //Type idArrType = Type.forName('List<string>');
        List<Contact> wrapperList = (List<Contact>)System.JSON.deserializeStrict(dataPost, List<Contact>.Class); 
           insert wrapperList;
         System.debug(wrapperList);
       
        }
        catch(Exception e) {
             System.debug('exception'+e);
        }
		//return importList;
    }
    
    @AuraEnabled
    public static Map<String,String> updateContactList(List<Contact> contactList) {
        // Forming a  string map to return response
        Map<String,String> resultMap = new Map<String,String>();
        // Adding try catch for exception handling
        try {
            // Insert the Contact List
            update contactList;
            System.debug(contactList);
            // Setting the success status and message in resultMap
            resultMap.put('status', 'success');
            resultMap.put('message', 'Contacts Updated Successfully');        
        }
        catch(Exception e) {
            // Setting the success status and message in resultMap
            resultMap.put('status', 'error');
            resultMap.put('message',e.getMessage());
        }
        // Returning the result string map
        return resultMap;
    }
    
    @AuraEnabled
    public static Map<String,String> deleteContact(String ids){
        System.debug(ids);
        Map<String,String> resultMap = new Map<String,String>();
        try{
            Delete [Select id from Contact where id =:ids];
        }
        catch(Exception e) {
            // Setting the error status and message in resultMap
            resultMap.put('status', 'error');
            resultMap.put('message',e.getMessage());
        }
        return resultMap;        
    }

    //Wrapper Class For Contact DataTable  
    public class ContactDataTableWrapper {
        @AuraEnabled
        public Integer recordsPerPages {get;set;}
        @AuraEnabled
        public Integer pageNumber {get;set;}
        @AuraEnabled
        public Integer totalNumberPages {get;set;}
        @AuraEnabled
        public Integer totalRecords {get;set;}
        @AuraEnabled
        public List<Contact> contactList {get;set;}
        @AuraEnabled
        public List<Contact> exportListContact {get;set;}               
    }    
}