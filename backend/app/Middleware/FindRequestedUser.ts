import User from 'App/Models/User'
import NoEntityDefinedException from 'App/Exceptions/NoEntityDefinedException'
import { CustomContextContract } from '../Controllers/types/index'

export default class FindRequestedUser {
  public async handle(ctx: CustomContextContract, next: () => Promise<void>) {
    // code for middleware goes here. ABOVE THE NEXT CALL
    const { user_id } = ctx.params

    if (!user_id) throw new NoEntityDefinedException('No user is provided!')

    let user
    try {
      user = await User.findOrFail(user_id)
    } catch (error) {
      return ctx.response.notFound({ message: 'Unknown user was requested' })
    }

    ctx.requestedUser = user

    await next()
  }
}
