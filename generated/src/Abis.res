// TODO: move to `eventFetching`

let myAwesomeContractAbi = `
    [{"type":"event","name":"AwesomeEvent","inputs":[{"name":"identifier","type":"string","indexed":true},{"name":"awesomeAddress","type":"address","indexed":true},{"name":"awesomeValue","type":"uint256","indexed":false}],"anonymous":false}]
    `->Js.Json.parseExn
