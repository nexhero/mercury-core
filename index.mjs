import Database from './lib/database.mjs'
import Corestore from 'corestore'
import b4a from 'b4a'
import Hyperswarm from 'hyperswarm'


function logError(msg){
  console.error(`** ERROR: ${msg} **`)
}
function logInfo(msg){
  console.info(`** INFO: ${msg} **`)
}
class Mercury {
  constructor(store){
    this.store = store
    this.db = new Database(store)
    this.network = null

  }
  async destroy(){
    await this.db.close()
    await this.network.destroy()
    console.log('Instance has been destroyed')
  }
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
  encodeRepository(){
    const topic = b4a.toString(this.db.discoveryKey, 'hex')
    const writerKey = b4a.toString(this.network.keyPair.publicKey, 'hex')
    const baseKey = b4a.toString(this.db.key, 'hex')
    const combined = b4a.from(`${topic}:${baseKey}:${writerKey}`)
    return b4a.toString(combined, 'base64')
  }
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
}

export default Mercury
