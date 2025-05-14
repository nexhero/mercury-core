import Hyperbee from 'hyperbee';
import Autobase from 'autobase';
import Corestore from 'corestore';
import crypto from 'hypercore-crypto';
import b4a from 'b4a';

/**
 * Validates a document before saving.
 * @param {object} prev - The previous state of the document.
 * @param {object} next - The new state of the document.
 * @returns {boolean} - Returns true if the document can be saved, false otherwise.
 */

const documentValidator = (prev,next)=>{
  if (prev.value !== next.value) {
    console.log('Can be saved');
  }else{
    console.log('it wont be saved');
  }
  return prev.value !== next.value;
};

/**
 * Creates a Hyperbee instance from a Corestore.
 * @param {Corestore} core - The Corestore instance.
 * @param {boolean} [extension=false] - Whether to use the extension.
 * @returns {Hyperbee} - The Hyperbee instance.
 */
const beeBuilder = (core,extension = false)=>{
  return new Hyperbee(core,{
    keyEncoding: 'utf-8',
    valueEncoding: 'json',
    extension:extension
  });
};

/**
 * Opens a Hyperbee instance for the '__documents__' core.
 * @param {Corestore} store - The Corestore instance.
 * @returns {Hyperbee} - The Hyperbee instance for the documents core.
 */
const open = (store)=>{
  const core = store.get('__documents__');
  return beeBuilder(core);
};

/**
 * Applies a batch of operations to the database.
 * @param {Array} batch - An array of operations to apply.
 * @param {View} view - The view object for the database.
 * @param {Base} base - The base object for the database.
 * @returns {void} - Applies the operations and handles errors.
 */
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

/**
 * A database class that extends Autobase to manage data, settings, and repositories.
 * @param {Corestore} store - The Corestore instance.
 */
class Database extends Autobase {
  /**
   * A database class that extends Autobase to manage data, settings, and repositories.
   * @param {Corestore} store - The Corestore instance.
   */
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

  /**
   * Retrieves the hyperswarm master key from the database.
   * @returns {Promise<string>} - A promise that resolves to the master key.
   */
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

  /**
   * Boots up the database and waits for all components to be ready.
   * @returns {Promise<boolean>} - A promise that resolves to true after initialization.
   */
  async init(){
    await Promise.all([
      super.ready(),
      this.settings.ready(),
      this.repositories.ready(),
    ]);
    return true;
  }

  /**
   * Gets the local key in hex format.
   * @returns {string} - The local key as a hex string.
   */
  getLocalKey(){
    return b4a.toString(this.key,'hex');
  }

  /**
   * Saves a document with the given ID and data.
   * @param {string} id - The ID of the document.
   * @param {object} data - The data to save.
   * @returns {Promise<void>} - A promise that resolves when the document is saved.
   */
  saveDocument(id,data){
    return this.append({
      type:'put',
      key:id,
      value:data
    });

  }

  /**
   * Retrieves a document by ID.
   * @param {string} id - The ID of the document.
   * @returns {Promise<object>} - A promise that resolves to the document data.
   */
  getDocument(id){
    return this.view.get(id);
  }

  /**
   * Retrieves a document by ID.
   * @param {string} id - The ID of the document.
   * @returns {Promise<object>} - A promise that resolves to the document data.
   */
  removeDocument(id){
    return this.append({
      type:'del',
      key:id
    });
  }
  /**
   * Retrieves all documents from the view, grouping them by their type.
   * @returns {Promise<object>} An object where keys are document type and values are arrays of documents of that type.
   */
  async getAllDocuments(){
    const documents = {}
    for await(const entry of this.view.createReadStream()){
      const doc = entry.value
      if (!(doc.type in documents)) {
        documents[doc.type] = []
      }
      documents[doc.type].push(doc)
    }
    return documents
    
  }

  /**
   * Creates a writer core for a given ID.
   * TODO: Return error and throw in case
   * @param {string} id - The ID of the writer.
   * @returns {Promise<void>} - A promise that resolves when the writer core is created.
   */
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

  /**
   * Destroys a writer core for a given ID.
   * @param {string} id - The ID of the writer to destroy.
   * @returns {Promise<void>} - A promise that resolves when the writer core is destroyed.
   */
  async destroyWriterCore(writer){
    try {
      await this.writerCores.get(writer).close();
      this.writerCores.delete(writer);
      return true;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Adds a writer to the database.
   * TODO: Return error and throw in case
   * @param {string} id - The ID of the writer.
   * @returns {Promise<void>} - A promise that resolves when the writer is added.
   */
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

  /**
   * Removes a writer from the database.
   * TODO: Return error and throw in case
   * @param {string} id - The ID of the writer to remove.
   * @returns {Promise<void>} - A promise that resolves when the writer is removed.
   */
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

  /**
   * TODO: Missing params documentation
   * Saves a channel with the given ID, data, and writer.
   * @param {string} id - The ID of the channel.
   * @param {object} data - The data for the channel.
   * @param {string} writer - The ID of the writer.
   * @returns {Promise<void>} - A promise that resolves when the channel is saved.
   */
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

  /**
   * Retrieves a channel by ID.
   * @param {string} id - The ID of the channel.
   * @returns {Promise<object>} - A promise that resolves to the channel data.
   */
  async getChannel(id){
    const c = await this.repositories.get(id);
    return c?c.value:null;

  }

  /**
   * Remove  a channel by ID.
   * @param {string} id - The ID of the channel.
   * @returns {Promise<*>} - A promise that resolves to the deletion.
   */
  removeChannel(id){
    return this.repositories.del(id);
  }

  /**
   * Appends a repository with the given ID, data, and writer.
   * @param {string} id - Either first 6 char fomr peer, or asigned name
   * @param {string} topic - Remote topic peer to connect
   * @param {string} writer - Autobase writer key
   * @param {string} peer - Remore peer public key
   * @param {string} name - Peer name
   * @returns {Promise<boolean>} - A promise that resolves when the repository is added.
   *
   */
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

  /**
   * Retrieves all repositories.
   * @returns {Promise<Array>} - A promise that resolves to an array of repositories.
   */
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
