// @name         Cookie Clicker Predict Spell
// @version      0.1
// @author       Random Reddit Guy (SamNosliw, 3pLm1zf1rMD_Xkeo6XHl)
// @match        http://orteil.dashnet.org/cookieclicker/
// @source       https://www.reddit.com/r/CookieClicker/comments/6v2lz3/predict_next_hands_of_faith/

(function() {
    if(Game.ObjectsById[7].minigameLoaded){
        var lookup = setInterval(function() {
            if (typeof Game.ready !== 'undefined' && Game.ready) {
                var CastSpell = document.getElementById("grimoireSpell1");
                CastSpell.onmouseover = function(){
                    let randomNum = 0;
                    if (Game.season=='valentines' || Game.season=='easter'){randomNum++;}
                    if (!Game.shimmerTypes['golden'].spawned && Game.chimeType==1){randomNum++;}
                    let goldenNum = Game.shimmerTypes['golden'].n;
                    
                    let str = '';
                    str = str + '<div class="line"></div>';
                    for(let g=0; g<3; g++){
                      str = str + '<b>GC num(' + g + '):</b>';
                      str = str + '<div class="description" style="display: flex;">';
                      str = str + '<div style="display: inline-box; padding: 3px; margin: 3px;">';
                      str = str + '<small></small><br />';
                      for(let i=1; i<11; i++){
                          str = str + '<small>' + i + ':</small><br />';
                      }
                      str = str.slice(0, -6);
                      str = str +'</div>';
                      for(let i=0; i<3; i++){
                          str = str + '<div style="display: inline-box; padding: 3px; margin: 3px;';
                          if(randomNum == i && goldenNum == g) str = str + ' outline: solid orange 2px;';
                          str = str + '">';
                          str = str + '<small>' + i + ':</small><br />';
                          for(let j=0; j<10; j++){
                              str = str + nextSpellAux(j, i, g) + '<br />';
                          }
                          str = str.slice(0, -6);
                          str = str +'</div>';
                      }
                      str = str +'</div>';
                    }
                    
                    Game.tooltip.dynamic=1;
                    Game.tooltip.draw(this, Game.ObjectsById[7].minigame.spellTooltip(1)() + str, 'this');
                    Game.tooltip.wobble();};
                clearInterval(lookup);
            }
        }, 1000);
    }
})();

nextSpellAux = function(i, randomNum, goldenNum) {
    season=Game.season;
    var obj = obj || {};
    M = Game.ObjectsById[7].minigame;
    spell = M.spellsById[1];
    
    var failChance = 0.15;
    if (Game.hasBuff('Magic adept')) failChance *= 0.1;
    if (Game.hasBuff('Magic inept')) failChance *= 5;
    failChance = failChance + 0.15 * goldenNum;
        
    if (typeof obj.failChanceSet !== 'undefined') failChance = obj.failChanceSet;
    if (typeof obj.failChanceAdd !== 'undefined') failChance += obj.failChanceAdd;
    if (typeof obj.failChanceMult !== 'undefined') failChance *= obj.failChanceMult;
    if (typeof obj.failChanceMax !== 'undefined') failChance = Math.max(failChance, obj.failChanceMax);
    Math.seedrandom(Game.seed + '/' + (M.spellsCastTotal + i));
    var choices = [];
    if (!spell.fail || Math.random() < (1 - failChance)) {
        Math.random();Math.random();
        if (randomNum == 1){Math.random();}
        if (randomNum == 2){Math.random();Math.random();}
        choices.push('<b style="color:#FFDE5F">Frenzy', '<b style="color:#FFDE5F">Lucky');
        if (!Game.hasBuff('Dragonflight')) choices.push('<b style="color:#FFD700">Click Frenzy');
        if (Math.random() < 0.1) choices.push('<b style="color:#FFDE5F">Cookie Chain', '<b style="color:#FFDE5F">Cookie Storm', 'Blab');
        if (Game.BuildingsOwned >= 10 && Math.random() < 0.25) choices.push('<b style="color:#DAA520">Building Special');
        if (Math.random() < 0.15) choices = ['Cookie Storm (Drop)'];
        if (Math.random() < 0.0001) choices.push('<b style="color:#5FFFFC">Sugar Lump');
    } else {
        Math.random();Math.random();
        if (randomNum == 1){Math.random();}
        if (randomNum == 2){Math.random();Math.random();}
        choices.push('<b style="color:#FF3605">Clot', '<b style="color:#FF3605">Ruin Cookies');
        if (Math.random() < 0.1) choices.push('<b style="color:#DAA520">Cursed Finger', '<b style="color:#DAA520">Elder Frenzy');
        if (Math.random() < 0.003) choices.push('<b style="color:#5FFFFC">Sugar Lump');
        if (Math.random() < 0.1) choices = ['Blab'];
    }
    ret = choose(choices);
    Math.seedrandom();
    return '<small>' + ret + '</b></small>';
}

