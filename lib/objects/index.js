export {default as BaseObject} from './base.js'
export {default as NoteObject} from './note.js'
export {default as TagObject} from './tag.js'
import BaseObject from './base.js';
import NoteObject from './note.js';
import TagObject from './tag.js';
/**
 * @constant {Object} DOCUMENT_TYPES - Document type constants
 * @property {DocumentType} BASE - Base document type.
 * @property {DocumentType} NOTE - Note document type.
 * @property {DocumentType} TAG - TAG document type.
 */
export const DOCUMENT_TYPES = Object.freeze({
    BASE:'BASE',
    NOTE:'NOTE',
    TAG:'TAG',
})

/**
 * @class DocumentFactory - Factory for creating document instances
 */
class DocumentFactory {
    /**
     * @static
     * @property {Object} documentTypes - Mapping of document types to classes
     * @property {BaseObject} BASE - Base document class
     * @property {NoteObject} NOTE - Note document class
     * @property {TagObject} TAG - Tag document class
     */
    static documentTypes ={
        BASE:BaseObject,
        NOTE:NoteObject,
        TAG:TagObject
    }
    /**
     * Creates a document instance based on the specified type.
     * @static
     * @param {DocumentType} [documentType=DOCUMENT_TYPES.BASE] - Document type
     * @param {Database} database - Database instance
     * @returns {BaseObject|NoteObject} - Document instance
     * @throws {Error} - If document type is unrecognized
     */
    static createDocument(documentType = DOCUMENT_TYPES.BASE, database){
        const docClass = this.documentTypes[documentType];
        if (!docClass) {
            throw new Error("Document type not recognized")
        }
        return new docClass(database);
    }

}

export default DocumentFactory;
