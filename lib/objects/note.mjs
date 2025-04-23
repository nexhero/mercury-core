import {BaseObject} from './base.mjs'

export default class NoteObject extends BaseObject {
  constructor(storage){
    super(storage)
    this.type = 'note'
  }
}
