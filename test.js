{


const moduleName = 'cookieGardenHelper';

const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);
const uncapitalize = (word) => word.charAt(0).toLowerCase() + word.slice(1);
const clone = (x) => JSON.parse(JSON.stringify(x));
const doc = {
  elId: document.getElementById.bind(document),
  qSel: document.querySelector.bind(document),
  qSelAll: document.querySelectorAll.bind(document),
}

class Config {
  static get default() {
    return {
      autoHarvest: false,
      autoHarvestNewSeeds: true,
      autoHarvestAvoidImmortals: true,
      autoHarvestWeeds: true,
      autoHarvestCleanGarden: false,
      autoHarvestCheckCpSMult: false,
      autoHarvestMiniCpSMult: { value: 1, min: 0 },
      autoHarvestDying: true,
      autoHarvestDyingSeconds: 5,
      autoHarvestCheckCpSMultDying: false,
      autoHarvestMiniCpSMultDying: { value: 1, min: 0 },
      autoPlant: false,
      autoPlantCheckCpSMult: false,
      autoPlantMaxiCpSMult: { value: 0, min: 0 },
      savedPlot: [],
      playSound: false,
      playSound2: false,
      logLevel: { value: 0, min: 0 },
      autoReload: false,
      autoReloadX: { value: 0, min: 0, max: 5 },
      autoReloadY: { value: 0, min: 0, max: 5 },
      autoReloadID: { value: 0, min: 0 },
      autoReloadMax: { value: 0, min: 0 },
      autoReloadSave: "",
      autoReloadSaveSecond: 9999,
      autoReloadReloads: 0,
      autoReloadNumber: 0,
      autoReload2: false,
      autoReload2ID: { value: 0, min: 0 },
      autoReload2Grow: { value: 0, min: 0 },
      autoReload2Number: { value: 0, min: 0 },
      autoReload2Play: { value: 0, min: 0 },
      autoReload2Save: "",
      autoReload2SaveSecond: 9999,
      autoReload2Reloads: 0,
      autoReload2Plants: [],
      autoJQB: false,
      autoJQBStage: { value: 0, min: 0 },
      quickLoadSave: "",
    };
  }

  static get storageKey() { return moduleName; }

  static load() {
    let config = window.localStorage.getItem(this.storageKey);
    if (!config) {
      this.save(this.default);
      return this.default;
    }
    return Object.assign(this.default, JSON.parse(config));
  }

  static save(config) {
    window.localStorage.setItem(this.storageKey, JSON.stringify(config));
  }
}

class Garden {
  static get minigame() { return Game.Objects['Farm'].minigame; }
  static get isActive() { return this.minigame !== undefined; }

  static get CpSMult() {
    var res = 1
    for (let key in Game.buffs) {
        if (typeof Game.buffs[key].multCpS != 'undefined') {
            res *= Game.buffs[key].multCpS;
        }
    }
    return res;
  }

  static get secondsBeforeNextTick() {
    return (this.minigame.nextStep-Date.now()) / 1000;
  }

  static get selectedSeed() { return this.minigame.seedSelected; }
  static set selectedSeed(seedId) { this.minigame.seedSelected = seedId; }

  static clonePlot() {
    let plot = clone(this.minigame.plot);
    for (let x=0; x<6; x++) {
      for (let y=0; y<6; y++) {
        let [seedId, age] = plot[x][y];
        let plant = this.getPlant(seedId);
        if (plant != undefined && !plant.plantable) {
          plot[x][y] = [0, 0];
        }
      }
    }
    return plot;
  }

  static getPlant(id) { return this.minigame.plantsById[id - 1]; }
  static getTile(x, y) {
    let tile = this.minigame.getTile(x, y);
    return { seedId: tile[0], age: tile[1] };
  }

  static getPlantStage(tile) {
    let plant = this.getPlant(tile.seedId);
    if (tile.age < plant.mature) {
      return 'young';
    } else {
      if ((tile.age + Math.ceil(plant.ageTick + plant.ageTickR)) < 100) {
        return 'mature';
      } else {
        return 'dying';
      }
    }
  }

  static tileIsEmpty(x, y) { return this.getTile(x, y).seedId == 0; }

  static plantSeed(seedId, x, y) {
    let plant = this.getPlant(seedId + 1);
    if (plant.plantable) {
      this.minigame.useTool(seedId, x, y);
    }
  }

  static forEachTile(callback) {
    for (let x=0; x<6; x++) {
      for (let y=0; y<6; y++) {
        if (this.minigame.isTileUnlocked(x, y)) {
          callback(x, y);
        }
      }
    }
  }

  static harvest(x, y) { this.minigame.harvest(x, y); }

  static fillGardenWithSelectedSeed() {
    if (this.selectedSeed > -1) {
      this.forEachTile((x, y) => {
        if (this.tileIsEmpty(x, y)) {
          this.plantSeed(this.selectedSeed, x, y);
        }
      });
    }
  }

  static handleYoung(config, plant, x, y) {
    if (plant.weed && config.autoHarvestWeeds) {
      this.harvest(x, y);
    }
    if (config.savedPlot.length > 0) {
      let [seedId, age] = config.savedPlot[y][x];
      seedId--;
      if (config.autoHarvestCleanGarden &&
          ((plant.unlocked && seedId == -1) ||
           (seedId > -1 && seedId != plant.id))
          ) {
        this.harvest(x, y);
      }
    }
  }

  static handleMature(config, plant, x, y) {
    if (!plant.unlocked && config.autoHarvestNewSeeds) {
      this.harvest(x, y);
    } else if (config.autoHarvestCheckCpSMult &&
               this.CpSMult >= config.autoHarvestMiniCpSMult.value) {
      this.harvest(x, y);
    }
  }

  static handleDying(config, plant, x, y) {
    if (config.autoHarvestCheckCpSMultDying &&
        this.CpSMult >= config.autoHarvestMiniCpSMultDying.value) {
      this.harvest(x, y);
    } else if (config.autoHarvestDying &&
        this.secondsBeforeNextTick <= config.autoHarvestDyingSeconds) {
      this.harvest(x, y);
    }
  }
  
  static logDate() {
    let logNow = new Date();
    let logYear = logNow.getFullYear();
    let logMonth = logNow.getMonth() + 1;
    logMonth = ("0" + logMonth).slice(-2);
    let logDay = logNow.getDate();
    logDay = ("0" + logDay).slice(-2);
    let logHour = logNow.getHours();
    logHour = ("0" + logHour).slice(-2);
    let logMinute = logNow.getMinutes();
    logMinute = ("0" + logMinute).slice(-2);
    let logSecond = logNow.getSeconds();
    logSecond = ("0" + logSecond).slice(-2);
    return "[" + logYear + "/" + logMonth + "/" + logDay + " " + logHour + ":" + logMinute + ":" + logSecond + "]";
  }
  
