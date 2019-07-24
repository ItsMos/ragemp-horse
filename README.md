# ragemp-horse
Horse mod for rage multiplayer

## Notes
This replaces the 'deer' model because it is fast-moving.
Horses **should** be synced, but sync wasnt really tested.
Feel free to contribute.

## Usage
```js
// server code
let pkg = require('ragemp-horse')
let allHorses = pgk.horses,
  Horse = pkg.Horse

// To create a horse
let myPony = new Horse(position, dimension)
// delete a horse
myPony.delete()
```
Press `Interact` button (default `E`) to mount/dismount a horse

## Credits
Horse model converted by Quechus13