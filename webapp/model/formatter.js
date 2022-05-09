sap.ui.define([
], function(){
    "use strict";
    return {
        gradeColor: function(args){
            var allargs = Object.values(arguments);
            var val = 0;
            for(let i in allargs){
                val+=parseInt(allargs[i])
            }
            val=parseInt(val/allargs.length);
            if(val >= 75) return 'Success';
            else if(val >= 50) return 'Warning';
            else return 'Error';
        },
        dob: function(date){
            return new Date(date).toDateString();
        },
        gradeLetter: function(val){
            var allargs = Object.values(arguments);
            var val = 0;
            for(let i in allargs){
                val+=parseInt(allargs[i])
            }
            val=parseInt(val/allargs.length);
            if(val >= 75) return "A";
            else if(val >= 50) return "B";
            return "C";
        },
        checkDate: function(theDate){
            if(theDate){
                var today = (new Date()).getTime();
                if(theDate > today) return 'Error';
                return 'Success'
            }
        },
        checkEmail: function(email){
            if(email){
                var rexMail = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/
                if(!email.match(rexMail)){
                    return 'Error';
                }
                return 'Success';
            }
        },
        phoneNumber: function(number){
            if(isNaN(parseInt(number))) return number;
            var clean = parseInt(number).toString();
            
            return `(${clean.slice(0,3)}) ${clean.slice(3,6)}-${clean.slice(6)}`
        }
    }
})