// Database
import Hyperbee from 'hyperbee';
import Autobase from 'autobase';
import Corestore from 'corestore';
import crypto from 'hypercore-crypto';
import b4a from 'b4a';

const documentValidator = (prev,next)=>{
  if (prev.value !== next.value) {
    console.log('Can be saved');
  }else{
    console.log('it wont be saved');
  }
  return prev.value !== next.value;
};
const beeBuilder = (core,extension = false)=>{
  return new Hyperbee(core,{
    keyEncoding: 'utf-8',
    valueEncoding: 'json',
    extension:extension
  });
};

const open = (store)=>{
  const core = store.get('__documents__');
  return beeBuilder(core);
};
const apply = async (batch,view,base) =>{
  const b = view.batch({update:false});
  for (const node of batch) {
    const op = node.value;
    switch(op.type){
    case 'put':
      try {
        await b.put(op.key,op.value,{documentValidator});

      } catch (err) {
        console.error("** put failed **",String(err));
      }
      break;
    case 'del':
      try {
        await b.del(op.key, op.opts);

      } catch (err) {
        console.error("** del failed **",String(err));

      }
      break;
    case 'addWriter':

      const buff = b4a.from(op.key,'hex');
      if (typeof op.key === 'string') {
        await base.addWriter(buff,{indexer : true});
      }else{
        console.log('Not valid writter');
      }
      break;
    case 'removeWriter':
      // avoid local writer to be removed
      if(typeof op.key ==='string' && op.key !== b4a.toString(base.key) ){
        const buff = b4a.from(op.key,'hex');
        await base.removeWriter(buff);
      }
      break;
    default:
      //**  */
    }
    await b.flush();
  }
}


class Database extends Autobase {
  constructor(store){
    super(store,{
      keyEncoding:'utf-8',
      valueEncoding:'json',
      open,
      apply
    });
    this.store = store;
    this.settings = beeBuilder(this.store.get({name:'__settings__'}),true);
    this.repositories = beeBuilder(this.store.get({name:'__writer__'}),true);
    this.writerCores = new Map();
    this.localChannel = '';
    this.documents = [];
  }
  async getSeed(){
    const seed = await this.settings.get('seed');
    if (seed) {
      return seed.value.key;
    }else{
      const buff = crypto.randomBytes(32);
      const key = b4a.toString(buff,'hex');
      await this.settings.put('seed',{key:key});
      return key;
    }
  }
  async init(){
    await Promise.all([
      super.ready(),
      this.settings.ready(),
      this.repositories.ready(),
    ]);
    return true;
  }
  getLocalKey(){
    return b4a.toString(this.key,'hex');
  }
  saveDocument(id,data){
    return this.append({
      type:'put',
      key:id,
      value:data
    });

  }
  getDocument(id){
    return this.view.get(id);
  }

  removeDocument(id){
    return this.append({
      type:'del',
      key:id
    });
  }
  async getAllDocuments(){
    const arr = [];
    const tagBatch = [];
    for await(const doc of this.view.createReadStream()){
      const document = doc.value;
      const indexTag = arr.findIndex((t)=>t.value === document.tag);
      if (document.tag) {
        if (indexTag>=0) {
          // Tag already exist, add the document as child
          arr[indexTag].children.push({
            label:document.label,
            value:document.id,
            content:document.content,
            id:document.id,
            tag:document.tag,
            created_at:document.created_at,
            updated_at:document.updated_at,
            type:'note',
            children:[]
          });
        }else{
          // New tag appended to the array
          arr.push({
            label: document.tag,
            value: document.tag,
            children: [],
            type:'tag'
          });
          tagBatch.push(document.tag);
          arr[arr.length-1].children.push({
            label:document.label,
            value:document.id,
            content:document.content,
            tag:document.tag,
            id:document.id,
            created_at:document.created_at,
            updated_at:document.updated_at,
            type:'note',
            children:[]
          });
        }
        // document has no tag, and is added to the root
      }else{
        arr.push({
          label: document.label,
          value: document.id,
          content:document.content,
          id:document.id,
          tag:document.tag,
          created_at:document.created_at,
          updated_at:document.updated_at,
          children: [],
          type:document.type
        });
      }
    }
    return arr;
  }

  async createWriterCore(writer){
    try {
      this.writerCores.set(writer, beeBuilder(this.store.get({key:writer})));
      await this.writerCores.get(writer).ready();
      await this.writerCores.get(writer).update();
      this.writerCores.get(writer).core.on('append',async()=>{
        await this.update();
        console.log(`** Appending data from ${writer}`);
      });
      console.log(`** Core is up ${writer}`);
      return true;
    } catch (err) {
      throw err;
    }
  }
  async destroyWriterCore(writer){
    try {
      await this.writerCores.get(writer).close();
      this.writerCores.delete(writer);
      return true;
    } catch (err) {
      throw err;
    }
  }
  async addWriter(writer){
    try {
      await this.append({
        type:'addWriter',
        key:writer
      });
      return true;
    } catch (err) {
      throw err;
    }
  }
  async removeWriter(writer){
    try {
      await this.append({
        type:'removeWriter',
        key:writer
      });
      return true;
    } catch (err) {
      throw err;
    }
  }
  async saveChannel(id,topic,writer,peer,name){
    try {
      await this.repositories.put(id,{
        name:name,
        topic:topic,
        writer:writer,
        peer:peer
      });
      return true;
    } catch (err) {
      console.log('Error found',err);
      throw err;
    }

  }
  async getChannel(id){
    const c = await this.repositories.get(id);
    return c?c.value:null;

  }
  removeChannel(id){
    return this.repositories.del(id);
  }
  async appendRepository(id,topic,writer,peer,name){
    try {
      await this.createWriterCore(writer);
      await this.addWriter(writer);
      await this.saveChannel(id,topic,writer,peer,name);
      await this.update();
      return true;
    } catch (err) {
      throw err;
    }
  }
  async getAllRepositories(){
    const arr = [];
    for await(const channel of this.repositories.createReadStream()){
      arr.push({
        id:channel.key,
        name:channel.value.name,
        topic:channel.value.topic,
        writer:channel.value.writer,
        peer:channel.value.peer,
      });
    }
    return arr;
  }
}

export default Database;
