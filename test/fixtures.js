import Database from '../lib/database.js'
import Corestore from 'corestore'

export const path = './test/tmp'

export function createMockDB(){
  return new Database(new Corestore(path + '/'+(Math.random() + 1).toString(36).substring(7)))
}
