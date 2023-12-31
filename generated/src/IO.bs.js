// Generated by ReScript, PLEASE EDIT WITH CARE
'use strict';

var Curry = require("rescript/lib/js/curry.js");
var Types = require("./Types.bs.js");
var Js_dict = require("rescript/lib/js/js_dict.js");
var Belt_Array = require("rescript/lib/js/belt_Array.js");
var EventUtils = require("./EventUtils.bs.js");
var Belt_Option = require("rescript/lib/js/belt_Option.js");
var DbFunctions = require("./DbFunctions.bs.js");

function entityCurrentCrud(currentCrud, nextCrud) {
  if (currentCrud !== undefined) {
    switch (currentCrud) {
      case /* Read */0 :
          if (nextCrud === 0) {
            return /* Read */0;
          }
          break;
      case /* Set */1 :
          if (nextCrud === 0) {
            return /* Set */1;
          }
          break;
      case /* Delete */2 :
          if (nextCrud === 0) {
            return /* Delete */2;
          }
          break;
      
    }
  }
  switch (nextCrud) {
    case /* Read */0 :
        return nextCrud;
    case /* Set */1 :
        return /* Set */1;
    case /* Delete */2 :
        return /* Delete */2;
    
  }
}

function MakeStore(StoreItem) {
  var make = function (param) {
    return {
            dict: {},
            hasher: StoreItem.hasher
          };
  };
  var set = function (self, key, eventData, dbOp, entity) {
    self.dict[Curry._1(self.hasher, key)] = {
      dbOp: dbOp,
      entity: entity,
      eventData: eventData
    };
  };
  var get = function (self, key) {
    return Belt_Option.map(Js_dict.get(self.dict, Curry._1(self.hasher, key)), (function (row) {
                  return row.entity;
                }));
  };
  var values = function (self) {
    return Js_dict.values(self.dict);
  };
  return {
          make: make,
          set: set,
          get: get,
          values: values
        };
}

function hasher(key) {
  return EventUtils.getEventIdKeyString(key.chainId, key.eventId);
}

function make(param) {
  return {
          dict: {},
          hasher: hasher
        };
}

function set(self, key, eventData, dbOp, entity) {
  self.dict[Curry._1(self.hasher, key)] = {
    dbOp: dbOp,
    entity: entity,
    eventData: eventData
  };
}

function get(self, key) {
  return Belt_Option.map(Js_dict.get(self.dict, Curry._1(self.hasher, key)), (function (row) {
                return row.entity;
              }));
}

function values(self) {
  return Js_dict.values(self.dict);
}

var RawEvents = {
  make: make,
  set: set,
  get: get,
  values: values
};

function hasher$1(param) {
  return EventUtils.getContractAddressKeyString(param.chainId, param.contractAddress);
}

function make$1(param) {
  return {
          dict: {},
          hasher: hasher$1
        };
}

function set$1(self, key, eventData, dbOp, entity) {
  self.dict[Curry._1(self.hasher, key)] = {
    dbOp: dbOp,
    entity: entity,
    eventData: eventData
  };
}

function get$1(self, key) {
  return Belt_Option.map(Js_dict.get(self.dict, Curry._1(self.hasher, key)), (function (row) {
                return row.entity;
              }));
}

function values$1(self) {
  return Js_dict.values(self.dict);
}

var DynamicContractRegistry = {
  make: make$1,
  set: set$1,
  get: get$1,
  values: values$1
};

function hasher$2(prim) {
  return prim;
}

function make$2(param) {
  return {
          dict: {},
          hasher: hasher$2
        };
}

function set$2(self, key, eventData, dbOp, entity) {
  self.dict[Curry._1(self.hasher, key)] = {
    dbOp: dbOp,
    entity: entity,
    eventData: eventData
  };
}

function get$2(self, key) {
  return Belt_Option.map(Js_dict.get(self.dict, Curry._1(self.hasher, key)), (function (row) {
                return row.entity;
              }));
}

function values$2(self) {
  return Js_dict.values(self.dict);
}

var AwesomeEntity = {
  make: make$2,
  set: set$2,
  get: get$2,
  values: values$2
};

function make$3(param) {
  return {
          rawEvents: {
            dict: {},
            hasher: hasher
          },
          dynamicContractRegistry: {
            dict: {},
            hasher: hasher$1
          },
          awesomeEntity: {
            dict: {},
            hasher: hasher$2
          }
        };
}

var InMemoryStore = {
  entityCurrentCrud: entityCurrentCrud,
  MakeStore: MakeStore,
  RawEvents: RawEvents,
  DynamicContractRegistry: DynamicContractRegistry,
  AwesomeEntity: AwesomeEntity,
  make: make$3
};

