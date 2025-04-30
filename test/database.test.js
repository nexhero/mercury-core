import test from 'brittle'
import Database from '../lib/database.mjs'
import RAM from 'random-access-memory'
import Corestore from 'corestore'
import fs from 'fs'

const path = './test/tmp'

if (fs.existsSync(path)) {
  fs.rmSync(path, {
    recursive: true,
    force: true
  })
}

function createMockDB(){
  // return new Database(new Corestore(path + '/'+(Math.random() + 1).toString(36).substring(7)))
  return new Database(new Corestore(RAM))
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
  for (let i = 0; i < 5; i++) {
    await db_a.saveDocument(`document_${i}`,{message:`message_${i}`})
  }
  const r = await db_a.getAllDocuments()

  if (r.length) {
    t.pass()
  }else{
    t.fail()
  }
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
