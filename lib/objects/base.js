// BaseObject
function generateId(){
  const _id = Math.random().toString(36).substring(2,9)
  return _id
}

class BaseObject {
  /**
   * A base class for managing document objects, provading common interface
   * for document creation, update, and deletion.
   * @property {string} id - A unique identifier for document.
   * @property {string} label - The title for document.
   * @property {string} content - Body document in markdown format by default.
   * @property {string} tag - A category for document.
   * @property {string} created_at - Timestamp of when the document was created.
   * @property {string} updated_at - Timestamp of when last update was made.
   * @property {string} type - Type of document(e.g 'note').
   * @property {Database} db - Reference to the database instance.
   * @param {Database} database - A database manager instance used to persist or retrieve documents.
   * @returns {object} -
   */
  constructor(database){
    this.id = generateId()
    this.label = 'New Document'
    this.content = ''
    this.tag = ''
    this.created_at = new Date().toString()
    this.updated_at = new Date().toString()
    this.type = 'base'
    this.db = database
  }

  /**
   * Update the `update_at` timestamp to the current time.
   * @returns {void}
   */
  updatedAt(){
    this.updated_at = new Date().toString()
  }

  /**
   * Save the document into the database
   * @returns {Promise<*>} - return database.saveDocument() method
   */
  save(){
    this.updatedAt()
    return this.db.saveDocument(this.id,this.toJson())
  }

  /**
   * Remove document from database
   * @returns {Promise<*>} - return database.removeDocument method
   */
  delete(){
    return this.db.removeDocument(this.id)
  }

  /**
   * Set the document's title
   * @param {string} label -
   */
  setLabel(label){
    this.label = label
  }

  /**
   * Change document tag
   * @param {string} tag -
   */
  setTag(tag){
    this.tag = tag
  }
  /**
   * Set the content for the document
   * @param {string} content -
   */
  setContent(content){
    this.content = content
  }

  /**
   * Inject metadata from a json object into the document
   * @param {object} data -
   */

  fromJson(data){
    {
      this.id = data.id;
      this.label = data.label;
      this.tag = data.tag;
      this.content = data.content;
      this.created_at = data.created_at;
      this.updated_at = data.updated_at;
      this.type = data.type;
    }

  }
  /**
   * Parse document into json object.
   * { id: {string}, label: string, content: string, tag: string, created_at: *, updated_at: *, type: string }
   * @returns {{ id: *, label: *, content: *, tag: *, created_at: *, updated_at: *, type: * }} -
   */
  toJson(){
    return {
      id: this.id,
      label: this.label,
      content: this.content,
      tag:this.tag,
      created_at: this.created_at,
      updated_at: this.updated_at,
      type: this.type
    };

  }
}

export default BaseObject;
