import BaseObject from './base'


class NoteObject extends BaseObject {
  /**
   * Represent a node document
   * @augments BaseObject
   * @param {Database} database - A database manager instance used to persist or retrieve documents.
   * @returns {object} -
   */
  constructor(database){
    super(database);
    this.type = 'note';
  }
}

export default NoteObject;