// This converts the nextSpell(i) to a string to be used for checking conditions for auto casting Force The Hand of Fate in fc_main.
spellName = function(i, randomNum, goldenNum) {
    if (nextSpellAux(i, randomNum, goldenNum) == '<small><b style="color:#FFDE5F">Lucky</b></small>') {   
    return "Lucky";
    }
    
    if (nextSpellAux(i, randomNum, goldenNum) == '<small><b style="color:#FFDE5F">Frenzy</b></small>') {   
    return "Frenzy";
    }
    
    if (nextSpellAux(i, randomNum, goldenNum) == '<small><b style="color:#FFD700">Click Frenzy</b></small>') {   
    return "Click Frenzy";
    }
    
    if (nextSpellAux(i, randomNum, goldenNum) == '<small><small><b style="color:#FFDE5F">Cookie Chain</b></small>') {   
    return "Cookie Chain";
    }
    
    if (nextSpellAux(i, randomNum, goldenNum) == '<small><b style="color:#FFDE5F">Cookie Storm</b></small>') {   
    return "Cookie Storm";
    }
  
    if (nextSpellAux(i, randomNum, goldenNum) == '<small>Cookie Storm (Drop)</b></small>') {   
    return "Cookie Storm (Drop)";
    }
    
    if (nextSpellAux(i, randomNum, goldenNum) == '<small><b style="color:#DAA520">Building Special</b></small>') {   
    return "Building Special";
    }
    
    if (nextSpellAux(i, randomNum, goldenNum) == '<small>Blab</b></small>') {   
    return "Blab";
    }
    
    if (nextSpellAux(i, randomNum, goldenNum) == '<small><b style="color:#FF3605">Ruin Cookies</b></small>') {   
    return "Ruin Cookies";
    }
    
    if (nextSpellAux(i, randomNum, goldenNum) == '<small><b style="color:#FF3605">Clot</b></small>') {   
    return "Clot";
    }
    
    if (nextSpellAux(i, randomNum, goldenNum) == '<small><b style="color:#DAA520">Cursed Finger</b></small>') {   
    return "Cursed Finger";
    }
    
    if (nextSpellAux(i, randomNum, goldenNum) == '<small><b style="color:#DAA520">Elder Frenzy</b></small>') {   
    return "Elder Frenzy";
    }
    
    if (nextSpellAux(i, randomNum, goldenNum) == '<small><b style="color:#5FFFFC">Sugar Lump</b></small>') {   
    return "Sugar Lump";
    }
}

nextSpellName = function() {
    let randomNum = 0;
    if (Game.season=='valentines' || Game.season=='easter'){randomNum++;}
    if (!Game.shimmerTypes['golden'].spawned && Game.chimeType==1){randomNum++;}
    let goldenNum = Game.shimmerTypes['golden'].n;
    return spellName(0, randomNum, goldenNum);
}

// Converts all of the games' building special named buffs to a single function to check if a building special buff is up.
// Used for autocasting Force The Hand of Fate
BuildingSpecialBuffAux = function() {
  let buffs = 0;
  if (Game.hasBuff('High-five')) buffs++;
  if (Game.hasBuff('Congregation')) buffs++;
  if (Game.hasBuff('Luxuriant harvest')) buffs++;
  if (Game.hasBuff('Ore vein')) buffs++;
  if (Game.hasBuff('Oiled-up')) buffs++;
  if (Game.hasBuff('Juicy profits')) buffs++;
  if (Game.hasBuff('Fervent adoration')) buffs++;
  if (Game.hasBuff('Manabloom')) buffs++;
  if (Game.hasBuff('Delicious lifeforms')) buffs++;
  if (Game.hasBuff('Breakthrough')) buffs++;
  if (Game.hasBuff('Righteous cataclysm')) buffs++;
  if (Game.hasBuff('Golden ages')) buffs++;
  if (Game.hasBuff('Extra cycles')) buffs++;
  if (Game.hasBuff('Solar flare')) buffs++;
  if (Game.hasBuff('Winning streak')) buffs++;
  if (Game.hasBuff('Macrocosm')) buffs++;
  if (Game.hasBuff('Refactoring')) buffs++;
  return buffs;
}

BuildingSpecialBuff = function() {
  if (BuildingSpecialBuffAux() > 0) {
    return 1;
  }  else {
    return 0;
  }
}
