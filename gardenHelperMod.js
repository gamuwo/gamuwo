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
      autoHarvestDyingSeconds: 30,
      autoHarvestCheckCpSMultDying: false,
      autoHarvestMiniCpSMultDying: { value: 1, min: 0 },
      autoPlant: false,
      autoPlantCheckCpSMult: false,
      autoPlantMaxiCpSMult: { value: 0, min: 0 },
      savedPlot: [],
      playSound: false,
      playSoundFlag: false,
      playSoundSecond: { value: 20, min: 0 },
      playSound2: false,
      playSound2Flag: false,
      playSound2Tick: { value: 0, min: 0 },
      playSoundMature: false,
      playSoundMatureFlag: false,
      playSoundMatureID: { value: 1, min: 1 },
      logLevel: { value: 0, min: 0 },
      autoReload: false,
      autoReloadX: { value: 0, min: 0, max: 5 },
      autoReloadY: { value: 0, min: 0, max: 5 },
      autoReloadID: { value: 1, min: 1 },
      autoReloadMax: { value: 0, min: 0 },
      autoReloadSave: "",
      autoReloadSaveSecond: 9999,
      autoReloadReloads: 0,
      autoReloadNumber: 0,
      autoReloadButtonSave: [],
      autoReloadTryHistory: [],
      autoReloadTryAverage: [],
      autoReloadGetXY: false,
      autoReloadMode:  { value: 0, min: 0 },
      autoReloadLockSeeds: [],
      autoReload2: false,
      autoReload2ID: { value: 1, min: 1 },
      autoReload2Grow: { value: 0, min: 0 },
      autoReload2Number: { value: 0, min: 0 },
      autoReload2Play: { value: 0, min: 0 },
      autoReload2Save: "",
      autoReload2SaveSecond: 9999,
      autoReload2Reloads: 0,
      autoReload2Plants: [],
      autoReload2ButtonSave: [],
      autoReload2TryHistory: [],
      autoReload2TryAverage: [],
      autoJQB: false,
      autoJQBStage: { value: 0, min: 0 },
      autoJQBFlag: false,
      autoJQBParam: "3,0,2,0,50",
      quickLoadSave: "",
      quickLoadFlag: false,
      quickLoadSaveTime: "",
      quickLoadSavedPlot: [],
      quickLoad2Save: "",
      quickLoad2SaveTime: "",
      quickLoad2SavedPlot: [],
      interval: { value: 1000, min: 0 },
      autoLump: false,
      autoLumpFlag: false,
      autoLumpButtonSave: [],
      lumpReload: false,
      lumpReloadNum: { value: 0, min: 0 },
      lumpReloadType: { value: 0, min: 0 },
      lumpReloadSave: "",
      lumpReloadReloads: 0,
      lumpReloadTryHistory: [],
      lumpReloadTryAverage: [],
      rightBottomDisplaySave: [],
      logHistory: [],
      logFilterWord: "",
      logInvisibleLevel1: false,
      logInvisibleLevel2: false,
      logInvisibleLevel3: false,
      logInvisibleLevel4: false,
      logInvisibleScript: false,
      logScriptText: "",
      hideOverTileFlag: false,
      overTile: false,
      overTileHideTime: { value: 10, min: 0 },
      overTileAge: false,
      clickFortune: false,
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
  static colorRGBA = {
    red: "rgba(255, 69, 0, 0.8)",
    green: "rgba(0, 255, 0, 0.8)",
    blue: "rgba(0, 191, 255, 0.8)",
    orange: "rgba(255, 165, 0, 0.8)",
  }

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

  static clonePlotAll() {
    return clone(this.minigame.plot);
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
  
  static isMatureNow(tile) {
    let plant = this.getPlant(tile.seedId);
    let result = false;
    if (tile.age >= plant.mature && tile.age < 100) result = true;
    return result;
  }
  
  static isMatureNext(tile) {
    let plant = this.getPlant(tile.seedId);
    let nextAgeMin = (tile.age + Math.floor(plant.ageTick));
    let nextAgeMax = (tile.age + Math.ceil(plant.ageTick + plant.ageTickR));
    let result = false;
    if (nextAgeMax < 100 && nextAgeMin >= plant.mature) result = true;
    return result;
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
  
  static handleAutoHarvestAndPlant(config) {
    this.forEachTile((x, y) => {
      //auto harvest
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
      //auto plant
      if (config.autoPlant &&
          (!config.autoPlantCheckCpSMult ||
          this.CpSMult <= config.autoPlantMaxiCpSMult.value) &&
          this.tileIsEmpty(x, y) &&
          config.savedPlot.length > 0
        ) {
        let [seedId, age] = config.savedPlot[y][x];
        if (seedId > 0 && this.getPlant(seedId).unlocked) {
          this.plantSeed(seedId - 1, x, y);
        }
      }
    });
  }
  
  static playSound1() {
    let base64 = "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSl+zPLaizsIGGS57OihUBELTKXh8bllHgU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvu7mnEoODlOq5O+zYBoGPJPY88p2KwUme8rx3I4+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfcsLu45ZFDBFYr+ftrVoXCECY3PLEcSYELIHO8diJOQcZaLvt559NEAxPqOPwtmMcBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7eSaRw0PVqzl77BeGQc9ltvyxnUoBSh+zPDaizsIGGS56+mjTxELTKXh8bllHgU1jdT0z3wvBSJ0xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/y1oU2Bhxqvu3mnEoPDlOq5O+zYRsGPJLZ88p3KgUme8rx3I4+CRVht+rqpVMSC0mh4fK8aiAFM4nU8tGAMQYfccPu45ZFDBFYr+ftrVwWCECY3PLEcSYGK4DN8tiIOQcZZ7zs56BODwxPpuPxtmQcBjiP1/PMeywGI3fH8N+RQAoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQHHG/A7eSaSQ0PVqvm77BeGQc9ltrzxnUoBSh9y/HajDsIF2W56+mjUREKTKPi8blnHgU1jdTy0HwvBSF0xPDglEQKElux6eyrWRUJQ5vd88FwJAQug8/y1oY2Bhxqvu3mnEwODVKp5e+zYRsGOpPX88p3KgUmecnw3Y4/CBVhtuvqpVMSC0mh4PG9aiAFM4nS89GAMQYfccLv45dGCxFYrufur1sYB0CY3PLEcycFKoDN8tiIOQcZZ7rs56BODwxPpuPxtmQdBTiP1/PMey4FI3bH8d+RQQkUXbPq66hWFQlGnt/yv2wiBDCG0PPTgzUGHG3A7uSaSQ0PVKzm7rJeGAc9ltrzyHQpBSh9y/HajDwIF2S46+mjUREKTKPi8blnHwU1jdTy0H4wBiF0xPDglEQKElux5+2sWBUJQ5vd88NvJAUtg87y1oY3Bxtpve3mnUsODlKp5PC1YRsHOpHY88p3LAUlecnw3Y8+CBZhtuvqpVMSC0mh4PG9aiAFMojT89GBMgUfccLv45dGDRBYrufur1sYB0CX2/PEcycFKoDN8tiKOQgZZ7vs56BOEQxPpuPxt2MdBTeP1vTNei4FI3bH79+RQQsUXbTo7KlXFAlFnd7zv2wiBDCF0fLUgzUGHG3A7uSaSQ0PVKzm7rJfGQc9lNrzyHUpBCh9y/HajDwJFmS46+mjUhEKTKLh8btmHwU1i9Xyz34wBiFzxfDglUMMEVux5+2sWhYIQprd88NvJAUsgs/y1oY3Bxpqve3mnUsODlKp5PC1YhsGOpHY88p5KwUlecnw3Y8+ChVgtunqp1QTCkig4PG9ayEEMojT89GBMgUfb8Lv4pdGDRBXr+fur1wXB0CX2/PEcycFKn/M8diKOQgZZrvs56BPEAxOpePxt2UcBzaP1vLOfC0FJHbH79+RQQsUXbTo7KlXFAlFnd7xwG4jBS+F0fLUhDQGHG3A7uSbSg0PVKrl7rJfGQc9lNn0yHUpBCh7yvLajTsJFmS46umkUREMSqPh8btoHgY0i9Tz0H4wBiFzw+/hlUULEVqw6O2sWhYIQprc88NxJQUsgs/y1oY3BxpqvO7mnUwPDVKo5PC1YhsGOpHY8sp5KwUleMjx3Y9ACRVgterqp1QTCkig3/K+aiEGMYjS89GBMgceb8Hu45lHDBBXrebvr1wYBz+Y2/PGcigEKn/M8dqJOwgZZrrs6KFOEAxOpd/js2coGUCLydq6e0MlP3uwybiNWDhEa5yztJRrS0lnjKOkk3leWGeAlZePfHRpbH2JhoJ+fXl9TElTVEQAAABJTkZPSUNSRAsAAAAyMDAxLTAxLTIzAABJRU5HCwAAAFRlZCBCcm9va3MAAElTRlQQAAAAU291bmQgRm9yZ2UgNC41AA=="

    let sound = new Audio("data:audio/wav;base64," + base64);
    sound.volume = 0.4;
    sound.play();
  }
  
  static playSound2() {
    let base64 = "UklGRkYQAABXQVZFZm10IBIAAAABAAEAcBcAAHAXAAABAAgAAABkYXRhfQQAAIB/gH+Af4B/gH+Af3+AfHl6enuFi5OcnJKAb19STlJgd4+pu8K/rZJ2W0U5O0hifZmzw8jBrIxuUT0zOEpkiKa+zM3ApYNkRzUwNk9vja3Ezs28nnpaQTAuPFR3l7XM1My2l3FSOissPlx/ob3Q1cqwjmlHMCYpQmaKr8rY2samgVw/Kyg1UW+Ts8ra18GfeVM3IyI1U3qgwdTe0reUbUkwISM5W4OqyNndza+KY0EqHyhCZ5CyzdzaxaR+WDklHy9MdJu71N3Wu5lwTDIiKDpZgaXE19rNsY5qSCwfJz9kjbHN3tzHqIBYOyYfLUlwmLjT4NrDnnNONCIhNFR9o8HX3c+0kmxLMiYmPV2DqcXX2s2uiGJCLSUwR2iNsMvX2MWlgVk6KSQwTHCXutDZ1byadVM1JSk6WHuhvtLaz7iTbUouJCo/X4epw9fYyq2HYUIvJzBIa5Kxy9nWvp95VTwtKzxXeZy2yc/Jr5ByUzwxNUVhgaS8ycm4pI1yXEYxMEFlkbjS0LSIXkM+WYSoxL2UZDosPmicyeDPml0sGjJtqtrryYxNIBs/erXa37+GSyIcPXe03uK+hUkeHUWBveDds3lBISRJgrvg37p+QxwdRoTC5+CwbjUcKFeUx+PbrW87GR5LiMDm57ZxNhciUpHI6NmnbTcaJ1WNwuPbr3I6GiJVk8ri1KNmNiAxYZrG3dGjbTwiLVyWx9vMnWU7KDhlm8fayJlkOCQzXpLD3NGmbTwiLlqTw9vMn2w7JDVhmMfaxpxsOyU0YZO+2M+lbz8kMFuSxNrMnGM0IjxzrtXVsn5MLy9OfqzM0beIWTYsQm+gxNTDlmQ7Kz9sncPOu5NjPi9CbJi7ybuXbkk3QmWRuMe3kWdLQVJzlLC7r5FuUENSbYultbCWd1pNVWyJoq6okXRbUVx2j5irq39mdWhNdKuRcaW1VEKmjS9/4HYzrsI9UMeOMojIYUGzrT5tx3s9lr1aS7emPHTGcT2ku0hQw5wxec9rM6+/MlnieRm5zCRd5HsdodtFM9K2GmP0ewit5DA/4JgXk+VBL+WvBX/7VRLK2R9A7qIMf/ZYFNHOElv6egaw5Sg67qYJefhiEcDXIknxiguf6D0r3bYPbvZoDLnfLDvnpwl/9lQaz8QbY+p3HKnQOkfcnBOJ7VUgv9IuP+OiFX/jXSnBviZl6m4WvtMlSOiZEIbqXCG50C9G45UVkd5PN8OwM2jQfi2ez0g/x60zac6BNJXDU0bAsSdm8W8OutsmP+ygCoH1WhbB1CRH8IwMnOlDJdi8EWf0dxCl5T0r3bcMafltDbffKznrqAZ99l4WutktOeajEH/sYBzGyRdp9GoOru40KOuuBXX5ag654yY89JgEkPFMIdTAF2PqfBig4UAz1Kopdc5tO6SxT2OyiFOFqG9fmpZedKWAWYqkaGGjj1WDrGlZqJlMeLlzQ6K2R1vFizeQv1lOsZxHeLV0WJSXcHeKgXuAgX9/gH+Af4B/gH9/gH9/gIB/gICAgICAgICAgICAgABDU0VUCAAAAOn9AAAAAAAAaWQzIKcAAABJRDMDAAAAAAEdVFlFUgAAAAsAAAH//jEAOQA5ADUAVERBVAAAAAsAAAH//jIAMAAwADkAVEVOQwAAAC0AAAH//lMAdwBpAHQAYwBoACAAqQAgAE4AQwBIACAAUwBvAGYAdAB3AGEAcgBlAFRTU0UAAAAZAAAB//5TAG8AdQBuAGQAIABGAG8AcgBnAGUAVElUMgAAAA8AAAH//kIATABFAEUAUAA3AABMSVNUXAAAAElORk9JTkFNBwAAAEJMRUVQNwAASVNGVAwAAABTb3VuZCBGb3JnZQBJU1JDFwAAAFN3aXRjaCDCqSBOQ0ggU29mdHdhcmUAAElDUkQLAAAAMTk5NS0wOS0yMAAARElTUAwAAAABAAAAQkxFRVA3AABiZXh0WgI"

    let sound = new Audio("data:audio/wav;base64," + base64);
    sound.volume = 0.4;
    sound.play();
  }
  
  static playSoundMature() {
    let base64 = "UklGRjAeAABXQVZFZm10IBIAAAABAAEAcBcAAHAXAAABAAgAAABkYXRhdRIAAH6KlJKSkpOUk5KSk5OTlJKQj46Pj5CRkpSUlZWUk5KSkpGRkJGRkZKTk5KSkpOTk5STlJSTk5OTk5OTkpGRkZGRkZKRkZCQkZGRkJGRkZGRkJGRkpGRkZGSkZKRkZKSkpKSkpKSkZGSkZKSkpKSkZGRkZKSkpKSkpKSk5KTk5KSkpKSkZGSkpKSkpOTlJKSkpOTk5OTlJSTkpKSkpOUlJOTkpGSkpKTlJSVlJOTk5OTkpKSkpOTlJKRkpKTlJSTk5OTk5OTk5SUlJSUk5OTk5OUk5SUk5SUlJSUlJSTk5KSk5OTkpKRkpKRkpOTlJOTk5OTk5KRkpOTlJOTk5OTkpKSk5SUlJSUk5SUlJSUlJSTkpKSkpKTlJOUk5OTkpGSk5OSkpOUk5OTk5KTk5OTkpKTkpOTk5OTk5OTkpOSkpOTk5OSk5KSkpGSkpKSkpOTkpOTk5KSkpOTkpKSkpKRkpKSk5OTk5OTk5KSk5STk5OSkpKTlJOTlJSUk5OSk5OUlJOTk5OTkpKSkpOTk5KSkZGSkpOUlJSUk5OTk5KTk5OTkpKTk5KSk5OTk5OTk5STkpOTk5OTk5STkpGRkJCQkZOSkpKSkpKRkZKSkpKSkZGRkpKSkZKSkpKSkZGRkZKSkpKSk5GRkZKRkZKSkZGRkZGRkpKTkpKSkZGQkZGRkZKTkpOTkpGQkJKTk5OTk5KTkpGSk5OTkpGSkZGRkpKTk5OTlJOSk5OTkpOSkpKRkZGRkpOSkpKTk5KRkZGRkZKSkpGRkZKRkpOSkpGRkZGSkZKSkpOSk5KSkpKSkpKRkpKSkpKRkpGRkZGRkZGRkZKSkpGRkZCPj4+Pj5CQkJCQkJCQkJGRkI+Pj4+Pj4+PkJCQj4+PkI+PkJCQkJCQj4+Oj4+Pj4+Pjo2NjY6Ojo6Pjo6Ojo6Ojo6Pjo6OjY2MjY2Njo6Ojo6NjY2NjY2NjY6NjY2MjY2MjYyMjIyMi4yMjY2MjIyMjIuLi4uLi4uLi4uLi4uLioqKioqKioqKioqKioqKiYmJiYmJiYmJiYmJiYmJiIiIiIiIh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4aGhoaGhoaGhYaGhoaFhYWFhYWFhYWFhYWEhISEhISEhISEhISEhIOEhISDg4ODg4F+fXt6dW9kWE1QgYZSNB09YDQhNi8hESI5OyUCKWeQp5WKl6SmgXOapsK4iqrM3ryUsM3kwJm21enAlrfX6L2WuNXgsIuuytCcgKS8vol2nLSwgHyftKp4ep2woXN9nayYb3uZpI1rfJWeimt8lJuIbnqQmIlweIuUiW5whI+IbWuAjIluZnyLjHBke4yOc2R6jJBzY3qNkHNjeo2QcGF7j5BuYXyQj2pifpKOZ2OBloxgY4aZiFxnip2DWGuPn3xWcpWfc1Z2mZxpWH6el2RdgaCQWmGIo4lXZ46lgFVvlaZ4V3ebo25YfKCfZlyFp5lcX42rjlZol66AUXGgq29Qe6qlXlWKs5ZQX5m6gklxrrloSoO/qk5WnMuNPWeyyWY7gsu1REug2YwxZ8HVXTWJ3LQ2S63nfypt0NNLNpTopS1WvuhrLHzfxz1Cpu+PKWbM3lYyjOixMVC37HUpd97OPz2j8ZYnYM7mWC2M7bguSLf0eiNw3thEM5n1oidVxPBoJ3rnzTo9ovaXJ1zJ6mAtf+XEO0Sk8JMvYsLiZjd/2MJITpnbl0Boq8t3T36qqWdliJWNdH+PkpKToaWnr7CupKGinpKHjI6JfHmCh31xd4OGe3WBiod7fouOg3uEj4t+foyQhXqCkJCBfoyUjICEkpaJgIuXkYSDj5aNgYeSkYaAiZKOg4SPkoqEipKSiYaPlI6GiZGQiYaMkI2Gh46PiYaLkI6JiI2QjIeJj4+Jh4yPi4eIjI2Kh4iNjIeFiY2LiIiLjouHiIyOiYiKjo2JiYqMi4mIio2KiImLi4iIioyKiYmKi4qIiIuMiomKjIuJiYqKh4aFhoWFiY6RkY6OjouEgIOKkZSTnZyQjYuNjomEgoOEhoqNjYqKi42MhYCAhIaBfXuDjYmFjpubgnN5iIlzb3+VhmlqfYxxXXKVmWxYZYuMWlZ/vateTnWzllVcjcSeZHChzY9TZp/CeUVipL5uS3S+ynBXiNDFZVuR1rRXXZzcplJoruOWT3K73n5KesjVa02J1cdaVZjesUxep+KXRGy54HxCe8rUYkmN2b9MVaHioD9lteF+PHfJ0ltBi9q3QVGk5JEzZr3eZzV/1sZERJrlnTBcuONtL3jUykI/meeeLFu642ktetfGP0Ge5pQsX8DcXTKD3LY3SqnlfixszNBMO5Lini5ZuN5lMH/ZujlIpuSBK2zM0Uo5lOSdLFu+4GEug9+2NEqu6HgpcdbLQD6e6pApY8naUTWP5qYsVbvjZi5528E6RabqgSps0dBHPJfplytew99YMofkrjBRtOhsLHrbxDlEpeyGKGrO1ko3lOmgKlvB42Aug+G5NEqu6Hsqb9LNRjuZ5pgtXL/dXzGD3bY5S6rjfzBuy8xQPpPeoTdatNlwN3zNvU1Lm9aVPWW1zG1BgcW0UlOZyZNHaa3Ddkt/uLFfWJK9m1Vqn7qGVXqmsnVehaimbGqKppprd4yfkHWCiJSLgYWHkoyGg4aPi4V/ho6MhICKkI2DhI+SjIWKkpGJhY2RjISFjY2GgIWLiIB/hoqEfoKIiIF+hYqGf4CHiYR/g4mIg4GGioiCg4iKh4OGioqFg4eJioeEiYqIhIWJiIeEhoqIh4SJioiGh4uKiIaKi4iHiIqIh4eIiYmIh4mLiIWIiomGh4iKiIWEh4mFgoSIiISDh4uJhYiLjYmIi46NiYmKjImGhoiJhoWHioqGhoeJiIaIi4yJh4aGhYODhomKi4+PjIaEhoiHhIeJg3pzcniEiYqOj5STiYGAjJCLlZWIgHN3gXxqWV1rcmdgZ2eHi2F6mYZ+Y0pCGw4+hnxMV3iWaj9Zgp91X4K1zoprltjUeW+l6M5yfbz3t2SFzPeZW4/c6npeoOzTX2Ss7KxIbb3riUR/0N1lTJXhxE1dru2gP2/B43Q8gdHLT0eY3aM1W7DedzN2yMtOPpDZpjRWrdx3LnHFx0w7kNWfNFeu1nAwdsi+SEKX15M0X7XNYzmCzas/T6LRejVvwbxORZTQjThjt8RaP4rOmjtcsMpkPILNpD9Xqs5rOn7MqkFUqdFuOnvLrEFTp9FvOnvKqkBTp9FtPH3LqT9UpNFxPX3JrEFWqM5vPoDKqENZrMpsQYHMo0ZbrsloRYLMnUdfrsZkSYXLl0hlsMFhT4zIj0pstLhdVpLFhkxytq5bXZfCfFF6uaRWZZ29c1WDuptVbaO4bFmJvJNUcam1Z1yOvotSda2zYVyRwIdRdrGyXlyUw4RPdrSyW1yVxoNOdra0W1qVyYVNc7W3XFmRyopMb7C7YFWLyJROaavBaVKDxaBRYaLHdU54v65XWpXJhU1ts7tkVYbFm1NjoMN5Una0rmJei7eQX2+Wpn1ofJeUeHOJmIt4fZKShHuIk4uAgI2Mg32EjIV+f4mJgn+Fi4V+f4eGfnyBiIN+gIiKhIKHjImEhIqMh4OGioeBgYeJhICDiIeCgIWIhICCh4eCgISHhYCBhYaDgIOGhYGBhIaDgYKFhoOChIaFgoOFhoSCg4aFg4KEhoSCg4WGhIOEhoWCg4aGhYSFh4aDgoOEgn+Ag4OAgIGDgoCBhIWDgYKDg4GBg4WDgYGCg4aKjpCNioWCgYGDhYSBf4GChomJhH11c3V5dHFzY2BUWXJoXEw5PEpihJaRgoB7YEc5O1BXQywZIjk1NVJ0a1xzlaGNlLfVzaKZqsGtgXybv6B2hqvAnIKdz+q5pMbx76ujyO/TjpvG46t2lMLQh3Gez79ye7Hcqm2Qx9iIbJ3QumZwp8yMUHixuGJTjcGaTWmpxHRPhsKsVGCgxH1GdLOrUFCOvH4/aaqtU02JvIRDaqmxWU2IuoZCZqWtVUuEtoE/ZaSrU0qGuIFAaKirUk6KuHs/a6mkTVCOtXJCcauaS1mWr2hKfa6LS2aepV5Vh6t6T3KhllhikKVsWICkiFhxmZxkZIuheVx9no1db5Sba2KIoYBcfJ6WYWyVo3Nch6WLWXKfn2VekKl9VXyomFpnnatvV4uxjFJ0qaNfXpmvdlKEsJBSbqelYVyYsXlUhLGRVXGopWFfmrB2U4myjVJ0raJbYaCwcFOPt4hPe7OfV2WosWlUlriBTX+2mVJprKxiV5u4e02FuZZQbbCtXlqeuHlNh7uTTXCyqlxaobpzTIu7kUxytKtZW6K6c0yLvZNKcrOuWFiiv3VIir+YR222slZVpL90R4u/lUZvtbJXVqHBeUSHwZ1FarW3WlGfwn1Dgr+hR2avvGBMlsWJQXm5sk9ZosV1Q4TAo0VlqcNkSY3HlkBts75WT5nLgUF5vrBIXKjGakmHxZlCbLS4WFWUx4JGdrezUVuWyH9JdbS1VlqOxYlPcKS2Z16ArZdlcoeehHN0hZSCdnqNkIB4g5GMfHuJkol6gY6PgXqHjol7fYmHfHaBiH9zdH1+d3SFlpOIi5iVhoCLk4l/hZOShoSPlYqBhpCMf3+Kj4V+ho+NgYGKjoV+hIyLgYKJjYaBhouMhoaLj4yJio2OjYqLjo+Oio2Pj4uJjZCPiYuQkoyJjZGQiYuRkoyIjZGOh4mQkYqGjZOPh4mRkoqHjpOPh4qQkYqHjZGPiYuOkIyKjI6OioyMjoyMjY2MjI2Mi4uOjY2Ljo6Mi4yQjo6Lj4+NjI2Rjo2MkZCNi42Qjo2NkY+NjI+OjIuMkI6NjJCQjo2Oj4+PjpGPjo6PkI6Oj5GOjo6Qj46Oj5CPj5CTkpCPkZKOjY6RkI6PkZGOjI6QjoyNkZGPjpCTkI6Pk5OPjZGUkY6OkpOPjpGUko6PlJWQjpKVk4+Pk5OPjZCTkY2Pk5OPjpGTj42QlJOQj5KUkI2Pk5OQkZOTkI+Rk5KRkZKUkZCRkpKQkZKTkZGSkpKSkpOTlJSTk5OTkZGQkZKRkZGSkZGRk5ORkZKTkpGRk5OSkZKTkpCRk5ORkJKTkpGSk5OSkZKUk5GSlJSSkJKTkZCQkZKQkJOTk5GSlJSTk5OUlJOTlJOTk5OUk5OUk5KRkpOTkpGSk5OSkpKTk5KSkpKSk5OTkpKSkpGSkpOTk5OTkpGRkZKSkpKTk5OSkpKRkpKUlJOTk5OTkpKSkpKTk5GRkZGRkZKSk5KSkpKSkpOTk5KTkpKSkpOSkpKSlJSTk5KTkpKTk5SUlJOTkpGSkpKSlJOSkZKSkpKTk5SUk5KSkpKTlJOTlJSUkpKTlJSUlJSVlJSTkpKTlJSUk5STkpKSkpOUlJOTkpOTkpKTk5OTkpKSkpKTkpKSkpOTk5STk5OTk5OSk5OSk5KRkZKSkZKSkpKTk5OTk5KSkpKSkZKSkpGRkZGRkZKSkpGRkpKSk5OSkpOTk5OSk5OSkpKTk5OTkpOTk5OTk5SVlZSUk5OTk5OTk5OUlJSTk5OTk5KSk5KSk5OUlZSUlJOTk5STkpOTlJSTlJSUlJSUk5OTk5KRkpKTk5OTk5OUk5OTk5SUlJOTk5OTk5OTk5OTk5SUlJSUlJSUlJSTk5SSk5STk5OTk5KSkpKSk5OTk5OTlJSTk5OTk5OTk5OTkpKSkpGTk5KTkpKSkZKTk5OUlJOSkpKTkpOTk5OTk5OTlJOUk5KSkpGOj5CPkZCSkI6Pj5CRkpKTlZWVlZWUlJWVk5GQj5GRkpOTk5SUlJSVk5OUlZWVk5OUlJOTk5OTkpKSkpOTk5SUlJSUlJSUlJSUk5OTk5OTk5KSkZKSkZKRkpKTk5OTlJSUk5KSkZGRkZGRkZKTkZGSkZGRkJCRkZGQkJCQkZGRkpKTkpGRkZKSk5OTkpGRkpOSk5OTk5KSkpKTk5SUlJOUk5OTk5STk5OTkpGRkZGSkpOTlJSSkpKSk5OTlJSTk5OSk5OTk5OSkpKSkZGSk5OSk5OTk5KSk5OSkpOUk5OTlJSTk5OTlJSVlJSUlJSTlJSUlJSUlJSTlJSUlJOTk5OUk5OUlJSUlJSTlJSTkpKSk5OUlJSUlZWUk5OTk5KSk5OTk5STkpKSkpKSk5OTk5OTk5OTk5OTk5OTk5KTk5OTk5OTk5SUk5KTk5STk5OUlJSTk5SUlJSUk5KTk5KTk5OTk5KSkpKSkpKSkpKRkpOSk5OTlJOTk5OTk5OSkpOTk5OSkZGRkZKSkpOTk5KTkpKSk5OTk5KSkZKTk5KSkpOTkpKSkpKTk5SSkwBDU0VUCAAAAOn9AAAAAAAAaWQzII4AAABJRDMDAAAAAAEEVEVOQwAAAC0AAAH//lMAdwBpAHQAYwBoACAAqQAgAE4AQwBIACAAUwBvAGYAdAB3AGEAcgBlAFRJVDIAAABDAAAB//5CAGUAZQBwACAAMgAtAFMAbwB1AG4AZABCAGkAYgBsAGUALgBjAG8AbQAtADEANwA5ADgANQA4ADEAOQA3ADEATElTVE4AAABJTkZPSU5BTSEAAABCZWVwIDItU291bmRCaWJsZS5jb20tMTc5ODU4MTk3MQAASVNSQxcAAABTd2l0Y2ggwqkgTkNIIFNvZnR3YXJlAABESVNQJgAAAAEAAABCZWVwIDItU291bmRCaWJsZS5jb20tMTc5ODU4MTk3MQAAYmV4dFoC"

    let sound = new Audio("data:audio/wav;base64," + base64);
    sound.volume = 0.4;
    sound.play();
  }
  
  static writeLog(level, functionName, isDate, text) {
    let logText = text;
    if(isDate) logText = this.logDate() + logText;
    if(functionName != "") logText = "[" + functionName + "]" +  logText;
    
    if(Main.config.logLevel.value >= level) console.log(logText);
    if(!Array.isArray(Main.config.logHistory[level])) Main.config.logHistory[level] = [];
    this.pushLimit(logText, Main.config.logHistory[level]);
  }
  
  static displayLog(level) {
    if(Array.isArray(Main.config.logHistory[level])){
      let logText = "";
      let filterRegexp = new RegExp(Main.config.logFilterWord, "i");
      for(let i = 0; i < Main.config.logHistory[level].length; i++){
        if(filterRegexp.test(Main.config.logHistory[level][i])) logText = logText + Main.config.logHistory[level][i] + "\n";
      }
      if(logText.length >= 2) logText.slice(0, -2);
      document.getElementById("logLevel" + level).innerText = logText;
      document.getElementById("logNumLevel" + level).innerText = Main.config.logHistory[level].length;
    } else {
      document.getElementById("logLevel" + level).innerText = "";
      document.getElementById("logNumLevel" + level).innerText = "0";
    }
  }
  
  static goBottom(targetId) {
    let obj = document.getElementById(targetId);
    if(!obj) return;
    obj.scrollTop = obj.scrollHeight;
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
    return logMonth + "/" + logDay + " " + logHour + ":" + logMinute + ":" + logSecond;
  }
  
  static pushLimit(input, array) {
    array.push(input);
    if(array.length > 1000){
      array.shift();
    }
  }
  
  static arrayAverage(array) {
    if(array.length == 0) return 0;
    
    let sum = 0;
    array.forEach(function(item) {
      sum += item;
    });
    return sum/array.length;
  }
  
  static displayMultiMeter(firstID, secondID, thirdID, maxValue, nowValue) {
    if(maxValue == 0){
      //max=0, display third meter and set value=1
      if( document.getElementById(thirdID).style.display == "" || document.getElementById(thirdID).style.display == "none" ){
        document.getElementById(firstID).style.display = "none";
        document.getElementById(secondID).style.display = "none";
        document.getElementById(thirdID).style.display = "inline-block";
      }
      if(document.getElementById(thirdID).value != 1) document.getElementById(thirdID).value = 1;
    } else {
      if( (nowValue / maxValue) <= 1 ){
        //display first meter
        if( document.getElementById(firstID).style.display == "" || document.getElementById(firstID).style.display == "none" ){
          document.getElementById(firstID).style.display = "inline-block";
          document.getElementById(secondID).style.display = "none";
          document.getElementById(thirdID).style.display = "none";
        }
        document.getElementById(firstID).value = (nowValue / maxValue);
      } else if( (nowValue / (maxValue * 2)) <= 1 ){
        //display second meter
        if( document.getElementById(secondID).style.display == "" || document.getElementById(secondID).style.display == "none" ){
          document.getElementById(firstID).style.display = "none";
          document.getElementById(secondID).style.display = "inline-block";
          document.getElementById(thirdID).style.display = "none";
        }
        document.getElementById(secondID).value = ((nowValue - maxValue) / maxValue);
      } else {
        //display third meter
        if( document.getElementById(thirdID).style.display == "" || document.getElementById(thirdID).style.display == "none" ){
          document.getElementById(firstID).style.display = "none";
          document.getElementById(secondID).style.display = "none";
          document.getElementById(thirdID).style.display = "inline-block";
        }
        document.getElementById(thirdID).value = (nowValue / (maxValue * 10));
      }
    }
  }
  
  static resetOneTimeFlag(config) {
    if( this.secondsBeforeNextTick >= (this.minigame.stepT - 2) ){
      config.playSoundFlag = false;
      config.playSound2Flag = false;
      config.playSoundMatureFlag = false;
      config.quickLoadFlag = false;
      config.autoJQBFlag = false;
      config.autoLumpFlag = false;
      config.hideOverTileFlag = false;
    }
  }
  
  static changeButton(buttonName, status, config) {
    if(status){
      if(!config[buttonName]) Main.handleToggle(buttonName);
    } else {
      if(config[buttonName]) Main.handleToggle(buttonName);
    }
  }
  
  static changeNumber(inputName, num, config) {
    config[inputName].value = num;
    document.getElementById(UI.makeId(inputName)).value = num; 
  }
  
  static changeSpan(spanName, text, config) {
    config[spanName] = text;
    document.getElementById(UI.makeId(spanName)).innerText = text; 
  }
  
  static saveButtonStatusAndTurnOff(targetArray, saveArray, config) {
    for(let i = 0; i < targetArray.length; i++){
      saveArray[i] = [];
      saveArray[i][0] = targetArray[i];
      saveArray[i][1] = config[targetArray[i]];
      this.changeButton(targetArray[i], false, config);
    }
  }
  
  static restoreButtonStatus(saveArray, config) {
    for(let i = 0; i < saveArray.length; i++){
      this.changeButton(saveArray[i][0], saveArray[i][1], config);
    }
  }
  
  static displayOverTileAge(isDisplay, x, y, text, config) {
    let idAge = "overTileAge-" + x + "-" + y;
    if(isDisplay){
      document.getElementById(idAge).style.opacity = "1";
      document.getElementById(idAge).innerText = text;
    } else {
      document.getElementById(idAge).style.opacity = "";
      document.getElementById(idAge).innerText = "";
    }
  }
  
  static displayOverTile(isDisplay, x, y, text, color, config) {
    let id = "overTile-" + x + "-" + y;
    let idAge = "overTileAge-" + x + "-" + y;
    if(isDisplay){
      document.getElementById(id).style.opacity = "1";
      document.getElementById(id).style.borderColor = color;
      document.getElementById(idAge).style.opacity = "1";
      document.getElementById(idAge).innerText = text;
    } else {
      document.getElementById(id).style.opacity = "";
      document.getElementById(id).style.borderColor = "";
      document.getElementById(idAge).style.opacity = "";
      document.getElementById(idAge).innerText = "";
    }
  }
  
  static flashOverTile(x, y, text, color, time, config) {
    let id = "overTile-" + x + "-" + y;
    document.getElementById(id).style.transition = "none";
    this.displayOverTile(true, x, y, text, color, config);
    window.setTimeout(() => {
      document.getElementById(id).style.transition = "all 500ms 0s ease";
      this.displayOverTile(false, x, y, text, color, config);
    }, time);
  }
  
  static hideOverTile() {
    doc.qSelAll('#gardenPlot div.cookieGardenHelperOverTile').forEach((overTile) => {
      overTile.style.opacity = "";
      overTile.style.borderColor = "";
    });
    doc.qSelAll('#gardenPlot div.cookieGardenHelperOverTileAge').forEach((overTileAge) => {
      overTileAge.style.opacity = "";
      overTileAge.style.innerText = "";
    });
  }
  
  static isOverTile(x, y) {
    let id = "overTile-" + x + "-" + y;
    return document.getElementById(id).style.opacity == "1";
  }
  
  static compareAge(plot, config) {
    this.forEachTile((x, y) => {
      let isDisplay = false;
      let plotId = plot[y][x][0];
      if( plotId > 0 && !this.tileIsEmpty(x, y) ){
        let tile = this.getTile(x, y);
        let id = tile.seedId;
        if(plotId == id){
          let plotAge = plot[y][x][1];
          let age = tile.age;
          let plant = this.getPlant(id);
          let grow = (age - plotAge);
          let growMin = Math.floor(plant.ageTick);
          let growMax = Math.ceil(plant.ageTick + plant.ageTickR);
          if(grow == growMax){
            this.displayOverTile(true, x, y, age, this.colorRGBA.green, config);
          } else if(grow == growMin){
            this.displayOverTile(true, x, y, age, this.colorRGBA.red, config);
          } else {
            this.displayOverTile(true, x, y, age, "", config);
          }
          isDisplay = true;
        }
      }
      if(!isDisplay) this.displayOverTile(false, x, y, "", "", config);
    });
  }
  
  static getMutsCustom(x, y, ifMature) {
    let anyNum = 0;
    let plantsNum = {};
    let maturesNum = {};
    for(let i in this.minigame.plants){
      plantsNum[i] = 0;
      maturesNum[i] = 0;
    }
    let afterMe = false;
    for(let yy = y - 1; yy < y + 2; yy++){
      for(let xx = x - 1; xx < x + 2; xx++){
        if(xx == x && yy == y){
          afterMe = true;
          continue;
        }
        if(this.tileIsEmpty(xx, yy)) continue;
        let tile = this.getTile(xx, yy);
        let plant = this.getPlant(tile.seedId);
        anyNum += 1;
        plantsNum[plant.key] += 1;
        if(!afterMe && this.isMatureNext(tile)) maturesNum[plant.key] += 1;
        if(afterMe && this.isMatureNow(tile)) maturesNum[plant.key] += 1;
      }
    }
    if(anyNum > 0){
      let mutations = this.minigame.getMuts(plantsNum, maturesNum);
      let mutationsMature = this.minigame.getMuts(plantsNum, plantsNum);
      if(ifMature){
        return mutationsMature;
      } else {
        let weedMult = this.minigame.plotBoost[y][x][2];
        if(weedMult > 0){
          return mutations;
        } else {
          let mutationsFinal = [];
          for(let i of mutations){
            let plant = this.minigame.plants[i[0]];
            if(!plant.weed && !plant.fungus) mutationsFinal.push(i);
          }
          return mutationsFinal;
        }
      }
    } else {
      return [];
    }
  }
  
  static handleHideOverTile(config) {
    if( !config.hideOverTileFlag && this.secondsBeforeNextTick <= (this.minigame.stepT - parseInt(config.overTileHideTime.value)) && this.secondsBeforeNextTick >= (this.minigame.stepT - parseInt(config.overTileHideTime.value) - 2) ){
      this.hideOverTile();
      config.hideOverTileFlag = true;
      this.writeLog(3, "over tile", false, "hide over tile");
    }
  }
  
  static handleClickFortune(config) {
    if(config.clickFortune){
      this.writeLog(4, "click fortune", false, "Game.TickerEffect.type:" + Game.TickerEffect.type);
      if(Game.TickerEffect.type=='fortune'){
        this.writeLog(2, "click fortune", false, "click! Game.TickerEffect.type:" + Game.TickerEffect.type);
        Game.tickerL.click();
      }
    }
  }
  
  static handlePlaySound1(config) {
    if(config.playSound && !config.playSoundFlag && this.secondsBeforeNextTick <= parseInt(config.playSoundSecond.value) && this.secondsBeforeNextTick >= (parseInt(config.playSoundSecond.value) - 2)){
      this.playSound1();
      config.playSoundFlag = true;
      this.writeLog(3, "play sound", false, "sound!");
    }
  }
  
  static handlePlaySound2(config) {
    if( config.playSound2 && !config.playSound2Flag && this.secondsBeforeNextTick <= (this.minigame.stepT - 2) && this.secondsBeforeNextTick >= (this.minigame.stepT - 4) ){
      if(config.playSound2Tick.value == 0){
        this.playSound2();
        this.writeLog(3, "play sound2", false, "sound!");
      } else {
        let nextTick = (parseInt(config.playSound2Tick.value) - 1);
        this.changeNumber("playSound2Tick", nextTick, config);
      }
      config.playSound2Flag = true;
    }
  }
  
  static handlePlaySoundMature(config) {
    if( config.playSoundMature && !config.playSoundMatureFlag && this.secondsBeforeNextTick <= (this.minigame.stepT - 4) && this.secondsBeforeNextTick >= (this.minigame.stepT - 6) ){
      let isMature = false;
      this.forEachTile((x, y) => {
        let tileForSound = this.getTile(x, y);
        if(tileForSound.seedId == config.playSoundMatureID.value){
          let matureValue = this.getPlant(config.playSoundMatureID.value).mature;
          if(tileForSound.age >= matureValue) isMature = true;
        }
      });
      
      if(isMature){
        this.playSoundMature();
        this.writeLog(3, "play sound mature", false, "sound!");
      }
      config.playSoundMatureFlag = true;
    }
  }
  
  static handleQuickLoadSave(config) {
    if(!config.quickLoadFlag && this.secondsBeforeNextTick <= 5 && this.secondsBeforeNextTick >= 3){
      config.quickLoadSave = Game.WriteSave(1);
      config.quickLoadSavedPlot = Garden.clonePlotAll();
      this.changeSpan("quickLoadSaveTime", this.saveDate(), config);
      config.quickLoadFlag = true;
      Main.save();
      this.writeLog(3, "quick load", false, "save!");
    }
  }
  
  static handleAutoLump(config) {
    if(!config.lumpReload && config.autoLump && !config.autoLumpFlag && this.secondsBeforeNextTick <= 15 && this.secondsBeforeNextTick >= 13){
      if(config.autoLumpButtonSave.length == 0){
        //check suger lump is mature
        let lumpAge = Date.now() - Game.lumpT;
        if (lumpAge >= Game.lumpMatureAge) {
          //turn off other buttons
          this.saveButtonStatusAndTurnOff(["autoHarvest", "autoPlant", "autoJQB", "autoReload", "autoReload2"], config.autoLumpButtonSave, config);
          
          //turn on lump reload
          if(Game.lumpCurrentType == 0) this.changeNumber("lumpReloadNum", 1, config);
          if(Game.lumpCurrentType == 1) this.changeNumber("lumpReloadNum", 2, config);
          if(Game.lumpCurrentType == 2) this.changeNumber("lumpReloadNum", 7, config);
          if(Game.lumpCurrentType == 3) this.changeNumber("lumpReloadNum", 2, config);
          if(Game.lumpCurrentType == 4) this.changeNumber("lumpReloadNum", 3, config);
          this.changeNumber("lumpReloadType", 2, config);
          
          this.changeButton("lumpReload", true, config);
          Main.save();
          this.writeLog(2, "auto lump", false, "turn on lump reload");
        }
      } else {
        //restore other buttons
        this.restoreButtonStatus(config.autoLumpButtonSave, config);
        config.autoLumpButtonSave = [];
        Main.save();
        this.writeLog(3, "auto lump", false, "restore buttons");
      }
      config.autoLumpFlag = true;
      this.writeLog(3, "auto lump", false, "check!");
    }
  }
  
  static handleAutoJQB(config) {
    if(config.autoJQB && !config.autoJQBFlag && this.secondsBeforeNextTick <= 10 && this.secondsBeforeNextTick >= 8){
      //get parameter
      let parameter = config.autoJQBParam.split(",");
      if(parameter.length == 5){
        //parameter check
        this.writeLog(3, "auto JQB", false, "parameter[0]:" + parameter[0] + " [1]:" + parameter[1] + " [2]:" + parameter[2] + " [3]:" + parameter[3] + " [4]:" + parameter[4]);
        
        //switch buttons
        this.changeButton("autoHarvest", false, config);
        this.changeButton("autoPlant", false, config);
        
        //harvest mature JQB, dying QB, all plants without QB and JQB
        this.forEachTile((x, y) => {
          if(!this.tileIsEmpty(x, y)){
            let tile = this.getTile(x, y);
            let stage = this.getPlantStage(tile);
            if(tile.seedId == 21 && stage == "dying") this.harvest(x, y);
            if(tile.seedId == 22 && stage == "mature") this.harvest(x, y);
            if(tile.seedId != 21 && tile.seedId != 22) this.harvest(x, y);
          }
        });
        
        //check num of plants
        let numPlants = 0;
        let numJQB = 0;
        let JQBAge = [];
        let minJQBAge = 0;
        let numQB = 0;
        let mutationJQBTiles = 0;
        
        this.forEachTile((x, y) => {
          if(!this.tileIsEmpty(x, y)){
            numPlants += 1;
            let tile = this.getTile(x, y);
            let stage = this.getPlantStage(tile);
            if(tile.seedId == 21 && stage != "dying") numQB += 1;
            if(tile.seedId == 22) {
              numJQB += 1;
              JQBAge.push(tile.age);
            }
          } else {
            let mutations = this.getMutsCustom(x, y, false);
            for(let i of mutations){
              if(this.getPlant(22).key == i[0]){
                mutationJQBTiles += 1;
                break;
              }
            }
          }
        });
        
        if(JQBAge.length > 0){
          JQBAge.sort(function(a,b){return(a - b);});
          minJQBAge = JQBAge[0];
        }
        
        //for max min age
        let ageArray = [];
        this.forEachTile((x, y) => {
          let tileForAge = this.getTile(x, y);
          if(tileForAge.seedId == 21){
            ageArray.push(tileForAge.age);
          }
        });
        let ageString = "0-0(0)/0";
        if(ageArray.length > 0){
          ageArray.sort(function(a,b){return(a - b);});
          ageString = ageArray[0] + "-" + ageArray[ageArray.length - 1] + "(" + (ageArray[ageArray.length - 1] - ageArray[0]) + ")/" + this.getPlant(21).mature;
        }
        
        this.writeLog(2, "auto JQB", false, "numPlants:" + numPlants + " numJQB:" + numJQB + " minJQBAge:" + minJQBAge + " numQB:" + numQB + " mutationJQBTiles:" + mutationJQBTiles);
        
        //for unexpected QB harvest
        if((config.autoJQBStage.value == 1 || config.autoJQBStage.value == 2) && numQB < 21){
          if(numJQB == 0){
            //if no JQB, change stage to 0
            //harvest all plants
            this.forEachTile((x, y) => {
              this.harvest(x, y);
            });
            //turn off auto-reload, auto-reload2
            this.changeButton("autoReload", false, config);
            this.changeButton("autoReload2", false, config);
            //change stage
            this.writeLog(1, "auto JQB", true, "unexpected QB harvest! stage:" + config.autoJQBStage.value + "->0");
            this.changeNumber("autoJQBStage", 0, config);
          } else {
            //if JQB is exist, change stage to 3
            //harvest all QB
            this.forEachTile((x, y) => {
              let tile = this.getTile(x, y);
              if(tile.seedId == 21) this.harvest(x, y);
            });
            //turn off auto-reload
            this.changeButton("autoReload", false, config);
            //turn on auto-reload2 for JQB
            this.changeButton("autoReload2", true, config);
            this.changeNumber("autoReload2ID", 22, config);
            this.changeNumber("autoReload2Grow", 1, config);
            this.changeNumber("autoReload2Number", parameter[2], config);
            this.changeNumber("autoReload2Play", parameter[3], config);
            
            //change stage
            this.changeNumber("autoJQBStage", 3, config);
            this.writeLog(1, "auto JQB", true, "unexpected QB harvest! stage:2->3 QBage:" + ageString + " numJQB:" + numJQB);
          }
        }
        
        if(config.autoJQBStage.value == 0 && numPlants == 0 && this.getPlant(21).unlocked){
          //if no plants, plant QB and turn on auto-reload2 for QB
          //plant QB
          this.forEachTile((x, y) => {
            if((x==0 || x==2 || x==4 || y==0 || y==2 || y==4) && x != 5 && y != 5){
              this.plantSeed((21 - 1), x, y);
            }
          });
          
          //turn off auto-reload
          this.changeButton("autoReload", false, config);
          //turn on auto-reload2 for QB
          this.changeButton("autoReload2", true, config);
          this.changeNumber("autoReload2ID", 21, config);
          this.changeNumber("autoReload2Grow", 2, config);
          this.changeNumber("autoReload2Number", parameter[0], config);
          this.changeNumber("autoReload2Play", parameter[1], config);
          
          //change stage
          this.changeNumber("autoJQBStage", 1, config);
          this.writeLog(1, "auto JQB", true, "stage:0->1");
        }
        
        if(config.autoJQBStage.value == 1 && mutationJQBTiles >= 1){
          //if 4JQB possible mutation, turn on auto-reload1 for JQB
          //turn off auto-reload2
          this.changeButton("autoReload2", false, config);
          //turn on auto-reload for JQB
          this.changeButton("autoReload", true, config);
          this.changeNumber("autoReloadMode", 0, config);
          this.changeNumber("autoReloadID", 22, config);
          this.changeNumber("autoReloadMax", 4, config);
          //control auto reload elements disabled
          Main.controlAutoReloadElementDisabled();
          
          //change stage
          this.changeNumber("autoJQBStage", 2, config);
          this.writeLog(1, "auto JQB", true, "stage:1->2 QBage:" + ageString);
        }
        
        if(config.autoJQBStage.value == 2 && numJQB >= 4){
          //if 4JQB is exist, harvest all QB and turn on auto-reload2 for JQB
          //harvest all QB
          this.forEachTile((x, y) => {
            let tile = this.getTile(x, y);
            if(tile.seedId == 21) this.harvest(x, y);
          });
        
          //turn off auto-reload
          this.changeButton("autoReload", false, config);
          //turn on auto-reload2 for JQB
          this.changeButton("autoReload2", true, config);
          this.changeNumber("autoReload2ID", 22, config);
          this.changeNumber("autoReload2Grow", 1, config);
          this.changeNumber("autoReload2Number", parameter[2], config);
          this.changeNumber("autoReload2Play", parameter[3], config);
          
          //change stage
          this.changeNumber("autoJQBStage", 3, config);
          this.writeLog(1, "auto JQB", true, "stage:2->3 QBage:" + ageString);
        }
        
        if(config.autoJQBStage.value == 3 && minJQBAge >= parameter[4]){
          //if youngest JQB's age >= parameter[4], plant QB
          this.forEachTile((x, y) => {
            if((x==0 || x==2 || x==4 || y==0 || y==2 || y==4) && x != 5 && y != 5){
              this.plantSeed((21 - 1), x, y);
            }
          });
          
          //change stage
          this.changeNumber("autoJQBStage", 4, config);
          this.writeLog(1, "auto JQB", true, "stage:3->4");
        }
        
        if(config.autoJQBStage.value == 4 && numJQB == 0){
          //if all JQB harvested, change stage to 1
          //turn off auto-reload
          this.changeButton("autoReload", false, config);
          //turn on auto-reload2 for QB
          this.changeButton("autoReload2", true, config);
          this.changeNumber("autoReload2ID", 21, config);
          this.changeNumber("autoReload2Grow", 2, config);
          this.changeNumber("autoReload2Number", parameter[0], config);
          this.changeNumber("autoReload2Play", parameter[1], config);
          
          //change stage
          this.changeNumber("autoJQBStage", 1, config);
          this.writeLog(1, "auto JQB", true, "stage:4->1" + " sugar:" + Game.lumps + " QBage:" + ageString);
        }
        
        //save config
        Main.save();
      
      } else {
        this.writeLog(2, "auto JQB", false, "parameter error!");
      }
      
      config.autoJQBFlag = true;
    }
  }
  
  static handleAutoReload(config) {
    if(config.autoReload){
      //2sec before tick
      if(this.secondsBeforeNextTick <= 2 && this.secondsBeforeNextTick >= 0 && config.autoReloadSaveSecond == 9999){
        let mode = config.autoReloadMode.value;
        //for max mode
        let targetNumber = 0;
        if(mode == 0){
          this.forEachTile((x, y) => {
            let tileAr = this.getTile(x, y);
            if(tileAr.seedId == config.autoReloadID.value){
              targetNumber += 1;
            }
          });
        }
        
        //for possible mutation check
        let isMutation = false;
        let lockMutationSeeds = [];
        if(mode == 0){
          //max mode
          this.forEachTile((x, y) => {
            if(this.tileIsEmpty(x, y)){
              let mutations = this.getMutsCustom(x, y, false);
              for(let i of mutations){
                if(this.getPlant(config.autoReloadID.value).key == i[0]) {
                  isMutation = true;
                  if(config.overTile) this.displayOverTile(true, x, y, "", this.colorRGBA.blue, config);
                  break;
                }
              }
            }
          }); 
        }
        if(mode == 1){
          //xy mode
          let x = parseInt(config.autoReloadX.value);
          let y = parseInt(config.autoReloadY.value);
          if(this.tileIsEmpty(x, y)){
            let mutations = this.getMutsCustom(x, y, false);
            for(let i of mutations){
              if(this.getPlant(config.autoReloadID.value).key == i[0]) {
                isMutation = true;
                if(config.overTile) this.displayOverTile(true, x, y, "", this.colorRGBA.blue, config);
                break;
              }
            }
          }
        }
        if(mode == 2){
          //lock seed mode
          let lockSeeds = [];
          for(let key in this.minigame.plants){
            let plant = this.minigame.plants[key];
            if(!plant.unlocked) lockSeeds.push(key);
          }
          let plantedSeeds = [];
          this.forEachTile((x, y) => {
            if(!this.tileIsEmpty(x, y)){
              let tile = this.getTile(x, y);
              let plant = this.getPlant(tile.seedId);
              if(!plantedSeeds.includes(plant.key)) plantedSeeds.push(plant.key);
            }
          });
          this.forEachTile((x, y) => {
            if(this.tileIsEmpty(x, y)){
              let mutations = this.getMutsCustom(x, y, false);
              for(let i of mutations){
                if(lockSeeds.includes(i[0]) && !plantedSeeds.includes(i[0])) {
                  isMutation = true;
                  if(!lockMutationSeeds.includes(i[0])) lockMutationSeeds.push(i[0]);
                  if(config.overTile) this.displayOverTile(true, x, y, "", this.colorRGBA.blue, config);
                }
              }
            }
          });
        }
        
        //check
        let xyModeCheck = (this.tileIsEmpty(config.autoReloadX.value, config.autoReloadY.value) && isMutation);
        let maxModeCheck = ( (targetNumber < parseInt(config.autoReloadMax.value)) && isMutation );
        let lockSeedModeCheck = isMutation;
        if( (mode == 1 && xyModeCheck) || (mode == 0 && maxModeCheck) || (mode == 2 && lockSeedModeCheck) ){
          //save
          config.autoReloadSave = Game.WriteSave(1);
          config.autoReloadSaveSecond = this.secondsBeforeNextTick;
          if(mode == 0) config.autoReloadNumber = targetNumber;
          if(mode == 2) config.autoReloadLockSeeds = lockMutationSeeds;
          this.writeLog(3, "auto reload", false, "save:" + config.autoReloadSave.substr(0, 15) + "...");
          this.writeLog(3, "auto reload", false, "second:" + config.autoReloadSaveSecond);
          if(mode == 1) this.writeLog(3, "auto reload", false, "X:" + config.autoReloadX.value + " Y:" + config.autoReloadY.value);
          if(mode == 0) this.writeLog(3, "auto reload", false, "number:" + config.autoReloadNumber);
          if(mode == 0) this.writeLog(3, "auto reload", false, "max:" + config.autoReloadMax.value);
          if(mode == 2) this.writeLog(2, "auto reload", false, "lock seeds:" + config.autoReloadLockSeeds);
        
          //turn off other buttons
          this.saveButtonStatusAndTurnOff(["autoHarvest", "autoPlant", "autoJQB", "autoLump", "autoReload2"], config.autoReloadButtonSave, config);
          Main.save();
        
          //display
          document.getElementById("rightBottomAutoReload").style.display = "block";
          document.getElementById("rightBottomAutoReload2").style.display = "none";
          document.getElementById("rightBottomLumpReload").style.display = "none";
        
          //reset interval
          Main.restart(parseInt(config.interval.value));
          this.writeLog(3, "auto reload", false, "reset interval:" + Main.timerInterval);
        }
      }
      
      //after tick
      if(this.secondsBeforeNextTick >= config.autoReloadSaveSecond + 10){
        let mode = config.autoReloadMode.value;
        
        let targetNumber = 0;
        //for max mode
        if(mode == 0){
          this.forEachTile((x, y) => {
            let tileAr = this.getTile(x, y);
            if(tileAr.seedId == config.autoReloadID.value) targetNumber += 1;
          });
        }
        //for lock seed mode
        if(mode == 2){
          this.forEachTile((x, y) => {
            if(!this.tileIsEmpty(x, y)){
              let tile = this.getTile(x, y);
              let plant = this.getPlant(tile.seedId);
              for(let i of config.autoReloadLockSeeds){
                if(plant.key == i){
                  targetNumber += 1;
                  break;
                }
              }
            }
          });
        }
        
        //for try text
        document.getElementById("autoReloadDisp").innerText = config.autoReloadReloads;
        
        //for try meter
        let ave = config.autoReloadTryAverage[config.autoReloadID.value];
        if(!isFinite(parseFloat(ave))) ave = 0;
        this.displayMultiMeter(UI.makeId("autoReloadMeter"), UI.makeId("autoReloadMeter2"), UI.makeId("autoReloadMeter3"), ave, config.autoReloadReloads);
        
        //check
        let xyModeCheck = (this.getTile(config.autoReloadX.value, config.autoReloadY.value).seedId == config.autoReloadID.value);
        let maxModeCheck = (targetNumber > parseInt(config.autoReloadNumber));
        let lockSeedModeCheck = (targetNumber > 0);
        if( (mode == 1 && xyModeCheck) || (mode == 0 && maxModeCheck) || (mode == 2 && lockSeedModeCheck) ){
          //grow
          //reset interval
          Main.restart(1000);
          //for average
          let id = config.autoReloadID.value;
          if(!Array.isArray(config.autoReloadTryHistory[id])) config.autoReloadTryHistory[id] = [];
          this.pushLimit(config.autoReloadReloads, config.autoReloadTryHistory[id]);
          config.autoReloadTryAverage[id] = this.arrayAverage(config.autoReloadTryHistory[id]);
          let tryAverage = "[" + id + "]" + config.autoReloadTryAverage[id].toFixed(2) + "(" + config.autoReloadTryHistory[id].length + ")";
          document.getElementById("autoReloadDisp2").innerText = tryAverage;
          this.writeLog(2, "auto reload", false, "try average:" + tryAverage);
          
          //display over tile
          if(config.overTile){
            if(mode == 0){
              this.forEachTile((x, y) => {
                let tileAr = this.getTile(x, y);
                if(this.isOverTile(x, y) && tileAr.seedId == config.autoReloadID.value) this.displayOverTile(true, x, y, "", this.colorRGBA.green, config);
              });
            }
            if(mode == 1){
              let x = parseInt(config.autoReloadX.value);
              let y = parseInt(config.autoReloadY.value);
              this.displayOverTile(true, x, y, "", this.colorRGBA.green, config);
            }
            if(mode == 2){
              this.forEachTile((x, y) => {
                if(!this.tileIsEmpty(x, y)){
                  let tile = this.getTile(x, y);
                  let plant = this.getPlant(tile.seedId);
                  for(let i of config.autoReloadLockSeeds){
                    if(plant.key == i){
                      this.displayOverTile(true, x, y, "", this.colorRGBA.green, config);
                      this.writeLog(2, "auto reload", false, "lock seed grow:" + plant.name + " x:" + x + " y:" + y);
                      break;
                    }
                  }
                }
              });
            }
          }
          
          this.writeLog(2, "auto reload", false, "grow! reloads:" + config.autoReloadReloads);
          this.writeLog(3, "auto reload", false, "reset interval:" + Main.timerInterval);
          if(mode == 0) this.writeLog(3, "auto reload", false, "target:" + targetNumber);
          //reset save
          config.autoReloadSave = "";
          config.autoReloadSaveSecond = 9999;
          config.autoReloadReloads = 0;
          if(mode == 0) config.autoReloadNumber = 0;
          if(mode == 2) config.autoReloadLockSeeds = [];
          this.writeLog(3, "auto reload", false, "reset:" + config.autoReloadSave);
          this.writeLog(3, "auto reload", false, "second:" + config.autoReloadSaveSecond);
          this.writeLog(3, "auto reload", false, "reloads:" + config.autoReloadReloads);
          if(mode == 0) this.writeLog(3, "auto reload", false, "number:" + config.autoReloadNumber);
        
          //restore other button state
          this.restoreButtonStatus(config.autoReloadButtonSave, config);
          config.autoReloadButtonSave = [];
          Main.save();
          this.writeLog(3, "auto reload", false, "restore buttons");
        } else {
          //reload
          config.autoReloadReloads += 1;
          this.writeLog(3, "auto reload", false, "reload! try:" + config.autoReloadReloads);
          Game.LoadSave(config.autoReloadSave);
        }
      }
    }
  }
  
  static handleAutoReload2(config) {
    if(config.autoReload2){
      //2sec before tick
      if(this.secondsBeforeNextTick <= 2 && this.secondsBeforeNextTick >= 0 && config.autoReload2SaveSecond == 9999){
        let targetPlants = [];
        this.forEachTile((x, y) => {
          let tileAr2 = this.getTile(x, y);
          if(tileAr2.seedId == config.autoReload2ID.value){
            let stage = this.getPlantStage(tileAr2);
            if(stage == "young") targetPlants.push([x, y, tileAr2.age]);
          }
        });
        
        if(targetPlants.length > 0){
          //sort by age
          targetPlants.sort(function(a,b){return(a[2] - b[2]);});
          
          //display over tile
          if(config.overTile){
            let num = parseInt(config.autoReload2Number.value);
            let play = parseInt(config.autoReload2Play.value);
            let upperAge = 0;
            if(num > targetPlants.length){
              upperAge = targetPlants[targetPlants.length - 1][2];
            } else {
              if(num > 0) upperAge = (targetPlants[(num - 1)][2] + play);
            }
            for(let i of targetPlants){
              let x = i[0];
              let y = i[1];
              let age = i[2];
              if(age > upperAge) this.displayOverTile(true, x, y, age, "", config);
              if(age == upperAge) this.displayOverTile(true, x, y, age, this.colorRGBA.blue, config);
              if(play != 0 && age < upperAge) this.displayOverTile(true, x, y, age, this.colorRGBA.blue, config);
              if(play == 0 && age < upperAge) this.displayOverTile(true, x, y, age, this.colorRGBA.red, config);
            }
          }
          
          //save
          config.autoReload2Save = Game.WriteSave(1);
          config.autoReload2SaveSecond = this.secondsBeforeNextTick;
          config.autoReload2Plants = targetPlants;
          this.writeLog(3, "auto reload2", false, "save:" + config.autoReload2Save.substr(0, 15) + "...");
          this.writeLog(3, "auto reload2", false, "second:" + config.autoReload2SaveSecond);
          this.writeLog(2, "auto reload2", false, "target plants:" + config.autoReload2Plants.join("|"));
          
          //turn off other buttons
          this.saveButtonStatusAndTurnOff(["autoHarvest", "autoPlant", "autoJQB", "autoLump", "autoReload"], config.autoReload2ButtonSave, config);
          Main.save();
          
          //display
          document.getElementById("rightBottomAutoReload").style.display = "none";
          document.getElementById("rightBottomAutoReload2").style.display = "block";
          document.getElementById("rightBottomLumpReload").style.display = "none";
          
          //reset interval
          Main.restart(parseInt(config.interval.value));
          this.writeLog(3, "auto reload2", false, "reset interval:" + Main.timerInterval);
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
          if(config.autoReload2Number.value > 0) upperAge = parseInt(config.autoReload2Plants[(parseInt(config.autoReload2Number.value) - 1)][2]) + parseInt(config.autoReload2Play.value);
          targetNumber = parseInt(config.autoReload2Number.value);
        }
        this.writeLog(3, "auto reload2", false, "upperAge:" + upperAge);
        this.writeLog(3, "auto reload2", false, "targetNumber:" + targetNumber);
        
        //for check
        let grows = 0;
        let checkNum = 0;
        let mustNum = 0;
        let mustGrows = 0;
        let isPlay0 = (parseInt(config.autoReload2Play.value) == 0);
        for(let i = 0; i < config.autoReload2Plants.length; i++){
          let targetPlant = config.autoReload2Plants[i];
          let isMust = (targetPlant[2] < upperAge);
          if(parseInt(targetPlant[2]) > upperAge){
            //above upper age
            break;
          }
          checkNum += 1;
          if(isMust) mustNum += 1;
          
          if(this.tileIsEmpty(targetPlant[0], targetPlant[1])){
            //target plant was harvested
            grows += 1;
            if(isMust) mustGrows += 1;
            continue;
          }
          
          let tileAr2 = this.getTile(targetPlant[0], targetPlant[1]);
          let stage = this.getPlantStage(tileAr2);
          
          if(stage != "young"){
            //target plant is mature
            grows += 1;
            if(isMust) mustGrows += 1;
            continue;
          }
          
          if(parseInt(tileAr2.age) >= (parseInt(targetPlant[2]) + parseInt(config.autoReload2Grow.value))){
            grows += 1;
            if(isMust) mustGrows += 1;
          }
        }
        
        //for grows text
        let growsString = grows + "/" +targetNumber + "(" + checkNum + ")";
        if(isPlay0) growsString = growsString + ", " + mustGrows + "/" + mustNum;
        document.getElementById("autoReload2Disp2").innerText = growsString;
        this.writeLog(3, "auto reload2", false, "grows:" + growsString);
        
        //for grows meter
        if(targetNumber == 0){
          document.getElementById(UI.makeId("autoReload2MeterGrow")).value = 1;
        } else {
          document.getElementById(UI.makeId("autoReload2MeterGrow")).value = (grows / targetNumber);
        }
        
        //for try text
        document.getElementById("autoReload2Disp").innerText = config.autoReload2Reloads;
        
        //for try meter
        let ave = config.autoReload2TryAverage[config.autoReload2ID.value];
        if(!isFinite(parseFloat(ave))) ave = 0;
        this.displayMultiMeter(UI.makeId("autoReload2Meter"), UI.makeId("autoReload2Meter2"), UI.makeId("autoReload2Meter3"), ave, config.autoReload2Reloads);
        
        //check
        if(grows < targetNumber || (isPlay0 && mustGrows < mustNum)){
          //reload
          config.autoReload2Reloads += 1;
          this.writeLog(3, "auto reload2", false, "reload! try:" + config.autoReload2Reloads);
          Game.LoadSave(config.autoReload2Save);
        } else {
          //grow
          //reset interval
          Main.restart(1000);
          
          //for average
          let id = config.autoReload2ID.value;
          if(!Array.isArray(config.autoReload2TryHistory[id])) config.autoReload2TryHistory[id] = [];
          this.pushLimit(config.autoReload2Reloads, config.autoReload2TryHistory[id]);
          config.autoReload2TryAverage[id] = this.arrayAverage(config.autoReload2TryHistory[id]);
          let tryAverage = "[" + id + "]" + config.autoReload2TryAverage[id].toFixed(2) + "(" + config.autoReload2TryHistory[id].length + ")";
          document.getElementById("autoReload2Disp3").innerText = tryAverage;
          this.writeLog(2, "auto reload2", false, "try average:" + tryAverage);
          
          //for max min age
          let ageArray = [];
          this.forEachTile((x, y) => {
            let tileForAge = this.getTile(x, y);
            if(tileForAge.seedId == config.autoReload2ID.value){
              ageArray.push(tileForAge.age);
            }
          });
          let ageString = "0-0(0)/0";
          if(ageArray.length > 0){
            ageArray.sort(function(a,b){return(a - b);});
            ageString = ageArray[0] + "-" + ageArray[ageArray.length - 1] + "(" + (ageArray[ageArray.length - 1] - ageArray[0]) + ")/" + this.getPlant(config.autoReload2ID.value).mature;
          }
          document.getElementById("autoReload2Disp4").innerText = ageString;
          this.writeLog(2, "auto reload2", false, "age:" + ageString);
          
          //for overtile
          if(config.overTile){
            for(let targetPlant of config.autoReload2Plants){
              let x = targetPlant[0];
              let y = targetPlant[1];
              let age = targetPlant[2];
              let isGrow = false;
              if(this.tileIsEmpty(x, y)) isGrow = true;
              let tile = this.getTile(x, y);
              if(parseInt(tile.age) >= (parseInt(age) + parseInt(config.autoReload2Grow.value))) isGrow = true;
              //display over tile
              if(isGrow){
                this.displayOverTile(true, x, y, tile.age, this.colorRGBA.green, config);
              } else {
                this.displayOverTileAge(true, x, y, tile.age, config);
              }
            }
          }
          
          //reset data
          this.writeLog(2, "auto reload2", false, "grow! reloads:" + config.autoReload2Reloads);
          this.writeLog(3, "auto reload2", false, "reset interval:" + Main.timerInterval);
          config.autoReload2Save = "";
          config.autoReload2SaveSecond = 9999;
          config.autoReload2Reloads = 0;
          config.autoReload2Plants = [];
          this.writeLog(3, "auto reload2", false, "reset:" + config.autoReload2Save);
          this.writeLog(3, "auto reload2", false, "second:" + config.autoReload2SaveSecond);
          this.writeLog(3, "auto reload2", false, "reloads:" + config.autoReload2Reloads);
          this.writeLog(3, "auto reload2", false, "target plants:" + config.autoReload2Plants);
          
          //restore other button state
          this.restoreButtonStatus(config.autoReload2ButtonSave, config);
          config.autoReload2ButtonSave = [];
          Main.save();
          this.writeLog(3, "auto reload2", false, "restore buttons");
        }
      }
    }
  }
  
  static handleLumpReload(config) {
    if(config.lumpReload){
      let numBefore = Game.lumps;
      let lumpTBefore = Game.lumpT;
      this.writeLog(3, "lump reload", false, "Game.lumps(before click):" + Game.lumps);
      this.writeLog(3, "lump reload", false, "Game.lumpT(before click):" + Game.lumpT);
      
      Game.clickLump();
      this.writeLog(3, "lump reload", false, "Game.lumps(after click):" + Game.lumps);
      this.writeLog(3, "lump reload", false, "Game.lumpT(after click):" + Game.lumpT);
      this.writeLog(3, "lump reload", false, "type:" + Game.lumpCurrentType);
      
      if(lumpTBefore == Game.lumpT){
        //not mature
        config.lumpReloadSave = "";
        this.writeLog(2, "lump reload", false, "not mature");
        //reset interval
        Main.restart(1000);
        this.writeLog(3, "lump reload", false, "reset interval:" + Main.timerInterval);
        
        this.changeButton("lumpReload", false, config);
      } else {
        //for text
        let gain = Game.lumps - numBefore;
        document.getElementById("lumpReloadDisp").innerText = config.lumpReloadReloads;
        document.getElementById("lumpReloadDisp2").innerText = gain;
        document.getElementById("lumpReloadDisp3").innerText = Game.lumpCurrentType;
        
        //for gain meter
        if(config.lumpReloadNum.value == 0){
          document.getElementById(UI.makeId("lumpReloadMeterGain")).value = 1;
        } else {
          document.getElementById(UI.makeId("lumpReloadMeterGain")).value = (gain / config.lumpReloadNum.value);
        }
        
        //for try meter
        let ave = config.lumpReloadTryAverage[config.lumpReloadType.value];
        if(!isFinite(parseFloat(ave))) ave = 0;
        this.displayMultiMeter(UI.makeId("lumpReloadMeter"), UI.makeId("lumpReloadMeter2"), UI.makeId("lumpReloadMeter3"), ave, config.lumpReloadReloads);
          
        //check
        if(Game.lumps >= (numBefore + parseInt(config.lumpReloadNum.value)) && Game.lumpCurrentType == config.lumpReloadType.value) {
          //grow
          //for average
          let type = config.lumpReloadType.value;
          if(!Array.isArray(config.lumpReloadTryHistory[type])) config.lumpReloadTryHistory[type] = [];
          this.pushLimit(config.lumpReloadReloads, config.lumpReloadTryHistory[type]);
          config.lumpReloadTryAverage[type] = this.arrayAverage(config.lumpReloadTryHistory[type]);
          let tryAverage = "[" + type + "]" + config.lumpReloadTryAverage[type].toFixed(2) + "(" + config.lumpReloadTryHistory[type].length + ")";
          document.getElementById("lumpReloadDisp4").innerText = tryAverage;
          this.writeLog(2, "lump reload", false, "try average:" + tryAverage);
          this.writeLog(1, "lump reload", true, "grow! type:" + Game.lumpCurrentType + " reloads:" + config.lumpReloadReloads + " gain:" + (Game.lumps - numBefore) + " sugar:" + Game.lumps);
          
          //reset save
          config.lumpReloadSave = "";
          config.lumpReloadReloads = 0;
          Main.save();
          
          //reset interval
          Main.restart(1000);
          this.writeLog(3, "lump reload", false, "reset interval:" + Main.timerInterval);
          
          //turn off lump reload
          this.changeButton("lumpReload", false, config);
        } else {
          //reload
          config.lumpReloadReloads += 1;
          this.writeLog(3, "lump reload", false, "reload! try:" + config.lumpReloadReloads);
          Game.LoadSave(config.lumpReloadSave);
        }
      }
    }
  }
  
  static handleOverTileAge(config) {
    if(config.overTileAge){
      this.forEachTile((x, y) => {
        if(this.tileIsEmpty(x, y)){
          this.displayOverTileAge(false, x, y, "", config);
        } else {
          this.displayOverTileAge(true, x, y, this.getTile(x, y).age, config);
        }
      });
    }
  }
  
  static displayRunTime(startTime, endTime, config) {
    document.getElementById("intervalDisp").innerText = Main.timerInterval;
    document.getElementById("runtimeDisp").innerText = (endTime - startTime).toFixed(2);
    let beforeTickDisp = document.getElementById("beforeTickDisp");
    let cookieGardenHelperRightTop = document.getElementById("cookieGardenHelperRightTop");
    beforeTickDisp.innerText = this.secondsBeforeNextTick.toFixed(2);
    if(this.secondsBeforeNextTick <= config.playSoundSecond.value){
      if(beforeTickDisp.style.color != "black") beforeTickDisp.style.color = "black";
      if(beforeTickDisp.style.fontWeight != "bold") beforeTickDisp.style.fontWeight = "bold";
      if(cookieGardenHelperRightTop.style.backgroundColor != "orange") cookieGardenHelperRightTop.style.backgroundColor = "orange";
    } else {
      if(beforeTickDisp.style.color != "white") beforeTickDisp.style.color = "white";
      if(beforeTickDisp.style.fontWeight != "normal") beforeTickDisp.style.fontWeight = "normal";
      if(cookieGardenHelperRightTop.style.backgroundColor != "rgba(0, 0, 0, 0.5)") cookieGardenHelperRightTop.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    }
  }
  
  static handleError(e) {
    document.getElementById("cookieGardenHelperRightBottom").style.backgroundColor = "red";
    throw e;
  }

  static run(config) {
    try {
      //for run time
      let startTime = performance.now();
      //for one time events
      this.resetOneTimeFlag(config);
      //original process
      this.handleAutoHarvestAndPlant(config);
      //click fortune
      this.handleClickFortune(config);
      //play sound
      this.handlePlaySound1(config);
      this.handlePlaySound2(config);
      this.handlePlaySoundMature(config);
      //hide over tile
      this.handleHideOverTile(config);
      //for over tile age
      this.handleOverTileAge(config);
      //for quick load
      this.handleQuickLoadSave(config);
      //auto lump
      this.handleAutoLump(config);
      //auto JQB
      this.handleAutoJQB(config);
      //auto reload
      this.handleAutoReload(config);
      //auto reload2
      this.handleAutoReload2(config);
      //lump reload
      this.handleLumpReload(config);
      //display run time
      let endTime = performance.now();
      this.displayRunTime(startTime, endTime, config);
    } catch(e) {
      this.handleError(e);
    }
  }

}

class UI {
  static makeId(id) { return moduleName + capitalize(id); }
  static get css() {
    return `
#game.onMenu #cookieGardenHelper { display: none; }
#cookieGardenHelper {
  background: #000 url("https://gamuwo.github.io/gamuwo/background.jpg");
  display: none;
  padding: 1rem;
  position: inherit;
}
#cookieGardenHelper.visible { display: block; }
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

.underline { text-decoration: underline; }
.boxPanel {
  display: inline-block;
  min-width: 11rem;
  border-style: solid;
  border-width: 0 2px 2px 2px;
  padding: 0.1rem 0.4rem 0.3rem 0.4rem;
  box-sizing: border-box;
  border-radius: 5px;
  background-color: rgba(0, 0, 0, 0.5);
}

#autoHarvestPanel { color: wheat; }
#autoHarvestPanel a { color: wheat; }
#autoHarvestImmortalPanel { color: wheat; }
#autoHarvestImmortalPanel a { color: wheat; }
#autoHarvestYoungPanel { color: wheat; }
#autoHarvestYoungPanel a { color: wheat; }
#autoHarvestMaturePanel { color: wheat; }
#autoHarvestMaturePanel a { color: wheat; }
#autoHarvestDyingPanel { color: wheat; }
#autoHarvestDyingPanel a { color: wheat; }

#autoPlantPanel { color: lightgreen; }
#autoPlantPanel a { color: lightgreen; }

#autoReload, #rightBottomAutoReload { color: aqua; }
#autoReload, #rightBottomAutoReload a { color: aqua; }

#autoReload2, #rightBottomAutoReload2 { color: coral; }
#autoReload2, #rightBottomAutoReload2 a { color: coral; }

#autoJQB { color: violet; }
#autoJQB a { color: violet; }

#lumpReload, #rightBottomLumpReload { color: gold; }
#lumpReload, #rightBottomLumpReload a { color: gold; }

#autoHarvestPanel a:hover,
#autoHarvestImmortalPanel a:hover,
#autoHarvestYoungPanel a:hover,
#autoHarvestMaturePanel a:hover,
#autoHarvestDyingPanel a:hover,
#autoPlantPanel a:hover,
#autoReload a:hover,
#autoReload2 a:hover,
#autoJQB a:hover,
#lumpReload a:hover { color: white; }

#cookieGardenHelperUrl { position:absolute; }

#cookieGardenHelperRightBottom {
  position: absolute;
  right: 0;
  bottom: 0;
  padding: 0.1rem;
  margin: 0.5rem;
  text-align: right;
  outline-width: 1px;
}
#cookieGardenHelperRightTop {
  display: flex;
  justify-content: center;
  align-items: center; 
  position: absolute;
  right: 0;
  top: 0;
  min-width: 5rem;
  height: 2rem;
  margin: 0.5rem;
  padding: 0.3rem;
  box-sizing: border-box;
  border: solid 2px white;
  border-radius: 5px;
  background-color: rgba(0, 0, 0, 0.5);
  font-size: 1.2rem;
  transition: all 500ms 0s ease;
}

#rightBottomAutoReload,
#rightBottomAutoReload2,
#rightBottomLumpReload { display: none }

#gardenPlot .cookieGardenHelperOverTile {
  opacity: 0;
  position: absolute;
  z-index: 1;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  border: solid 3px rgba(255, 255, 255, 0.8);
  border-radius: 25px;
  transition: all 500ms 0s ease;
}
#gardenPlot .cookieGardenHelperOverTileAge {
  display: inline-block;
  opacity: 0;
  position: absolute;
  z-index: 2;
  top: -3px;
  left: -3px;
  border-radius: 3px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 2px;
  transition: all 500ms 0s ease;
}

#logPanel {
  background: #000 url("https://gamuwo.github.io/gamuwo/logback.jpg");
  display: none;
  padding: 1rem;
  position: inherit;
  overflow: auto;
}
#logPanel.visible { display: block; }
#logPanel h2 { font-size: 1.2rem; }
#logPanel h3 {
  height: 1.3rem;
  font-size: 1rem;
  margin: 3px;
}
#logPanel p { text-indent: 0; }
#logPanel .logBoxParent {
  display: flex;
  flex-wrap: wrap;
}
#logPanel .logBox {
  flex: 1;
  min-width: 50%;
}
#logBoxLevel1.invisible,
#logBoxLevel2.invisible,
#logBoxLevel3.invisible,
#logBoxLevel4.invisible,
#logBoxScript.invisible { display: none; }
#logPanel .logText {
  width: calc(100% - 0.4rem);
  height: 10rem;
  border: solid 2px;
  padding: 0.4rem;
  margin: 0 0.2rem;
  user-select: text;
  overflow: auto;
  overflow-wrap: break-word;
  box-sizing: border-box;
  border-radius: 5px;
  background-color: rgba(0, 0, 0, 0.5);
}
#logPanel .flexPanel {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
#logPanel .flexItemGrowNormal { flex-grow: 1; }
#logPanel .flexItemGrowWide { flex-grow: 5; }
#logScript {
  width: calc(100% - 0.4rem);
  height: 10rem;
  border: solid 2px;
  padding: 0.4rem;
  margin: 0 0.2rem;
  overflow: auto;
  overflow-wrap: break-word;
  box-sizing: border-box;
  border-radius: 5px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  resize: none;
}

#cookieGardenHelperTitle {
  color: white;
  font-size: 1.5rem;
  font-style: normal;
  margin-bottom: 0.2rem;
  margin-top: 0rem;
  text-align: center;
  min-width: 25rem;
}
#cookieGardenHelper h2 {
  font-size: 1.2rem;
  margin: 3px 3px 2px 3px;
  min-width: 11rem;
}
#cookieGardenHelper h3 {
  display: flex;
  align-items: center;
}
#cookieGardenHelper h3:before,
#cookieGardenHelper h3:after {
  border-top: 2px dashed;
  content: "";
  flex-grow: 1;
}
#cookieGardenHelper h3:before { margin-right: 0.5rem; }
#cookieGardenHelper h3:after { margin-left: 0.5rem; }

#cookieGardenHelper p { text-indent: 0; }
#cookieGardenHelper input[type=number],
#logPanel input[type=number] { width: 1.7rem; }
#cookieGardenHelper input[type=number],
#logPanel input[type=number],
#cookieGardenHelper input[type=text],
#logPanel input[type=text] {
  border: solid 1px white;
  border-radius: 3px;
}
#cookieGardenHelper select,
#logPanel select {
  padding: 1px;
  -webkit-appearance: button;
  border: solid 1px white;
  border-radius: 3px;
}
#cookieGardenHelper select:disabled,
#cookieGardenHelper input:disabled,
#logPanel select:disabled,
#logPanel input:disabled {
  color: lightgray;
  background-color: gray;
  border-color: gray;
}
#cookieGardenHelper div.meterDiv { height: 7px; }
#cookieGardenHelper meter {
  width: 120px;
  height: 5px;
  vertical-align: 5px;
}
#cookieGardenHelper meter.meterSecond,
#cookieGardenHelper meter.meterThird { display: none; }
#cookieGardenHelper meter::-webkit-meter-bar ,
#cookieGardenHelper meter::-webkit-meter-optimum-value ,
#cookieGardenHelper meter::-webkit-meter-suboptimum-value ,
#cookieGardenHelper meter::-webkit-meter-even-less-good-value {
  background-image: none;
  border-radius: 2px;
}
#cookieGardenHelper meter.meterFirst::-webkit-meter-bar { background-color: darkslategray; }
#cookieGardenHelper meter.meterFirst::-webkit-meter-optimum-value,
#cookieGardenHelper meter.meterSecond::-webkit-meter-bar { background-color: greenyellow; }
#cookieGardenHelper meter.meterSecond::-webkit-meter-optimum-value,
#cookieGardenHelper meter.meterThird::-webkit-meter-bar { background-color: cornflowerblue; }
#cookieGardenHelper meter.meterThird::-webkit-meter-optimum-value { background-color: orange; }
#cookieGardenHelper meter.meterThird::-webkit-meter-suboptimum-value { background-color: hotpink; }

#cookieGardenHelper a.toggleBtn:not(.off) .toggleBtnOff,
#cookieGardenHelper a.toggleBtn.off .toggleBtnOn { display: none; }
#cookieGardenHelper a.toggleBtn,
#cookieGardenHelper a.btn,
#logPanel a.toggleBtn,
#logPanel a.btn {
  padding: 3px;
  margin: 0;
  border-radius: 5px;
  transition: all 100ms 0s ease;
}
#cookieGardenHelper span.labelWithState:not(.active) .labelStateActive,
#cookieGardenHelper span.labelWithState.active .labelStateNotActive { display: none; }

#cookieGardenHelperTooltip {
  background: #000 url("img/BGgarden.jpg");
  padding: 10px;
  margin: 4px 0;
}
#cookieGardenHelperTooltip .gardenTileRow { display: flex; }
#cookieGardenHelperTooltip .tile {
  position: relative;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 24px;
  display: inline-block;
  height: 48px;
  width: 48px;
}
#cookieGardenHelperTooltip .gardenTileIcon { position: static; }
#cookieGardenHelperTooltip .gardenTileAge {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  border-radius: 3px;
  display: inline-block;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 2px;
}

#cookieGardenHelper .warning {
  padding: 1rem;
  font-size: 1.5rem;
  background-color: orange;
  color: white;
}
#cookieGardenHelper .warning .closeWarning {
  font-weight: bold;
  float: right;
  font-size: 2rem;
  line-height: 0.25rem;
  cursor: pointer;
  transition: 0.3s;
}
#cookieGardenHelper .warning .closeWarning:hover { color: black; }

#support,
#smallSupport { display: none; }
`;
  }
  
  static numberInputWidth(name, text, title, options, width) {
    let id = this.makeId(name);
    return `
<input type="number" style="width: ${width}rem;" name="${name}" id="${id}" value="${options.value}" step=1
  ${options.min !== undefined ? `min="${options.min}"` : ''}
  ${options.max !== undefined ? `max="${options.max}"` : ''} />
<label for="${id}" title="${title}">${text}</label>`;
  }
  
  static numberInputDigits(name, text, title, options, digits) {
    let id = this.makeId(name);
    let width = 1.8;
    if(digits == 1) width = 1.3;
    if(digits == 2) width = 1.8;
    if(digits == 3) width = 2.3;
    if(digits == 4) width = 2.7;
    if(digits == 5) width = 3.1;
    return this.numberInputWidth(name, text, title, options, width);
  }
  
  static textInputWidth(name, text, title, options, width) {
    let id = this.makeId(name);
    return `<input type="text" style="width: ${width}rem;" name="${name}" id="${id}" value="${options}" />
<label for="${id}" title="${title}">${text}</label>`;
  }
  
  static fixedSelect(name, optionTextArray, startIndex, text, title, options, width) {
    let id = this.makeId(name);
    let selectContent = "";
    for(i=0; i<optionTextArray.length; i++){
      let indexLabel = (i + startIndex);
      selectContent = selectContent + '<option value="';
      selectContent = selectContent + indexLabel;
      selectContent = selectContent + '"';
      if(indexLabel == options.value) selectContent = selectContent + ' selected';
      selectContent = selectContent + '>';
      selectContent = selectContent + indexLabel;
      selectContent = selectContent + ':';
      selectContent = selectContent + optionTextArray[i];
      selectContent = selectContent + '</option>';
    }
    return `<select style="width: ${width}rem;" name="${name}" id="${id}" size="1">${selectContent}</select>
<label for="${id}" title="${title}">${text}</label>`;
  }
  
  static makeNameArray(inputArray) {
    let outputArray = [];
    for(i=0; i<inputArray.length; i++){
      outputArray[i] = inputArray[i].name;
    }
    return outputArray;
  }
  
  static meter(name, cls, low, high, optimum, value) {
    let id = this.makeId(name);
    return `<meter name="${name}" id="${id}" class="${cls}" low="${low}" high="${high}" optimum="${optimum}" value="${value}"></meter>`;
  }
  
  static spanMemory(name, options) {
    let id = this.makeId(name);
    return `<span name="${name}" id="${id}">${options}</span>`;
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
    doc.qSel('#row2 .productButtons').insertAdjacentHTML('beforeend', `
        <div id="cookieGardenHelperLogButton" class="productButton">
          Log
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
    <div class="cookieGardenHelperPanel" id="manualToolsPanel">
      <h2><span class="underline">Tools</span></h2>
      <div class="boxPanel">
        <h3>Save&Load</h3>
        <p>
          ${this.button('saveButton', 'Save', 'save')}
          ${this.button('exportSaveButton', 'Export', 'open export save window')}
          ${this.button('importSaveButton', 'Import', 'open import save window')}
        </p>
        <p>
          ${this.button('fileSaveButton', 'Save to file', 'file save')}
          <a class="btn option" style="position:relative;">
            <input id="cookieGardenHelperFileLoadButton" type="file" 
            style="cursor:pointer;opacity:0;position:absolute;left:0px;top:0px;width:100%;height:100%;" />
            Load from file
          </a>
        </p>
        <p>
          ${this.button('quickLoad', 'Quick load', 'load before tick savedata')}
          ${this.spanMemory('quickLoadSaveTime', config.quickLoadSaveTime)}
        </p>
        <p>
          ${this.button('quickSave2', 'QS2', 'quick save')}
          ${this.button('quickLoad2', 'QL2', 'quick load')}
          ${this.spanMemory('quickLoad2SaveTime', config.quickLoad2SaveTime)}
        </p>
        <h3>Play sound</h3>
        <p>
          ${this.button('playSound', '1', 'play beep sound before tick', true, config.playSound)}
          ${this.numberInputDigits('playSoundSecond', 'Sec', 'input second', config.playSoundSecond, 2)}
        </p>
        <p>
          ${this.button('playSound2', '2', 'play beep sound after tick', true, config.playSound2)}
          ${this.numberInputDigits('playSound2Tick', 'Tick', 'input ticks', config.playSound2Tick, 2)}
        </p>
        <p>
          ${this.button('playSoundMature', '3', 'play beep sound after target plant is mature', true, config.playSoundMature)}
          ${this.fixedSelect('playSoundMatureID', this.makeNameArray(Garden.minigame.plantsById), 1, 'ID', 'select ID', config.playSoundMatureID, 6)}
        </p>
        <h3>Settings</h3>
        <p>
          ${this.button('overTile', 'Over tile', 'display over tile', true, config.overTile)}
          ${this.numberInputDigits('overTileHideTime', 'Hide', 'input over tile hide time(sec)', config.overTileHideTime, 3)}
        </p>
        <p>
          ${this.button('overTileAge', 'Age', 'display age on garden tile', true, config.overTileAge)}
          ${this.numberInputDigits('interval', 'Interval', 'input auto reload interval(ms)', config.interval, 4)}
        </p>
        <p>
          ${this.button('clickFortune', 'Click fortune', 'click fortune news', true, config.clickFortune)}
        </p>
      </div>
    </div>
    <div class="cookieGardenHelperPanel" id="autoHarvestPanel">
      <h2>
        <span class="underline">Auto-harvest</span>
        ${this.button('autoHarvest', '', '', true, config.autoHarvest)}
      </h2>
      <div class="boxPanel">
        <div id="autoHarvestImmortalPanel">
          <h3>Immortal</h3>
          <p>
            ${this.button('autoHarvestAvoidImmortals', 'Avoid immortals', 'Do not harvest immortal plants', true, config.autoHarvestAvoidImmortals)}
          </p>
        </div>
        <div id="autoHarvestYoungPanel">
          <h3>Young</h3>
          <p>
            ${this.button('autoHarvestWeeds', 'Remove weeds', 'Remove weeds as soon as they appear', true, config.autoHarvestWeeds)}
          </p>
          <p>
            ${this.button('autoHarvestCleanGarden', 'Clean garden', 'Only allow saved and unlocked seeds', true, config.autoHarvestCleanGarden)}
          </p>
        </div>
        <div id="autoHarvestMaturePanel">
          <h3>Mature</h3>
          <p>
            ${this.button('autoHarvestNewSeeds', 'New seeds', 'Harvest new seeds as soon as they are mature', true, config.autoHarvestNewSeeds)}
          </p>
          <p>
            ${this.button('autoHarvestCheckCpSMult', 'Harvest', 'Check the CpS multiplier before harvesting (see below)', true, config.autoHarvestCheckCpSMult)}
            ${this.numberInputDigits('autoHarvestMiniCpSMult', 'Min', 'Minimum CpS multiplier for the auto-harvest to happen', config.autoHarvestMiniCpSMult, 4)}
          </p>
        </div>
        <div id="autoHarvestDyingPanel">
          <h3>Dying</h3>
          <p>
            ${this.button('autoHarvestDying', 'Dying plants', `Harvest dying plants, ${config.autoHarvestDyingSeconds}s before `
              + `the new tick occurs`, true, config.autoHarvestDying)}
          </p>
          <p>
            ${this.button('autoHarvestCheckCpSMultDying', 'Harvest', 'Check the CpS multiplier before harvesting (see below)', true, config.autoHarvestCheckCpSMultDying)}
            ${this.numberInputDigits('autoHarvestMiniCpSMultDying', 'Min', 'Minimum CpS multiplier for the auto-harvest to happen', config.autoHarvestMiniCpSMultDying, 4)}
          </p>
        </div>
      </div>
    </div>
    <div class="cookieGardenHelperPanel">
      <div id="autoPlantPanel">
        <h2>
          <span class="underline">Auto-plant</span>
          ${this.button('autoPlant', '', '', true, config.autoPlant)}
        </h2>
        <div class="boxPanel">
          <p>
            ${this.button('autoPlantCheckCpSMult', 'Plant', 'Check the CpS multiplier before planting (see below)', true, config.autoPlantCheckCpSMult)}
            ${this.numberInputDigits('autoPlantMaxiCpSMult', 'Max', 'Maximum CpS multiplier for the auto-plant to happen', config.autoPlantMaxiCpSMult, 4)}
          </p>
          <p>
            ${this.button('savePlot', 'Save plot', 'Save the current plot; these seeds will be replanted later')}
            ${this.labelWithState('plotIsSaved', 'No saved plot', 'Plot saved', Boolean(config.savedPlot.length))}
          </p>
          <p>
            ${this.button('fillGardenWithSelectedSeed', 'Plant selected seed', 'Plant the selected seed on all empty tiles')}
          </p>
        </div>
      </div>
      <div id="autoJQB">
        <h2>
          <span class="underline">Auto-JQB</span>
          ${this.button('autoJQB', '', '', true, config.autoJQB)}
        </h2>
        <div class="boxPanel">
          <p>
            ${this.fixedSelect('autoJQBStage', ["no plants", "QB growing", "waiting JQB", "JQB growing", "JQB+QB growing"], 0, 'Stage', 'select stage', config.autoJQBStage, 7)}
          </p>
          <p>
            ${this.textInputWidth('autoJQBParam', 'Param', 'auto JQB parameter(QBnum,QBplay,JQBnum,JQBplay,JQBage)', config.autoJQBParam, 5)}
          </p>
        </div>
      </div>
      <div id="lumpReload">
        <h2>
          <span class="underline">Auto-lump</span>
          ${this.button('autoLump', '', '', true, config.autoLump)}
        </h2>
        <div class="boxPanel">
          <p>
            ${this.button('lumpReload', 'Lump reload', 'reload for sugar lump', true, config.lumpReload)}
            ${this.button('lumpReloadReset', 'Reset', 'reset history data')}
          </p>
          <p>
            ${this.numberInputDigits('lumpReloadNum', 'Gain', 'input number', config.lumpReloadNum, 1)}
          </p>
          <p>
            ${this.fixedSelect('lumpReloadType', ["normal", "bifurcated", "golden", "meaty", "caramelized"], 0, 'Type', 'select type', config.lumpReloadType, 5)}
          </p>
        </div>
      </div>
    </div>
    <div class="cookieGardenHelperPanel">
      <div id="autoReload">
        <h2>
          <span class="underline">Auto-reload</span>
          ${this.button('autoReload', '', '', true, config.autoReload)}
        </h2>
        <div class="boxPanel">
          <p>
            ${this.fixedSelect('autoReloadMode', ["Max mode", "XY mode", "Lock seed mode"], 0, 'Mode', 'select mode', config.autoReloadMode, 6.5)}
          </p>
          <p>
            ${this.fixedSelect('autoReloadID', this.makeNameArray(Garden.minigame.plantsById), 1, 'ID', 'select ID', config.autoReloadID, 7)}
          </p>
          <p>
            ${this.numberInputDigits('autoReloadMax', 'Max', 'input max plants(if 0, use xy)', config.autoReloadMax, 2)}
            ${this.numberInputDigits('autoReloadX', 'X', 'input x(only works when max = 0)', config.autoReloadX, 1)}
            ${this.numberInputDigits('autoReloadY', 'Y', 'input Y(only works when max = 0)', config.autoReloadY, 1)}
          </p>
          <p>
            ${this.button('autoReloadGetXY', 'Get XY', 'get X/Y by clicking tile', true, config.autoReloadGetXY)}
            ${this.button('autoReloadReset', 'Reset', 'reset history data')}
          </p>
        </div>
      </div>
      <div id="autoReload2">
        <h2>
          <span class="underline">Auto-reload2</span>
          ${this.button('autoReload2', '', '', true, config.autoReload2)}
        </h2>
        <div class="boxPanel">
          <p>
            ${this.fixedSelect('autoReload2ID', this.makeNameArray(Garden.minigame.plantsById), 1, 'ID', 'select ID', config.autoReload2ID, 7)}
          </p>
          <p>
            ${this.numberInputDigits('autoReload2Number', 'Num', 'input Number', config.autoReload2Number, 2)}
            ${this.numberInputDigits('autoReload2Play', 'Play', 'input Play', config.autoReload2Play, 2)}
          </p>
          <p>
            ${this.numberInputDigits('autoReload2Grow', 'Grow', 'input Grow', config.autoReload2Grow, 2)}
            ${this.button('autoReload2Reset', 'Reset', 'reset history data')}
          </p>
        </div>
      </div>
    </div>
  </div>
  <div id="cookieGardenHelperRightTop">
    <span id="beforeTickDisp">0</span>
  </div>
  <div id="cookieGardenHelperRightBottom">
    <div id="rightBottomLumpReload">
      <p>
        Try:<span id="lumpReloadDisp">0</span>
        Gain:<span id="lumpReloadDisp2">0</span>
        Type:<span id="lumpReloadDisp3">0</span><br>
        Ave:<span id="lumpReloadDisp4">[0]0(0)</span>
      </p>
      <div class="meterDiv">
        ${this.meter('lumpReloadMeterGain', 'meterFirst', 0, 0, 0.5, 0)}
      </div>
      <div class="meterDiv">
        ${this.meter('lumpReloadMeter', 'meterFirst', 0, 0, 0.5, 0)}
        ${this.meter('lumpReloadMeter2', 'meterSecond', 0, 0, 0.5, 0)}
        ${this.meter('lumpReloadMeter3', 'meterThird', 0, 0.99, 0.5, 0)}
      </div>
    </div>
    <div id="rightBottomAutoReload">
      <p>
        Try:<span id="autoReloadDisp">0</span>
        Ave:<span id="autoReloadDisp2">[0]0(0)</span>
      </p>
      <div class="meterDiv">
        ${this.meter('autoReloadMeter', 'meterFirst', 0, 0, 0.5, 0)}
        ${this.meter('autoReloadMeter2', 'meterSecond', 0, 0, 0.5, 0)}
        ${this.meter('autoReloadMeter3', 'meterThird', 0, 0.99, 0.5, 0)}
      </div>
    </div>
    <div id="rightBottomAutoReload2">
      <p>
        Try:<span id="autoReload2Disp">0</span>
        Grow:<span id="autoReload2Disp2">0/0(0)</span><br>
        Ave:<span id="autoReload2Disp3">[0]0(0)</span><br>
        Age:<span id="autoReload2Disp4">0-0(0)/0</span>
      </p>
      <div class="meterDiv">
        ${this.meter('autoReload2MeterGrow', 'meterFirst', 0, 0, 0.5, 0)}
      </div>
      <div class="meterDiv">
        ${this.meter('autoReload2Meter', 'meterFirst', 0, 0, 0.5, 0)}
        ${this.meter('autoReload2Meter2', 'meterSecond', 0, 0, 0.5, 0)}
        ${this.meter('autoReload2Meter3', 'meterThird', 0, 0.99, 0.5, 0)}
      </div>
    </div>
    <div>
      <p>
        Interval:<span id="intervalDisp">1000</span>ms
        Time:<span id="runtimeDisp">0</span>ms
      </p>
    </div>
  </div>
</div>
<div id="logPanel">
  <div class="flexPanel">
    <h2 class="flexItemGrowWide">
      <span class="underline">Log</span>
    </h2>
    <p class="flexItemGrowNormal">
      ${this.button('logToggleLevel1', 'Level1', 'toggle level1 log panel')}
      ${this.button('logToggleLevel2', 'Level2', 'toggle level2 log panel')}
      ${this.button('logToggleLevel3', 'Level3', 'toggle level3 log panel')}
      ${this.button('logToggleLevel4', 'Level4', 'toggle level4 log panel')}
      ${this.button('logToggleScript', 'Script', 'toggle script panel')}
    </p>
    <p class="flexItemGrowNormal">
      ${this.button('logRefreshButton', 'Refresh', 'refresh, scroll bottom')}
      ${this.textInputWidth('logFilterWord', 'Filter', 'log filter word', config.logFilterWord, 8)}
    </p>
    <p class="flexItemGrowNormal">
      ${this.fixedSelect('logLevel', ["no log", "a little", "normal", "massive", "debug"], 0, 'Level', 'select log level', config.logLevel, 4)}
    </p>
    <p>
      ${this.button('logResetButton', 'Reset', 'reset log')}
    </p>
  </div>
  <div class="logBoxParent">
    <div class="logBox" id="logBoxLevel1">
      <h3>
        Level1
        (<span id="logNumLevel1">0</span>/1000)
      </h3>
      <div class="logText" id="logLevel1">
      </div>
    </div>
    <div class="logBox" id="logBoxLevel2">
      <h3>
        Level2
        (<span id="logNumLevel2">0</span>/1000)
      </h3>
      <div class="logText" id="logLevel2">
      </div>
    </div>
    <div class="logBox" id="logBoxLevel3">
      <h3>
        Level3
        (<span id="logNumLevel3">0</span>/1000)
      </h3>
      <div class="logText" id="logLevel3">
      </div>
    </div>
    <div class="logBox" id="logBoxLevel4">
      <h3>
        Level4
        (<span id="logNumLevel4">0</span>/1000)
      </h3>
      <div class="logText" id="logLevel4">
      </div>
    </div>
    <div class="logBox" id="logBoxScript">
      <h3>
        Script
        ${this.button('logRunScript', 'Run', 'run script')}
      </h3>
      <textarea cols="" rows="" id="logScript">${config.logScriptText}</textarea>
    </div>
  </div>
</div>`);

    doc.elId('cookieGardenHelperProductButton').onclick = (event) => {
      let panel = doc.elId('cookieGardenHelper');
      panel.classList.toggle('visible');
      UI.hackDragArea(panel.classList.contains('visible'));
    };
    
    doc.elId('cookieGardenHelperLogButton').onclick = (event) => {
      Garden.displayLog(1);
      Garden.displayLog(2);
      Garden.displayLog(3);
      Garden.displayLog(4);
      doc.elId('logPanel').classList.toggle('visible');
      Garden.goBottom("logLevel1");
      Garden.goBottom("logLevel2");
      Garden.goBottom("logLevel3");
      Garden.goBottom("logLevel4");
    };
    doc.elId('logScript').onchange = (event) => {
      config.logScriptText = doc.elId('logScript').value;
      Main.save();
    };
    doc.elId('logScript').addEventListener("keydown", function(event) {
      //for prevent frozen cookie keybind
      event.stopImmediatePropagation();
    }, true);

    doc.qSelAll('#cookieGardenHelper input, #logPanel input').forEach((input) => {
      input.onchange = (event) => {
        if (input.type == 'number') {
          let min = config[input.name].min;
          let max = config[input.name].max;
          if (min !== undefined && input.value < min) { input.value = min; }
          if (max !== undefined && input.value > max) { input.value = max; }
          Main.handleChange(input.name, input.value);
        } else if (input.type == 'text') {
          Main.handleChange(input.name, input.value);
        }
      };
      if (input.type == 'text') {
        input.addEventListener("keydown", function(event) {
          //for prevent frozen cookie keybind
          event.stopImmediatePropagation();
        }, true);
      }
    });
    
    doc.qSelAll('#cookieGardenHelper select, #logPanel select').forEach((input) => {
      input.onchange = (event) => {
        Main.handleChange(input.name, input.value);
        if(input.name == "autoReload2ID"){
          let plant = Garden.getPlant(config.autoReload2ID.value);
          let maxGrow = Math.ceil(plant.ageTick + plant.ageTickR);
          Garden.changeNumber("autoReload2Grow", maxGrow, config);
          Main.save();
        }
      };
    });
    
    doc.qSelAll('#cookieGardenHelper select').forEach((input) => {
      input.onclick = (event) => {
        let id = input.id;
        if(id !== undefined && id.length > 2 && id.slice(-2) == "ID" && Garden.selectedSeed > -1){
          input.value = (Garden.selectedSeed + 1);
          input.onchange();
          Game.SparkleAt(Game.mouseX, Game.mouseY);
        }
      };
    });
    
    doc.qSelAll('#gardenPlot div.gardenTile').forEach((tile) => {
      //get xy(interrupt original click event)
      tile.addEventListener("click", function(event) {
        Garden.writeLog(3, "auto reload", false, "click tile:" + tile.id);
        if(config.autoReloadGetXY){
          let splitted = tile.id.split("-");
          if(splitted.length == 3){
            let x = splitted[1];
            let y = splitted[2];
            Garden.changeNumber("autoReloadX", x, config);
            Garden.changeNumber("autoReloadY", y, config);
            Garden.changeButton("autoReloadGetXY", false, config);
            Main.save();
            if(config.overTile) Garden.flashOverTile(x, y, "", Garden.colorRGBA.orange, 100, config);
            Garden.writeLog(3, "auto reload", false, "set x/y:" + config.autoReloadX.value + "/" + config.autoReloadY.value);
            event.stopImmediatePropagation();
          }
        }
      }, true);
      
      //build div over garden tile
      let idSplitted = tile.id.split("-");
      if(idSplitted.length == 3){
        let idNew = "overTile-" + idSplitted[1] + "-" + idSplitted[2];
        let idAge = "overTileAge-" + idSplitted[1] + "-" + idSplitted[2];
        let html = "";
        html = html + `<div id="`;
        html = html + idNew;
        html = html + `" class="cookieGardenHelperOverTile">`;
        html = html + `</div>`;
        html = html + `<div id="`;
        html = html + idAge;
        html = html + `" class="cookieGardenHelperOverTileAge">`;
        html = html + `</div>`;
        tile.insertAdjacentHTML("beforeend", html);
      }
      
    });

    doc.qSelAll('#cookieGardenHelper a.toggleBtn').forEach((a) => {
      a.onclick = (event) => {
        Main.handleToggle(a.name);
      };
    });

    doc.qSelAll('#cookieGardenHelper a.btn, #logPanel a.btn').forEach((a) => {
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

    doc.elId('cookieGardenHelperQuickLoadSaveTime').onmouseout = (event) => {
      Game.tooltip.shouldHide=1;
    }
    doc.elId('cookieGardenHelperQuickLoadSaveTime').onmouseover = (event) => {
      if (config.quickLoadSavedPlot.length > 0) {
        let content = UI.buildSavedPlot(config.quickLoadSavedPlot, false);
        Game.tooltip.draw(this, window.escape(content));
      }
    }

    doc.elId('cookieGardenHelperQuickLoad2SaveTime').onmouseout = (event) => {
      Game.tooltip.shouldHide=1;
    }
    doc.elId('cookieGardenHelperQuickLoad2SaveTime').onmouseover = (event) => {
      if (config.quickLoad2SavedPlot.length > 0) {
        let content = UI.buildSavedPlot(config.quickLoad2SavedPlot, false);
        Game.tooltip.draw(this, window.escape(content));
      }
    }
    
    doc.elId('cookieGardenHelperRightBottom').onmouseout = (event) => {
      if(config.rightBottomDisplaySave.length == 3){
        document.getElementById("rightBottomAutoReload").style.display = config.rightBottomDisplaySave[0];
        document.getElementById("rightBottomAutoReload2").style.display = config.rightBottomDisplaySave[1];
        document.getElementById("rightBottomLumpReload").style.display = config.rightBottomDisplaySave[2];
        config.rightBottomDisplaySave = [];
        Main.save();
      }
      document.getElementById("cookieGardenHelperRightBottom").style.outlineStyle = "none";
      document.getElementById("cookieGardenHelperRightBottom").style.zIndex = "auto";
      document.getElementById("cookieGardenHelperRightBottom").style.backgroundImage = "none";
    }
    doc.elId('cookieGardenHelperRightBottom').onmouseover = (event) => {
      let displaySave = [];
      displaySave[0] = document.getElementById("rightBottomAutoReload").style.display;
      displaySave[1] = document.getElementById("rightBottomAutoReload2").style.display;
      displaySave[2] = document.getElementById("rightBottomLumpReload").style.display;
      config.rightBottomDisplaySave = displaySave;
      Main.save();
      
      document.getElementById("rightBottomAutoReload").style.display = "block";
      document.getElementById("rightBottomAutoReload2").style.display = "block";
      document.getElementById("rightBottomLumpReload").style.display = "block";
      
      document.getElementById("cookieGardenHelperRightBottom").style.outlineStyle = "solid";
      document.getElementById("cookieGardenHelperRightBottom").style.zIndex = "1";
      document.getElementById("cookieGardenHelperRightBottom").style.backgroundImage = 'url("https://gamuwo.github.io/gamuwo/background.jpg")';
    }
    
    doc.elId('cookieGardenHelperFileLoadButton').onchange = (event) => {
      Game.FileLoad(event);
      document.getElementById("cookieGardenHelperFileLoadButton").value = "";
    }
    
    window.onkeydown = (event) => {
      if(event.ctrlKey && event.keyCode == 49){
        Main.handleQuickLoad(config.quickLoadSave, config.quickLoadSavedPlot);
      }
      if(event.ctrlKey && event.keyCode == 50){
        Main.handleQuickLoad(config.quickLoad2Save, config.quickLoad2SavedPlot);
      }
    }
    
    //hack tooltips
    this.hackTileTooltip();
    this.hackSeedTooltip();
    this.hackLumpTooltip();
    
    //log invisible set
    if(config.logInvisibleLevel1) doc.elId('logBoxLevel1').classList.toggle('invisible');
    if(config.logInvisibleLevel2) doc.elId('logBoxLevel2').classList.toggle('invisible');
    if(config.logInvisibleLevel3) doc.elId('logBoxLevel3').classList.toggle('invisible');
    if(config.logInvisibleLevel4) doc.elId('logBoxLevel4').classList.toggle('invisible');
    if(config.logInvisibleScript) doc.elId('logBoxScript').classList.toggle('invisible');
    
    //control auto reload elements disabled
    Main.controlAutoReloadElementDisabled();
  }

  static getSeedIconX(seedId, age, isSeed) {
    let mature = Garden.getPlant(seedId).mature;
    let stage = 0;
    if(age >= mature){
      stage = 4;
    } else if(age >= (mature * 0.666)) {
      stage = 3;
    } else if(age >= (mature * 0.333)) {
      stage = 2;
    } else {
      stage = 1;
    }
    if(isSeed){
      return 0;
    } else {
      return stage * -48;
    }
  }
  static getSeedIconY(seedId) {
    return Garden.getPlant(seedId).icon * -48;
  }
  static getOpacity(seedId, age, isSeed) {
    let stage = Garden.getPlantStage({seedId: seedId, age: age});
    let opacity = 1;
    if(!isSeed && stage=="dying") opacity = 0.5;
    return opacity;
  }

  static buildSavedPlot(savedPlot, isSeed) {
    let plotHtml =  `<div id="cookieGardenHelperTooltip">
      ${savedPlot.map((row) => `<div class="gardenTileRow">
        ${row.map((tile) => `<div class="tile">
          ${(tile[0] - 1) < 0 ? '' : `<div class="gardenTileIcon" style="background-position: ${this.getSeedIconX(tile[0], tile[1], isSeed)}px ${this.getSeedIconY(tile[0])}px; opacity: ${this.getOpacity(tile[0], tile[1], isSeed)};"></div>`}
          ${(tile[0] - 1) < 0 || isSeed ? '' : `<div class="gardenTileAge">${tile[1]}</div>`}
        </div>`).join('')}
      </div>`).join('')}
    </div>`;
    Garden.writeLog(4, "saved plot", false, plotHtml.replace(/\r?\n/g, ""));
    return plotHtml;
  }
  
  static makeTooltipTitleHTML() {
    let result = "";
    result = result + `<div class="line"></div>`;
    result = result + `<div style="text-align:center;">Cookie Garden Helper Mod</div>`;
    return result;
  }
  
  static makePlantDataHTML(id) {
    //get parents data
    let plant = Garden.getPlant(id);
    let parents = [];
    for(let i in Garden.minigame.plants){
      for(let j of Garden.minigame.plants[i].children){
        if(j == plant.key){
          parents.push({name: Garden.minigame.plants[i].name, icon: Garden.minigame.plants[i].icon});
          break;
        }
      }
    }
    //make plant data html
    let result = "";
    result = result + `<div style="margin:6px 0px;font-size:11px;">`;
    result = result + `<b>Mature : </b>`;
    result = result + plant.mature;
    result = result + `<b> AgeTick : </b>`;
    result = result + plant.ageTick;
    result = result + `<b> AgeTickR : </b>`;
    result = result + plant.ageTickR;
    result = result + `</div>`;
    if( (plant.plantable !== undefined && !plant.plantable) || (plant.noContam !== undefined && plant.noContam) || plant.contam !== undefined ){
      result = result + `<div style="margin:6px 0px;font-size:11px;">`;
      if(plant.plantable !== undefined && !plant.plantable){
        result = result + `<div class="red" style="display: inline-block; margin-right: 5px;">`;
        result = result + `<b>Not plantable</b>`;
        result = result + `</div>`;
      }
      if(plant.noContam !== undefined && plant.noContam){
        result = result + `<div class="green" style="display: inline-block; margin-right: 5px;">`;
        result = result + `<b>NoContam</b>`;
        result = result + `</div>`;
      }
      if(plant.contam !== undefined){
        result = result + `<div class="red" style="display: inline-block;">`;
        result = result + `<b>Contam : </b>`;
        result = result + plant.contam;
        result = result + `</div>`;
      }
      result = result + `</div>`;
    }
    if(parents.length > 0){
      result = result + `<div style="margin:6px 0px;font-size:11px;">`;
      result = result + `<b>Parents : </b>`;
      for(let i of parents){
        result = result + `<div style="display: inline-block; margin: 0px 4px 0px 0px;">`;
        result = result + `<div class="gardenSeedTiny" style="background-position:0px -`;
        result = result + (i.icon * 48);
        result = result + `px;"></div>`;
        result = result + i.name;
        result = result + `</div>`;
      }
      result = result + `</div>`;
    }
    if(plant.children.length > 0){
      result = result + `<div style="margin:6px 0px;font-size:11px;">`;
      result = result + `<b>Children : </b>`;
      for(let i of plant.children){
        result = result + `<div style="display: inline-block; margin: 0px 4px 0px 0px;">`;
        result = result + `<div class="gardenSeedTiny" style="background-position:0px -`;
        result = result + (Garden.minigame.plants[i].icon * 48);
        result = result + `px;"></div>`;
        result = result + Garden.minigame.plants[i].name;
        result = result + `</div>`;
      }
      result = result + `</div>`;
    }
    return result;
  }
  
  static makeMutationsHTML(mutations, title) {
    let result = "";
    result = result + `<div style="margin:6px 0px;font-size:11px;text-align:left;">`;
    result = result + `<b>`;
    result = result + title;
    result = result + ` : </b>`;
    for(let i of mutations){
      result = result + `<div style="display: inline-block; margin: 0px 4px 0px 0px;">`;
      result = result + `<div class="gardenSeedTiny" style="background-position:0px -`;
      result = result + (Garden.minigame.plants[i[0]].icon * 48);
      result = result + `px;"></div>`;
      result = result + Garden.minigame.plants[i[0]].name;
      result = result + `(`;
      result = result + i[1];
      result = result + `)`;
      result = result + `</div>`;
    }
    result = result + `</div>`;
    return result;
  }
  
  static hackTileTooltip() {
    //garden tile tooltip hack
    let tileTooltipOrigin = Garden.minigame.tileTooltip;
    Garden.minigame.tileTooltip = function() {
      let x = arguments[0];
      let y = arguments[1];
      let funcOrigin = tileTooltipOrigin.apply(null, arguments);
      let func = function() {
        if(Game.keys[16]) return "";
        //original tooptip
        let result = funcOrigin.apply(null, arguments);
        //add plant data
        if(!Garden.tileIsEmpty(x, y)){
          //if plant exist, display plant data
          let tile = Garden.getTile(x, y);
          let plant = Garden.getPlant(tile.seedId);
          //for next age
          let nextAgeMin = (tile.age + Math.floor(plant.ageTick));
          let nextAgeMax = (tile.age + Math.ceil(plant.ageTick + plant.ageTickR));
          //for max min age
          let ageArray = [];
          Garden.forEachTile((x, y) => {
            let tileForAge = Garden.getTile(x, y);
            if(tileForAge.seedId == tile.seedId){
              ageArray.push(tileForAge.age);
            }
          });
          let ageString = "";
          if(ageArray.length > 0){
            ageArray.sort(function(a,b){return(a - b);});
            ageString = ageArray[0] + "-" + ageArray[ageArray.length - 1] + "(" + (ageArray[ageArray.length - 1] - ageArray[0]) + ")";
          }
          //modify tooltip
          result = result.slice(0, -6); //delete original </div>
          result = result + UI.makeTooltipTitleHTML();
          result = result + `<div style="margin:6px 0px;font-size:11px;">`;
          result = result + `<b>Age : </b>`;
          result = result + tile.age;
          result = result + `<b> Next age : </b>`;
          result = result + nextAgeMin;
          result = result + `-`;
          result = result + nextAgeMax;
          if(ageString != ""){
            result = result + `<b> Same kind age : </b>`;
            result = result + ageString;
          }
          result = result + `</div>`;
          result = result + UI.makePlantDataHTML(tile.seedId);
          result = result + `</div>`; //append original </div>
        } else {
          //if tile is empty, display possible mutations
          let mutations = Garden.getMutsCustom(x, y, false);
          let mutationsMature = Garden.getMutsCustom(x, y, true);
          if(mutations.length > 0 || mutationsMature.length > 0){
            result = result.slice(0, -6); //delete original </div>
            result = result + UI.makeTooltipTitleHTML();
            if(mutations.length > 0) result = result + UI.makeMutationsHTML(mutations, "Mutations");
            if(mutationsMature.length > 0) result = result + UI.makeMutationsHTML(mutationsMature, "Mutations(if all plants are mature)");
            result = result + `</div>`; //append original </div>
          }
        }
        Garden.writeLog(4, "tooltip hack", false, result);
        return result;
      }
      return func;
    }
  }
  
  static hackSeedTooltip() {
    //garden seed tooptip hack
    let seedTooltipOrigin = Garden.minigame.seedTooltip;
    Garden.minigame.seedTooltip = function() {
      let id = arguments[0];
      let funcOrigin = seedTooltipOrigin.apply(null, arguments);
      let func = function() {
        //original tooptip
        let result = funcOrigin.apply(null, arguments);
        //add plant data
        result = result.slice(0, -6); //delete original </div>
        result = result + UI.makeTooltipTitleHTML();
        result = result + UI.makePlantDataHTML(id + 1);
        result = result + `</div>`;  //append original </div>
        Garden.writeLog(4, "tooltip hack", false, result);
        return result;
      }
      return func;
    }
  }
  
  static hackLumpTooltip() {
    //suger lump tooptip hack
    let lumpTooltipOrigin = Game.lumpTooltip;
    Game.lumpTooltip = function() {
      //original tooptip
      let result = lumpTooltipOrigin.apply(null, arguments);
      //add lump data
      result = result.slice(0, -6); //delete original </div>
      result = result + UI.makeTooltipTitleHTML();
      result = result + `<div style="display: flex; align-items: center; justify-content: center;">`;
      result = result + `Type : `;
      result = result + `<div class="usesIcon" style="transform: scale(0.5,0.5); margin: -12px -12px; display: inline-block; width: 48px; height: 48px; background-position: -`;
      result = result + (29 * 48);
      result = result + `px -`;
      result = result + ([14, 15, 16, 17, 27][Game.lumpCurrentType] * 48);
      result = result + `px;"></div>`;
      result = result + `<b>`;
      result = result + ["normal", "bifurcated", "golden", "meaty", "caramelized"][Game.lumpCurrentType];
      result = result + `</b>`;
      result = result + `</div>`;
      result = result + `</div>`; //append original </div>
      Garden.writeLog(4, "tooltip hack", false, result);
      return result;
    }
  }
  
  static hackDragArea(isOpen) {
    let dragArea = document.getElementById("gardenDrag");
    if(isOpen){
      let panel = document.getElementById("cookieGardenHelper");
      let height = panel.getBoundingClientRect().height;
      dragArea.style.bottom = (height * -1) + "px";
    } else {
      dragArea.style.bottom = 0;
    }
    Garden.writeLog(4, "drag area hack", false, "dragArea.style.bottom:" + dragArea.style.bottom);
  }
  
}

class Main {
  static init() {
    this.timerInterval = 1000;
    this.config = Config.load();
    UI.build(this.config);

    // sacrifice garden
    let oldConvert = Garden.minigame.convert;
    Garden.minigame.convert = () => {
      this.config.savedPlot = [];
      UI.labelToggleState('plotIsSaved', false);
      Garden.changeButton("autoHarvest", false, this.config);
      Garden.changeButton("autoPlant", false, this.config);
      Garden.changeButton("autoJQB", false, this.config);
      Garden.changeButton("autoLump", false, this.config);
      Garden.changeButton("autoReload", false, this.config);
      Garden.changeButton("autoReload2", false, this.config);
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
  
  static restart(interval) {
    this.stop();
    this.timerInterval = interval;
    this.timerId = window.setInterval(
      () => Garden.run(this.config),
      this.timerInterval
    );
  }

  static stop() { window.clearInterval(this.timerId); }

  static save() { Config.save(this.config); }
  
  static handleQuickLoad(save, plot) {
    if(save != "") {
      Game.LoadSave(save);
      if(this.config.overTile){
        window.setTimeout(() => {
          Garden.compareAge(plot, this.config);
        }, parseInt(this.config.interval.value));
      }
    }
  }
  
  static controlAutoReloadElementDisabled() {
    let mode = this.config.autoReloadMode.value;
    if(mode == 0){
      document.getElementById(UI.makeId("autoReloadID")).disabled = false;
      document.getElementById(UI.makeId("autoReloadMax")).disabled = false;
      document.getElementById(UI.makeId("autoReloadX")).disabled = true;
      document.getElementById(UI.makeId("autoReloadY")).disabled = true;
    }
    if(mode == 1){
      document.getElementById(UI.makeId("autoReloadID")).disabled = false;
      document.getElementById(UI.makeId("autoReloadMax")).disabled = true;
      document.getElementById(UI.makeId("autoReloadX")).disabled = false;
      document.getElementById(UI.makeId("autoReloadY")).disabled = false;
    }
    if(mode == 2){
      document.getElementById(UI.makeId("autoReloadID")).disabled = true;
      document.getElementById(UI.makeId("autoReloadMax")).disabled = true;
      document.getElementById(UI.makeId("autoReloadX")).disabled = true;
      document.getElementById(UI.makeId("autoReloadY")).disabled = true;
    }
  }

  static handleChange(key, value) {
    if (this.config[key].value !== undefined) {
      this.config[key].value = value;
    } else {
      this.config[key] = value;
    }
    this.save();
    
    if(key == "autoReloadX" || key == "autoReloadY"){
      if(this.config.overTile) Garden.flashOverTile(this.config.autoReloadX.value, this.config.autoReloadY.value, "", Garden.colorRGBA.orange, 100, this.config);
    }
    if(key == "autoReloadMode"){
      this.controlAutoReloadElementDisabled();
    }
  }

  static handleToggle(key) {
    this.config[key] = !this.config[key];
    UI.toggleButton(key);
    
    if(key == "lumpReload" && this.config[key]){
      //lump reload ON
      Garden.writeLog(2, "lump reload", false, "lump reload on");
      this.config.lumpReloadSave = Game.WriteSave(1);
      //display
      document.getElementById("rightBottomAutoReload").style.display = "none";
      document.getElementById("rightBottomAutoReload2").style.display = "none";
      document.getElementById("rightBottomLumpReload").style.display = "block";
      //reset interval
      this.restart(parseInt(this.config.interval.value));
      Garden.writeLog(3, "lump reload", false, "reset interval:" + Main.timerInterval);
    }
    
    if(key=="overTile" && !this.config[key]){
      Garden.hideOverTile();
    }
    if(key=="overTileAge" && !this.config[key]){
      Garden.hideOverTile();
    }
    if(key=="autoReload" && !this.config[key] && this.config.autoReloadSaveSecond != 9999){
      //auto reload forced termination
      Main.restart(1000);
      Garden.restoreButtonStatus(this.config.autoReloadButtonSave, this.config);
      this.config.autoReloadSave = "";
      this.config.autoReloadSaveSecond = 9999;
      this.config.autoReloadReloads = 0;
      this.config.autoReloadNumber = 0;
      this.config.autoReloadLockSeeds = [];
      this.config.autoReloadButtonSave = [];
      Garden.writeLog(2, "auto reload", false, "force termination! reset data");
    }
    if(key=="autoReload2" && !this.config[key] && this.config.autoReload2SaveSecond != 9999){
      //auto reload2 forced termination
      Main.restart(1000);
      Garden.restoreButtonStatus(this.config.autoReload2ButtonSave, this.config);
      this.config.autoReload2Save = "";
      this.config.autoReload2SaveSecond = 9999;
      this.config.autoReload2Reloads = 0;
      this.config.autoReload2Plants = [];
      this.config.autoReload2ButtonSave = [];
      Garden.writeLog(2, "auto reload2", false, "force termination! reset data");
    }
    if(key=="lumpReload" && !this.config[key] && this.config.lumpReloadSave != ""){
      //lump reload forced termination
      Main.restart(1000);
      if(this.config.autoLumpButtonSave.length > 0){
        Garden.restoreButtonStatus(this.config.autoLumpButtonSave, this.config);
        this.config.autoLumpButtonSave = [];
      }
      this.config.lumpReloadSave = "";
      this.config.lumpReloadReloads = 0;
      Garden.writeLog(2, "lump reload", false, "force termination! reset data");
    }
    this.save();
    
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
      this.handleQuickLoad(this.config.quickLoadSave, this.config.quickLoadSavedPlot);
    } else if (key == 'quickSave2') {
      this.config.quickLoad2Save = Game.WriteSave(1);
      this.config.quickLoad2SavedPlot = Garden.clonePlotAll();
      Garden.changeSpan("quickLoad2SaveTime", Garden.saveDate(), this.config);
    } else if (key == 'quickLoad2') {
      this.handleQuickLoad(this.config.quickLoad2Save, this.config.quickLoad2SavedPlot);
    } else if (key == 'autoReloadReset') {
      this.config.autoReloadTryHistory = [];
      this.config.autoReloadTryAverage = [];
      document.getElementById("autoReloadDisp2").innerText = "[0]0(0)";
    } else if (key == 'autoReload2Reset') {
      this.config.autoReload2TryHistory = [];
      this.config.autoReload2TryAverage = [];
      document.getElementById("autoReload2Disp3").innerText = "[0]0(0)";
    } else if (key == 'lumpReloadReset') {
      this.config.lumpReloadTryHistory = [];
      this.config.lumpReloadTryAverage = [];
      document.getElementById("lumpReloadDisp4").innerText = "[0]0(0)";
    } else if (key == 'logResetButton') {
      this.config.logHistory = [];
      Garden.displayLog(1);
      Garden.displayLog(2);
      Garden.displayLog(3);
      Garden.displayLog(4);
    } else if (key == 'logRefreshButton') {
      Garden.displayLog(1);
      Garden.displayLog(2);
      Garden.displayLog(3);
      Garden.displayLog(4);
      Garden.goBottom("logLevel1");
      Garden.goBottom("logLevel2");
      Garden.goBottom("logLevel3");
      Garden.goBottom("logLevel4");
    } else if (key == 'logToggleLevel1') {
      doc.elId('logBoxLevel1').classList.toggle('invisible');
      this.config.logInvisibleLevel1 = !this.config.logInvisibleLevel1;
    } else if (key == 'logToggleLevel2') {
      doc.elId('logBoxLevel2').classList.toggle('invisible');
      this.config.logInvisibleLevel2 = !this.config.logInvisibleLevel2;
    } else if (key == 'logToggleLevel3') {
      doc.elId('logBoxLevel3').classList.toggle('invisible');
      this.config.logInvisibleLevel3 = !this.config.logInvisibleLevel3;
    } else if (key == 'logToggleLevel4') {
      doc.elId('logBoxLevel4').classList.toggle('invisible');
      this.config.logInvisibleLevel4 = !this.config.logInvisibleLevel4;
    } else if (key == 'logToggleScript') {
      doc.elId('logBoxScript').classList.toggle('invisible');
      this.config.logInvisibleScript = !this.config.logInvisibleScript;
    } else if (key == 'logRunScript') {
      eval(this.config.logScriptText);
    }
    this.save();
  }

  static handleMouseoutPlotIsSaved(element) {
    Game.tooltip.shouldHide=1;
  }

  static handleMouseoverPlotIsSaved(element) {
    if (this.config.savedPlot.length > 0) {
      let content = UI.buildSavedPlot(this.config.savedPlot, true);
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
