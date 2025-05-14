/**
 * Generate an unique identifier
 * @returns {string} - A random characteres representing the ID
 */
function generateId(){
  const _id = Math.random().toString(36).substring(2,9)
  return _id
}

class BaseObject {
  /**
   * A base class for managing document objects, provading common interface
   * for document creation, update, and deletion.
   * @property {string} id - An unique identifier for document.
   * @property {string} label - The title for document.
   * @property {string} content - Body document in markdown format by default.
   * @property {string} tag - A category for document.
   * @property {string} icon - Emoji as icon for the document.
   * @property {string} created_at - Timestamp of when the document was created.
   * @property {string} updated_at - Timestamp of when last update was made.
   * @property {DOCUMENT_TYPES} type - Type of document(e.g 'NOTE').
   * @property {Database} db - Reference to the database instance.
   * @param {Database} database - A database manager instance used to persist or retrieve documents.
   * @returns {object} -
   */
  constructor(database){

    this.id = generateId()
    this.label = 'New Document'
    this.content = ''
    this.tag = ''
    this.icon = null
    this.created_at = new Date().toString()
    this.updated_at = new Date().toString()
    this.type = 'BASE'
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
   * Save the document into the database.
   * @returns {Promise<*>} - A promise resolving to the result of the dadtabase
   * save operation.
   */
  save(){
    this.updatedAt()
    return this.db.saveDocument(this.id,this.toJson())
  }

  /**
   * Remove document from database.
   * @returns {Promise<*>} - A promise resolving to the result of the database
   * deletion operation.
   */
  delete(){
    return this.db.removeDocument(this.id)
  }

  /**
   * Sets the document's title.
   * @param {string} label - The new title for the document.
   * @returns {void}
   */
  setLabel(label){
    this.label = label
  }

  /**
   * Set's document's tag.
   * @param {string} tag - The new tag for the document.
   */
  setTag(tag){
    this.tag = tag
  }
  /**
   * Sets the document's content body.
   * @param {string} content -The new content for the document.
   */
  setContent(content){
    this.content = content
  }

  /**
   * Sets the document emoji icon
   * @param {string} null
   */
  setIcon(icon = null){
    this.icon = icon
  }
  /**
   * Inject metadata from a JSON object into the document
   * @param {object} data - The Json object containing document metadata
   */
  fromJson(data){
    //TODO: Implement required fields and make a throw
    //throw new Error('Missing reequired field...')
    {
      this.id = data.id;
      this.label = data.label;
      this.tag = data.tag;
      this.content = data.content;
      this.icon = data.icon;
      this.created_at = data.created_at;
      this.updated_at = data.updated_at;
      this.type = data.type;
    }

  }
  /**
   * Converts the document into JSON object.
   * { id: {string}, label: string, content: string, tag: string, created_at: *, updated_at: *, type: string }
   * @returns {object} - A JSON object representing the document
   */
  toJson(){
    return {
      id: this.id,
      label: this.label,
      content: this.content,
      icon:this.icon,
      tag:this.tag,
      created_at: this.created_at,
      updated_at: this.updated_at,
      type: this.type
    };

  }
}

export default BaseObject;
