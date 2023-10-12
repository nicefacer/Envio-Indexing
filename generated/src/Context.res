module MyAwesomeContractContract = {
  module AwesomeEventEvent = {
    type context = Types.MyAwesomeContractContract.AwesomeEventEvent.context

    type contextCreatorFunctions = {
      getLoaderContext: unit => Types.MyAwesomeContractContract.AwesomeEventEvent.loaderContext,
      //
      getContext: (
        ~eventData: Types.eventData,
        unit,
      ) => Types.MyAwesomeContractContract.AwesomeEventEvent.context,
      getEntitiesToLoad: unit => array<Types.entityRead>,
      getAddedDynamicContractRegistrations: unit => array<Types.dynamicContractRegistryEntity>,
    }
    let contextCreator: (
      ~inMemoryStore: IO.InMemoryStore.t,
      ~chainId: int,
      ~event: Types.eventLog<'a>,
      ~logger: Pino.t,
    ) => contextCreatorFunctions = (~inMemoryStore, ~chainId, ~event, ~logger) => {
      let logger =
        logger->Logging.createChildFrom(
          ~logger=_,
          ~params={"userLog": "MyAwesomeContract.AwesomeEvent.context"},
        )
      let optSetOfIds_awesomeEntity: Set.t<Types.id> = Set.make()

      let entitiesToLoad: array<Types.entityRead> = []

      let addedDynamicContractRegistrations: array<Types.dynamicContractRegistryEntity> = []

      @warning("-16")
      let loaderContext: Types.MyAwesomeContractContract.AwesomeEventEvent.loaderContext = {
        contractRegistration: {
          //TODO only add contracts we've registered for the event in the config
          addMyAwesomeContract: (contractAddress: Ethers.ethAddress) => {
            let eventId = EventUtils.packEventIndex(
              ~blockNumber=event.blockNumber,
              ~logIndex=event.logIndex,
            )
            let dynamicContractRegistration: Types.dynamicContractRegistryEntity = {
              chainId,
              eventId,
              contractAddress,
              contractType: "MyAwesomeContract",
            }

            addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

            inMemoryStore.dynamicContractRegistry->IO.InMemoryStore.DynamicContractRegistry.set(
              ~key={chainId, contractAddress},
              ~entity=dynamicContractRegistration,
              ~eventData={chainId, eventId: eventId->Ethers.BigInt.toString},
              ~dbOp=Set,
            )
          },
        },
        awesomeEntity: {
          load: (id: Types.id) => {
            let _ = optSetOfIds_awesomeEntity->Set.add(id)
            let _ = Js.Array2.push(entitiesToLoad, Types.AwesomeEntityRead(id))
          },
        },
      }

      let getHandlerContext: (
        ~eventData: Types.eventData,
      ) => Types.MyAwesomeContractContract.AwesomeEventEvent.context = (~eventData) => {
        {
          log: {
            info: (message: string) => logger->Logging.uinfo(message),
            debug: (message: string) => logger->Logging.udebug(message),
            warn: (message: string) => logger->Logging.uwarn(message),
            error: (message: string) => logger->Logging.uerror(message),
            errorWithExn: (exn: option<Js.Exn.t>, message: string) =>
              logger->Logging.uerrorWithExn(exn, message),
          },
          awesomeEntity: {
            set: entity => {
              inMemoryStore.awesomeEntity->IO.InMemoryStore.AwesomeEntity.set(
                ~key=entity.id,
                ~entity,
                ~dbOp=Types.Set,
                ~eventData,
              )
            },
            delete: id =>
              Logging.warn(
                `[unimplemented delete] can't delete entity(awesomeEntity) with ID ${id}.`,
              ),
            get: (id: Types.id) => {
              if optSetOfIds_awesomeEntity->Set.has(id) {
                inMemoryStore.awesomeEntity->IO.InMemoryStore.AwesomeEntity.get(id)
              } else {
                Logging.warn(
                  `The loader for a "AwesomeEntity" of entity with id "${id}" was not used please add it to your default loader function (ie. place 'context.awesomeEntity.load("${id}")' inside your loader) to avoid unexpected behaviour. This is a runtime validation check.`,
                )

                // NOTE: this will still retern the value if it exists in the in-memory store (despite the loader not being run).
                inMemoryStore.awesomeEntity->IO.InMemoryStore.AwesomeEntity.get(id)

                // TODO: add a further step to syncronously try fetch this from the DB if it isn't in the in-memory store - similar to this PR: https://github.com/Float-Capital/indexer/pull/759
              }
            },
          },
        }
      }
      {
        getEntitiesToLoad: () => entitiesToLoad,
        getAddedDynamicContractRegistrations: () => addedDynamicContractRegistrations,
        getLoaderContext: () => loaderContext,
        getContext: (~eventData) => {() => getHandlerContext(~eventData)},
      }
    }
  }
}
