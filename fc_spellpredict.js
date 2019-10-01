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
                    Game.tooltip.dynamic=1;
                    Game.tooltip.draw(this, Game.ObjectsById[7].minigame.spellTooltip(1)()
                                      + '<div class="line"></div><div class="description">'
                                      + '<b>First Spell:</b> ' + nextSpell(0) + '<br />'
                                      + '<b>Second Spell:</b> ' + nextSpell(1) + '<br />'
                                      + '<b>Third Spell:</b> ' + nextSpell(2) + '<br />'
                                      + '<b>Fourth Spell:</b> ' + nextSpell(3) +'</div>','this');
                    Game.tooltip.wobble();};
                clearInterval(lookup);
            }
        }, 1000);
    }
})();


nextSpell = function(i) {
    season=Game.season;
    var obj = obj || {};
    M = Game.ObjectsById[7].minigame;
    spell = M.spellsById[1];
    var failChance = M.getFailChance(spell);
    if (typeof obj.failChanceSet !== 'undefined') failChance = obj.failChanceSet;
    if (typeof obj.failChanceAdd !== 'undefined') failChance += obj.failChanceAdd;
    if (typeof obj.failChanceMult !== 'undefined') failChance *= obj.failChanceMult;
    if (typeof obj.failChanceMax !== 'undefined') failChance = Math.max(failChance, obj.failChanceMax);
    Math.seedrandom(Game.seed + '/' + (M.spellsCastTotal + i));
    var choices = [];
    if (!spell.fail || Math.random() < (1 - failChance)) {
        Math.random();Math.random();
        if (Game.season=='valentines' || Game.season=='easter'){Math.random();}
        if (Game.chimeType==1){Math.random();}
        choices.push('<b style="color:#FFDE5F">Frenzy', '<b style="color:#FFDE5F">Lucky');
        if (!Game.hasBuff('Dragonflight')) choices.push('<b style="color:#FFD700">Click Frenzy');
        if (Math.random() < 0.1) choices.push('<b style="color:#FFDE5F">Cookie Chain', '<b style="color:#FFDE5F">Cookie Storm', 'Blab');
        if (Game.BuildingsOwned >= 10 && Math.random() < 0.25) choices.push('<b style="color:#DAA520">Building Special');
        if (Math.random() < 0.15) choices = ['Cookie Storm (Drop)'];
        if (Math.random() < 0.0001) choices.push('<b style="color:#5FFFFC">Sugar Lump');
    } else {
        Math.random();Math.random();
        if (Game.season=='valentines' || Game.season=='easter'){Math.random();}
        if (Game.chimeType==1){Math.random();}
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
nextSpellName = function() {   
    if (nextSpell(0) == '<small><b style="color:#FFDE5F">Lucky</b></small>') {   
    return "Lucky";
    }
    
    if (nextSpell(0) == '<small><b style="color:#FFDE5F">Frenzy</b></small>') {   
    return "Frenzy";
    }
    
    if (nextSpell(0) == '<small><b style="color:#FFD700">Click Frenzy</b></small>') {   
    return "Click Frenzy";
    }
    
    if (nextSpell(0) == '<small><small><b style="color:#FFDE5F">Cookie Chain</b></small>') {   
    return "Cookie Chain";
    }
    
    if (nextSpell(0) == '<small><b style="color:#FFDE5F">Cookie Storm</b></small>') {   
    return "Cookie Storm";
    }
	
    if (nextSpell(0) == '<small>Cookie Storm (Drop)</b></small>') {   
    return "Cookie Storm (Drop)";
    }
    
    if (nextSpell(0) == '<small><b style="color:#DAA520">Building Special</b></small>') {   
    return "Building Special";
    }
    
    if (nextSpell(0) == '<small>Blab</b></small>') {   
    return "Blab";
    }
    
    if (nextSpell(0) == '<small><b style="color:#FF3605">Ruin Cookies</b></small>') {   
    return "Ruin Cookies";
    }
    
    if (nextSpell(0) == '<small><b style="color:#FF3605">Clot</b></small>') {   
    return "Clot";
    }
    
    if (nextSpell(0) == '<small><b style="color:#DAA520">Cursed Finger</b></small>') {   
    return "Cursed Finger";
    }
    
    if (nextSpell(0) == '<small><b style="color:#DAA520">Elder Frenzy</b></small>') {   
    return "Elder Frenzy";
    }
    
    if (nextSpell(0) == '<small><b style="color:#5FFFFC">Sugar Lump</b></small>') {   
    return "Sugar Lump";
    }
}

// Converts all of the games' building special named buffs to a single function to check if a building special buff is up.
// Used for autocasting Force The Hand of Fate
BuildingSpecialBuff = function() {
if (Game.hasBuff('High-five') ||
	Game.hasBuff('Congregation') ||
	Game.hasBuff('Luxuriant harvest') ||
	Game.hasBuff('Ore vein') ||
	Game.hasBuff('Oiled-up') ||
	Game.hasBuff('Juicy profits') ||
	Game.hasBuff('Fervent adoration') ||
	Game.hasBuff('Manabloom') ||
	Game.hasBuff('Delicious lifeforms') ||
	Game.hasBuff('Breakthrough') ||
	Game.hasBuff('Righteous cataclysm') ||
	Game.hasBuff('Golden ages') ||
	Game.hasBuff('Extra cycles') ||
	Game.hasBuff('Solar flare') ||
	Game.hasBuff('Winning streak') ||
	Game.hasBuff('Macrocosm') ||
	Game.hasBuff('Refactoring')) 
    { return 1; }
	
	else { return 0; }
}
