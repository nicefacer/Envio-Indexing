let registerMyAwesomeContractHandlers = () => {
  try {
    let _ = %raw(`require("../../src/EventHandlers.js")`)
  } catch {
  | err => {
      Logging.error(
        "EE500: There was an issue importing the handler file for MyAwesomeContract. Expected file at ../../src/EventHandlers.js",
      )
      Js.log(err)
    }
  }
}

let registerAllHandlers = () => {
  registerMyAwesomeContractHandlers()
}
