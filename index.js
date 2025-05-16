
import Database from './lib/database.js'
import Corestore from 'corestore'
import b4a from 'b4a'
import Hyperswarm from 'hyperswarm'
import DocumentFactory from './lib/objects/index.js';

function logError(msg){
  console.error(`** ERROR: ${msg} **`)
}
function logInfo(msg){
  console.info(`** INFO: ${msg} **`)
}

class Mercury {
  /**
   * Main class for managing peer-to-peer network operations
   * @param {Corestore} store - Corestore instance for persistent storage
   */
  constructor(store){
    this.store = store
    this.db = new Database(store)
    this.network = null

  }
  /**
   * Destroy the instance and clean up resources
   * @returns {Promise} - Promise that resolves when cleanup is complete
   */
  async destroy(){
    await this.db.close()
    await this.network.destroy()
    console.log('Instance has been destroyed')
  }
  /**
   * Initialize the network and database
   * @returns {Promise} - Promise that resolves when initialization is complete
   */
  async initialize(){
    try {
      await this.store.ready()
      await this.db.init()
      const seed = await this.db.getSeed()
      this.network = new Hyperswarm({seed:b4a.from(seed,'hex')})
      const discovery = this.network.join(this.db.discoveryKey,{client:true,server:true})
      discovery.flushed().then(()=>{
        this.joinAllKnownRepositories()
      })
    } catch (err) {
      logError(String(err))
      throw err
    }
  }

  /**
   * Listen for network connections
   * @returns {void}
   */
  listen(){
    console.log(`** Ready for connection **`)
    this.network.on('connection',(peer)=>{
      console.log(`** Peer connected ${b4a.toString(peer.remotePublicKey, 'hex')}`)
      this.db.replicate(peer)

      peer.on('error',(err)=>{
        console.error(`** Peer has beed disconected ${b4a.toString(peer.remotePublicKey, 'hex')}`)
      })
    })
  }

  /**
   * Encode repository information into a base64 string
   * @returns {string} - Base64 encoded repository information
   */
  encodeRepository(){
    const topic = b4a.toString(this.db.discoveryKey, 'hex')
    const writerKey = b4a.toString(this.network.keyPair.publicKey, 'hex')
    const baseKey = b4a.toString(this.db.key, 'hex')
    const combined = b4a.from(`${topic}:${baseKey}:${writerKey}`)
    return b4a.toString(combined, 'base64')
  }

  /**
   * Decode a base64 encoded repository string
   * @param {string} encodedRepo - Base64 encoded repository string
   * @returns {Object} - Decoded repository information
   * @throws {Error} - If the repository string is invalid
   */
  decodeRepository(encodedRepo) {
    try {
      const decodedBuffer = b4a.from(encodedRepo, 'base64')
      const decodedString = b4a.toString(decodedBuffer, 'utf-8')
      const [topic, writer, peer] = decodedString.split(':')
      if (!topic || !writer || !peer) throw new Error('Incomplete repository info')
      return { topic, writer, peer }
    } catch (err) {
      throw new Error('Invalid repository string format')
    }
  }

  /**
   * Join a remote repository
   * @param {string} encodedRepo - Base64 encoded repository string
   * @param {string} name - Optional display name for the repository
   * @returns {string} - Confirmation message
   * @throws {Error} - If the repository join fails
   */
  async joinRemoteRepository(encodedRepo, name) {
    try {
      const { topic, writer, peer } = this.decodeRepository(encodedRepo)
      const id = peer.slice(0, 8)
      const displayName = name || id

      const topicBuffer = b4a.from(topic, 'hex')
      const discovery = this.network.join(topicBuffer)
      await discovery.flushed()

      await this.db.appendRepository(id, topic, writer, peer, displayName)
      console.log(`** Repository ${displayName} has been added **`)
      console.log(
        `
          ** Repository ${displayName} has been added
          ** Connected to ${topic} topic
        `
      )
      return `Connected to ${displayName}'s repository`
    } catch (err) {
      console.error('Failed to join remote repository:', err)
      throw err
    }
  }

  /**
   * Remove a repository
   * @param {string} repoId - Repository ID
   * @returns {Promise} - Promise that resolves when removal is complete
   * @throws {Error} - If the repository removal fails
   */
  async removeRepository(repoId) {
    try {
      const repo = await this.db.getChannel(repoId)
      await this.db.removeChannel(repoId)
      await this.network.leave(b4a.from(repo.topic, 'hex'))
      console.log(`Repository ${repo.name} removed`)
    } catch (err) {
      console.error('Failed to remove repository:', err)
      throw err
    }
  }

  /**
   * Join all known repositories
   * @returns {Promise} - Promise that resolves when all repositories are joined
   * @throws {Error} - If joining repositories fails
   */
  async joinAllKnownRepositories() {
    try {
      const repos = await this.db.getAllRepositories()
      for (const repo of repos) {
        await this.db.createWriterCore(repo.writer)
        const topicBuffer = b4a.from(repo.topic, 'hex')
        const discovery = this.network.join(topicBuffer)
        await discovery.flushed()
        console.log(`** Joined repository: ${repo.name} | ${repo.topic} **`)
      }
    } catch (err) {
      console.error('Error while joining known repositories:', err)
      throw err
    }
  }

  /**
 * Creates a document instance based on the specified type using the database.
 * @param {string} type - The type of document to create (e.g., "BASE", "NOTE").
 * @param {Object} [metadata] - Optional metadata to set on the document.
 * @returns {BaseObject} - The created document instance.
 * @throws {Error} - If the document type is invalid or unsupported.
 * @see DocumentFactory - The factory used to create the document.
 */
  createDocument(type,metadata=null){
    try {
      const doc = DocumentFactory.createDocument(type,this.db);
      if (metadata) {
        doc.fromJson(metadata)
      }
      return doc
    } catch (err) {
      throw Error(String(err))
    }
  }
}

export default Mercury