    static saveDate() {
    let logNow = new Date();
    let logHour = logNow.getHours();
    logHour = ("0" + logHour).slice(-2);
    let logMinute = logNow.getMinutes();
    logMinute = ("0" + logMinute).slice(-2);
    let logSecond = logNow.getSeconds();
    logSecond = ("0" + logSecond).slice(-2);
    return logHour + ":" + logMinute + ":" + logSecond;
  }
  
  static playSound1() {
      var base64 = "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"

      var sound = new Audio("data:audio/wav;base64," + base64);
      sound.volume = 0.4;
      sound.play();
  }
  
  static playSound2() {
      var base64 = "UklGRhYJAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YUAIAACAgICAgICAgICAgICAgICAgICAgICAgICAgH9/f39/f39/gIGCgoOEhYWFhYOCgH59e3p4eHd3eHl6fX+BhIaJiouMjIuKiIWCgH16eHZ0dHN0dXd5fH+BhIeJi4yNjYyLiYaDgH16eHV0c3JzdHZ4e36ChYeKjI2Ojo2MiYeDgH16d3VzcnJyc3V4e36BhIeKjI2Ojo6MioeEgH16d3VzcnFyc3V3en6BhIeKjI6Pj46NioiEgX16d3VzcXFxcnR3en2BhIeKjI6Pj4+Ni4iFgX56d3RycXBwcXN2en2BhIiLjY+QkJCOi4iFgX16d3RycXBxcnR3en2AhIeKjI6QkJCOjImFgn56d3RycG9vcXN1eX2AhIiLjY+QkZCOjImFgn56d3RycG9vcHJ1eHyAhIeLjY+QkZCPjImGgn57d3RycG9vcHJ1eHyAhIeKjY+QkZCPjImGgn57d3RycG9vcHJ1eHyAhIeKjY+QkZCPjImGgn56d3RycG9wcXN1eXyAhIeKjY+QkJCOjImGgn97eHVycG9vcHJ1eHyAhIeLjY+RkZCPjImGgn56d3RycG9vcHJ1eHyAhIeKjY+RkZGPjYqGgn56d3RycG9vcHJ1eHyAhIeKjY+QkZCOjImGgn97eHVzcXBwcHJ1eHt/g4aKjI6QkJCPjYqGg397eHVzcXBwcXN1eHt/goaJjI6PkJCPjYqHg4B8eHVzcXBwcHJ0d3t+goaJjI6PkJCPjYqHg4B8eXZzcXBwcXJ1d3t+goWJi42PkJCPjYuIhIB9eXZzcXBwcHJ0d3p+goWIi42PkJCPjYuIhIB9eXZ0cnFwcXJ0d3p+goWIi42PkJCPjYqHhIB8eXZ0cnFxcXN1eHt+goWIioyOjo6OjImGg4B9end1c3JycnR1eHt+gYWIioyNjo2MioiGhIF/fHp4dnNycXJzdnl+goaKjY+QjoyIhH97eHV0dHZ6foKGiYyNjIiEf3p2cnFxc3Z7gIWKjpGSkI2HgXt1cW5tb3N5f4aLkJOUko2HgXp0cG1tb3R5f4aLj5KSkY2Ignx2cW5tbnF3fIOJjpKTko+KhH54cm5tbXF2fIKJjpGTko+KhH54c29ubnB1eoCGjJCTk5GNiIF7dXBtbG5yd36Fi5CUlJKOiIF6dHBtbW9zeH+Fi4+SlJKPioN9d3JubGxvdHqAh4yRlJWTjoeAeXNubGxuc3mAhoyRlJSSjYeBe3VwbWxucnd9g4mOkpSTkIuFfnhybmxsb3V7goiOkpOTkIuFfnhzb21ucHV7gYeMkJKTkY2Hgnt2cW5tbnJ3foSKj5KTkY6Jgnx3cm9ub3J3fYOJjpGTko+KhH54c29tbW90eX+Fi5CTlJKPiYN8dnFtbG1wdnyDiY+SlJOPioR+eHJubG1wdXuCiI6SlJOQi4aAenRvbGxuc3h/hYqPk5STkIqEfXdxbWtsb3V7gomPk5WUkYuEfXZwbGpscHd+ho2SlZWSjYeAeXNvbGxucnh+hYqPk5STkIuFfnhzbmxsbnJ4f4WLkJOVlJCLhH13cW1rbG91e4KJjpKUk5CMhn95c29sbG5zeX+Fi4+Sk5KOiYR9eHNvbW5wdXuBh42Rk5KPioR+eHRxb3Bzd3yBhoqOkJCOi4aBfHdzcHBxdXl9goaKjY+PjYmFgHt3c3JydHd7gISIi42NjImFgXx4dXNzdXh8gYSGh4qNjoqDfHl6fX15c3J3gYqNh398gYuSjX5va3aHj4Z0aXCEl5qJcml0ipiTfmtpeY6Wi3dqcIKSlIVya3WIlZB+bm19j5SJd21ygpGShXRsdYaUkYBvbXuNlIp4bHGCkpSFcmpzh5WSgW5qeIyXjnpqbH+TmIhwZXGLnJR6ZGeBm5yEamN1kJ2Rd2Vpf5eci3FjbIacmoRqYXGOoZl8YmF5mKKPcGBrh5yZgWhkeJSfj3JgaoegnoJkXnWVpJR0XmSAnaKMbV1ph5+ehmlfcI6hmXxhYXuao45uXWqJoZ2BZF51laOTc15mg56giWtebIqhnIFlX3WTopR2YGWBnJ+Ial9wjqCYe2NiepehkHFfaIWenoVnXnCPoph8Y2J5lqGSc19mg56fhmhfcZChlXliZn+YnYpvY2+Jm5Z/aWZ5kp2QdGJpg5ydh2thb4qdmoNpYXKOn5Z8ZWV7lJyNc2RthZqYgmpld5KekHNhaoadnINoYXOPn5Z7ZGR6lZ6PdWNpgJicinBibYicmYBoZHiSnI92ZmyClZeHcWlzh5aSgG1qeY+Zj3hoa3+TmIp1aXCDk5SFcmt1iJSQfm5seo6Yj3lnaX+ZnolrX2+NoJh9Y2J5laGRdGFmgZufiWxgbYmemoFnYXWToJJ1YWiCm52IbGBui5+ZfmVieJSgknZiZ3+YnoxwYGuHnZyDZ2BykKGWeWJkfZigjXBgaoaenYVoX3GPoJd7ZGR5lJ+RdmJmf5meim5iboicmYFpY3aSn5FzYWuInZqBZ2Fzj6GZfWJheZiij3BfaISdnodrYG+MoJp+ZGF5l6GQcV9phZ2chWphco+flXpkZn2VnIxzZGyEmZqGbGNyjJuTfGtrfI+ViXZsc4OQkIJ0cHqHjol9dXZ/iIuFe3V5gomJgXl2fIWKh353d36Hi4V7dXiCioqAd3V9iIyGenN3g42MgHVye4mPiXtwcoCPkoV0bXWHk49+b299jZKId250g4+OgnRxeoiOiH10d4CIiIN9e32Bg4KAf3+AgIGAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIBMSVNUQgAAAElORk9JQ1JECwAAADE5OTUtMDktMjAAAElFTkcOAAAATWljaGFlbCBCcm9zcwBJU0ZUDAAAAFNvdW5kIEZvcmdlAGN1ZSAcAAAAAQAAAAEAAAAAAAAAZGF0YQAAAAAAAAAAAAAAAExJU1Q8AAAAYWR0bGx0eHQUAAAAAQAAAD8IAAByZ24gAAAAAAAAAABsYWJsFAAAAAEAAABSZWNvcmQgVGFrZSAwMDEA"

      var sound = new Audio("data:audio/wav;base64," + base64);
      sound.volume = 1;
      sound.play();
  }

