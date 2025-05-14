import BaseObject from './base.js'

class NoteObject extends BaseObject {
  /**
   * Represent a node document
   * @augments BaseObject
   * @param {Database} database - A database manager instance used to persist or retrieve documents.
   * @returns {object} -
   */
  constructor(database){
    super(database);
    this.type = 'NOTE';
  }
}

export default NoteObject;
