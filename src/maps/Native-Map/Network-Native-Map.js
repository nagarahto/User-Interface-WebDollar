import MapsTester from "./../Maps.tester"

// import NodesList from 'node/lists/nodes-list'
// import NodesWaitList from 'node/lists/waitlist/nodes-waitlist'
// import { NodesWaitListObject, NODES_WAITLIST_OBJECT_TYPE } from 'node/lists/waitlist/nodes-waitlist-object';




import CircleMap from "./helpers/Circle-Map";
import MapModal from "./helpers/Map-Modal";
import CellCounter from "./helpers/Cell-Counter";


class NetworkNativeMaps {

    constructor(map) {

        this._markers = [];
        this._markerMyself = null;

    }

    createMap(mapSelector){

        mapSelector = mapSelector || '#map svg';

        this._mapElem = document.querySelector(mapSelector);
        this._circleMap = new CircleMap(this._mapElem);

        this._mapModal = new MapModal();
        this._mapElem.onmousemove = e => this._mapHighlight(e);

        this._cellCounter = new CellCounter();
    }

    async initialize(){

        WebDollar.Node.NodesList.registerEvent("connected", {type: ["all"]}, async (err, nodesListObject) => {

            let geoLocation = await nodesListObject.socket.node.sckAddress.getGeoLocation();

            this._addMarker(geoLocation, nodesListObject.socket);

        } );

        WebDollar.Node.NodesList.registerEvent("disconnected", {type: ["all"]}, async (err, nodesListObject) => {

            //deleting the marker
            let markerIndex = this._findMarkerIndexBySocket(nodesListObject.socket);

            if (markerIndex !== -1) this._removeMarker(this._markers[markerIndex])
        });

        //Waitlist p2p
        WebDollar.Node.NodesWaitList.registerEvent("new-node-waitlist", {type: ["all"]}, async (err, nodesWaitListObject)=>{

            let geoLocation = await nodesWaitListObject.sckAddresses[0].getGeoLocation();

            this._addMarker(geoLocation, nodesWaitListObject);

        });

        NodesWaitList.registerEvent("delete-node-waitlist", {type: ["all"]}, async (err, nodesWaitListObject)=>{

            //deleting the marker
            let markerIndex = this._findMarkerIndexBySocket(nodesWaitListObject);

            if (markerIndex !== -1) this._removeMarker(this._markers[markerIndex])
        });

        await this._showMyself();

    }

    async _showMyself(){
        let geoLocation = await GeoHelper.getLocationFromAddress('', true);

        this._addMarker( geoLocation, 'myself');
    }

    _addMarker(geoLocation, socket){

        let marker = {
            socket: socket,
            desc: this._getInfoWindowContent(geoLocation, socket),
        };


        this._markers.push(marker);

        if (socket === "myself") this.highlightMe(marker); else
        if (socket === "fake") this.highlightConnectedPeer(marker); else
        this.highlightConnectedPeer(marker)

    }

    highlightMe(marker){

        this._markerMyself = marker;

        let cell = this._circleMap.getCellByLocation(marker.desc.pos.lat, marker.desc.pos.lng);
        if (cell) {
            marker.cell = cell;

            this._circleMap.highlightCell(cell, 'peer-own', marker.desc);

            this._cellCounter.incCellCount(cell);

            //add links to current nodes
            for (let i = 0; i< this._markers.length; i++)
                if (this._markers[i] !== marker && this._markers[i].status === "connected")
                    this._circleMap.addLink(cell, this._markers[i].cell);

        }
    }

    highlightConnectedPeer(marker){

        let cell = this._circleMap.getCellByLocation(marker.desc.pos.lat, marker.desc.pos.lng);
        if (cell) {

            marker.cell = cell;

            let cellClass;

            if (marker.desc.nodeType === "myself") cellClass = "peer-own"; else
            if (marker.desc.nodeType === "browser") cellClass = "peer-connected-browser";
            if (marker.desc.nodeType === "terminal") cellClass = "peer-connected-terminal";

            this._circleMap.highlightCell(cell, cellClass , marker.desc);

            this._cellCounter.incCellCount(cell);

            //add links to the myselfMarker
            if (marker.desc.status === "connected")
                if (this._markerMyself !== null && this._markerMyself !== undefined && this._markerMyself !== marker)
                    this._circleMap.addLink(cell, this._markerMyself.cell);

        }
    }