  static run(config) {
    this.forEachTile((x, y) => {
      if (config.autoHarvest && !this.tileIsEmpty(x, y)) {
        let tile = this.getTile(x, y);
        let plant = this.getPlant(tile.seedId);

        if (plant.immortal && config.autoHarvestAvoidImmortals) {
          // do nothing
        } else {
          let stage = this.getPlantStage(tile);
          switch (stage) {
            case 'young':
              this.handleYoung(config, plant, x, y);
              break;
            case 'mature':
              this.handleMature(config, plant, x, y);
              break;
            case 'dying':
              this.handleDying(config, plant, x, y);
              break;
            default:
              console.log(`Unexpected plant stage: ${stage}`);
          }
        }
      }

      if (config.autoPlant &&
          (!config.autoPlantCheckCpSMult ||
          this.CpSMult <= config.autoPlantMaxiCpSMult.value) &&
          this.tileIsEmpty(x, y) &&
          config.savedPlot.length > 0
        ) {
        let [seedId, age] = config.savedPlot[y][x];
        if (seedId > 0) {
          this.plantSeed(seedId - 1, x, y);
        }
      }
    });
    
    //play sound
    if(config.playSound && this.secondsBeforeNextTick <= 15 && this.secondsBeforeNextTick >= 13){
      this.playSound1();
    }
    if(config.playSound2 && this.secondsBeforeNextTick <= 178 && this.secondsBeforeNextTick >= 176){
      this.playSound2();
    }
    
    //for quick load
    if(this.secondsBeforeNextTick <= 15 && this.secondsBeforeNextTick >= 13){
      config.quickLoadSave = Game.WriteSave(1);
      document.getElementById("quickLoadSaveTime").innerText = this.saveDate();
    }
        
    //auto reload
    if(config.autoReload){
      try{
        //5sec before tick
        if(this.secondsBeforeNextTick <= 5 && config.autoReloadSaveSecond == 9999){
          if(parseInt(config.autoReloadMax.value) == 0){
            //xy mode
            if(this.tileIsEmpty(config.autoReloadX.value, config.autoReloadY.value)){
              //save
              config.autoReloadSave = Game.WriteSave(1);
              config.autoReloadSaveSecond = this.secondsBeforeNextTick;
              if(config.logLevel.value >= 2){
                console.log("[auto reload]save!");
              }
              if(config.logLevel.value >= 3){
                console.log("[auto reload]save:" + config.autoReloadSave);
                console.log("[auto reload]second:" + config.autoReloadSaveSecond);
                console.log("[auto reload]X:" + config.autoReloadX.value + " Y:" + config.autoReloadY.value);
              }
            }
          } else {
            //max mode
            let targetNumber = 0;
            this.forEachTile((x, y) => {
              let tileAr = this.getTile(x, y);
              if(tileAr.seedId == config.autoReloadID.value){
                targetNumber += 1;
              }
            });
            
            if(targetNumber < parseInt(config.autoReloadMax.value)){
              //save
              config.autoReloadSave = Game.WriteSave(1);
              config.autoReloadSaveSecond = this.secondsBeforeNextTick;
              config.autoReloadNumber = targetNumber;
              if(config.logLevel.value >= 2){
                console.log("[auto reload]save!");
              }
              if(config.logLevel.value >= 3){
                console.log("[auto reload]save:" + config.autoReloadSave);
                console.log("[auto reload]second:" + config.autoReloadSaveSecond);
                console.log("[auto reload]number:" + config.autoReloadNumber);
                console.log("[auto reload]max:" + config.autoReloadMax.value);
              }
            }
          }
        }
        
        //after tick
        if(this.secondsBeforeNextTick >= config.autoReloadSaveSecond + 10){
          if(parseInt(config.autoReloadMax.value) == 0){
            //xy mode
            //get tile info
            let tileAr = this.getTile(config.autoReloadX.value, config.autoReloadY.value);
            //check
            if(tileAr.seedId == config.autoReloadID.value){
              //grow
              document.getElementById("autoReloadDisp").innerText = config.autoReloadReloads;
              if(config.logLevel.value >= 2){
                console.log("[auto reload]grow! reloads:" + config.autoReloadReloads);
              }
              //reset save
              config.autoReloadSave = "";
              config.autoReloadSaveSecond = 9999;
              config.autoReloadReloads = 0;
              if(config.logLevel.value >= 3){
                console.log("[auto reload]reset:" + config.autoReloadSave);
                console.log("[auto reload]second:" + config.autoReloadSaveSecond);
                console.log("[auto reload]reloads:" + config.autoReloadReloads);
              }
            } else {
              //reload
              config.autoReloadReloads += 1;
              document.getElementById("autoReloadDisp").innerText = config.autoReloadReloads;
              if(config.logLevel.value >= 3){
                console.log("[auto reload]reload! try:" + config.autoReloadReloads);
              }
              Game.LoadSave(config.autoReloadSave);
            }
          } else {
            //max mode
            let targetNumber = 0;
            this.forEachTile((x, y) => {
              let tileAr = this.getTile(x, y);
              if(tileAr.seedId == config.autoReloadID.value){
                targetNumber += 1;
              }
            });
            //check
            if(targetNumber > parseInt(config.autoReloadNumber)){
              //grow
              document.getElementById("autoReloadDisp").innerText = config.autoReloadReloads;
              if(config.logLevel.value >= 2){
                console.log("[auto reload]grow! reloads:" + config.autoReloadReloads);
              }
              if(config.logLevel.value >= 3){
                console.log("[auto reload]target:" + targetNumber);
              }
              //reset save
              config.autoReloadSave = "";
              config.autoReloadSaveSecond = 9999;
              config.autoReloadReloads = 0;
              config.autoReloadNumber = 0;
              if(config.logLevel.value >= 3){
                console.log("[auto reload]reset:" + config.autoReloadSave);
                console.log("[auto reload]second:" + config.autoReloadSaveSecond);
                console.log("[auto reload]reloads:" + config.autoReloadReloads);
                console.log("[auto reload]number:" + config.autoReloadNumber);
              }
            } else {
              //reload
              config.autoReloadReloads += 1;
              document.getElementById("autoReloadDisp").innerText = config.autoReloadReloads;
              if(config.logLevel.value >= 3){
                console.log("[auto reload]reload! try:" + config.autoReloadReloads);
              }
              Game.LoadSave(config.autoReloadSave);
            }
          }
        }
      } catch(e){
        console.error("[auto reload]some error:" + e.message);
      }
    }
    
    //auto reload2
    if(config.autoReload2){
      try{
        //5sec before tick
        if(this.secondsBeforeNextTick <= 5 && config.autoReload2SaveSecond == 9999){
          let targetPlants = [];
          this.forEachTile((x, y) => {
            let tileAr2 = this.getTile(x, y);
            if(tileAr2.seedId == config.autoReload2ID.value){
              targetPlants.push([x, y, tileAr2.age]);
            }
          });
          
          if(targetPlants.length > 0){
            //sort by age
            targetPlants.sort(function(a,b){return(a[2] - b[2]);});
            //save
            config.autoReload2Save = Game.WriteSave(1);
            config.autoReload2SaveSecond = this.secondsBeforeNextTick;
            config.autoReload2Plants = targetPlants;
            if(config.logLevel.value >= 2){
              console.log("[auto reload2]save!");
            }
            if(config.logLevel.value >= 3){
              console.log("[auto reload2]save:" + config.autoReload2Save);
              console.log("[auto reload2]second:" + config.autoReload2SaveSecond);
              console.log("[auto reload2]target plants:" + config.autoReload2Plants);
            }
          }
        }
        
        //after tick
        if(this.secondsBeforeNextTick >= config.autoReload2SaveSecond + 10){
          let upperAge = 0;
          let targetNumber = 0;
          if(parseInt(config.autoReload2Number.value) > config.autoReload2Plants.length){
            upperAge = parseInt(config.autoReload2Plants[config.autoReload2Plants.length - 1][2]);
            targetNumber = parseInt(config.autoReload2Plants.length);
          } else {
            upperAge = parseInt(config.autoReload2Plants[(parseInt(config.autoReload2Number.value) - 1)][2]) + parseInt(config.autoReload2Play.value);
            targetNumber = parseInt(config.autoReload2Number.value);
          }
          if(config.logLevel.value >= 3){
            console.log("[auto reload2]upperAge:" + upperAge);
            console.log("[auto reload2]targetNumber:" + targetNumber);
          }
          
          //check
          let grows = 0;
          for(let i = 0; i < config.autoReload2Plants.length; i++){
            let targetPlant = config.autoReload2Plants[i];
            if(parseInt(targetPlant[2]) > upperAge){
              //above upper age
              break;
            }
            
            if(this.tileIsEmpty(targetPlant[0], targetPlant[1])){
              //target plant was harvested
              grows += 1;
              continue;
            }
            
            let tileAr2 = this.getTile(targetPlant[0], targetPlant[1]);
            if(parseInt(tileAr2.age) >= (parseInt(targetPlant[2]) + parseInt(config.autoReload2Grow.value))){
              grows += 1;
            }
          }
          document.getElementById("autoReload2Disp2").innerText = grows;
          if(config.logLevel.value >= 3){
            console.log("[auto reload2]grows:" + grows);
          }
          
          if(grows < targetNumber){
            //reload
            config.autoReload2Reloads += 1;
            document.getElementById("autoReload2Disp").innerText = config.autoReload2Reloads;
            if(config.logLevel.value >= 3){
              console.log("[auto reload2]reload! try:" + config.autoReload2Reloads);
            }
            Game.LoadSave(config.autoReload2Save);
          } else {
            //grow
            document.getElementById("autoReload2Disp").innerText = config.autoReload2Reloads;
            if(config.logLevel.value >= 2){
              console.log("[auto reload2]grow! reloads:" + config.autoReload2Reloads);
            }
            config.autoReload2Save = "";
            config.autoReload2SaveSecond = 9999;
            config.autoReload2Reloads = 0;
            config.autoReload2Plants = [];
            if(config.logLevel.value >= 3){
              console.log("[auto reload2]reset:" + config.autoReload2Save);
              console.log("[auto reload2]second:" + config.autoReload2SaveSecond);
              console.log("[auto reload2]reloads:" + config.autoReload2Reloads);
              console.log("[auto reload2]target plants:" + config.autoReload2Plants);
            }
          }
        }
        
      } catch(e){
        console.error("[auto reload2]some error:" + e.message);
      }
    }

    //auto JQB
    if(config.autoJQB && this.secondsBeforeNextTick <= 15 && this.secondsBeforeNextTick >= 13){
      try{
        //switch buttons
        if(!config.autoHarvest){ Main.handleToggle('autoHarvest'); }
        if(!config.autoHarvestWeeds){ Main.handleToggle('autoHarvestWeeds'); }
        if(config.autoHarvestCleanGarden){ Main.handleToggle('autoHarvestCleanGarden'); }
        if(config.autoPlant){ Main.handleToggle('autoPlant'); }
        Main.save();
        
        //harvest all plants without QB and JQB
        this.forEachTile((x, y) => {
          let tile = this.getTile(x, y);
          if(tile.seedId != 21 && tile.seedId != 22){
            this.harvest(x, y);
          }
        });
        
        //check num of plants
        let numPlants = 0;
        let numMatureQB = 0;
        let numJQB = 0;
        let JQBAge = [];
        let minJQBAge = 0;
        
        this.forEachTile((x, y) => {
          if(!this.tileIsEmpty(x, y)){
            numPlants += 1;
            let tile = this.getTile(x, y);
            let stage = this.getPlantStage(tile);
            if(tile.seedId == 21 && stage == "mature"){
              numMatureQB += 1;
            } else if(tile.seedId == 22) {
              numJQB += 1;
              JQBAge.push(tile.age);
            }
          }
        });
        
        if(JQBAge.length > 0){
          JQBAge.sort(function(a,b){return(a - b);});
          minJQBAge = JQBAge[0];
        }
        
        if(config.logLevel.value >= 3){
          console.log("[auto JQB]numPlants:" + numPlants);
          console.log("[auto JQB]numMatureQB:" + numMatureQB);
          console.log("[auto JQB]numJQB:" + numJQB);
          console.log("[auto JQB]minJQBAge:" + minJQBAge);
        }
        
        if(config.autoJQBStage.value == 0 && numPlants == 0 && this.getPlant(21).unlocked){
          //if no plants, plant QB and turn on auto-reload2 for QB
          //plant QB
          this.forEachTile((x, y) => {
            if((x==1 || x==3 || x==5 || y==1 || y==3 || y==5) && x != 0 && y != 0){
              this.plantSeed((21 - 1), x, y);
            }
          });
          
          //turn off autoHarvestCheckCpSMult
          if(config.autoHarvestCheckCpSMult){ Main.handleToggle('autoHarvestCheckCpSMult'); }
          //turn off auto-reload
          if(config.autoReload){ Main.handleToggle('autoReload'); }
          //turn on auto-reload2 for QB
          if(!config.autoReload2){ Main.handleToggle('autoReload2'); }
          config.autoReload2ID.value = 21;
          document.getElementById(UI.makeId("autoReload2ID")).value = 21;
          config.autoReload2Grow.value = 2;
          document.getElementById(UI.makeId("autoReload2Grow")).value = 2;
          config.autoReload2Number.value = 2;
          document.getElementById(UI.makeId("autoReload2Number")).value = 2;
          config.autoReload2Play.value = 0;
          document.getElementById(UI.makeId("autoReload2Play")).value = 0;
          
          //change stage
          config.autoJQBStage.value = 1;
          document.getElementById(UI.makeId("autoJQBStage")).value = 1;
          //save config
          Main.save();
          if(config.logLevel.value >= 1){
            console.log("[auto JQB]" + this.logDate() + "stage:0->1");
          }
        }
        
        if(config.autoJQBStage.value == 1 && numMatureQB >= 21){
          //if 21QB mature, turn on auto-reload1 for JQB
          //turn off autoHarvestCheckCpSMult
          if(config.autoHarvestCheckCpSMult){ Main.handleToggle('autoHarvestCheckCpSMult'); }
          //turn off auto-reload2
          if(config.autoReload2){ Main.handleToggle('autoReload2'); }
          //turn on auto-reload for JQB
          if(!config.autoReload){ Main.handleToggle('autoReload'); }
          config.autoReloadID.value = 22;
          document.getElementById(UI.makeId("autoReloadID")).value = 22;
          config.autoReloadMax.value = 4;
          document.getElementById(UI.makeId("autoReloadMax")).value = 4;
          
          //change stage
          config.autoJQBStage.value = 2;
          document.getElementById(UI.makeId("autoJQBStage")).value = 2;
          //save config
          Main.save();
          if(config.logLevel.value >= 1){
            console.log("[auto JQB]" + this.logDate() + "stage:1->2");
          }
        }
        
        if(config.autoJQBStage.value == 2 && numJQB >= 4){
          //if 4JQB is exist, harvest all QB and turn on auto-reload2 for JQB
          //turn on autoHarvestCheckCpSMult
          if(!config.autoHarvestCheckCpSMult){ Main.handleToggle('autoHarvestCheckCpSMult'); }
          //turn off auto-reload
          if(config.autoReload){ Main.handleToggle('autoReload'); }
          //turn on auto-reload2 for QB
          if(!config.autoReload2){ Main.handleToggle('autoReload2'); }
          config.autoReload2ID.value = 22;
          document.getElementById(UI.makeId("autoReload2ID")).value = 22;
          config.autoReload2Grow.value = 1;
          document.getElementById(UI.makeId("autoReload2Grow")).value = 1;
          config.autoReload2Number.value = 2;
          document.getElementById(UI.makeId("autoReload2Number")).value = 2;
          config.autoReload2Play.value = 2;
          document.getElementById(UI.makeId("autoReload2Play")).value = 2;
          
          //change stage
          config.autoJQBStage.value = 3;
          document.getElementById(UI.makeId("autoJQBStage")).value = 3;
          //save config
          Main.save();
          if(config.logLevel.value >= 1){
            console.log("[auto JQB]" + this.logDate() + "stage:2->3");
          }
        }
        
        if(config.autoJQBStage.value == 3 && minJQBAge >= 65){
          //if youngest JQB's age >= 65, plant QB
          this.forEachTile((x, y) => {
            if((x==1 || x==3 || x==5 || y==1 || y==3 || y==5) && x != 0 && y != 0){
              this.plantSeed((21 - 1), x, y);
            }
          });
          
          //change stage
          config.autoJQBStage.value = 4;
          document.getElementById(UI.makeId("autoJQBStage")).value = 4;
          //save config
          Main.save();
          if(config.logLevel.value >= 1){
            console.log("[auto JQB]" + this.logDate() + "stage:3->4");
          }
        }
        
        if(config.autoJQBStage.value == 4 && numJQB == 0){
          //if all JQB harvested, change stage to 1
          //turn off autoHarvestCheckCpSMult
          if(config.autoHarvestCheckCpSMult){ Main.handleToggle('autoHarvestCheckCpSMult'); }
          //turn off auto-reload
          if(config.autoReload){ Main.handleToggle('autoReload'); }
          //turn on auto-reload2 for QB
          if(!config.autoReload2){ Main.handleToggle('autoReload2'); }
          config.autoReload2ID.value = 21;
          document.getElementById(UI.makeId("autoReload2ID")).value = 21;
          config.autoReload2Grow.value = 2;
          document.getElementById(UI.makeId("autoReload2Grow")).value = 2;
          config.autoReload2Number.value = 2;
          document.getElementById(UI.makeId("autoReload2Number")).value = 2;
          config.autoReload2Play.value = 0;
          document.getElementById(UI.makeId("autoReload2Play")).value = 0;
          
          //change stage
          config.autoJQBStage.value = 1;
          document.getElementById(UI.makeId("autoJQBStage")).value = 1;
          //save config
          Main.save();
          if(config.logLevel.value >= 1){
            console.log("[auto JQB]" + this.logDate() + "stage:4->1" + " sugar:" + Game.lumps);
          }
        }
        
      } catch(e){
        console.error("[auto JQB]some error:" + e.message);
      }
    }
    
  }
}

