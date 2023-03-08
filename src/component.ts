import { IHttpServerComponent, ILoggerComponent } from '@well-known-components/interfaces'
import { HEALTH_PATH } from './constants'
import { shouldSkip } from './logic'
import { RequestLoggerConfigurations, Verbosity } from './types'

export function instrumentHttpServerWithRequestLogger(
  components: {
    server: IHttpServerComponent<object>
    logger: ILoggerComponent
  },
  config?: RequestLoggerConfigurations
): void {
  const { server, logger } = components
  const verbosity = config?.verbosity ?? Verbosity.INFO
  const inLogger = logger.getLogger('http-in')
  const outLogger = logger.getLogger('http-out')

  server.use((ctx: IHttpServerComponent.DefaultContext<object>, next) => {
    const skipInput = config?.skipInput
    const skipOutput = config?.skipOutput
    // Skip health checks by default
    const skip = shouldSkip(ctx, config?.skip ?? HEALTH_PATH)

    const inLog = config?.inputLog ? config.inputLog(ctx.request) : `[${ctx.request.method}: ${ctx.url.pathname}]`
    if (!skipInput && !skip) {
      inLogger[verbosity](inLog)
    }
    return next().then(response => {
      if (!skipOutput && !skip) {
        outLogger[verbosity](
          config?.outputLog ? config.outputLog(ctx.request, response) : `[${ctx.request.method}: ${ctx.url.pathname}][${response.status}]`
        )
      }
      return response
    })
  })
}
