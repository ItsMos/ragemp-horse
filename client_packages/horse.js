let dict = 'timetable@mime@ig_1',
  anim = 'cowboy_riding_horse',
  lPlayer = mp.players.local,
  debug = false,
  horses = {}

function msg(str) {
  if (debug)
    mp.gui.chat.push(str)
}

function inFrontOf(pos, heading, dist) {
  heading *= Math.PI / 180
  pos.x += (dist * Math.sin(-heading))
  pos.y += (dist * Math.cos(-heading))
  return pos
}

mp.game.streaming.requestAnimDict(dict)

class Horse {
  constructor(id, pos, dim) {
    this.id = id
    // deer
    this.ped = mp.peds.new(0xD86B5A95, pos, 0, dim)
  }

  mount(playerRID) {
    if (this.rider) return
    mp.events.callRemote('horse:mount', this.id, playerRID)
    this.interval = setInterval(() => {
      mp.events.callRemote('horse:update', this.id, JSON.stringify(lPlayer.position))
    }, 1000)
  }
  
  dismount() {
    mp.events.callRemote('horse:dismount', this.id)
    clearInterval(this.interval)
  }

  setNormalRidingAnim() {
    if (!this.render) {
      this.render = new mp.Event('render', ()=> {
        let time = this.ped.getAnimCurrentTime(dict, anim)
        if (time > 0.59) {
          this.ped.setAnimCurrentTime(dict, anim, 0.5)
        }
      })
    }
  }

  doMount(playerRID) {
    let player = mp.players.atRemoteId(playerRID)
    this.rider = player
    let horseData = {
      model: this.ped.model,
      pos: this.ped.getCoords(true)
    }
    this.ped.model = player.model
    this.ped.setCoordsNoOffset(player.position.x, player.position.y, player.position.z, true,true,true)
    
    player.model = horseData.model
    player.setCoordsNoOffset(horseData.pos.x, horseData.pos.y, horseData.pos.z)
    
    this.ped.attachTo(player.handle, 0, 0.5,0,0,-90,0,-90, false,false,false, true, 0, true)
    this.ped.taskPlayAnim(dict, anim, 8, 1, -1, 1, 1, false,false,false )
    setTimeout(() => {
      this.ped.setAnimCurrentTime(dict, anim, 0.44)
    }, 100)
    setTimeout(() => {
      this.setNormalRidingAnim()
    }, 8000)
  }

  doDismount() {
    this.ped.detach(false, false)
    this.ped.clearTasks()
    let cowModel = this.rider.model
    let riderModel = this.ped.model
    this.ped.model = cowModel
    this.rider.model = riderModel
    let pos = this.ped.getCoords(true)
    pos = inFrontOf(pos, this.ped.getHeading()+90, 2)
    this.ped.setCoordsNoOffset(pos.x,pos.y,pos.z -1.5, true,true,true)
    this.ped.setHeading(this.rider.getHeading())
    this.rider = null
  }

  delete() {
    this.ped.destroy()
    if (this.render) {
      this.render.destroy()
    }
    delete horses[this.id]
  }
}

mp.events.add({
  'horse:new': (id, pos, dim)=> {
    let horse = new Horse(id, pos, dim)
    horses[id] = horse
    msg('horse:new > horse:' + id +', dim: ' + dim)
  },

  'horse:delete': id=> {
    horses[id].delete()
    msg('horse:delete > horse:' +id)
  },

  'horse:mount': (horseId, playerRID)=> {
    horses[horseId].doMount(playerRID)
    msg('horse:mount > horse:' + horseId +', player:' + playerRID)
  },

  'horse:dismount': (horseId)=> {
    horses[horseId].doDismount()
    msg('horse:dismount > horse:' + horseId)
  },

  'render': ()=> {
    if ( mp.game.controls.isControlJustPressed(13, 38) ) {
      
      if ( lPlayer.getVariable('ridingHorse') == null ) { // 0 == false
        let streamedHorses = player.getVariable('inHorseColshapes')
        if (streamedHorses) {
          let leastDist = 100,
            closestHorse = null
          streamedHorses.forEach(horseId => {
            let pos = horses[horseId].ped.getCoords(true)
            let pos2 = lPlayer.position
            let dist = mp.game.system.vdist2(pos.x, pos.y, pos.z, pos2.x, pos2.y, pos2.z)
            if (dist < leastDist) {
              leastDist = dist
              closestHorse = horseId
            }
          })
          if (closestHorse != null && leastDist < 2)
            horses[closestHorse].mount(lPlayer.remoteId)
        }
      } else {
        // player is riding
        let horseId = lPlayer.getVariable('ridingHorse')
        if (horseId != null)
          horses[horseId].dismount()
      }
    }
  }
})