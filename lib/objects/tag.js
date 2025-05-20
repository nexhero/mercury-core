import BaseObject from './base.js'

class TagObject extends BaseObject {
  /**
   * Represent a tag document
   * @augments BaseObject
   * @param {Database} database - A database manager instance used to persist or retrieve documents.
   * @returns {object} -
   */
  constructor(database){
    super(database);
    this.type = 'TAG';
    this.label = 'New Tag';
    this.icon = '🏷';
  }
}

export default TagObject;