class UI {
  static makeId(id) { return moduleName + capitalize(id); }
  static get css() {
    return `
#game.onMenu #cookieGardenHelper {
  display: none;
}
#cookieGardenHelper {
  background: #000 url(img/darkNoise.jpg);
  display: none;
  padding: 1em;
  position: inherit;
}
#cookieGardenHelper.visible {
  display: block;
}
#cookieGardenHelperTools:after {
  content: "";
  display: table;
  clear: both;
}

.cookieGardenHelperPanel {
  float: left;
  width: 25%;
}
.cookieGardenHelperBigPanel {
  float: left;
  width: 50%;
}
.cookieGardenHelperSubPanel {
  float: left;
  width: 50%;
}
.cookieGardenHelperAutoLeftPanel {
  float: left;
  margin-right: 6px;
}
.cookieGardenHelperAutoRightPanel {
  overflow: hidden;
  zoom: 1;
}
.cookieGardenHelperClearPanel {
  clear: both;
}

#autoHarvestPanel { color: wheat; }
#autoHarvestPanel a { color: wheat; }
#autoHarvestImmortalPanel { color: wheat; }
#autoHarvestImmortalPanel a { color: wheat; }
#autoHarvestYoungPanel { color: #dec9a2; }
#autoHarvestYoungPanel a { color: #dec9a2; }
#autoHarvestMaturePanel { color: #c8b592; }
#autoHarvestMaturePanel a { color: #c8b592; }
#autoHarvestDyingPanel { color: #b2a182; }
#autoHarvestDyingPanel a { color: #b2a182; }

#autoPlantPanel { color: lightgreen; }
#autoPlantPanel a { color: lightgreen; }

#autoReload { color: aqua; }
#autoReload a { color: aqua; }

#autoReload2 { color: coral; }
#autoReload2 a { color: coral; }

#autoJQB { color: violet; }
#autoJQB a { color: violet; }

#autoHarvestPanel a:hover,
#autoHarvestImmortalPanel a:hover,
#autoHarvestYoungPanel a:hover,
#autoHarvestMaturePanel a:hover,
#autoHarvestDyingPanel a:hover,
#autoPlantPanel a:hover,
#autoReload a:hover,
#autoReload2 a:hover,
#autoJQB a:hover { color: white; }

#cookieGardenHelperUrl {
  position:absolute;
}

#cookieGardenHelperTitle {
  color: grey;
  font-size: 1.7em;
  font-style: normal;
  margin-bottom: 0.2em;
  margin-top: 0em;
  text-align: center;
}
#cookieGardenHelper h2 {
  font-size: 1.5em;
  line-height: 2em;
}
#cookieGardenHelper h3 {
  color: lightgrey;
  font-style: italic;
  line-height: 2em;
}
#cookieGardenHelper p {
  text-indent: 0;
}
#cookieGardenHelper input[type=number] {
  width: 2.5em;
}

#cookieGardenHelper a.toggleBtn:not(.off) .toggleBtnOff,
#cookieGardenHelper a.toggleBtn.off .toggleBtnOn {
  display: none;
}
#cookieGardenHelper a.toggleBtn,
#cookieGardenHelper a.btn {
  padding-right: 4px;
  padding-left: 4px;
  margin: 1px;
}
#cookieGardenHelper span.labelWithState:not(.active) .labelStateActive,
#cookieGardenHelper span.labelWithState.active .labelStateNotActive {
  display: none;
}

#cookieGardenHelperTooltip {
  width: 300px;
}
#cookieGardenHelperTooltip .gardenTileRow {
  height: 48px;
}
#cookieGardenHelperTooltip .tile {
  border: 1px inset dimgrey;
  display: inline-block;
  height: 48px;
  width: 48px;
}
#cookieGardenHelperTooltip .gardenTileIcon {
  position: inherit;
}

#cookieGardenHelper .warning {
    padding: 1em;
    font-size: 1.5em;
    background-color: orange;
    color: white;
}
#cookieGardenHelper .warning .closeWarning {
    font-weight: bold;
    float: right;
    font-size: 2em;
    line-height: 0.25em;
    cursor: pointer;
    transition: 0.3s;
}
#cookieGardenHelper .warning .closeWarning:hover {
    color: black;
}
`;
  }

