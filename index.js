let streamConfig = mp.config["stream-distance"]
let streamRange = streamConfig ? streamConfig : 500

let horses = {}
class Horse {
  constructor(pos, dim) {
    this.id = Horse.makeId()
    // mp.players.callInRange(pos, streamRange, 'horse:new', [this.id, pos, dim])
    this.colshape = mp.colshapes.newCircle(pos.x, pos.y, streamRange)
    this.colshape.dimension = dim
    this.colshape.setVariable('horse', {
      id: this.id,
      position: pos,
      dim
    })
    horses[this.id] = this
  }

  delete() {
    mp.players.callInRange(this.colshape.position, streamRange, 'horse:delete', [this.id])
    this.colshape.destroy()
    delete horses[this.id]
  }

  static makeId() {
    let i = 0
    while (horses[i]) i++
    return i
  }
}

function syncMount(player, horseId, playerId) {
  let horse = horses[horseId]
  player.setVariable('ridingHorse', horseId)
  horse.riderId = playerId
  let horseData = horse.colshape.getVariable('horse')
  mp.players.callInRange(horseData.position, streamRange, 'horse:mount', [horseId, playerId])
}

function syncDismount(player, horseId) {
  let horse = horses[horseId]
  player.setVariable('ridingHorse', null)
  horse.riderId = null
  let horseData = horse.colshape.getVariable('horse')
  mp.players.callInRange(horseData.position, streamRange, 'horse:dismount', [horseId])
}

mp.events.add({
  playerEnterColshape(player, colshape) {
    let horseData = colshape.getVariable('horse')
    if (!horseData) return mp.players.broadcast('no horsedata for cp')

    let playerInColshapes = player.getVariable('inHorseColshapes')
    if (playerInColshapes && playerInColshapes.includes(horseData.id))
      return // player already inside colshape
    else if (!playerInColshapes) {
      playerInColshapes = []
    }
    playerInColshapes.push(horseData.id)
    player.setVariable('inHorseColshapes', playerInColshapes)

    player.call('horse:new', [horseData.id, horseData.position, horseData.dim])
    let horse = horses[horseData.id]
    if (horse.riderId != null) {
      player.call('horse:mount', [horse.id, horse.riderId])
    }
    // mp.players.broadcast('Horse colshape: entering ' + horseData.id )
  },

  playerExitColshape(player, colshape) {
    let horseData = colshape.getVariable('horse')
    if (!horseData) return
    // remove id from colshapes array
    let playerInColshapes = player.getVariable('inHorseColshapes')
    playerInColshapes = playerInColshapes.filter(id=> id !== horseData.id)
    player.setVariable('inHorseColshapes', playerInColshapes)
    player.call('horse:delete', [horseData.id])
    // mp.players.broadcast('Horse colshape: exiting ' + horseData.id )
  },

  'horse:mount': syncMount,
  'horse:dismount': syncDismount,
  'horse:update': (player, horseId, pos)=> {
    pos = JSON.parse(pos)
    let oldColshape = horses[horseId].colshape
    let newColshape = mp.colshapes.newCircle(pos.x, pos.y, streamRange)
    newColshape.playersInside = oldColshape.playersInside
    newColshape.dimension = oldColshape.dimension
    
    let horseData = oldColshape.getVariable('horse')
    horseData.position = pos
    newColshape.setVariable('horse', horseData)
    oldColshape.destroy()
    horses[horseId].colshape = newColshape
  },

  playerQuit(player) {
    let horseId = player.getVariable('ridingHorse')
    if (horseId != null) {
      syncDismount(player, horseId)
    }
  }
})

exports.Horse = Horse
exports.horses = horses