import {BaseObject} from './base'

export default class NoteObject extends BaseObject {
  constructor(storage){
    super(storage)
    this.type = 'note'
  }
}
