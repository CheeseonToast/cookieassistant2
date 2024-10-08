const CookieAssistant2 = {};

if (typeof CCSE == 'undefined') {
    Game.LoadMod('https://klattmose.github.io/CookieClicker/SteamMods/CCSE/main.js');
}

CookieAssistant2.name = 'Cookie Assistant 2.0';
CookieAssistant2.version = '0.9.4';
CookieAssistant2.GameVersion = '2.052';


CookieAssistant2.launch = function () {
    CookieAssistant2.defaultConfig = function () {
        return {
            //Enable/disable flag for each function
            flags:
                {
                    autoClickBigCookie: 0,
                    autoClickGoldenCookie: 0,
                    autoClickReindeer: 0,
                    autoClickFortuneNews: 0,
                    autoClickWrinklers: 0,
                    autoSpellOnBuff: 0,
                    autoBuyElderPledge: 0,
                    autoBuyUpgrades: 0,
                    autoBuyBuildings: 0,
                    autoSwitchSeason: 0,
                    autoTrainDragon: 0,
                    autoSetSpirits: 0,
                    autoHarvestSugarLump: 0,
                    autoSellBuilding: 0,
                    autoToggleGoldenSwitch: 0,
                    autoChocolateEgg: 0,
                    autoHireBrokers: 0,
                },
            //Execution interval of each function
            intervals:
                {
                    autoClickBigCookie: 1,
                    autoClickGoldenCookie: 1,
                    autoClickReindeer: 100,
                    autoClickFortuneNews: 100,
                    autoClickWrinklers: 60000,
                    autoSpellOnBuff: 1000,
                    autoBuyElderPledge: 1000,
                    autoBuyUpgrades: 1000,
                    autoBuyBuildings: 1000,
                    autoSwitchSeason: 1000,
                    autoTrainDragon: 1000,
                    autoSetSpirits: 10000,
                    autoHarvestSugarLump: 60000,
                    autoSellBuilding: 2500,
                    autoToggleGoldenSwitch: 500,
                    autoHireBrokers: 1000,
                },
            //Special settings for each function CheckConfig. I don't go deeper than this because there is a limit.
            particular:
                {
                    dragon:
                        {
                            aura1: 0,
                            aura2: 0,
                        },
                    spell:
                        {
                            mode: 0, //mp condition
                            mode2: 0, //buff count condition
                        },
                    upgrades:
                        {
                            mode: 0,
                        },
                    buildings:
                        {
                            mode: 0,
                            amount: 1, // Do not set to 0, purchase logic currently cannot buy 0 of something. Needs fixing
                        },
                    spirits:
                        {
                            slot1: 0,
                            slot2: 1,
                            slot3: 2,
                        },
                    golden:
                        {
                            mode: 0,
                        },
                    bigCookie:
                        {
                            isMute: 1,
                            mode: 0,
                        },
                    sell:
                        {
                            isAfterSell: [], //Retains flag indicating whether it is sold or not (so that it will work even if you drop the game while it is running)
                            target: [],
                            amount: [],
                            activate_mode: [],
                            after_mode: [],
                            sell_mode: [],
                        },
                    wrinkler:
                        {
                            mode: 0,
                        },
                    goldenSwitch:
                        {
                            enable: 0,
                            disable: 0,
                        },
                    season:
                        {
                            afterComplete: 0, //What to do after the season is over
                        },
                }
        };
    }

    CookieAssistant2.init = function () {
        CookieAssistant2.isLoaded = 1;
        CookieAssistant2.restoreDefaultConfig(1);
        CookieAssistant2.ReplaceGameMenu();

        //Large cookie SE mute
        CCSE.SpliceCodeIntoFunction(
            "Game.playCookieClickSound",
            2,
            "if (CookieAssistant2.config.particular.bigCookie.isMute) { return; }"
        );

        //SE mute for building sales
        for (const objectName of Object.keys(Game.Objects)) {
            CCSE.ReplaceCodeIntoFunction(
                "Game.Objects['" + objectName + "'].sell",
                "PlaySound('snd/sell'+choose([1,2,3,4])+'.mp3',0.75);",
                "if (!CookieAssistant2.config.flags.autoSellBuilding) {PlaySound('snd/sell'+choose([1,2,3,4])+'.mp3',0.75);}",
                0
            );
            CCSE.ReplaceCodeIntoFunction(
                "Game.Objects['" + objectName + "'].buy",
                "PlaySound('snd/buy'+choose([1,2,3,4])+'.mp3',0.75);",
                "if (!CookieAssistant2.config.flags.autoSellBuilding) {PlaySound('snd/buy'+choose([1,2,3,4])+'.mp3',0.75);}",
                0
            );
        }

        //ChocolateEgg automatic purchase
        CCSE.SpliceCodeIntoFunction(
            "Game.Ascend",
            5,
            "CookieAssistant2.OnPreAscend();"
        );


        CookieAssistant2.showAllIntervals = false;
        CookieAssistant2.isAfterSpellcast = false;

        CookieAssistant2.intervalHandles =
            {
                autoClickBigCookie: null,
                autoClickGoldenCookie: null,
                autoClickReindeer: null,
                autoClickFortuneNews: null,
                autoClickWrinklers: null,
                autoSpellOnBuff: null,
                autoBuyElderPledge: null,
                autoBuyUpgrades: null,
                autoBuyBuildings: null,
                autoSwitchSeason: null,
                autoTrainDragon: null,
                autoSetSpirits: null,
                autoHarvestSugarLump: null,
                autoSellBuilding: null,
                autoToggleGoldenSwitch: null,
            }

        CookieAssistant2.modes =
            {
                spell:
                    {
                        0:
                            {
                                desc: "Magic Meter is minimum to cast",
                            },
                        1:
                            {
                                desc: "Magic Meter is full",
                            }
                    },
                spell_buff:
                    {
                        0:
                            {
                                count: 1,
                                desc: "Have one buff",
                            },
                        1:
                            {
                                count: 2,
                                desc: "Have two or more buffs",
                            }
                    },
                upgrades:
                    {
                        0:
                            {
                                desc: "All Upgrades (includes Researches)",
                            },
                        1:
                            {
                                desc: "All Upgrades except Researches",
                            },
                        2:
                            {
                                desc: `All Upgrades that don't cause "Grandmapocalypse"`,
                            },
                    },
                buildings:
                    {
                        0:
                            {
                                amount: 10,
                                desc: "Buy every 10",
                            },
                        1:
                            {
                                amount: 50,
                                desc: "Buy every 50",
                            },
                        2:
                            {
                                amount: 100,
                                desc: "Buy every 100",
                            },
                        3:
                            {
                                desc: "Buy",
                            }
                    },
                golden:
                    {
                        0:
                            {
                                desc: "Golden Cookie including Wrath Cookie"
                            },
                        1:
                            {
                                desc: "Ignore Wrath Cookie"
                            }
                    },
                sell_buildings: //Conditions for triggering automatic building sale
                    {
                        0:
                            {
                                desc: "Have one buff",
                            },
                        1:
                            {
                                desc: "Have two or more buffs",
                            },
                        2:
                            {
                                desc: "Have click buff",
                            },
                        3:
                            {
                                desc: "Have two or more buffs including click buff",
                            },
                        4:
                            {
                                desc: "After auto-spell cast",
                            },
                        5:
                            {
                                desc: "Always"
                            },
                        6:
                            {
                                desc: "Have three or more buffs",
                            },
                    },
                sell_buildings_mode:
                    {
                        0:
                            {
                                desc: "All",
                            },
                        1:
                            {
                                desc: "Set",
                            },
                        2:
                            {
                                desc: "Percentage",
                            },
                    },
                sell_buildings_after: //Behavior after automatic building sale
                    {
                        0:
                            {
                                desc: "Buy back the amount sold",
                            },
                        1:
                            {
                                desc: "Spell cast if can, and buy back",
                            },
                        2:
                            {
                                desc: "Do nothing",
                            },
                    },
                wrinkler:
                    {
                        0:
                            {
                                desc: "All Type",
                            },
                        1:
                            {
                                desc: "Except Shiny Wrinkler"
                            },
                    },
                bigCookie:
                    {
                        0:
                            {
                                desc: "Always",
                            },
                        1:
                            {
                                desc: "Have any click buff"
                            },
                        2:
                            {
                                desc: "Have one buff"
                            },
                        3:
                            {
                                desc: "Have two or more buffs"
                            }
                    },
                goldenSwitch_enable:
                    {
                        0:
                            {
                                desc: "Have one buff"
                            },
                        1:
                            {
                                desc: "Have two or more buffs"
                            },
                        2:
                            {
                                desc: "Have click buff",
                            },
                        3:
                            {
                                desc: "Have two or more buffs including click buff",
                            },
                    },
                goldenSwitch_disable:
                    {
                        0:
                            {
                                desc: "No buffs"
                            },
                        1:
                            {
                                desc: "No click buffs"
                            },
                    },
                season:
                    {
                        0:
                            {
                                desc: "None",
                                season: "",
                            },
                        1:
                            {
                                desc: "Christmas",
                                season: "christmas",
                            },
                        2:
                            {
                                desc: "Easter",
                                season: "easter",
                            },
                        3:
                            {
                                desc: "Halloween",
                                season: "halloween",
                            },
                        4:
                            {
                                desc: "Valentines",
                                season: "valentines",
                            },
                        5:
                            {
                                desc: "Business Day",
                                season: "fools",
                            },
                    },
            }

        CookieAssistant2.actions =
            {
                autoClickBigCookie: () => {
                    CookieAssistant2.intervalHandles.autoClickBigCookie = setInterval(
                        () => {
                            //Do not run for the first second because the BGM will be strange.
                            if (Game.T < Game.fps) {
                                return;
                            }
                            //Stops working during reincarnation
                            if (Game.OnAscend) {
                                return;
                            }

                            let buffCount = 0;
                            let clickBuffCount = 0;
                            for (let i in Game.buffs) {
                                switch (Game.buffs[i].type.name) {
                                    case "dragonflight":
                                    case "click frenzy":
                                        clickBuffCount++;
                                        buffCount++;
                                        break;
                                    case "dragon harvest":
                                    case "frenzy":
                                    case "blood frenzy": //elder frenzy (x666)
                                    case "sugar frenzy":
                                    case "building buff":
                                    case "devastation":
                                        buffCount++;
                                        break;
                                    case "cursed finger":
                                    default:
                                        break;
                                }
                            }
                            let mode = CookieAssistant2.config.particular.bigCookie.mode;
                            let isMode0 = mode === 0;
                            let isMode1 = mode === 1 && clickBuffCount >= 1;
                            let isMode2 = mode === 2 && buffCount >= 1;
                            let isMode3 = mode === 3 && buffCount >= 2;
                            if (isMode0 || isMode1 || isMode2 || isMode3) {
                                bigCookie.click(); //Look into why this works
                                Game.lastClick = 0;
                            }
                        },
                        CookieAssistant2.config.intervals.autoClickBigCookie
                    )
                },
                autoClickGoldenCookie: () => {
                    CookieAssistant2.intervalHandles.autoClickGoldenCookie = setInterval(
                        () => {
                            Game.shimmers
                                .filter(shimmer => shimmer.type === "golden")
                                .filter(shimmer => !(CookieAssistant2.config.particular.golden.mode === 1 && shimmer.wrath !== 0))
                                .forEach(shimmer => shimmer.pop())
                        },
                        CookieAssistant2.config.intervals.autoClickGoldenCookie
                    )
                },
                autoClickReindeer: () => {
                    CookieAssistant2.intervalHandles.autoClickReindeer = setInterval(
                        () => {
                            Game.shimmers
                                .filter(shimmer => shimmer.type === "reindeer")
                                .forEach(shimmer => shimmer.pop())
                        },
                        CookieAssistant2.config.intervals.autoClickReindeer
                    )
                },
                autoClickFortuneNews: () => {
                    CookieAssistant2.intervalHandles.autoClickFortuneNews = setInterval(
                        () => {
                            if (Game.TickerEffect && Game.TickerEffect.type === 'fortune') {
                                Game.tickerL.click();
                            }
                        },
                        CookieAssistant2.config.intervals.autoClickFortuneNews
                    )
                },
                autoSpellOnBuff: () => {
                    CookieAssistant2.intervalHandles.autoSpellOnBuff = setInterval(
                        () => {
                            let buffCount = 0;
                            for (let i in Game.buffs) {
                                switch (Game.buffs[i].type.name) {
                                    case "frenzy":
                                    case "blood frenzy": //elder frenzy (x666)
                                    case "dragon harvest":
                                    case "click frenzy":
                                    case "dragonflight":
                                    case "sugar frenzy":
                                    case "building buff":
                                        buffCount++;
                                        break;
                                    case "cursed finger": //Although it is a positive buff, it is ignored because the buffs are incompatible with each other.
                                    case "devastation": //Since Devastation wants to be triggered by the MOD side, it ignores anything that is caused spontaneously by the user.
                                    default:
                                        break;
                                }
                            }
                            let grimoire = Game.ObjectsById[7].minigame;
                            let spell = grimoire.spells['hand of fate'];
                            let cost;
                            switch (CookieAssistant2.config.particular.spell.mode) {
                                case 0: //Minimum MP required
                                    cost = Math.floor(spell.costMin + grimoire.magicM * spell.costPercent);
                                    break;
                                case 1: //Full MP recovery
                                default:
                                    cost = grimoire.magicM;
                                    break;
                            }
                            if (cost <= Math.floor(grimoire.magic) && buffCount >= CookieAssistant2.modes.spell_buff[CookieAssistant2.config.particular.spell.mode2].count) {
                                grimoire.castSpell(spell);
                                CookieAssistant2.isAfterSpellcast = true;
                                setTimeout(() => {
                                    if (CookieAssistant2.isAfterSpellcast) {
                                        CookieAssistant2.isAfterSpellcast = false;
                                    }
                                }, 3000);
                            }
                        },
                        CookieAssistant2.config.intervals.autoSpellOnBuff
                    )
                },
                autoClickWrinklers: () => {
                    CookieAssistant2.intervalHandles.autoClickWrinklers = setInterval(
                        () => {
                            Game.wrinklers.forEach(wrinkler => {
                                if (wrinkler.close === 1) {
                                    if (CookieAssistant2.config.particular.wrinkler.mode === 1 && wrinkler.type === 1) {
                                        return;
                                    }
                                    wrinkler.hp = 0;
                                }
                            });
                        },
                        CookieAssistant2.config.intervals.autoClickWrinklers
                    )
                },
                autoBuyElderPledge: () => {
                    CookieAssistant2.intervalHandles.autoBuyElderPledge = setInterval(
                        () => {
                            if (Game.UpgradesInStore.indexOf(Game.Upgrades["Elder Pledge"]) !== -1) {
                                Game.Upgrades["Elder Pledge"].buy();
                            }
                            //If you're automatically purchasing ElderPledge, you'll probably want to buy a sacrificial rolling pin as well, so check it out here.
                            if (Game.UpgradesInStore.indexOf(Game.Upgrades["Sacrificial rolling pins"]) !== -1) {
                                Game.Upgrades["Sacrificial rolling pins"].buy(1);
                            }
                        },
                        CookieAssistant2.config.intervals.autoBuyElderPledge
                    )
                },
                autoBuyUpgrades: () => {
                    CookieAssistant2.intervalHandles.autoBuyUpgrades = setInterval(
                        () => {
                            for (let i in Game.UpgradesInStore) {
                                let upgrade = Game.UpgradesInStore[i];
                                //Ignore upgrades in the vault
                                if (upgrade.isVaulted()) {
                                    continue;
                                }
                                //Purchased excluding switches (ElderPledge is also treated as Toggle, so you don't have to think about it)
                                //Sacrifice rolling pins are also bought here without permission.
                                if (upgrade.pool !== "toggle") {
                                    //When in mode excluding research
                                    if (CookieAssistant2.config.particular.upgrades.mode === 1 && upgrade.pool === "tech") {
                                        continue;
                                    }
                                    //When you're in a mode where you don't want to enter the old apocalypse
                                    if (CookieAssistant2.config.particular.upgrades.mode === 2 && upgrade.name === "One mind") {
                                        continue;
                                    }
                                    //When chocolate egg mode is on
                                    if (CookieAssistant2.config.flags.autoChocolateEgg && upgrade.name === "Chocolate egg") {
                                        continue;
                                    }
                                    upgrade.buy(1);
                                }
                            }
                        },
                        CookieAssistant2.config.intervals.autoBuyUpgrades
                    );
                },
                autoSwitchSeason: () => {
                    CookieAssistant2.intervalHandles.autoSwitchSeason = setInterval(
                        () => {
                            let winterSantaRate = Game.GetHowManySantaDrops() / Game.santaDrops.length;
                            let winterReindeerRate = Game.GetHowManyReindeerDrops() / Game.reindeerDrops.length;
                            let halloweenRate = Game.GetHowManyHalloweenDrops() / Game.halloweenDrops.length;
                            let easterRate = Game.GetHowManyEggs() / Game.easterEggs.length;
                            let valentinesRate = Game.GetHowManyHeartDrops() / Game.heartDrops.length;

                            if (Game.season === "") {
                                CookieAssistant2.SwitchNextSeason();
                            } else if (Game.season === "valentines") {
                                if (valentinesRate >= 1) {
                                    CookieAssistant2.SwitchNextSeason();
                                }
                            } else if (Game.season === "christmas") {
                                if (winterSantaRate < 1 || Game.santaLevel < 14) {
                                    Game.specialTab = "santa";
                                    Game.ToggleSpecialMenu(true);
                                    Game.UpgradeSanta();
                                    Game.ToggleSpecialMenu(false);
                                }
                                if (winterReindeerRate >= 1 && winterSantaRate >= 1 && Game.santaLevel >= 14) {
                                    CookieAssistant2.SwitchNextSeason();
                                }
                            } else if (Game.season === "easter") {
                                if (easterRate >= 1 || (Game.GetHowManyEggs() === Game.easterEggs.length - 1 && !Game.Has("Chocolate egg"))) {
                                    CookieAssistant2.SwitchNextSeason();
                                }
                            } else if (Game.season === "halloween") {
                                //If automatic purchase of Elder Oath is on, force it off.
                                if (CookieAssistant2.config.flags.autoBuyElderPledge === 1) {
                                    CookieAssistant2.config.flags.autoBuyElderPledge = 0;
                                    clearInterval(CookieAssistant2.intervalHandles.autoBuyElderPledge);
                                    CookieAssistant2.intervalHandles.autoBuyElderPledge = null;
                                }
                                //If there is time left for the Elder Oath, activate the Elder Oath (to reset the Elder Oath time)
                                if (Game.pledgeT >= 1 && Game.UpgradesInStore.indexOf(Game.Upgrades["Elder Covenant"]) !== -1) {
                                    Game.Upgrades["Elder Covenant"].buy();
                                }
                                //If you can cancel the Elder Covenant, do it (because it is necessary to spawn Wrinkler)
                                if (Game.UpgradesInStore.indexOf(Game.Upgrades["Revoke Elder Covenant"]) !== -1) {
                                    Game.Upgrades["Revoke Elder Covenant"].buy();
                                }
                                if (halloweenRate >= 1) {
                                    //Purchase the Elder Covenant and end Baba Apocalypse before moving on.
                                    Game.Upgrades["Elder Covenant"].buy(1);
                                    CookieAssistant2.SwitchNextSeason();
                                }
                            }
                        },
                        CookieAssistant2.config.intervals.autoSwitchSeason
                    )
                },
                autoBuyBuildings: () => {
                    CookieAssistant2.intervalHandles.autoBuyBuildings = setInterval(
                        () => {
                            if (Game.AscendTimer > 0 || Game.OnAscend) {
                                return;
                            }
                            let amountPerPurchase;
                            if (CookieAssistant2.config.particular.buildings.mode.desc === "Buy") {
                                amountPerPurchase = parseInt(CookieAssistant2.config.particular.buildings.amount)
                            } else {
                                amountPerPurchase = CookieAssistant2.modes.buildings[CookieAssistant2.config.particular.buildings.mode].amount;
                            }
                            for (const objectName in Game.Objects) {
                                let amount = Game.Objects[objectName].amount % amountPerPurchase === 0 ? amountPerPurchase : amountPerPurchase - Game.Objects[objectName].amount % amountPerPurchase;
                                let isMaxDragon = Game.dragonLevel >= Game.dragonLevels.length - 1;
                                //If automatic dragon training is on, automatic purchase of buildings will be restricted.
                                if (!isMaxDragon && CookieAssistant2.config.flags.autoTrainDragon && Game.Objects[objectName].amount >= 350 - amountPerPurchase) {
                                    amount = 350 - Game.Objects[objectName].amount;
                                    if (amount <= 0) {
                                        continue;
                                    }
                                }
                                if (Game.cookies >= Game.Objects[objectName].getSumPrice(amount)) {
                                    //If you are in sell mode, force it into buy mode.
                                    if (Game.buyMode < 0) {
                                        Game.buyMode = 1;
                                    }
                                    Game.Objects[objectName].buy(amount);
                                }
                            }
                        },
                        CookieAssistant2.config.intervals.autoBuyBuildings
                    );
                },
                autoTrainDragon: () => {
                    CookieAssistant2.intervalHandles.autoTrainDragon = setInterval(
                        () => {
                            Math.seedrandom(Game.seed + '/dragonTime');
                            let drops = ['Dragon scale', 'Dragon claw', 'Dragon fang', 'Dragon teddy bear'];
                            drops = shuffle(drops);
                            Math.seedrandom();
                            let currentDrop = drops[Math.floor((new Date().getMinutes() / 60) * drops.length)];

                            let canTrain = Game.dragonLevel < Game.dragonLevels.length - 1 && Game.dragonLevels[Game.dragonLevel].cost();
                            let canPet = Game.dragonLevel >= 8 && Game.Has("Pet the dragon") && !Game.Has(currentDrop) && !Game.HasUnlocked(currentDrop);

                            if (canTrain || canPet) {
                                Game.specialTab = "dragon";
                                Game.ToggleSpecialMenu(true);
                                //Nurturing
                                if (canTrain) {
                                    Game.UpgradeDragon();
                                    if (Game.dragonLevel === Game.dragonLevels.length - 1) {
                                        Game.SetDragonAura(CookieAssistant2.config.particular.dragon.aura1, 0);
                                        Game.ConfirmPrompt();
                                        Game.SetDragonAura(CookieAssistant2.config.particular.dragon.aura2, 1);
                                        Game.ConfirmPrompt();
                                    }
                                }
                                //Stroke
                                if (canPet) {
                                    Game.ClickSpecialPic();
                                }
                                Game.ToggleSpecialMenu(false);
                            }
                        },
                        CookieAssistant2.config.intervals.autoTrainDragon
                    );
                },
                autoSetSpirits: () => {
                    CookieAssistant2.intervalHandles.autoSetSpirits = setInterval(
                        () => {
                            if (Game.Objects['Temple'].minigame === undefined || !Game.Objects['Temple'].minigameLoaded) {
                                return;
                            }
                            let pantheon = Game.Objects['Temple'].minigame;
                            if (pantheon.slot[0] === -1) {
                                pantheon.dragGod(pantheon.godsById[CookieAssistant2.config.particular.spirits.slot1]);
                                pantheon.hoverSlot(0);
                                pantheon.dropGod();
                                pantheon.hoverSlot(-1);
                            }
                            if (pantheon.slot[1] === -1) {
                                pantheon.dragGod(pantheon.godsById[CookieAssistant2.config.particular.spirits.slot2]);
                                pantheon.hoverSlot(1);
                                pantheon.dropGod();
                                pantheon.hoverSlot(-1);
                            }
                            if (pantheon.slot[2] === -1) {
                                pantheon.dragGod(pantheon.godsById[CookieAssistant2.config.particular.spirits.slot3]);
                                pantheon.hoverSlot(2);
                                pantheon.dropGod();
                                pantheon.hoverSlot(-1);
                            }
                        },
                        CookieAssistant2.config.intervals.autoSetSpirits
                    );
                },
                autoHarvestSugarLump: () => {
                    CookieAssistant2.intervalHandles.autoHarvestSugarLump = setInterval(
                        () => {
                            //Check if sugar balls are unlocked
                            if (!Game.canLumps()) {
                                return;
                            }
                            let age = Date.now() - Game.lumpT;
                            if (age > Game.lumpRipeAge && age < Game.lumpOverripeAge) {
                                Game.clickLump();
                            }
                        },
                        CookieAssistant2.config.intervals.autoHarvestSugarLump
                    );
                },
                autoSellBuilding: () => {
                    CookieAssistant2.intervalHandles.autoSellBuilding = setInterval(
                        () => {
                            for (let i = 0; i < CookieAssistant2.config.particular.sell.isAfterSell.length; i++) {
                                let target = CookieAssistant2.config.particular.sell.target[i];
                                let sell_amount = CookieAssistant2.config.particular.sell.amount[i];
                                let activate_mode = CookieAssistant2.config.particular.sell.activate_mode[i];
                                let after_mode = CookieAssistant2.config.particular.sell.after_mode[i];
                                let sell_mode = CookieAssistant2.config.particular.sell.sell_mode[i];
                                CookieAssistant2.sellBuildings(i, target, sell_amount, activate_mode, after_mode, sell_mode);
                            }
                        },
                        CookieAssistant2.config.intervals.autoSellBuilding
                    );
                },
                autoToggleGoldenSwitch: () => {
                    CookieAssistant2.intervalHandles.autoToggleGoldenSwitch = setInterval(
                        () => {
                            let off = Game.UpgradesInStore.find(x => x.name === "Golden switch [off]");
                            let on = Game.UpgradesInStore.find(x => x.name === "Golden switch [on]");
                            let enableMode = CookieAssistant2.config.particular.goldenSwitch.enable;
                            let disableMode = CookieAssistant2.config.particular.goldenSwitch.disable;
                            let buffCount = 0;
                            let clickBuffCount = 0;
                            for (let i in Game.buffs) {
                                switch (Game.buffs[i].type.name) {
                                    case "dragonflight":
                                    case "click frenzy":
                                        clickBuffCount++;
                                        buffCount++;
                                        break;
                                    case "dragon harvest":
                                    case "frenzy":
                                    case "blood frenzy": //elder frenzy (x666)
                                    case "sugar frenzy":
                                    case "building buff":
                                    case "devastation":
                                        buffCount++;
                                        break;
                                    case "cursed finger":
                                    default:
                                        break;
                                }
                            }
                            //When the switch is OFF
                            if (off !== undefined) {
                                let isMode0 = enableMode === 0 && buffCount >= 1;
                                let isMode1 = enableMode === 1 && buffCount >= 2;
                                let isMode2 = enableMode === 2 && clickBuffCount >= 1;
                                let isMode3 = enableMode === 3 && buffCount >= 2 && clickBuffCount >= 1;

                                if (isMode0 || isMode1 || isMode2 || isMode3) {
                                    off.buy();
                                }
                            }
                            //When the switch is on
                            if (on !== undefined) {
                                let isMode0 = disableMode === 0 && buffCount === 0;
                                let isMode1 = disableMode === 1 && clickBuffCount === 0;

                                if (isMode0 || isMode1) {
                                    on.buy();
                                }
                            }
                        },
                        CookieAssistant2.config.intervals.autoToggleGoldenSwitch
                    );
                },
                autoHireBrokers: () => {
                    CookieAssistant2.intervalHandles.autoHireBrokers = setInterval(
                        () => {
                            let market = Game.Objects["Bank"].minigame;
                            if (market === undefined || !Game.Objects["Bank"].minigameLoaded) {
                                return;
                            }
                            //Hire
                            if (market.brokers < market.getMaxBrokers() && Game.cookies >= market.getBrokerPrice()) {
                                l('bankBrokersBuy').click();
                            }
                            //Upgrade
                            let currentOffice = market.offices[market.officeLevel];
                            if (currentOffice.cost && Game.Objects['Cursor'].amount >= currentOffice.cost[0] && Game.Objects['Cursor'].level >= currentOffice.cost[1]) {
                                l('bankOfficeUpgrade').click();
                            }
                        },
                        CookieAssistant2.config.intervals.autoHireBrokers
                    );
                },
            }

        Game.Notify('CookieAssistant loaded!', '', '', 1, 1);
        CookieAssistant2.CheckUpdate().then(() => {});
    }

    CookieAssistant2.sellBuildings = function (index, target, sell_amount, activate_mode, after_mode, sell_mode) {
        let objectName = Game.ObjectsById[target].name;
        let amount = parseInt(sell_amount);
        if (amount <= 0) {
            return;
        }
        if (CookieAssistant2.config.particular.sell.isAfterSell[index]) {
            if (after_mode === 2)//Do nothing
            {
                CookieAssistant2.config.particular.sell.isAfterSell[index] = 0;
                return false;
            }
            if (after_mode === 1)//Spell cast and buy back
            {
                let grimoire = Game.ObjectsById[7].minigame;
                if (grimoire === undefined) {
                    Game.Notify(CookieAssistant2.name, "You have not unlocked the Grimoire yet, so failed to spell cast.", "", 3);
                    CookieAssistant2.config.particular.sell.isAfterSell[index] = 0;
                    return false;
                }
                let spell = grimoire.spells['hand of fate'];
                let cost = Math.floor(spell.costMin + grimoire.magicM * spell.costPercent);
                if (cost <= Math.floor(grimoire.magic)) {
                    grimoire.castSpell(spell);
                }
            }
            if (Game.cookies >= Game.Objects[objectName].getSumPrice(amount)) {
                if (Game.buyMode < 0) {
                    Game.buyMode = 1;
                }
                Game.Objects[objectName].buy(amount);
            } else {
                Game.Notify(CookieAssistant2.name, "Not have enough cookies to buy back");
            }
            CookieAssistant2.config.particular.sell.isAfterSell[index] = 0;
            return false;
        }


        let buffCount = 0;
        let clickBuffCount = 0;
        for (let i in Game.buffs) {
            switch (Game.buffs[i].type.name) {
                case "dragonflight":
                case "click frenzy":
                    clickBuffCount++;
                    buffCount++;
                    break;
                case "dragon harvest":
                case "frenzy":
                case "blood frenzy": //elder frenzy (x666)
                case "sugar frenzy":
                case "building buff":
                    buffCount++;
                    break;
                case "devastation":
                case "cursed finger":
                default:
                    break;
            }
        }

        let isMode0 = activate_mode === 0 && buffCount >= 1;
        let isMode1 = activate_mode === 1 && buffCount >= 2;
        let isMode2 = activate_mode === 2 && clickBuffCount >= 1;
        let isMode3 = activate_mode === 3 && buffCount >= 2 && clickBuffCount >= 1;
        let isMode4 = activate_mode === 4 && CookieAssistant2.isAfterSpellcast;
        let isMode5 = activate_mode === 5;
        let isMode6 = activate_mode === 6 && buffCount >= 3;
        if (isMode0 || isMode1 || isMode2 || isMode3 || isMode4 || isMode5 || isMode6) {
            // Sell All
            if (sell_mode === 0) {
                amount = parseInt(Game.Objects[objectName].amount);
                Game.Objects[objectName].sell(amount);
            }
            // Sell Set Amount
            if (sell_mode === 1) {
                if (Game.Objects[objectName].amount < amount) {
                    Game.Notify(CookieAssistant2.name, "Could not sell buildings due to not enough.");
                    return false;
                }
                Game.Objects[objectName].sell(amount);
            }
            // Sell Percentage
            if (sell_mode === 2) {
                let buildings = parseInt(Game.Objects[objectName].amount);
                Game.Objects[objectName].sell(parseInt(((amount / 100) * buildings).toPrecision()));
            }
            CookieAssistant2.config.particular.sell.isAfterSell[index] = 1;
            CookieAssistant2.isAfterSpellcast = false;
            return true;
        }
    }

    CookieAssistant2.restoreDefaultConfig = function (mode) {
        CookieAssistant2.config = CookieAssistant2.defaultConfig();
        if (mode === 2) {
            CookieAssistant2.save(CookieAssistant2.config);
        }
    }

    CookieAssistant2.SwitchNextSeason = function () {
        let seasons = ["valentines", "christmas", "easter", "halloween"];
        let isCompletes = [
            (Game.GetHowManyHeartDrops() / Game.heartDrops.length) >= 1,
            ((Game.GetHowManySantaDrops() / Game.santaDrops.length) >= 1) && ((Game.GetHowManyReindeerDrops() / Game.reindeerDrops.length) >= 1) && Game.santaLevel >= 14,
            (Game.GetHowManyEggs() / Game.easterEggs.length) >= 1,
            (Game.GetHowManyHalloweenDrops() / Game.halloweenDrops.length) >= 1,
        ];

        if (CookieAssistant2.config.flags.autoChocolateEgg && !isCompletes[2]) {
            isCompletes[2] = Game.GetHowManyEggs() === Game.easterEggs.length - 1 && !Game.Has("Chocolate egg");
        }

        let targetSeason = "";
        let afterCompleteSeason = CookieAssistant2.modes.season[CookieAssistant2.config.particular.season.afterComplete].season;

        for (let i in seasons) {
            if (!isCompletes[i]) {
                targetSeason = seasons[i];
                break;
            }
        }
        if (targetSeason === "" && afterCompleteSeason !== "") {
            targetSeason = afterCompleteSeason;
        }
        //All seasons have been upgraded and are currently in some season.
        if (Game.season !== "" && targetSeason === "") {
            //Season ends
            Game.seasonT = -1;
        }
        if (targetSeason !== "" && targetSeason !== Game.season) {
            if (Game.UpgradesInStore.indexOf(Game.Upgrades[Game.seasons[targetSeason].trigger]) !== -1) {
                Game.Upgrades[Game.seasons[targetSeason].trigger].buy(1);
            }
        }
    }

    CookieAssistant2.OnPreAscend = function () {
        if (CookieAssistant2.config.flags.autoChocolateEgg) {
            CookieAssistant2.BuyChocolateEgg();
        }
    }

    CookieAssistant2.BuyChocolateEgg = function () {
        let egg = Game.UpgradesInStore.find(x => x.name === "Chocolate egg");
        if (egg === undefined) {
            Game.Notify(CookieAssistant2.name, "Failed to buy Chocolate Egg.");
            return;
        }
        if (Game.dragonLevel >= 8 && !Game.hasAura("Earth Shatterer")) {
            Game.SetDragonAura(5, 0);
            Game.ConfirmPrompt();
        }
        for (let objectName in Game.Objects) {
            let building = Game.Objects[objectName];
            if (building.amount > 0) {
                building.sell(building.amount);
            }
        }
        egg.buy();
    }

    //Check the config
    //Prevent new items from becoming undefined during update and execution at 1ms cycle
    CookieAssistant2.CheckConfig = function () {
        let defaultConfig = CookieAssistant2.defaultConfig();
        for (const [key, value] of Object.entries(defaultConfig.flags)) {
            if (CookieAssistant2.config.flags[key] === undefined) {
                CookieAssistant2.config.flags[key] = value;
            }
        }
        for (const [key, value] of Object.entries(defaultConfig.intervals)) {
            if (CookieAssistant2.config.intervals[key] === undefined) {
                CookieAssistant2.config.intervals[key] = value;
            }
        }
        if (CookieAssistant2.config.particular === undefined) {
            CookieAssistant2.config.particular = defaultConfig.particular;
        }

        for (const [key, value] of Object.entries(defaultConfig.particular)) {
            if (CookieAssistant2.config.particular[key] === undefined) {
                CookieAssistant2.config.particular[key] = value;
            }
            for (const [key_p, value_p] of Object.entries(defaultConfig.particular[key])) {
                if (CookieAssistant2.config.particular[key][key_p] === undefined) {
                    CookieAssistant2.config.particular[key][key_p] = value_p;
                }
            }
        }
    }


    //Add options & statistics
    CookieAssistant2.ReplaceGameMenu = function () {
        Game.customOptionsMenu.push(function () {
            CCSE.AppendCollapsibleOptionsMenu(CookieAssistant2.name, CookieAssistant2.getMenuString());
        });

        Game.customStatsMenu.push(function () {
            CCSE.AppendStatsVersionNumber(CookieAssistant2.name, CookieAssistant2.version);
        });
    }

    CookieAssistant2.getMenuString = function () {
        let m = CCSE.MenuHelper;
        let str = m.Header('Basic Assists');

        //Big Cookie click
        str += '<div class="listing">'
            + m.ToggleButton(CookieAssistant2.config.flags, 'autoClickBigCookie', 'CookieAssistant2_autoClickBigCookieButton', 'AutoClick Big Cookie ON', 'AutoClick Big Cookie OFF', "CookieAssistant2.Toggle")
            + '<label>Mode</label>'
            + '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.bigCookie.mode++; if(CookieAssistant2.config.particular.bigCookie.mode >= Object.keys(CookieAssistant2.modes.bigCookie).length){CookieAssistant2.config.particular.bigCookie.mode = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
            + CookieAssistant2.modes.bigCookie[CookieAssistant2.config.particular.bigCookie.mode].desc
            + '</a>'
            + '<label>Clicking sound</label><a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.bigCookie.isMute++; if(CookieAssistant2.config.particular.bigCookie.isMute >= 2){CookieAssistant2.config.particular.bigCookie.isMute = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
            + (CookieAssistant2.config.particular.bigCookie.isMute ? 'Muted' : 'Enabled')
            + '</a>'
        if (CookieAssistant2.showAllIntervals) {
            str += '<label>Click interval(ms)</label>'
                + m.InputBox("CookieAssistant2_Interval_autoClickBigCookie", 40, CookieAssistant2.config.intervals.autoClickBigCookie, "CookieAssistant2.ChangeInterval('autoClickBigCookie', this.value)")
        }
        str += '<br />'
            + '</div>';

        //Golden Cookie click
        str += '<div class="listing">' + m.ToggleButton(CookieAssistant2.config.flags, 'autoClickGoldenCookie', 'CookieAssistant2_autoClickGoldenCookieButton', 'AutoClick ' + loc("Golden cookie") + ' ON', 'AutoClick ' + loc("Golden cookie") + ' OFF', "CookieAssistant2.Toggle")
            + '<label>Mode</label>'
            + '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.golden.mode++; if(CookieAssistant2.config.particular.golden.mode >= Object.keys(CookieAssistant2.modes.golden).length){CookieAssistant2.config.particular.golden.mode = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
            + CookieAssistant2.modes.golden[CookieAssistant2.config.particular.golden.mode].desc
            + '</a>'
        if (CookieAssistant2.showAllIntervals) {
            str += '<label>Click interval(ms)</label>'
                + m.InputBox("CookieAssistant2_Interval_autoClickBigCookie", 40, CookieAssistant2.config.intervals.autoClickGoldenCookie, "CookieAssistant2.ChangeInterval('autoClickGoldenCookie', this.value)")
        }
        str += '<br />'
            + '</div>';

        //Destroy Wrinklers
        str += '<div class="listing">' + m.ToggleButton(CookieAssistant2.config.flags, 'autoClickWrinklers', 'CookieAssistant2_autoClickWrinklers', 'AutoClick ' + loc("wrinkler") + ' ON', 'AutoClick ' + loc("wrinkler") + ' OFF', "CookieAssistant2.Toggle")
            + '<label>Mode</label>'
            + '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.wrinkler.mode++; if(CookieAssistant2.config.particular.wrinkler.mode >= Object.keys(CookieAssistant2.modes.wrinkler).length){CookieAssistant2.config.particular.wrinkler.mode = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
            + CookieAssistant2.modes.wrinkler[CookieAssistant2.config.particular.wrinkler.mode].desc
            + '</a>'
        if (CookieAssistant2.showAllIntervals) {
            str += '<label>Click interval(ms)</label>'
                + m.InputBox("CookieAssistant2_Interval_autoClickWrinklers", 40, CookieAssistant2.config.intervals.autoClickWrinklers, "CookieAssistant2.ChangeInterval('autoClickWrinklers', this.value)")
        }
        str += '<br />'
            + '</div>';

        //Upgrade automatic purchase
        str += '<div class="listing">' + m.ToggleButton(CookieAssistant2.config.flags, 'autoBuyUpgrades', 'CookieAssistant2_autoBuyUpgrades', 'AutoBuy ' + loc("upgrade") + ' ON', 'AutoBuy ' + loc("upgrade") + ' OFF', "CookieAssistant2.Toggle")
            + '<label>Mode</label>'
            + '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.upgrades.mode++; if(CookieAssistant2.config.particular.upgrades.mode >= Object.keys(CookieAssistant2.modes.upgrades).length){CookieAssistant2.config.particular.upgrades.mode = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
            + CookieAssistant2.modes.upgrades[CookieAssistant2.config.particular.upgrades.mode].desc
            + '</a><br />'
            + '</div>';

        //building automatic purchase
        str += '<div class="listing">' + m.ToggleButton(CookieAssistant2.config.flags, 'autoBuyBuildings', 'CookieAssistant2_autoBuyBuildings', 'AutoBuy ' + loc("building") + ' ON', 'AutoBuy ' + loc("building") + ' OFF', "CookieAssistant2.Toggle")
            + '<label>Mode</label>'
            if (CookieAssistant2.modes.buildings[CookieAssistant2.config.particular.buildings.mode].desc === "Buy") {
                str += '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.buildings.mode++; if(CookieAssistant2.config.particular.buildings.mode >= Object.keys(CookieAssistant2.modes.buildings).length){CookieAssistant2.config.particular.buildings.mode = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
                + CookieAssistant2.modes.buildings[CookieAssistant2.config.particular.buildings.mode].desc
                + '</a>'
                + '<label>Amount</label>'
                + m.InputBox("CookieAssistant2_Amount_autoBuyBuildings", 40, CookieAssistant2.config.particular.buildings.amount, "if(isNaN(this.value)) {this.value = 1; Game.Notify(CookieAssistant2.name, `Please input only numbers`)}; if(this.value < 1){this.value = 1; Game.Notify(CookieAssistant2.name, `Please input only positive numbers`)}; CookieAssistant2.config.particular.buildings.amount = parseInt(this.value).toPrecision();")
            } else {
                str += '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.buildings.mode++; if(CookieAssistant2.config.particular.buildings.mode >= Object.keys(CookieAssistant2.modes.buildings).length){CookieAssistant2.config.particular.buildings.mode = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
                    + CookieAssistant2.modes.buildings[CookieAssistant2.config.particular.buildings.mode].desc
                    + '</a>'
            }

            str += '<br />'
                + '</div>';

        //ElderPledge automatic purchase
        str += '<div class="listing">'
            + m.ToggleButton(CookieAssistant2.config.flags, 'autoBuyElderPledge', 'CookieAssistant2_autoBuyElderPledge', 'AutoBuy ' + loc("[Upgrade name 74]Elder Pledge") + ' ON', 'AutoBuy ' + loc("[Upgrade name 74]Elder Pledge") + ' OFF', "CookieAssistant2.Toggle")
            + '<label>This feature will also automatically purchase "Sacrificial rolling pins".</label>'
            + '<br />'
            + '</div>';

        //reindeer click
        str += '<div class="listing">'
            + m.ToggleButton(CookieAssistant2.config.flags, 'autoClickReindeer', 'CookieAssistant2_autoClickReindeerButton', 'AutoClick ' + loc("reindeer") + ' ON', 'AutoClick ' + loc("reindeer") + ' OFF', "CookieAssistant2.Toggle")
            + '</div>';

        //FortuneNewsClick
        str += '<div class="listing">'
            + m.ToggleButton(CookieAssistant2.config.flags, 'autoClickFortuneNews', 'CookieAssistant2_autoClickFortuneNewsButton', 'AutoClick News ON', 'AutoClick News OFF', "CookieAssistant2.Toggle")
            + '</div>';

        //Automatic sugar ball harvesting
        str += '<div class="listing">'
            + m.ToggleButton(CookieAssistant2.config.flags, 'autoHarvestSugarLump', 'CookieAssistant2_autoHarvestSugarLump', 'AutoHarvest ' + loc("sugar lump") + ' ON', 'AutoHarvest ' + loc("sugar lump") + ' OFF', "CookieAssistant2.Toggle")
            + '</div>';

        str += "<br>"
        str += m.Header('Advanced Assists');
        //Auto cast Force the Hand of Fate
        str += '<div class="listing">' + m.ToggleButton(CookieAssistant2.config.flags, 'autoSpellOnBuff', 'CookieAssistant2_autoSpellOnBuff', 'AutoSpellCast ' + loc("Force the Hand of Fate") + ' ON', 'AutoSpellCast ' + loc("Force the Hand of Fate") + ' OFF', "CookieAssistant2.Toggle")
            + '<label>Mode</label>'
            + '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.spell.mode++; if(CookieAssistant2.config.particular.spell.mode >= Object.keys(CookieAssistant2.modes.spell).length){CookieAssistant2.config.particular.spell.mode = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
            + CookieAssistant2.modes.spell[CookieAssistant2.config.particular.spell.mode].desc
            + '</a>'
            + '<label>and</label>'
            + '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.spell.mode2++; if(CookieAssistant2.config.particular.spell.mode2 >= Object.keys(CookieAssistant2.modes.spell_buff).length){CookieAssistant2.config.particular.spell.mode2 = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
            + CookieAssistant2.modes.spell_buff[CookieAssistant2.config.particular.spell.mode2].desc
            + '</a>'
            + '<br />'
            + '</div>'

        //Automatic season switching
        str += '<div class="listing">' + m.ToggleButton(CookieAssistant2.config.flags, 'autoSwitchSeason', 'CookieAssistant2_autoSwitchSeason', 'AutoSwitch Seasons ON', 'AutoSwitch Seasons OFF', "CookieAssistant2.Toggle")
            + '<label>Cycle seasons until all upgrades purchased, once finished, switch this season</label>'
            + '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.season.afterComplete++; if(CookieAssistant2.config.particular.season.afterComplete >= Object.keys(CookieAssistant2.modes.season).length){CookieAssistant2.config.particular.season.afterComplete = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
            + CookieAssistant2.modes.season[CookieAssistant2.config.particular.season.afterComplete].desc
            + '</a>'
            + '<br />'
            + '</div>';

        //Dragon automatic training
        str += '<div class="listing">' + m.ToggleButton(CookieAssistant2.config.flags, 'autoTrainDragon', 'CookieAssistant2_autoTrainDragon', 'AutoTrain Dragon ON', 'AutoTrain Dragon OFF', "CookieAssistant2.Toggle")
            + '<label>Aura 1</label>'
            + '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.dragon.aura1++; if(CookieAssistant2.config.particular.dragon.aura1 >= Object.keys(Game.dragonAuras).length){CookieAssistant2.config.particular.dragon.aura1 = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
            + Game.dragonAuras[CookieAssistant2.config.particular.dragon.aura1].dname
            + '</a>'
            + '<label>Aura 2</label>'
            + '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.dragon.aura2++; if(CookieAssistant2.config.particular.dragon.aura2 >= Object.keys(Game.dragonAuras).length){CookieAssistant2.config.particular.dragon.aura2 = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
            + Game.dragonAuras[CookieAssistant2.config.particular.dragon.aura2].dname
            + '</a>'
            + '<br />'
            + '</div>';

        //Pantheon slot automatic set
        str += '<div class="listing">' + m.ToggleButton(CookieAssistant2.config.flags, 'autoSetSpirits', 'CookieAssistant2_autoSetSpirits', 'AutoSet Spirits ON', 'AutoSet Spirits OFF', "CookieAssistant2.Toggle")
        if (Game.Objects['Temple'].minigame !== undefined && Game.Objects['Temple'].minigameLoaded) {
            str += '<label>Diamond</label>'
                + `<a class="option" ` + Game.clickStr + `=" CookieAssistant2.config.particular.spirits.slot1++; if(CookieAssistant2.config.particular.spirits.slot1 >= Object.keys(Game.Objects['Temple'].minigame.gods).length){CookieAssistant2.config.particular.spirits.slot1 = 0;} Game.UpdateMenu();">`
                + Game.Objects['Temple'].minigame.godsById[CookieAssistant2.config.particular.spirits.slot1].name
                + '</a>'
                + '<label>Ruby</label>'
                + `<a class="option" ` + Game.clickStr + `=" CookieAssistant2.config.particular.spirits.slot2++; if(CookieAssistant2.config.particular.spirits.slot2 >= Object.keys(Game.Objects['Temple'].minigame.gods).length){CookieAssistant2.config.particular.spirits.slot2 = 0;} Game.UpdateMenu();">`
                + Game.Objects['Temple'].minigame.godsById[CookieAssistant2.config.particular.spirits.slot2].name
                + '</a>'
                + '<label>Jade</label>'
                + `<a class="option" ` + Game.clickStr + `=" CookieAssistant2.config.particular.spirits.slot3++; if(CookieAssistant2.config.particular.spirits.slot3 >= Object.keys(Game.Objects['Temple'].minigame.gods).length){CookieAssistant2.config.particular.spirits.slot3 = 0;} Game.UpdateMenu();">`
                + Game.Objects['Temple'].minigame.godsById[CookieAssistant2.config.particular.spirits.slot3].name
                + '</a>';
        } else {
            str += "<label>⚠️You have not unlocked the Pantheon yet. This feature will not be available until it is unlocked.</label><br />";
        }
        str += '<br />'
            + '</div>'

        //Golden switch automatic switching
        str += '<div class="listing">' + m.ToggleButton(CookieAssistant2.config.flags, 'autoToggleGoldenSwitch', 'CookieAssistant2_autoToggleGoldenSwitch', 'AutoToggle ' + loc("[Upgrade name 327]Golden switch") + ' ON', 'AutoToggle ' + loc("[Upgrade name 327]Golden switch") + ' OFF', "CookieAssistant2.Toggle")
            + '<label>Enable when</label>'
            + '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.goldenSwitch.enable++; if(CookieAssistant2.config.particular.goldenSwitch.enable >= Object.keys(CookieAssistant2.modes.goldenSwitch_enable).length){CookieAssistant2.config.particular.goldenSwitch.enable = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
            + CookieAssistant2.modes.goldenSwitch_enable[CookieAssistant2.config.particular.goldenSwitch.enable].desc
            + '</a>'
            + '<label>Disable when</label>'
            + '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.goldenSwitch.disable++; if(CookieAssistant2.config.particular.goldenSwitch.disable >= Object.keys(CookieAssistant2.modes.goldenSwitch_disable).length){CookieAssistant2.config.particular.goldenSwitch.disable = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
            + CookieAssistant2.modes.goldenSwitch_disable[CookieAssistant2.config.particular.goldenSwitch.disable].desc
            + '</a>'
            + '</div>';

        //broker auto hire
        str += '<div class="listing">' + m.ToggleButton(CookieAssistant2.config.flags, 'autoHireBrokers', 'CookieAssistant2_autoHireBrokers', 'AutoHire Brokers ON', 'AutoHire Brokers OFF', "CookieAssistant2.Toggle");
        if (CookieAssistant2.showAllIntervals) {
            str += '<label>Click interval(ms)</label>'
                + m.InputBox("CookieAssistant2_Interval_autoHireBrokers", 40, CookieAssistant2.config.intervals.autoHireBrokers, "CookieAssistant2.ChangeInterval('autoHireBrokers', this.value)");
        }
        str += '</div>';
        str += "<br>"

        str += m.Header('Ascension Assists');
        //ChocolateEgg
        str += '<div class="listing">' + m.ToggleButton(CookieAssistant2.config.flags, 'autoChocolateEgg', 'CookieAssistant2_autoChocolateEgg', 'Auto Buy ' + loc("[Upgrade name 227]Chocolate egg") + ' ON', 'AutoToggle ' + loc("[Upgrade name 227]Chocolate egg") + ' OFF', "CookieAssistant2.Toggle")
            + '</div>';
        str += "<br>"

        str += m.Header('Godzamok Assistant');
        //building automatic sale
        str += '<div class="listing">' + m.ToggleButton(CookieAssistant2.config.flags, 'autoSellBuilding', 'CookieAssistant2_autoSellBuilding', 'AutoSell Buildings ON', 'AutoSell Buildings OFF', "CookieAssistant2.Toggle");
        str += '<label>Click interval(ms)</label>'
            + m.InputBox("CookieAssistant2_Interval_autoSellBuilding", 40, CookieAssistant2.config.intervals.autoSellBuilding, "CookieAssistant2.ChangeInterval('autoSellBuilding', this.value)");
        str += '<br>'
        str += '<a class="option" ' + Game.clickStr + '="CookieAssistant2.addSellConfig(); Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">Add Config</a>';
        if (CookieAssistant2.config.particular.sell.isAfterSell.length > 0) {
            str += '<a class="option" ' + Game.clickStr + '="CookieAssistant2.removeSellConfig(); Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">Remove Last</a>';
        }
        str += '<div class="listing">'
            + '<ol style="list-style: inside decimal;">';
        for (let i = 0; i < CookieAssistant2.config.particular.sell.isAfterSell.length; i++) {
            str += '<li>'
                + '<label>Mode</label>'
                + '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.sell.sell_mode[' + i + ']++; if(CookieAssistant2.config.particular.sell.sell_mode[' + i + '] >= Object.keys(CookieAssistant2.modes.sell_buildings_mode).length) {CookieAssistant2.config.particular.sell.sell_mode[' + i + '] = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
                + CookieAssistant2.modes.sell_buildings_mode[CookieAssistant2.config.particular.sell.sell_mode[i]].desc
                + '</a>'
                + '<label>Target</label>'
                + '<a class="option" ' + Game.clickStr + '="CookieAssistant2.config.particular.sell.target[' + i + ']++; if(CookieAssistant2.config.particular.sell.target[' + i + '] >= Object.keys(Game.Objects).length){CookieAssistant2.config.particular.sell.target[' + i + '] = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
            if (Game.season === "fools") {
                str += Game.foolObjects[Game.ObjectsById[CookieAssistant2.config.particular.sell.target[i]].dname].name
            } else {
                str += Game.ObjectsById[CookieAssistant2.config.particular.sell.target[i]].dname
            }
            str += '</a>'
            if (CookieAssistant2.modes.sell_buildings_mode[CookieAssistant2.config.particular.sell.sell_mode[i]].desc === "Set") {
                str += '<label>Amount</label>'
                    + m.InputBox("CookieAssistant2_Amount_autoSellBuilding", 40, CookieAssistant2.config.particular.sell.amount[i], "CookieAssistant2.config.particular.sell.amount[" + i + "] = this.value;")
            }
            if (CookieAssistant2.modes.sell_buildings_mode[CookieAssistant2.config.particular.sell.sell_mode[i]].desc === "Percentage") {
                str += '<label>Percentage</label>'
                    + m.InputBox("CookieAssistant2_Amount_autoSellBuilding", 40, CookieAssistant2.config.particular.sell.amount[i], "if(this.value < 0){this.value = 0}; if(this.value > 100) {this.value = 100}; CookieAssistant2.config.particular.sell.amount[" + i + "] = parseInt(this.value).toPrecision();")
            }
            str += '<label>When</label>'
                + '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.sell.activate_mode[' + i + ']++; if(CookieAssistant2.config.particular.sell.activate_mode[' + i + '] >= Object.keys(CookieAssistant2.modes.sell_buildings).length){CookieAssistant2.config.particular.sell.activate_mode[' + i + '] = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
                + CookieAssistant2.modes.sell_buildings[CookieAssistant2.config.particular.sell.activate_mode[i]].desc
                + '</a>'
                + '<label>Then</label>'
                + '<a class="option" ' + Game.clickStr + '=" CookieAssistant2.config.particular.sell.after_mode[' + i + ']++; if(CookieAssistant2.config.particular.sell.after_mode[' + i + '] >= Object.keys(CookieAssistant2.modes.sell_buildings_after).length){CookieAssistant2.config.particular.sell.after_mode[' + i + '] = 0;} Game.UpdateMenu(); PlaySound(\'snd/tick.mp3\');">'
                + CookieAssistant2.modes.sell_buildings_after[CookieAssistant2.config.particular.sell.after_mode[i]].desc
                + '</a><br></li>';
        }
        str += '</ol>'
        +'</div>'
        +'</div>'

        if (CookieAssistant2.config.flags.autoSellBuilding) {
            let temple = Game.Objects['Temple'].minigame;
            if (temple === undefined || !Game.Objects['Temple'].minigameLoaded || !temple.slot.includes(2)) {
                str += "<label><b style='color: #ff3705'>⚠️Godzamok is not set, so there may be no benefit from enabling this.</b></label><br />";
            }
        }

        str += "<br />"
        str += m.Header('Misc');
        str += '<div class="listing">'
            + m.ActionButton("Steam.openLink('https://steamcommunity.com/sharedfiles/filedetails/?id=2596469882');", 'Original Cookie Assistant')
            + m.ActionButton("CookieAssistant2.showAllIntervals = !CookieAssistant2.showAllIntervals; Game.UpdateMenu();", (CookieAssistant2.showAllIntervals ? 'Hide' : 'Show All') + ' Interval Settings')
            + m.ActionButton("CookieAssistant2.restoreDefaultConfig(2); CookieAssistant2.DoAction(); Game.UpdateMenu();", 'Restore Default')
            + m.ActionButton("CookieAssistant2.CheckUpdate();", 'Check Update')
            + m.ActionButton("Steam.openLink('https://steamcommunity.com/sharedfiles/filedetails/?id=3316971307');", 'Get more information')
            + '</div>'
        str += '<div class="listing">'
            + '<label>Version: ' + CookieAssistant2.version + '</label>'
            + '</div>'

        return str;
    }

    CookieAssistant2.Toggle = function (prefName, button, on, off, invert) {
        if (CookieAssistant2.config.flags[prefName]) {
            l(button).innerHTML = off;
            CookieAssistant2.config.flags[prefName] = 0;
        } else {
            l(button).innerHTML = on;
            CookieAssistant2.config.flags[prefName] = 1;
        }
        l(button).className = 'option' + ((CookieAssistant2.config.flags[prefName] ^ invert) ? '' : ' off');
        CookieAssistant2.DoAction();
    }

    CookieAssistant2.ChangeInterval = function (prefName, value) {
        CookieAssistant2.config.intervals[prefName] = value;
        CookieAssistant2.DoAction();
    }

    CookieAssistant2.DoAction = function () {
        for (const [key, isClick] of Object.entries(CookieAssistant2.config.flags)) {
            if (CookieAssistant2.actions[key] === undefined) {
                continue;
            }
            if (isClick) {
                if (CookieAssistant2.intervalHandles[key] == null) {
                    CookieAssistant2.actions[key]();
                } else {
                    clearInterval(CookieAssistant2.intervalHandles[key]);
                    CookieAssistant2.intervalHandles[key] = null;
                    CookieAssistant2.actions[key]();
                }
            } else if (CookieAssistant2.intervalHandles[key] != null) {
                clearInterval(CookieAssistant2.intervalHandles[key]);
                CookieAssistant2.intervalHandles[key] = null;
            }
        }
    }

    CookieAssistant2.addSellConfig = function () {
        CookieAssistant2.config.particular.sell.isAfterSell.push(0);
        CookieAssistant2.config.particular.sell.target.push(0);
        CookieAssistant2.config.particular.sell.amount.push(0);
        CookieAssistant2.config.particular.sell.activate_mode.push(0);
        CookieAssistant2.config.particular.sell.after_mode.push(0);
        CookieAssistant2.config.particular.sell.sell_mode.push(0);
    }

    CookieAssistant2.removeSellConfig = function () {
        CookieAssistant2.config.particular.sell.isAfterSell.pop();
        CookieAssistant2.config.particular.sell.target.pop();
        CookieAssistant2.config.particular.sell.amount.pop();
        CookieAssistant2.config.particular.sell.activate_mode.pop();
        CookieAssistant2.config.particular.sell.after_mode.pop();
        CookieAssistant2.config.particular.sell.sell_mode.pop();
    }

    CookieAssistant2.save = function () {
        return JSON.stringify(CookieAssistant2.config);
    }

    CookieAssistant2.load = function (str) {
        CookieAssistant2.config = JSON.parse(str);
        CookieAssistant2.CheckConfig();
        CookieAssistant2.DoAction();
    }

    CookieAssistant2.CheckVersion = function (version) {
        let pattern = /(\d+).(\d+).(\d+)/;
        let local_result = CookieAssistant2.version.match(pattern);
        let online_result = version.match(pattern);
        let local_major_version = local_result[1];
        let local_minor_version = local_result[2];
        let local_patch_version = local_result[3];
        let online_major_version = online_result[1];
        let online_minor_version = online_result[2];
        let online_patch_version = online_result[3];

        if (local_major_version === online_major_version && local_minor_version === online_minor_version && local_patch_version === online_patch_version) {
            return true
        } else {
            if (local_major_version < online_major_version) {
                return false
            } else {
                if (local_minor_version < online_minor_version) {
                    return false
                } else {
                    if (local_patch_version < online_patch_version) {
                        return false
                    }
                }
            }
        }
    }

    CookieAssistant2.CheckUpdate = async function () {
        await fetch("https://api.github.com/repos/CheeseonToast/cookieassistant2/releases/latest").then(json => {
            json.json().then(result => {
                if (CookieAssistant2.CheckVersion(result['tag_name'])) {
                    Game.Notify(CookieAssistant2.name, `This is the latest version: <b style="color: #38e410">${CookieAssistant2.version}</b>`);
                } else {
                    Game.Notify(CookieAssistant2.name, `<b style="color: #38e410"><br>There is an update!</b><br><a ${Game.clickStr}="Steam.openLink('${result['html_url']}')" target="_brank">Download Here</a>`);
                    Game.UpdateMenu();
                }
            })
        })
    }

    if (CCSE.ConfirmGameVersion(CookieAssistant2.name, CookieAssistant2.version, CookieAssistant2.GameVersion)) {
        Game.registerMod(CookieAssistant2.name, CookieAssistant2);
    }
}

if (!CookieAssistant2.isLoaded) {
    if (CCSE && CCSE.isLoaded) {
        CookieAssistant2.launch();
    } else {
        if (!CCSE) var CCSE = {};
        if (!CCSE.postLoadHooks) CCSE.postLoadHooks = [];
        CCSE.postLoadHooks.push(CookieAssistant2.launch);
    }
}
