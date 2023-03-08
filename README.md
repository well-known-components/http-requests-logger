# HTTP requests logger component

This component logs each incoming request and response. When a request is initiated in the service, the component will log it and when it gets resolved, it will log the response.

## Usage

### Set up

The HTTP requests logger component is pretty straightforward to use, just import the component and initialize it with the log and the server components before any router:

```ts
import { instrumentHttpServerWithRequestLogger } from '@well-known-components/http-requests-logger'
import { createConfigComponent } from '@well-known-components/env-config-provider'
import { createServerComponent } from '@well-known-components/http-server'
import { createLogComponent } from '@well-known-components/logger'

const config = createConfigComponent(process.env, defaultValues)
const server = await createServerComponent<GlobalContext>({ config, logs }, { cors, compression: {} })
const logs = await createLogComponent()
instrumentHttpServerWithRequestLogger({ server, logger: logs })
```

Although only the server and the log components are required for this component to work, it is recommended to be used alongside the [tracer](https://github.com/well-known-components/tracer-component) and [http-tracer components](https://github.com/well-known-components/http-tracer-component) to make it possible to track and match each of the input and output requests.

```ts
import { instrumentHttpServerWithRequestLogger } from '@well-known-components/http-requests-logger'
import { createConfigComponent } from '@well-known-components/env-config-provider'
import { createServerComponent } from '@well-known-components/http-server'
import { createLogComponent } from '@well-known-components/logger'
import { createHttpTracerComponent } from '@well-known-components/http-tracer-component'
import { createTracerComponent } from '@well-known-components/tracer-component'

const tracer = createTracerComponent()
const config = createConfigComponent(process.env, defaultValues)
const server = await createServerComponent<GlobalContext>({ config, logs }, { cors, compression: {} })
const logs = await createLogComponent()
createHttpTracerComponent({ server, tracer })
instrumentHttpServerWithRequestLogger({ server, logger: logs })
```

This set up, alongside the default configurations, will produce the following logs:

```
[0-ae513d7468d8df8d9418e2bbee9d3c5b-0000000000000000-0] 2023-03-05T16:47:20.334Z [INFO] (http-in): [GET: /v1/items?contractAddress=0xa8dcccf8beeefdf07157dceeb4351afe8c4edf1a&itemId=0]
[0-ae513d7468d8df8d9418e2bbee9d3c5b-0000000000000000-0] 2023-03-05T16:47:21.431Z [INFO] (http-out): [GET: /v1/items?contractAddress=0xa8dcccf8beeefdf07157dceeb4351afe8c4edf1a&itemId=0][200]
```

> Notice:
> Although the example has the input and the output logs one next to the other, the service might resolve other requests at the same time, interpolating the request and response logs.

### Configuration

The component allows the following configurations via a config parameter:

- verbosity: The verbosity on which the logs will be outputted. Defaults to INFO.
- inputLog: A customizable function that defines how the input log will be outputted. Defaults to outputting `[$method: $path$search$hash]`.
- outputLog: A customizable function that defines how the output log will be outputted. Defaults to outputting `[$method: $path$search$hash][$status]`.
- skipInput: A flag to disable the outputting of the input log.
- skipOutput: A flag to disable the outputting of the output log.
- skip: A flexible parameter to define how to skip the logging of endpoints. Defaults to skipping the `/health/live` endpoint.