async function loadEntities(sql, inMemoryStore, entityBatch) {
  var loadLayer = {
    contents: false
  };
  var uniqueAwesomeEntityDict = {};
  var populateLoadAsEntityFunctions = [];
  var uniqueAwesomeEntityAsEntityFieldArray = {
    contents: []
  };
  Belt_Array.forEach(entityBatch, (function (readEntity) {
          var entityId = readEntity._0;
          if (!loadLayer.contents) {
            loadLayer.contents = true;
          }
          if (Belt_Option.isNone(Js_dict.get(uniqueAwesomeEntityDict, entityId))) {
            uniqueAwesomeEntityAsEntityFieldArray.contents.push(entityId);
            uniqueAwesomeEntityDict[entityId] = entityId;
          }
          
        }));
  while(loadLayer.contents) {
    loadLayer.contents = false;
    if (uniqueAwesomeEntityAsEntityFieldArray.contents.length !== 0) {
      var awesomeEntityFieldEntitiesArray = await DbFunctions.AwesomeEntity.readAwesomeEntityEntities(sql, uniqueAwesomeEntityAsEntityFieldArray.contents);
      Belt_Array.forEach(awesomeEntityFieldEntitiesArray, (function (readRow) {
              var match = DbFunctions.AwesomeEntity.readRowToReadEntityData(readRow);
              var entity = match.entity;
              set$2(inMemoryStore.awesomeEntity, entity.id, match.eventData, /* Read */0, entity);
            }));
      uniqueAwesomeEntityAsEntityFieldArray.contents = [];
    }
    var functionsToExecute = populateLoadAsEntityFunctions;
    populateLoadAsEntityFunctions = [];
    Belt_Array.forEach(functionsToExecute, (function (func) {
            Curry._1(func, undefined);
          }));
  };
}

async function executeBatch(sql, inMemoryStore) {
  var rawEventsRows = Js_dict.values(inMemoryStore.rawEvents.dict);
  var setRawEventsPromise = function (sql) {
    var rawEventsToSet = Belt_Array.map(rawEventsRows, (function (rawEventsRow) {
            return rawEventsRow.entity;
          }));
    if (rawEventsToSet.length !== 0) {
      return DbFunctions.RawEvents.batchSetRawEvents(sql, rawEventsToSet);
    } else {
      return Promise.resolve(undefined);
    }
  };
  var dynamicContractRegistryRows = Js_dict.values(inMemoryStore.dynamicContractRegistry.dict);
  var setDynamicContractRegistryPromise = function (sql) {
    var setDynamicContractRegistry = Belt_Array.keepMap(dynamicContractRegistryRows, (function (dynamicContractRegistryRow) {
            if (dynamicContractRegistryRow.dbOp === /* Set */1) {
              return dynamicContractRegistryRow.entity;
            }
            
          }));
    if (setDynamicContractRegistry.length !== 0) {
      return DbFunctions.DynamicContractRegistry.batchSetDynamicContractRegistry(sql, setDynamicContractRegistry);
    } else {
      return Promise.resolve(undefined);
    }
  };
  var awesomeEntityRows = Js_dict.values(inMemoryStore.awesomeEntity.dict);
  var deleteAwesomeEntityIdsPromise = function (sql) {
    var deleteAwesomeEntityIds = Belt_Array.map(Belt_Array.keepMap(awesomeEntityRows, (function (awesomeEntityRow) {
                if (awesomeEntityRow.dbOp === /* Delete */2) {
                  return awesomeEntityRow.entity;
                }
                
              })), (function (awesomeEntity) {
            return awesomeEntity.id;
          }));
    if (deleteAwesomeEntityIds.length !== 0) {
      return DbFunctions.AwesomeEntity.batchDeleteAwesomeEntity(sql, deleteAwesomeEntityIds);
    } else {
      return Promise.resolve(undefined);
    }
  };
  var setAwesomeEntityPromise = function (sql) {
    var setAwesomeEntity = Belt_Array.keepMap(awesomeEntityRows, (function (awesomeEntityRow) {
            if (awesomeEntityRow.dbOp === /* Set */1) {
              return {
                      dbOp: awesomeEntityRow.dbOp,
                      entity: Types.awesomeEntityEntity_encode(awesomeEntityRow.entity),
                      eventData: awesomeEntityRow.eventData
                    };
            }
            
          }));
    if (setAwesomeEntity.length !== 0) {
      return DbFunctions.AwesomeEntity.batchSetAwesomeEntity(sql, setAwesomeEntity);
    } else {
      return Promise.resolve(undefined);
    }
  };
  return await sql.begin(function (sql) {
              return [
                      setRawEventsPromise(sql),
                      setDynamicContractRegistryPromise(sql),
                      deleteAwesomeEntityIdsPromise(sql),
                      setAwesomeEntityPromise(sql)
                    ];
            });
}

exports.InMemoryStore = InMemoryStore;
exports.loadEntities = loadEntities;
exports.executeBatch = executeBatch;
/* Types Not a pure module */
