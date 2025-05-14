import test from 'brittle'
import {createMockDB,path} from './fixtures.js';
import fs from 'fs';
import DocumentFactory, {DOCUMENT_TYPES} from '../lib/objects/index.js'

if (fs.existsSync(path)) {
  fs.rmSync(path, {
    recursive: true,
    force: true
  })
}


const db_a = createMockDB()
const db_b = createMockDB()

test('init',async function(t){
  await db_a.init()
  await db_b.init()

})
test('localKey', function(t){
  if (typeof db_a.getLocalKey()  === 'string') {
    t.pass()
  }else{
    t.fail()
  }
})
test('seed', async function (t) {
  const db = createMockDB()
  const seed = await db.getSeed()
  if (typeof seed  === 'string') {
    t.pass()
  }else{
    t.fail()
  }
})
test('saveDocument', async function(t){
  try {
    await db_a.saveDocument('doc_1',{message:"HELLO"} )
    t.pass()
  } catch (err) {
    t.fail()
  }
})

test('getDocument',async function(t){
  const b = await db_a.getDocument('doc_1')
  if (b) {
    t.pass()
  }else{
    t.fail()
  }
})

test('removeDocument',async function(t){
  try {
    await db_a.removeDocument('doc_1')
    t.pass()
  } catch (err) {
    t.fail()
  }
})

test('getAllDocument',async function(t){
  const opts = ['BASE','NOTE']
  for (let i = 0; i < 10; i++) {
    const obj = DocumentFactory.createDocument(
      opts[Math.floor(Math.random() * opts.length)],
      db_a
    );
    obj.setLabel(`title_${i}`)
    obj.setContent(`content_${i}`)
    await obj.save()
    // await db_a.saveDocument(`document_${i}`,{message:`message_${i}`})
  }
  const r = await db_a.fetchAllDocuments()
  console.log(r)
  t.pass
  // if (r.length) {
  //   t.pass()
  // }else{
  //   t.fail()
  // }
})

test('createWriterCore',async function(t){
  const c = await db_a.createWriterCore(db_b.getLocalKey())
  t.is(c,true)
})
test('destroyWriteCore',async function(t){
  const c = await db_a.destroyWriterCore(db_b.getLocalKey())
  t.is(c,true)
})
test('addWriter', async function(t){
  const c = await db_a.addWriter(db_b.getLocalKey())
  t.is(c,true)
})
test('removeWriter', async function(t){
  const c = await db_a.removeWriter(db_b.getLocalKey())
  t.is(c,true)
})
test('saveChannel',async function(t){
  const c = await db_a.saveChannel('id_b','topic_b',db_b.getLocalKey(),'peer_b','db_b')

  t.is(c,true)
})
test('getChannel',async function(t){
  const c = await db_a.getChannel('id_b')
  t.not(c,null)
})
test('removeChannel',async function(t){
  const c = await db_a.removeChannel('id_b')
  t.pass()
})
test('appendRepository',async function(t){
  const c = await db_a.appendRepository('id_b','topic_b',db_b.getLocalKey(),'peer_b','db_b')
  await db_b.saveDocument('doc_b_1',{message:'remote channel'})
  t.is(c,true)
})
