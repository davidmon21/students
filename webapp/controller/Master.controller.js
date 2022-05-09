sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "zstud/students/model/formatter",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/Sorter"
], function(Controller, Fragment, formatter, Filter, FilterOperator, Sorter) {
    "use strict";
    var dialogModel = new sap.ui.model.json.JSONModel(), filters = ["Name"],localData;

    return Controller.extend("zstud.students.controller.Master",{
        formatter: formatter,
        onInit: function(){
            //The table is copied over to JSON because the oData does not have sortable or filterable set to true
            this._mViewSettingsDialogs={};
            localData = this.getOwnerComponent().getModel("localData");
            this.getOwnerComponent().getModel().read("/StudentSet",this.mParameters(localData,"/StudentSet","results"));
            this.getOwnerComponent().setModel(localData,"localData")
           
        },
        onListPress: function(oEvent) {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            var studentRollnumber = this
                                    .getView()
                                    .getModel("localData")
                                    .getProperty(
                                        oEvent
                                        .getSource()
                                        .getBindingContext("localData")
                                        .getPath()+"/Rollnumber"
                                    );
            oRouter.navTo("detail", {
                dataPath: `StudentSet('${studentRollnumber}')`
            });
        },
        _jsonTooData: function(selectedItems){
            //this functions purpose is to translate json index to oData reference of form StudentSet('Rollnumber')
            var cleaned = [];
            for(let i in selectedItems){
                var Rollnumber = this.getView()
                                    .getModel("localData")
                                    .getProperty(this.getView()
                                    .byId("studentTable")
                                    .getContextByIndex(selectedItems[i])+"/Rollnumber")
                cleaned.push(`/StudentSet('${Rollnumber}')`)
            }
            return cleaned;
        },
        onEditPress: function(){
            var items = this.getView().byId("studentTable").getSelectedIndices()
            if(items.length != 1){
                this.onErrorMessageDialogPress(this.getView().getModel("i18n").getResourceBundle().getText("editError"))
                return false;
            }
            dialogModel.setProperty("/", localData.getProperty("/StudentSet/"+items[0]));
            dialogModel.setProperty("/Contactnumber",formatter.phoneNumber(dialogModel.getProperty("/Contactnumber")));
            var country = dialogModel.getProperty("/Country")
            var index = localData.getProperty("/lookupTableCountry/"+country);
            if(index){
                localData.setProperty("/States", localData.getProperty("/Country/"+index+"/states"));
            }
            else{
                localData.setProperty("/Country", localData.getProperty("/Country").concat({ "name": country,"states": [{"name": dialogModel.getProperty("/State") }]}))
                localData.setProperty("/States", localData.getProperty("/Country/"+(localData.getProperty("/Country").length-1)+"/states"));
            }
            this.dialogInit(dialogModel,"Edit","zstud.students.fragment.Entry");
        },
        onCancelDialogPress: function( ) {
            this.byId("openDialog").destroy();
            this.byId("studentTable").clearSelection();
            this._hardRefresh();
        },
        gradePopOver: function (oEvent) {
            var oLink = oEvent.getSource(), oView = this.getView();
            var oPath = oEvent.getSource().getBindingContext("localData").getPath();
            if(!this._pPopover){
                this._pPopover = Fragment.load({
                    id: oView.getId(),
                    name: "zstud.students.fragment.GradePopover",
                    controller: this
                }).then( function(oPopover){
                    oView.addDependent(oPopover);
                    return oPopover;
                });
            }
            this._pPopover.then(function(oPopover){
                oPopover.bindElement("localData>"+oPath);
                oPopover.openBy(oLink);
            });
        },
        onRefreshPress: function(){
            filters=["Name"];
            this.byId("studentTable").clearSelection();
            this._hardRefresh();
        },
        onDeletePress: function(){
            if (!this.oDeleteDialog) {
                this.oDeleteDialog = new sap.m.Dialog({
                    type: sap.m.DialogType.Message,
                    title: "Confirm",
                    content: new sap.m.Text({ text: "Do you want to delete the selected students?" }),
                    beginButton: new sap.m.Button({
                        type: sap.m.ButtonType.Emphasized,
                        text: "Delete",
                        press: function () {
                                var selectedItems = this._jsonTooData(this.getView().byId("studentTable").getSelectedIndices());
                                this._deleteEntries(selectedItems);
                                this.oDeleteDialog.close();
                        }.bind(this)
                    }),
                    endButton: new sap.m.Button({
                        text: "Cancel",
                        press: function () {
                            this.oDeleteDialog.close();
                        }.bind(this)
                    })
                });
            }
    
            this.oDeleteDialog.open();
            
        },
        onErrorMessageDialogPress: function (theText) {
			if (!this.oErrorMessageDialog) {
				this.oErrorMessageDialog = new sap.m.Dialog({
					type: sap.m.DialogType.Message,
					title: "Error",
					state: sap.ui.core.ValueState.Error,
					content: new sap.m.Text({ text: theText }),
					beginButton: new sap.m.Button({
						type: sap.m.ButtonType.Emphasized,
						text: "OK",
						press: function () {
							this.oErrorMessageDialog.close();
						}.bind(this)
					})
				});
			}

			this.oErrorMessageDialog.open();
		},
        dialogInit: function(data,subState,fragmentName){
            var oView = this.getView();
            localData = this.getView().getModel("localData");
            if(!this.byId("openDialog")){
                Fragment.load({
                    id: oView.getId(),
                    name: fragmentName,
                    controller: this
                    }).then( function(oDialog) {
                        oView.addDependent(oDialog)
                        oDialog.setModel(dialogModel,"dialogModel");
                        if(subState == "Add") dialogModel.setProperty("/", data);
                        //substate is to determine if the dialogbox is an edit or an additional(DRY for submit and Fragment)
                        if(subState == "Add") oDialog.setTitle(oView.getModel("i18n").getResourceBundle().getText("addStudent"));
                        else oDialog.setTitle(oView.getModel("i18n").getResourceBundle().getText("editStudent"));
                        localData.setProperty("/subState", {"state":subState});
                        
                        //seperate dialog model, so value binding doesnt effect the JSON or oData within the fragment
                        oDialog.bindElement({
                            path: "/",
                            model: "dialogModel"
                        })
                        oDialog.open()
                });
            }
        },
        onAddPress: function( ){
            //the extra items will be added through the view definitions of the fields - magick
            localData.setProperty("/States", localData.getProperty("/Country/0/states"))
            this.dialogInit( {"Rollnumber": `${parseInt(Math.random()*9999999999)}`,
                        "Dob": new Date(),
                        "Country": "US",
                        "State": "CA"}, "Add","zstud.students.fragment.Entry" )
            
        },
        returnIdListOfRequiredFields: function(){
            //collection of values differes for selects and inputfields, so two seperate list
            let requiredInputs;
            return requiredInputs = ["Name","Contactnumber","EmailId","Maths","Science", "History","Dob"];
        },
        returnIdListOfRequiredSelections: function(){
            let requiredSelections;
            return requiredSelections = ["Gender","Dept","Country","State","Mainsubject"];
        },
        validateEventFeedbackForm: function(requiredInputs,requiredSelections){
            //extra validation of fragment input, using constraints causes silent failure, we want user notification
            //so issues are communicated through value states and validated here letting unconstrained values through
            var _self = this;
            var valid = true;
            //check input fields
            requiredInputs.forEach(function(input){
                var sInput = _self.getView().byId(input);
                console.log(input);
                if(sInput.getValue() == "" || sInput.getValue()==undefined || sInput.getValueState() == "Error"){
                    valid = false;
                    sInput.setValueState("Error");
                }else {
                    //the grade types are string / so checks like this are nessecery
                    //grade types as int in backend could allow this to be cleaned out
                    if(input == "Maths" || input == "Science" || input == "History"){
                        if(isNaN(parseInt(sInput.getValue()))){
                            valid = false;
                            sInput.setValueState("Error");
                        }else{
                            sInput.setValueState("None");
                        }
                    }else{
                        sInput.setValueState("None");
                    }
                }
            });
            //check select boxes
            requiredSelections.forEach(function(selection){
                var sSelection = _self.getView().byId(selection)
                var value = sSelection.getSelectedItem().getKey()
                if( value == undefined || value == "" ){
                    valid = false;
                    sSelection.setValueState("Error");
                }
                dialogModel.setProperty("/"+selection,value);
            });
            return valid;
        },
        mParameters: function(item,path, part,entry){
            //mParams DRY, avoids repitition but incurs cost of checks
            //trade off - best choice? not sure depends
            return {
                success: function(oResponse){
                    var response = undefined
                    if(part){
                        response = oResponse[part]
                    }
                    else{
                        response = oResponse
                    }if(item){
                        item.setProperty(path, response);
                        
                    }
                    if(entry){
                        item.setProperty("/Contactnumber",formatter.phoneNumber(item.getProperty("/Contactnumber")));
                        sap.m.MessageToast.show("Successfully Updated");
                    }
                },
                error: function(oError){
                    console.log(oError);
                },
                requestCompleted: function(){

                }
            }
        },
        _cleanModel: function(dialogModel){
            //currently this does one thing, but in future could do more - so group
            dialogModel.setProperty("/Contactnumber", dialogModel.getProperty("/Contactnumber").replace(/\D/g,''));
        },
        _createEntry: function(dialogModel){
            var oModel = this.getView().getModel();
            this._cleanModel(dialogModel);
            oModel.create('/StudentSet',dialogModel.getProperty("/"), this.mParameters());
        },
        _updateEntry: function(dialogModel){
            var oModel = this.getView().getModel();
            this._cleanModel(dialogModel);
            oModel.update(`/StudentSet(Rollnumber=${dialogModel.getProperty("Rollnumber")})`,dialogModel.getProperty("/"), this.mParameters());
        },
        _hardRefresh: function() {
            localData = this.getOwnerComponent().getModel("localData");
            this.getOwnerComponent().getModel().read("/StudentSet",this.mParameters(localData,"/StudentSet","results"));
        },
        _deleteEntries: function(selectedItems, jsonItems){
            var oModel = this.getView().getModel();
            for(let i in selectedItems){
                this._deleteEntry(selectedItems[i]);
            }

        },
        _deleteEntry: function(sPath){
            var oModel = this.getView().getModel();
            oModel.remove(sPath,{groupId: Math.random()*99999, success: function(){this._hardRefresh()}.bind(this)})
        },
        _hardRefresh: function(){
            this.getView().getModel().read("/StudentSet",this.mParameters(localData,"/StudentSet","results"));
        },
        _getEntry: function(workingPath){
            var oModel = this.getView().getModel();
            dialogModel = new sap.ui.model.json.JSONModel()
            oModel.read(workingPath,this.mParameters(dialogModel,"/",undefined,true));
        },
        
        onFinishDialogPress: function( ) {
            var requiredInputs = this.returnIdListOfRequiredFields();
            var requiredSelections = this.returnIdListOfRequiredSelections();
            var passedValidation = this.validateEventFeedbackForm(requiredInputs, requiredSelections);
            //see substate come into play, see dialog init as to why(DRY principles)
            if(passedValidation == false){
                return false;
            }
            if(localData.getProperty("/subState/state")){
                this._createEntry(dialogModel);
            }else{
                this._updateEntry(dialogModel)
            }
            this.byId("openDialog").destroy();
            this.byId("studentTable").clearSelection();
            this._hardRefresh();
        },
        onSettingsPress: function(){
            var oView = this.getView();
            if(!this.byId("settingsDialog")){
                Fragment.load({
                    id: oView.getId(),
                    name: "zstud.students.fragment.Settings",
                    controller: this
                    }).then( function(oDialog) {
                        oView.addDependent(oDialog)
                        oDialog.open()
                });
            }
        },
        handleSettingsDialogConfirm: function (oEvent) {
            var oTable = this.byId("studentTable"),
                oBinding = oTable.getBinding("rows"),
                mParams = oEvent.getParameters();
            if(mParams.groupItem){
                var sPath = mParams.groupItem.getKey();
                var bDescending= mParams.groupDescending;
                var vGroup = function(oContext) {
                    var name = oContext.getProperty(mParams.groupItem.getKey())
                    return {
                        key: name,
                        text: name
                    }
                }
                var oSorter = new Sorter(sPath, bDescending,vGroup);
                oBinding.sort(oSorter);
            }
            var selectedFilters = Object.keys(mParams.filterKeys)
            var selections = [];
            var aFilters = [];
            var filter=undefined;
            for(let i in selectedFilters){
                var parts = selectedFilters[i].split('__');
                if(parts[0] == "Search") selections.push(parts[1]);
                else{
                    if(parts[0] == "Gender" || parts[0] == "Mainsubject" || parts[0] == "Dept"){
                        filter = new Filter(parts[0], FilterOperator.Contains, parts[1]);

                    }else{
                        filter = new Filter(parts[0], FilterOperator.BT, parseInt(parts[1]), parseInt(parts[2]));
                    }
                    aFilters.push(filter);
                }
            }
            var oTable = this.byId("studentTable");
            var oBinding = oTable.getBinding("rows");
            oBinding.filter(aFilters)
            if(selections.length > 0){
                filters=selections;
            }else{
                filters=["Name"];
            }
            this.byId("settingsDialog").destroy();
        },
        handleSettingsDialogCancel: function(){
            this.byId("settingsDialog").destroy();
            this._hardRefresh();
        },
        onSearch: function (oEvent) {
            var aFilters = [];
            var sQuery = oEvent.getSource().getValue();
            if(sQuery && sQuery.length > 0){
                for(let i in filters){
                    var filter = new Filter(filters[i], FilterOperator.Contains, sQuery);
                    aFilters.push(filter);
                }
            }
            var oTable = this.byId("studentTable")
            var oBinding = oTable.getBinding("rows")
            oBinding.filter(aFilters)
        },
        onChange: function(oEvent){
            this.getView()
                .getModel("localData")
                .setProperty(
                    "/States",
                    this.getView()
                    .getModel("localData")
                    .getProperty(
                        oEvent.getParameters()
                        .selectedItem
                        .oBindingContexts
                        .localData.sPath+"/states"))
        }
    });
});