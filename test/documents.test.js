import test from 'brittle'
import DocumentFactory, {DOCUMENT_TYPES} from '../lib/objects/index.js'
import  {createMockDB} from './fixtures.js'

const temp_db =  createMockDB();
test('factory-base',function(t){
    const base = DocumentFactory.createDocument('BASE',temp_db);
    t.ok(base.type = DOCUMENT_TYPES.BASE)
})

test('factory-note',function(t){
    const base = DocumentFactory.createDocument(DOCUMENT_TYPES.NOTE,temp_db);
    t.ok(base.type = DOCUMENT_TYPES.NOTE)
})

test('invalid_document',function(t){
    t.exception(
        ()=>DocumentFactory.createDocument('NONE',temp_db),
        /Document type not recognized/
    );
})