  static numberInput(name, text, title, options) {
    let id = this.makeId(name);
    return `
<input type="number" name="${name}" id="${id}" value="${options.value}" step=1
  ${options.min !== undefined ? `min="${options.min}"` : ''}
  ${options.max !== undefined ? `max="${options.max}"` : ''} />
<label for="${id}" title="${title}">${text}</label>`;
  }

  static button(name, text, title, toggle, active) {
    if (toggle) {
      return `<a class="toggleBtn option ${active ? '' : 'off'}" name="${name}"
                 id="${this.makeId(name)}" title="${title}">
        ${text}
        <span class="toggleBtnOn">ON</span>
        <span class="toggleBtnOff">OFF</span>
      </a>`;
    }
    return `<a class="btn option" name="${name}" id="${this.makeId(name)}"
      title="${title}">${text}</a>`;
  }

  static toggleButton(name) {
    let btn = doc.qSel(`#cookieGardenHelper a.toggleBtn[name=${name}]`);
    btn.classList.toggle('off');
  }

  static labelWithState(name, text, textActive, active) {
    return `<span name="${name}" id="${this.makeId(name)}"
                  class="labelWithState ${active ? 'active' : ''}"">
      <span class="labelStateActive">${textActive}</span>
      <span class="labelStateNotActive">${text}</span>
    </span>`;
  }

