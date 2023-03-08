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

  server.use(async (ctx: IHttpServerComponent.DefaultContext<object>, next) => {
    const skipInput = config?.skipInput
    const skipOutput = config?.skipOutput
    // Skip health checks by default
    const skip = shouldSkip(ctx, config?.skip ?? HEALTH_PATH)

    const inLog = config?.inputLog ? config.inputLog(ctx.request) : `[${ctx.request.method}: ${ctx.url.pathname}]`
    if (!skipInput && !skip) {
      inLogger[verbosity](inLog)
    }
    let response: IHttpServerComponent.IResponse | undefined = undefined

    try {
      response = await next()
      return response
    } catch (e) {
      // Craft a custom response with the purpose of printing the log
      let statusCode = 200
      if (typeof e === 'object' && e !== null && e !== undefined) {
        if ('status' in e && typeof e.status == 'number') {
          statusCode = e.status
        } else if ('statusCode' in e && typeof e.statusCode == 'number') {
          statusCode = e.statusCode
        }
      }
      response = {
        status: statusCode
      }
      throw e
    } finally {
      if (!skipOutput && !skip && response) {
        outLogger[verbosity](
          config?.outputLog ? config.outputLog(ctx.request, response) : `[${ctx.request.method}: ${ctx.url.pathname}][${response.status}]`
        )
      }
    }
  })
}
