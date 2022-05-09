sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "zstud/students/model/formatter"
], function(Controller, History, formatter) {
    "use strict";

    return Controller.extend("zstud.students.controller.Detail", {
        formatter: formatter,
        onInit: function() {
            this._oRouter=sap.ui.core.UIComponent.getRouterFor(this);
            this._oRouter.getRoute("detail").attachPatternMatched(this._onDetailMatched, this);
        },
        _onDetailMatched: function(oEvent){
            var sObjectPath = oEvent.getParameter("arguments").dataPath;
            var dialogModel = new sap.ui.model.json.JSONModel()
            var oModel = this.getView().getModel();
            this.getView().setModel(dialogModel,"dialogModel")
            var mParameters = {
                success: function(oResponse){
                    dialogModel.setProperty("/",oResponse)
                },
                error: function(oError){
                    debugger;
                }
            }
            oModel.read("/"+sObjectPath,mParameters);
            this.getView().bindElement({
                path: "/",
                model: "dialogModel"
            })
        },
        onNavPress: function() {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if(sPreviousHash !== undefined) {
                window.history.go(-1);
            }else {
                this._oRouter.navTo("master");
            }
        }
    });
});