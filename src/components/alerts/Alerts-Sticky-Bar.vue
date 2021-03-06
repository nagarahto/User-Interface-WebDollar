<template>
    <div v-show="this._showStatus">

        <div id="WebDollarAlertsStickyBarDiv" class='alertsStickyBar' :style="'background: '+this._backgroundColor " >

            <alert v-for="alert in this.alerts"
                   :key="'alert'+alert.statusUniqueId"
                   :alert="alert"
            >
            </alert>

        </div>
    </div>
</template>

<script>

    import icon from "components/UI/icons/icon.vue"
    import Alert from "./Alert.vue"

     export default{

         name: "alerts-sticky-bar",

         components:{
             icon,
             Alert,
         },

         data: () => {
             return {
                 loadedFirstTime: false,

                 alertUniqueIds: 0,
                 alerts: [],
             }
         },


         computed:{

             _showStatus(){
                 return this.alerts.length > 0;
             },
         },

         mounted(){


             if (typeof window === "undefined") return;

             WebDollar.StatusEvents.on("blockchain/status", (data)=>{

                 switch (data.message){

                     case "Blockchain Ready to Mine":

                         this.loadedFirstTime = true;
                         this.deleteAlert(["error-firewall","error-internet"]);
                         break;

                     case "Error Synchronizing":

                         if (WebDollar.Blockchain.loaded !== true) {
                             this.deleteAlert("error-internet");
                             this.deleteAlert("error-firewall");
                             this.addAlert("error-firewall", "error", "Check your Firewall, Router, Anti-virus or Internet");
                         }
                         else {
                             this.deleteAlert("error-internet");
                             this.deleteAlert("error-firewall");
                             this.addAlert("error-internet", "error", "Internet is no longer working. Check your internet or refresh");
                         }

                         break;

                     case "No Internet Access":

                         this.deleteAlert("error-internet");
                         this.deleteAlert("error-firewall");
                         this.addAlert("error-internet", "error","Internet is no longer working. Check your internet or refresh");
                         break;
                 }



             });

             WebDollar.StatusEvents.on("blockchain/logs", (data)=> {

                 switch (data.message) {
                     case "IndexedDB Error":
                         this.deleteAlert("indexedDB-error-reason");
                         this.addAlert("indexedDB-error-reason", "error", "IndexedDB returned an error <b>"+data.reason+"</b>");
                         break;

                     case "Network Adjusted Time Error":
                         this.deleteAlert("network-adjusted-time-error");
                         this.addAlert("network-adjusted-time-error", "error", "Network Adjusted Time didn't work <b>"+data.reason+"</b>");

                         break;

                     case "Network Adjusted Time Success":
                         this.deleteAlert("network-adjusted-time-error");
                         break;

                     case "You mined way too many blocks":

                         this.addAlert("too-many-blocks-mined", "warning", "You mined way too many blocks. You are not sync. Refresh in 15 sec");
                         WebDollar.Blockchain.Mining.stopMining();

                         break;
                 }

             });

             WebDollar.StatusEvents.on("validation/status", (data)=> {

                 switch (data.message) {
                     case "IndexedDB is not supported":
                         if (this.checkIfExistsAlert("indexedDB-error")) break;

                         this.addAlert("indexedDB-error", "error", "<b>IndexedDB is not supported</b> on your browser. Install a different browser");
                         break;

                     case "IndexedDB - PouchDB doesn't work":
                         if (this.checkIfExistsAlert("pouchDB-error")) break;

                         this.addAlert("pouchDB-error", "error", "<b>PouchDB doesn't work</b> "+data.dbName+" . Clear your Website Data from browser. <b style='text-decoration: underline; color:blue'>Click Here</b>", undefined, "/clearIndexedDB");
                         break;

                     case "IndexedDB - Wallet couldn't be imported":
                         if (this.checkIfExistsAlert("wallet-error")) break;

                         this.addAlert("wallet-error", "error", "<b>Wallet couldn't be imported</b> "+data.dbName+" Try refresh or Erase your Wallet. <b style='text-decoration: underline; color:blue'>Click Here</b>", undefined, "/clearIndexedDB");
                         break;

                     case "Incognito mode":
                         this.addAlert("incognito-warning", "warning", "Incognito - your <b>WALLET will not be saved</b>b");
                         break;

                     case "WebAssembly not supported":
                         if (this.checkIfExistsAlert("web-assembly-warning")) break;

                         this.addAlert("web-assembly-warning", "warning", "<b>WebAssembly is not supported</b>. You use an old browser or one that doesn't support WebAssembly. Install Chrome/Firefox/Safari and mining increases with 70%");
                         break;

                     case "ASM.JS not supported":
                         if (this.checkIfExistsAlert("asm.js-warning")) break;

                         this.addAlert("asm.js-warning", "error", "<b>ASM.JS is not supported</b>. Mining is not available on your machine. Please update your browser");
                         break;
                 }

             });

         },

         methods:{


             addAlert(statusId, statusType, statusMessage, timeoutDelete, href){

                 this.alertUniqueIds += 1;

                 let alert = {
                     statusUniqueId: this.alertUniqueIds,
                     statusId: statusId,
                     statusType: statusType,
                     statusMessage: statusMessage,
                     statusHref: href,
                 };

                 this.alerts.push(alert);

                 if (typeof timeoutDelete === "number")
                    setTimeout(()=>{

                        for (let i=0; i<this.alerts.length; i++)
                            if (this.alerts[i] === alert)
                                this.alerts[i].splice(i,1);
                    }, timeoutDelete)

             },

             deleteAlert(arrayStatusId){

                 if (!Array.isArray(arrayStatusId)) arrayStatusId = [arrayStatusId];

                 for (let i=0; i<arrayStatusId.length; i++)

                     for (let j=this.alerts.length-1; j>=0; j--)
                         if (this.alerts[j].statusId === arrayStatusId[i] ){
                             this.alerts.splice(j,1);
                             break;
                         }


             },

             checkIfExistsAlert(statusId){
                 for (let j=this.alerts.length-1; j>=0; j--)
                     if (this.alerts[j].statusId === statusId )
                         return true;

                 return false;
             }

         }

     }

</script>

<style>

    .alertsStickyBar{

        position: fixed;
        width: 100%;
        z-index: 1000;
        text-align: center;

    }

</style>