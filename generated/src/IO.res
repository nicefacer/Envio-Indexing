module InMemoryStore = {
  let entityCurrentCrud = (currentCrud: option<Types.dbOp>, nextCrud: Types.dbOp): Types.dbOp => {
    switch (currentCrud, nextCrud) {
    | (Some(Set), Read)
    | (_, Set) =>
      Set
    | (Some(Read), Read) => Read
    | (Some(Delete), Read)
    | (_, Delete) =>
      Delete
    | (None, _) => nextCrud
    }
  }

  module type StoreItem = {
    type t
    type key
    let hasher: key => string
  }

  module MakeStore = (StoreItem: StoreItem) => {
    type value = StoreItem.t
    type key = StoreItem.key
    type hasher = StoreItem.key => string
    type t = {
      dict: Js.Dict.t<Types.inMemoryStoreRow<StoreItem.t>>,
      hasher: hasher,
    }

    let make = (): t => {dict: Js.Dict.empty(), hasher: StoreItem.hasher}

    let set = (self: t, ~key: StoreItem.key, ~eventData, ~dbOp, ~entity: StoreItem.t) =>
      self.dict->Js.Dict.set(key->self.hasher, {eventData, entity, dbOp})

    let get = (self: t, key: StoreItem.key) =>
      self.dict->Js.Dict.get(key->self.hasher)->Belt.Option.map(row => row.entity)

    let values = (self: t) => self.dict->Js.Dict.values
  }

  type rawEventsKey = {
    chainId: int,
    eventId: string,
  }

  module RawEvents = MakeStore({
    type t = Types.rawEventsEntity
    type key = rawEventsKey
    let hasher = (key: key) =>
      EventUtils.getEventIdKeyString(~chainId=key.chainId, ~eventId=key.eventId)
  })

  type dynamicContractRegistryKey = {
    chainId: int,
    contractAddress: Ethers.ethAddress,
  }

  module DynamicContractRegistry = MakeStore({
    type t = Types.dynamicContractRegistryEntity
    type key = dynamicContractRegistryKey
    let hasher = ({chainId, contractAddress}) =>
      EventUtils.getContractAddressKeyString(~chainId, ~contractAddress)
  })

  module AwesomeEntity = MakeStore({
    type t = Types.awesomeEntityEntity
    type key = string
    let hasher = Obj.magic
  })

  type t = {
    rawEvents: RawEvents.t,
    dynamicContractRegistry: DynamicContractRegistry.t,
    awesomeEntity: AwesomeEntity.t,
  }

  let make = (): t => {
    rawEvents: RawEvents.make(),
    dynamicContractRegistry: DynamicContractRegistry.make(),
    awesomeEntity: AwesomeEntity.make(),
  }
}

type uniqueEntityReadIds = Js.Dict.t<Types.id>
type allEntityReads = Js.Dict.t<uniqueEntityReadIds>

let loadEntities = async (
  sql,
  ~inMemoryStore: InMemoryStore.t,
  ~entityBatch: array<Types.entityRead>,
) => {
  let loadLayer = ref(false)

  let uniqueAwesomeEntityDict = Js.Dict.empty()

  let populateLoadAsEntityFunctions: ref<array<unit => unit>> = ref([])

  let uniqueAwesomeEntityAsEntityFieldArray: ref<array<string>> = ref([])

  @warning("-39")
  let rec awesomeEntityLinkedEntityLoader = (entityId: string) => {
    if !loadLayer.contents {
      // NOTE: Always set this to true if it is false, I'm sure there are optimizations. Correctness over optimization for now.
      loadLayer := true
    }
    if Js.Dict.get(uniqueAwesomeEntityDict, entityId)->Belt.Option.isNone {
      let _ = uniqueAwesomeEntityAsEntityFieldArray.contents->Js.Array2.push(entityId)
      let _ = Js.Dict.set(uniqueAwesomeEntityDict, entityId, entityId)
    }

    ()
  }

  @warning("+39")
  (
    entityBatch
    ->Belt.Array.forEach(readEntity => {
      switch readEntity {
      | AwesomeEntityRead(entityId) => awesomeEntityLinkedEntityLoader(entityId)
      }
    })
  )

  while loadLayer.contents {
    loadLayer := false

    if uniqueAwesomeEntityAsEntityFieldArray.contents->Array.length > 0 {
      let awesomeEntityFieldEntitiesArray =
        await sql->DbFunctions.AwesomeEntity.readAwesomeEntityEntities(
          uniqueAwesomeEntityAsEntityFieldArray.contents,
        )

      awesomeEntityFieldEntitiesArray->Belt.Array.forEach(readRow => {
        let {entity, eventData} = DbFunctions.AwesomeEntity.readRowToReadEntityData(readRow)

        inMemoryStore.awesomeEntity->InMemoryStore.AwesomeEntity.set(
          ~key=entity.id,
          ~entity,
          ~eventData,
          ~dbOp=Types.Read,
        )
      })

      uniqueAwesomeEntityAsEntityFieldArray := []
    }

    let functionsToExecute = populateLoadAsEntityFunctions.contents

    populateLoadAsEntityFunctions := []

    functionsToExecute->Belt.Array.forEach(func => func())
  }
}

