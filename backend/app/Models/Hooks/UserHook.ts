import Env from '@ioc:Adonis/Core/Env'
import { v5 as uuidV5 } from 'uuid'
import { DateTime } from 'luxon'

import Hash from '@ioc:Adonis/Core/Hash'

import User from 'App/Models/User'

import crypto from 'crypto'

import PasswordGenerator from 'secure-random-password'

const UUID_NAMESPACE = Env.get('UUID_NAMESPACE')

interface UserHookContract {
  hashPassword: (userInstance: User) => void
  preparePassword: (value: string) => Promise<string>
  generateUUID: (userInstance: User) => void
  generateActivationCode: (userInstance: User) => void
}

const UserHook: UserHookContract = {
  /**
   * Hash password for the User Instance
   * @param {object} userInstance - The color, in hexadecimal format.
   * @function UserHook.hashPassword
   * @return null
   */
  hashPassword: async (userInstance) => {
    try {
      if (userInstance.$dirty.password) {
        userInstance.password = await Hash.make(userInstance.password)
      }
    } catch (error) {
      console.log(error)
    }
  },

  preparePassword: (value) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('from preparePassword. before hashing: ', value)

        const hashed = await Hash.make(value)
        console.log('from preparePassword. after hashing: ', hashed)

        resolve(hashed)
      } catch (error) {
        console.log(error)

        reject(error)
      }
    })
  },

  generateUUID: (userInstance) => {
    const randomString = PasswordGenerator.randomString({
      length: 15,
    })
    userInstance.id = uuidV5(userInstance.email + randomString, UUID_NAMESPACE)
  },

  generateActivationCode: (userInstance) => {
    userInstance.activation_code = crypto.randomBytes(20).toString('hex')
    userInstance.activation_code_expires_at = DateTime.now().plus({ days: 2 })
  },
}

export default UserHook
