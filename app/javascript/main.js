/**
 * Created by andriivandakurov on 8/18/14.
 */

;(function(){
  var comp = {
    db        : null,
    storeName : null,
    res : {
      "size"         : null,
      "localStorage" : null,
      "indexedDb"    : null
    },
    validateJson: function (str) {
      try {
        JSON.parse(str);
      } catch (e) {
        return false;
      }
      return true;
    },
    showResults: function () {
      var table = document.querySelector('table[name="results"]');
      table.insertAdjacentHTML(
        'beforeend',
        "<tr>" +
          "<td>"+comp.res["localStorage"]+"</td>" +
          "<td>"+comp.res["indexedDb"]+"</td>" +
          "<td>"+comp.res["size"]+"</td>" +
        "</tr>"
      );
    },
    dataSize: function (object) {
      var objectList = [],
          stack = [ object ],
          bytes = 0;

      while ( stack.length ) {
        var value = stack.pop();

        if ( typeof value === 'boolean' ) {
          bytes += 4;
        }
        else if ( typeof value === 'string' ) {
          bytes += value.length * 2;
        }
        else if ( typeof value === 'number' ) {
          bytes += 8;
        }
        else if
            (
            typeof value === 'object'
            && objectList.indexOf( value ) === -1
            )
        {
          objectList.push( value );

          for( var i in value ) {
            stack.push( value[ i ] );
          }
        }
      }
      return bytes;
    },
    dataSet: function () {
      var textAreaData = document.querySelector('textarea[name="data"]');
      comp.storeName = "dataJson"+Date.parse(new Date());

      if(comp.validateJson(textAreaData.value)){
        // Set local storage data
        localStorage.clear();
        localStorage.setItem(comp.storeName, JSON.stringify(textAreaData.value));

        // Set indexDb data
        comp.indexDbAdd(JSON.parse(textAreaData.value));
      }else{
        console.error("Error: Json you entered is invalid.");
      }
    },
    dataGet: function () {
      var measureTimeStart,
          measureTimeEnd,
          res;

      if(comp.storeName){
        measureTimeStart = window.performance.now();
        res = JSON.parse(localStorage.getItem(comp.storeName));
        measureTimeEnd = window.performance.now();

        comp.res["localStorage"] = measureTimeEnd - measureTimeStart;

        console.log("localStorage data: ", res);

        measureTimeStart = window.performance.now();
        comp.indexDbGet(comp.storeName, function (data) {
          measureTimeEnd = window.performance.now();
          res = data;

          comp.res["indexedDb"] = measureTimeEnd - measureTimeStart;
          comp.res["size"] = comp.dataSize(res);

          console.log("indexedDb data: ", res);

          comp.showResults();
        });

      }else{
        console.warn("Warn: Please set initial data");
      }
    },
    init : function () {
      var $ = {
        on:function(event, selector, callback){
          document.addEventListener(event, function (e) {
            var target = e.target;

            while(target && !target.classList.contains(selector.replace(/\.|\#/g, ""))){
              target = target.parentElement;
            }

            if(target && target.classList.contains(selector.replace(/\.|\#/g, ""))){
              callback(e, target);
            }
          });
        },
        get: function (url, callback) {
          var req = new XMLHttpRequest();
          req.onreadystatechange = function (e) {
            if(req.readyState == 4){
              console.log(req.responseText);
              callback(req.responseText);
            }
          };
          req.open("GET", url, true);
          req.send();
        }
      },
      textAreaData = document.querySelector('textarea[name="data"]'),

      dataJson = {
        "users":[
          {"id":1, "name": "Name 1"},
          {"id":2, "name": "Name 2"},
          {"id":3, "name": "Name 3"},
          {"id":4, "name": "Name 4"},
          {"id":5, "name": "Name 5"}
        ]
      };

      comp.indexDbConnect("localStVsIdb");

      $.on("click", ".btn-data-set", comp.dataSet);
      $.on("click", ".btn-data-get", comp.dataGet);

      // Set init data json value
      textAreaData.value = JSON.stringify(dataJson, undefined, 2);
    },
    indexDbConnect: function (dbName, dbVersion) {
      var requestIDB = indexedDB.open(dbName, (dbVersion ? dbVersion : 1));

      requestIDB.onerror = function () {
        console.error('Error');
      };

      requestIDB.onupgradeneeded = function (e) {
        var thisdb = e.target.result;
        if(!thisdb.objectStoreNames.contains("json")) {
          thisdb.createObjectStore("json", { keyPath: "localStVsIdbId"});
        }
      };

      requestIDB.onsuccess = function (e) {
        comp.db = e.target.result;
      };
    },
    indexDbAdd: function (data) {
      var reqAdd,
          objStore,
          formattedData = {
            localStVsIdbId : comp.storeName,
            data           : data
          };

      if(comp.db){
        objStore = comp.db.transaction(["json"],"readwrite").objectStore("json");
        objStore.clear();
        reqAdd= objStore.add(formattedData);
        reqAdd.onerror = function (e) {
          console.error('Error:', e.target.name);
        }
      }else{
        console.error("Error: IndexDb is not connected.");
      }
    },
    indexDbGet: function (key, callback) {
      var res = comp.db.transaction(["json"], "readonly").objectStore("json").get(key);

      res.onsuccess = function (e) {
        callback(e.target.result);
      };

      res.onerror = function () {
        console.error("something goes wrong");
      }
    }
  };

  comp.init();

})();