    _getInfoWindowContent(geoLocation, socket){

        let address = '', nodeType = '', status = "node", nodeProtocol = '', nodeIndex=0;

        if (socket === 'myself') {
            status = "connected";
            address = geoLocation.address;
            nodeType = "myself";
        } else
        if (socket === 'fake') {
            address = geoLocation.country;

            if (Math.floor(Math.random()*2) === 0) status = "connected";
            else  status = "not connected";

            if (Math.floor(Math.random()*2) === 0) nodeType = "browser";
            else nodeType = "terminal"

        } else
        if (typeof socket === "object" && socket.node !== undefined && socket.node.protocol !== undefined && socket.node.protocol.helloValidated ) {
            address = socket.node.sckAddress.toString();
            status = "connected";

            switch (socket.node.type){
                case 'client': nodeType = 'terminal'; break;
                case 'server' : nodeType = 'terminal'; break;
                case 'webpeer' : nodeType = 'browser'; break;
            }

            nodeProtocol = socket.node.type;
            nodeIndex = socket.node.index;
        }
        else if (socket instanceof NodesWaitListObject ){ //its a waitlist

            address = socket;

            switch (socket.type){
                case NODES_WAITLIST_OBJECT_TYPE.WEB_RTC_PEER: nodeType = 'browser'; break;
                case NODES_WAITLIST_OBJECT_TYPE.NODE_PEER_TERMINAL_SERVER: nodeType = 'terminal'; break;
            }

            status = "not connected";
            nodeProtocol = nodeType;
            nodeIndex = -1;
        }

        let position = {lat: geoLocation.lat||0, lng: geoLocation.lng||0};

        return {
            status: status,
            city: geoLocation.city||'',
            country: geoLocation.country||'',
            address: address,
            protocol: nodeProtocol,
            index: nodeIndex,
            isp: geoLocation.isp||'',
            pos: position,
            nodeType: nodeType,
        }

    }

    _mapHighlight(e) {

        if (e.target.data) {
            const data = e.target.data;
            this._mapModal.show(data);
        } else
            this._mapModal.hide();

    }

    _removeMarker(marker){

        if (marker.cell !== undefined && marker.cell !== null) {

            // Only remove highlight if there are no more peers on this cell.
            if (this._cellCounter.decCellCount(marker.cell) === 0) {
                // Either change class if there are still known peers there.
                if (this._cellCounter.getCellCount(marker.cell) > 0) {
                    this._circleMap.highlightCell(marker.cell, 'peer-connected-browser', undefined);
                }
                // Or remove class at all.
                else
                    this._circleMap.unhighlightCell(marker.cell);

                if (this._markerMyself !== marker && this._markerMyself !== null)
                    this._circleMap.removeLink(this._markerMyself.cell, marker.cell);
            }

        }

        //delete marker from the list
        for (let i=0; i<this._markers.length; i++)
            if (this._markers[i] === marker) {
                this._markers.splice(i, 1);
                break;
            }

    }

    createTestConnections(){

        let mapsTester = new MapsTester(this);
        mapsTester.testConnections();

    }

    _createTestConnectionsManual(){
        let cell1 = this._circleMap.getCellByLocation(66.160507,  -153.369141);
        let cell2 = this._circleMap.getCellByLocation(73.500823,  -21.755973);
        let cell3 = this._circleMap.getCellByLocation(-28.083,  23.044);
        let cell4 = this._circleMap.getCellByLocation(-20.72,  127.10);

        let data = {
            status: status,
            city: "Bucharest",
            country: "RO",
            protocol: "peer",
            addr: "76.44.22.11"
        };

        this._circleMap.addLink(cell1, cell2);
        this._circleMap.addLink(cell2, cell3);
        this._circleMap.addLink(cell3, cell4);

        this._circleMap.highlightCell(cell1, 'known-peer', data);
        this._circleMap.highlightCell(cell2, 'own-peer', data);
        this._circleMap.highlightCell(cell3, 'own-peer', data);
        this._circleMap.highlightCell(cell4, 'own-peer', data);

    }

    _findMarkerIndexBySocket(socket){

        for (let i=0; i< this._markers.length; i++ )
            if (this._markers[i].socket === socket)
                return i;

        return -1;

    }

}


export default new NetworkNativeMaps()