  static labelToggleState(name, active) {
    let label = doc.qSel(`#cookieGardenHelper span.labelWithState[name=${name}]`);
    label.classList.toggle('active', active);
  }

  static createWarning(msg) {
    doc.elId('row2').insertAdjacentHTML('beforebegin', `
<div id="cookieGardenHelper">
  <style>${this.css}</style>
  <div class="warning">
    <span class="closeWarning">&times;</span>
    ${msg}
  </div>
</div>`);
    doc.qSel('#cookieGardenHelper .closeWarning').onclick = (event) => {
      doc.elId('cookieGardenHelper').remove();
    };
  }

  static get readmeLink() { return 'https://github.com/yannprada/'
      + 'cookie-garden-helper/blob/master/README.md#how-it-works'; }

  static build(config) {
    doc.qSel('#row2 .productButtons').insertAdjacentHTML('beforeend', `
        <div id="cookieGardenHelperProductButton" class="productButton">
          Cookie Garden Helper Mod
        </div>`);
    doc.elId('row2').insertAdjacentHTML('beforeend', `
<div id="cookieGardenHelper">
  <style>${this.css}</style>
  <div id="cookieGardenHelperUrl">
    <a href="${this.readmeLink}"
      target="new">how it works</a>
  </div>
  <div id="cookieGardenHelperTitle" class="title">Cookie Garden Helper Mod</div>
  <div id="cookieGardenHelperTools">
    <div class="cookieGardenHelperPanel" id="autoHarvestPanel">
      <h2>
        Auto-harvest
        ${this.button('autoHarvest', '', '', true, config.autoHarvest)}
      </h2>
      <span id="autoHarvestImmortalPanel">
        <p>
          ${this.button(
            'autoHarvestAvoidImmortals', '[i]Avoid immortals',
            'Do not harvest immortal plants', true,
            config.autoHarvestAvoidImmortals
          )}
        </p>
      </span>
      <span id="autoHarvestYoungPanel">
        <p>
          ${this.button(
            'autoHarvestWeeds', '[y]Remove weeds',
            'Remove weeds as soon as they appear', true,
            config.autoHarvestWeeds
          )}
        </p>
        <p>
          ${this.button(
            'autoHarvestCleanGarden', '[y]Clean garden',
            'Only allow saved and unlocked seeds', true,
            config.autoHarvestCleanGarden
          )}
        </p>
      </span>
      <span id="autoHarvestMaturePanel">
        <p>
          ${this.button(
            'autoHarvestNewSeeds', '[m]New seeds',
            'Harvest new seeds as soon as they are mature', true,
            config.autoHarvestNewSeeds
          )}
        </p>
        <p>
          ${this.button(
            'autoHarvestCheckCpSMult', '[m]Harvest',
            'Check the CpS multiplier before harvesting (see below)', true,
            config.autoHarvestCheckCpSMult
          )}
          ${this.numberInput(
            'autoHarvestMiniCpSMult', 'Min',
            'Minimum CpS multiplier for the auto-harvest to happen',
            config.autoHarvestMiniCpSMult
          )}
        </p>
      </span>
      <span id="autoHarvestDyingPanel">
        <p>
          ${this.button(
            'autoHarvestDying', '[d]Dying plants',
            `Harvest dying plants, ${config.autoHarvestDyingSeconds}s before `
            + `the new tick occurs`, true,
            config.autoHarvestDying
          )}
        </p>
        <p>
          ${this.button(
            'autoHarvestCheckCpSMultDying', '[d]Harvest',
            'Check the CpS multiplier before harvesting (see below)', true,
            config.autoHarvestCheckCpSMultDying
          )}
          ${this.numberInput(
            'autoHarvestMiniCpSMultDying', 'Min',
            'Minimum CpS multiplier for the auto-harvest to happen',
            config.autoHarvestMiniCpSMultDying
          )}
        </p>
      </span>
    </div>
    <div class="cookieGardenHelperPanel" id="autoPlantPanel">
      <h2>
        Auto-plant
        ${this.button('autoPlant', '', '', true, config.autoPlant)}
      </h2>
      <p>
        ${this.button(
          'autoPlantCheckCpSMult', 'Plant',
          'Check the CpS multiplier before planting (see below)', true,
          config.autoPlantCheckCpSMult
        )}
        ${this.numberInput(
          'autoPlantMaxiCpSMult', 'Max',
          'Maximum CpS multiplier for the auto-plant to happen',
          config.autoPlantMaxiCpSMult
        )}
      </p>
      <p>
        ${this.button('savePlot', 'Save plot',
          'Save the current plot; these seeds will be replanted later')}
        ${this.labelWithState('plotIsSaved', 'No saved plot', 'Plot saved',
          Boolean(config.savedPlot.length))}
      </p>
      <p>
        ${this.button('fillGardenWithSelectedSeed', 'Plant selected seed',
        'Plant the selected seed on all empty tiles')}
      </p>
      <span id="autoJQB">
        <h2>
          Auto-JQB
          ${this.button('autoJQB', '', '', true, config.autoJQB)}
        </h2>
        <p>
          ${this.numberInput(
            'autoJQBStage', 'Stage', 'input stage(0:no plants 1:QB growing 2:waiting JQB 3:JQB growing)',
            config.autoJQBStage
          )}
        </p>
      </span>
    </div>
    <div class="cookieGardenHelperPanel" id="manualToolsPanel">
      <h2>Tools</h2>
      <p>
        ${this.button('saveButton', 'Save',
        'save')}
      </p>
      <p>
        ${this.button('exportSaveButton', 'Export save',
        'open export save window')}
        ${this.button('importSaveButton', 'Import save',
        'open import save window')}
      </p>
      <p>
        ${this.button('fileSaveButton', 'Save to file',
        'file save')}
        <a class="btn option" style="position:relative;">
          <input id="cookieGardenHelperFileLoadButton" type="file" 
          style="cursor:pointer;opacity:0;position:absolute;left:0px;top:0px;width:100%;height:100%;" />
          Load from file
        </a>
      </p>
      <p>
        ${this.button('quickLoad', 'Quick load',
        'load before tick savedata')}
        <span id="quickLoadSaveTime">Not saved</span>
      </p>
      <p>
        ${this.button(
          'playSound', 'Sound',
          'play beep sound before 10-15sec from tick', true,
          config.playSound
        )}
        ${this.button(
          'playSound2', 'Sound2',
          'play beep sound after tick', true,
          config.playSound2
        )}
      </p>
      <p>
        ${this.numberInput(
          'logLevel', 'Log level', 'input log level(0:no log 1:a little 2:normal 3:massive)',
          config.logLevel
        )}
      </p>
    </div>
    <div class="cookieGardenHelperPanel" id="autoReload">
      <h2>
        Auto-reload
        ${this.button('autoReload', '', '', true, config.autoReload)}
      </h2>
      <div class="cookieGardenHelperAutoLeftPanel">
        <p>
          ${this.numberInput(
            'autoReloadID', 'ID', 'input ID',
            config.autoReloadID
          )}
        </p>
        <p>
          ${this.numberInput(
            'autoReloadMax', 'Max', 'input max plants(if 0, use xy)',
            config.autoReloadMax
          )}
        </p>
      </div>
      <div class="cookieGardenHelperAutoRightPanel">
        <p>
          ${this.numberInput(
            'autoReloadX', 'X', 'input x(only works when max = 0)',
            config.autoReloadX
          )}
        </p>
        <p>
          ${this.numberInput(
            'autoReloadY', 'Y', 'input Y(only works when max = 0)',
            config.autoReloadY
          )}
        </p>
      </div>
      <div class="cookieGardenHelperClearPanel">
        <p>
          ${this.button('autoReloadReset', 'Reset',
          'reset data(use when it stucks)')}
          Try:<span id="autoReloadDisp">0</span>
        </p>
      </div>
    </div>
    <div class="cookieGardenHelperPanel" id="autoReload2">
      <h2>
        Auto-reload2
        ${this.button('autoReload2', '', '', true, config.autoReload2)}
      </h2>
      <div class="cookieGardenHelperAutoLeftPanel">
        <p>
          ${this.numberInput(
            'autoReload2ID', 'ID', 'input target ID',
            config.autoReload2ID
          )}
        </p>
        <p>
          ${this.numberInput(
            'autoReload2Number', 'Num', 'input Number',
            config.autoReload2Number
          )}
        </p>
      </div>
      <div class="cookieGardenHelperAutoRightPanel">
        <p>
          ${this.numberInput(
            'autoReload2Grow', 'Grow', 'input Grow',
            config.autoReload2Grow
          )}
        </p>
        <p>
          ${this.numberInput(
            'autoReload2Play', 'Play', 'input Play',
            config.autoReload2Play
          )}
        </p>
      </div>
      <div class="cookieGardenHelperClearPanel">
        <p>
          ${this.button('autoReload2Reset', 'Reset',
          'reset data(use when it stucks)')}
          Try:<span id="autoReload2Disp">0</span>
          Grow:<span id="autoReload2Disp2">0</span>
        </p>
      </div>
    </div>
  </div>
</div>`);

    doc.elId('cookieGardenHelperProductButton').onclick = (event) => {
      doc.elId('cookieGardenHelper').classList.toggle('visible');
    };

    doc.qSelAll('#cookieGardenHelper input').forEach((input) => {
      input.onchange = (event) => {
        if (input.type == 'number') {
          let min = config[input.name].min;
          let max = config[input.name].max;
          if (min !== undefined && input.value < min) { input.value = min; }
          if (max !== undefined && input.value > max) { input.value = max; }
          Main.handleChange(input.name, input.value);
        }
      };
    });

    doc.qSelAll('#cookieGardenHelper a.toggleBtn').forEach((a) => {
      a.onclick = (event) => {
        Main.handleToggle(a.name);
      };
    });

    doc.qSelAll('#cookieGardenHelper a.btn').forEach((a) => {
      a.onclick = (event) => {
        Main.handleClick(a.name);
      };
    });

    doc.elId('cookieGardenHelperPlotIsSaved').onmouseout = (event) => {
      Main.handleMouseoutPlotIsSaved(this);
    }
    doc.elId('cookieGardenHelperPlotIsSaved').onmouseover = (event) => {
      Main.handleMouseoverPlotIsSaved(this);
    }
    
    doc.elId('cookieGardenHelperFileLoadButton').onchange = (event) => {
      console.log($('cookieGardenHelperFileLoadButton').val())
      
      Game.FileLoad(event);
      $('cookieGardenHelperFileLoadButton').val('');
      
      console.log($('cookieGardenHelperFileLoadButton').val())
    }
    
  }

