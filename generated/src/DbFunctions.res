let config: Postgres.poolConfig = {
  ...Config.db,
  transform: {undefined: Js.null},
}
let sql = Postgres.makeSql(~config)

type chainId = int
type eventId = string
type blockNumberRow = {@as("block_number") blockNumber: int}

module RawEvents = {
  type rawEventRowId = (chainId, eventId)
  @module("./DbFunctionsImplementation.js")
  external batchSetRawEvents: (Postgres.sql, array<Types.rawEventsEntity>) => promise<unit> =
    "batchSetRawEvents"

  @module("./DbFunctionsImplementation.js")
  external batchDeleteRawEvents: (Postgres.sql, array<rawEventRowId>) => promise<unit> =
    "batchDeleteRawEvents"

  @module("./DbFunctionsImplementation.js")
  external readRawEventsEntities: (
    Postgres.sql,
    array<rawEventRowId>,
  ) => promise<array<Types.rawEventsEntity>> = "readRawEventsEntities"

  @module("./DbFunctionsImplementation.js")
  external getRawEventsPageGtOrEqEventId: (
    Postgres.sql,
    ~chainId: chainId,
    ~eventId: Ethers.BigInt.t,
    ~limit: int,
    ~contractAddresses: array<Ethers.ethAddress>,
  ) => promise<array<Types.rawEventsEntity>> = "getRawEventsPageGtOrEqEventId"

  @module("./DbFunctionsImplementation.js")
  external getRawEventsPageWithinEventIdRangeInclusive: (
    Postgres.sql,
    ~chainId: chainId,
    ~fromEventIdInclusive: Ethers.BigInt.t,
    ~toEventIdInclusive: Ethers.BigInt.t,
    ~limit: int,
    ~contractAddresses: array<Ethers.ethAddress>,
  ) => promise<array<Types.rawEventsEntity>> = "getRawEventsPageWithinEventIdRangeInclusive"

  ///Returns an array with 1 block number (the highest processed on the given chainId)
  @module("./DbFunctionsImplementation.js")
  external readLatestRawEventsBlockNumberProcessedOnChainId: (
    Postgres.sql,
    chainId,
  ) => promise<array<blockNumberRow>> = "readLatestRawEventsBlockNumberProcessedOnChainId"

  let getLatestProcessedBlockNumber = async (~chainId) => {
    let row = await sql->readLatestRawEventsBlockNumberProcessedOnChainId(chainId)

    row->Belt.Array.get(0)->Belt.Option.map(row => row.blockNumber)
  }
}

module DynamicContractRegistry = {
  type contractAddress = Ethers.ethAddress
  type dynamicContractRegistryRowId = (chainId, contractAddress)
  @module("./DbFunctionsImplementation.js")
  external batchSetDynamicContractRegistry: (
    Postgres.sql,
    array<Types.dynamicContractRegistryEntity>,
  ) => promise<unit> = "batchSetDynamicContractRegistry"

  @module("./DbFunctionsImplementation.js")
  external batchDeleteDynamicContractRegistry: (
    Postgres.sql,
    array<dynamicContractRegistryRowId>,
  ) => promise<unit> = "batchDeleteDynamicContractRegistry"

  @module("./DbFunctionsImplementation.js")
  external readDynamicContractRegistryEntities: (
    Postgres.sql,
    array<dynamicContractRegistryRowId>,
  ) => promise<array<Types.dynamicContractRegistryEntity>> = "readDynamicContractRegistryEntities"

  type contractTypeAndAddress = {
    @as("contract_address") contractAddress: Ethers.ethAddress,
    @as("contract_type") contractType: string,
    @as("event_id") eventId: Ethers.BigInt.t,
  }
  ///Returns an array with 1 block number (the highest processed on the given chainId)
  @module("./DbFunctionsImplementation.js")
  external readDynamicContractsOnChainIdAtOrBeforeBlock: (
    Postgres.sql,
    ~chainId: chainId,
    ~startBlock: int,
  ) => promise<array<contractTypeAndAddress>> = "readDynamicContractsOnChainIdAtOrBeforeBlock"
}

type readEntityData<'a> = {
  entity: 'a,
  eventData: Types.eventData,
}

module AwesomeEntity = {
  open Types
  @spice
  type awesomeEntityReadRow = {
    id: string,
    awesomeAddress: string,
    awesomeTotal: Ethers.BigInt.t,
    @spice.key("event_chain_id") chainId: int,
    @spice.key("event_id") eventId: Ethers.BigInt.t,
  }

  let readRowToReadEntityData = (readRowJson: Js.Json.t): readEntityData<
    Types.awesomeEntityEntity,
  > => {
    let readRow = switch readRowJson->awesomeEntityReadRow_decode {
    | Ok(v) => Ok(v)
    | Error(e) =>
      Logging.error({
        "err": e,
        "msg": "EE700: Unable to parse row from database of entity awesomeEntity using spice",
        "raw_unparsed_object": readRowJson,
      })
      Error(e)
    }->Belt.Result.getExn

    let {id, awesomeAddress, awesomeTotal, chainId, eventId} = readRow

    {
      entity: {
        id,
        awesomeAddress,
        awesomeTotal,
      },
      eventData: {
        chainId,
        eventId: eventId->Ethers.BigInt.toString,
      },
    }
  }

  @module("./DbFunctionsImplementation.js")
  external batchSetAwesomeEntity: (
    Postgres.sql,
    array<Types.inMemoryStoreRow<Js.Json.t>>,
  ) => promise<unit> = "batchSetAwesomeEntity"

  @module("./DbFunctionsImplementation.js")
  external batchDeleteAwesomeEntity: (Postgres.sql, array<Types.id>) => promise<unit> =
    "batchDeleteAwesomeEntity"

  @module("./DbFunctionsImplementation.js")
  external readAwesomeEntityEntities: (Postgres.sql, array<Types.id>) => promise<array<Js.Json.t>> =
    "readAwesomeEntityEntities"
}