let executeBatch = async (sql, ~inMemoryStore: InMemoryStore.t) => {
  let rawEventsRows = inMemoryStore.rawEvents->InMemoryStore.RawEvents.values

  let setRawEventsPromise = sql => {
    // NOTE: This is commented out because raw events are always 'Set' operations. Likely that will stay the case even with reorgs protections in place since it'll just re-run the batch rather than edit a partially run batch.
    // TODO: remove if not necessary
    // let setRawEvents =
    //   rawEventsRows->Belt.Array.keepMap(rawEventsRow =>
    //     rawEventsRow.dbOp == Types.Set
    //       ? Some(rawEventsRow.entity)
    //       : None
    //   )
    let rawEventsToSet = rawEventsRows->Belt.Array.map(rawEventsRow => rawEventsRow.entity)

    if rawEventsToSet->Belt.Array.length > 0 {
      sql->DbFunctions.RawEvents.batchSetRawEvents(rawEventsToSet)
    } else {
      ()->Promise.resolve
    }
  }

  let dynamicContractRegistryRows =
    inMemoryStore.dynamicContractRegistry->InMemoryStore.DynamicContractRegistry.values

  // // NOTE: currently deleting dynamic contracts in unimplemented
  // let deleteDynamicContractRegistryIdsPromise = sql => {
  //   let deleteDynamicContractRegistryIds =
  //     dynamicContractRegistryRows
  //     ->Belt.Array.keepMap(dynamicContractRegistryRow =>
  //       dynamicContractRegistryRow.dbOp == Types.Delete
  //         ? Some(dynamicContractRegistryRow.entity)
  //         : None
  //     )
  //     ->Belt.Array.map(dynamicContractRegistry => (
  //       dynamicContractRegistry.chainId,
  //       dynamicContractRegistry.contractAddress,
  //     ))

  //   if deleteDynamicContractRegistryIds->Belt.Array.length > 0 {
  //     sql->DbFunctions.DynamicContractRegistry.batchDeleteDynamicContractRegistry(
  //       deleteDynamicContractRegistryIds,
  //     )
  //   } else {
  //     ()->Promise.resolve
  //   }
  // }

  let setDynamicContractRegistryPromise = sql => {
    let setDynamicContractRegistry =
      dynamicContractRegistryRows->Belt.Array.keepMap(dynamicContractRegistryRow =>
        // NOTE: the currently they will all be of type 'Set', but in the future we may add functionality to also delete contracts from the registry.
        dynamicContractRegistryRow.dbOp == Types.Set
          ? Some(dynamicContractRegistryRow.entity)
          : None
      )

    if setDynamicContractRegistry->Belt.Array.length > 0 {
      sql->DbFunctions.DynamicContractRegistry.batchSetDynamicContractRegistry(
        setDynamicContractRegistry,
      )
    } else {
      ()->Promise.resolve
    }
  }

  let awesomeEntityRows = inMemoryStore.awesomeEntity->InMemoryStore.AwesomeEntity.values

  let deleteAwesomeEntityIdsPromise = sql => {
    let deleteAwesomeEntityIds =
      awesomeEntityRows
      ->Belt.Array.keepMap(awesomeEntityRow =>
        awesomeEntityRow.dbOp == Types.Delete ? Some(awesomeEntityRow.entity) : None
      )
      ->Belt.Array.map(awesomeEntity => awesomeEntity.id)

    if deleteAwesomeEntityIds->Belt.Array.length > 0 {
      sql->DbFunctions.AwesomeEntity.batchDeleteAwesomeEntity(deleteAwesomeEntityIds)
    } else {
      ()->Promise.resolve
    }
  }
  let setAwesomeEntityPromise = sql => {
    let setAwesomeEntity = awesomeEntityRows->Belt.Array.keepMap(awesomeEntityRow =>
      awesomeEntityRow.dbOp == Types.Set
        ? Some({
            ...awesomeEntityRow,
            entity: awesomeEntityRow.entity->Types.awesomeEntityEntity_encode,
          })
        : None
    )

    if setAwesomeEntity->Belt.Array.length > 0 {
      sql->DbFunctions.AwesomeEntity.batchSetAwesomeEntity(setAwesomeEntity)
    } else {
      ()->Promise.resolve
    }
  }

  let res = await sql->Postgres.beginSql(sql => {
    [
      sql->setRawEventsPromise,
      // sql->deleteDynamicContractRegistryIdsPromise, // NOTE: currently deleting dynamic contracts in unimplemented
      sql->setDynamicContractRegistryPromise,
      sql->deleteAwesomeEntityIdsPromise,
      sql->setAwesomeEntityPromise,
    ]
  })

  res
}