  static getSeedIconY(seedId) {
    return Garden.getPlant(seedId).icon * -48;
  }

  static buildSavedPlot(savedPlot) {
    return `<div id="cookieGardenHelperTooltip">
      ${savedPlot.map((row) => `<div class="gardenTileRow">
        ${row.map((tile) => `<div class="tile">
          ${(tile[0] - 1) < 0 ? '' : `<div class="gardenTileIcon"
            style="background-position: 0 ${this.getSeedIconY(tile[0])}px;">
          </div>`}
        </div>`).join('')}
      </div>`).join('')}
    </div>`;
  }
}

class Main {
  static init() {
    this.timerInterval = 1000;
    this.config = Config.load();
    UI.build(this.config);
    
    //delete quick load save
    this.config.quickLoadSave = "";
    this.save();

    // sacrifice garden
    let oldConvert = Garden.minigame.convert;
    Garden.minigame.convert = () => {
      this.config.savedPlot = [];
      UI.labelToggleState('plotIsSaved', false);
      if(this.config.autoHarvest){ Main.handleToggle('autoHarvest'); }
      if(this.config.autoPlant){ Main.handleToggle('autoPlant'); }
      this.save();
      oldConvert();
    }

    this.start();
  }

  static start() {
    this.timerId = window.setInterval(
      () => Garden.run(this.config),
      this.timerInterval
    );
  }

  static stop() { window.clearInterval(this.timerId); }

  static save() { Config.save(this.config); }

  static handleChange(key, value) {
    if (this.config[key].value !== undefined) {
      this.config[key].value = value;
    } else {
      this.config[key] = value;
    }
    this.save();
  }

  static handleToggle(key) {
    this.config[key] = !this.config[key];
    this.save();
    UI.toggleButton(key);
  }

  static handleClick(key) {
    if (key == 'fillGardenWithSelectedSeed') {
      Garden.fillGardenWithSelectedSeed();
    } else if (key == 'savePlot') {
      this.config['savedPlot'] = Garden.clonePlot();
      UI.labelToggleState('plotIsSaved', true);
    } else if (key == 'saveButton') {
      Game.toSave=true;
    } else if (key == 'exportSaveButton') {
      Game.ExportSave();
    } else if (key == 'importSaveButton') {
      Game.ImportSave();
    } else if (key == 'fileSaveButton') {
      Game.FileSave();
    } else if (key == 'quickLoad') {
      if(this.config.quickLoadSave != "") {
        Game.LoadSave(this.config.quickLoadSave);
      }
    } else if (key == 'autoReloadReset') {
      this.config.autoReloadSave = "";
      this.config.autoReloadSaveSecond = 9999;
      this.config.autoReloadReloads = 0;
      this.config.autoReloadNumber = 0;
    } else if (key == 'autoReload2Reset') {
      this.config.autoReload2Save = "";
      this.config.autoReload2SaveSecond = 9999;
      this.config.autoReload2Reloads = 0;
      this.config.autoReload2Plants = [];
    }
    this.save();
  }

  static handleMouseoutPlotIsSaved(element) {
    Game.tooltip.shouldHide=1;
  }

  static handleMouseoverPlotIsSaved(element) {
    if (this.config.savedPlot.length > 0) {
      let content = UI.buildSavedPlot(this.config.savedPlot);
      Game.tooltip.draw(element, window.escape(content));
    }
  }
}

if (Garden.isActive) {
  Main.init();
} else {
  let msg = `You don't have a garden yet. This mod won't work without it!`;
  console.log(msg);
  UI.createWarning(msg);
}


}