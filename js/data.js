'use strict';
/* ============================================================
   Experience: Bible Stories
   Chapter data. Chapters live in an array so future chapters
   (Chapter 2, 3, …) can simply be appended later.
   ============================================================ */

const CHAPTERS = [
  {
    id: 1,
    title: 'God Made Heaven and Earth',
    tagline: 'Jehovah God is our Creator.',
    playable: 'angel',               // you play as the first angel (God's helper)

    /* ---------- Quest chain (in order) ---------- */
    quests: [
      {
        id: 'meet',
        title: 'The Creator Calls',
        objective: 'Talk to Jehovah God on the hill.'
      },
      {
        id: 'light',
        title: 'Let There Be Light',
        objective: 'Go east along the path and touch the Beacon of Light.',
        need: 1
      },
      {
        id: 'plants',
        title: 'Grass, Plants and Trees',
        objective: 'Plant seeds in the three patches of soft soil in the south meadow.',
        need: 3,
        unit: 'seeds planted'
      },
      {
        id: 'animals',
        title: 'The Animals Arrive',
        objective: 'Find four animals and lead them into the meadow.',
        need: 4,
        unit: 'animals led to the meadow'
      },
      {
        id: 'man',
        title: '“Let Us Make Man”',
        objective: 'Return to Jehovah God on the hill.'
      }
    ],

    /* ---------- Cutscenes (letterboxed, cinematic) ---------- */
    cutscenes: {
      intro: [
        { t: 'Jehovah God is our Creator. He made everything — the things we can see, and the things we cannot see.' },
        { t: 'Before He made the things we can see, He made many, many angels. Angels are persons that Jehovah made who are like Himself.' },
        { t: 'You are the first angel Jehovah made. You became His helper, and helped when Jehovah made the stars, the planets, and all other things.' },
        { t: 'One of those planets is the earth — our beautiful home. Today Jehovah gets the earth ready for animals and humans. He calls for you…' }
      ],
      finale: [
        { s: 'Jehovah God', t: 'You are here, My first angel. It is time for Our greatest work on the earth. “Let us make man.”' },
        { t: 'And Jehovah God formed man from the dust of the ground, and breathed into his nostrils the breath of life.' },
        { t: 'Do you know who the first man was? Let us see…' },
        { fx: 'spawnAdam' },
        { t: 'The first man opened his eyes in the garden Jehovah had prepared. His name was Adam — the first man.' },
        { t: 'Humans would be different from animals. They could invent things. They could speak, laugh, and pray. They would look after the earth and the animals.' },
        { fx: 'canon', text: 'Canon Event: Man was created — Adam, the first man.' },
        { t: 'You stood beside Jehovah God, and watched the beginning of mankind.' }
      ]
    },

    /* ---------- Dialogs (bottom box, during play) ---------- */
    dialogs: {
      meet: [
        { s: 'Jehovah God', t: 'Welcome, My first angel. Today I make the earth ready for animals and humans to live on. Will you help Me again?' },
        { s: 'Jehovah God', t: 'First, go east along the path to the Beacon of Light, and touch it — so the sun’s light will shine on the earth.' }
      ],
      lightDone: [
        { t: 'It is good. The sun’s light shines on the earth. Now the mountains, the oceans, and the rivers can be seen.' },
        { t: 'Then Jehovah said: “I am going to make grass and plants and trees.”' },
        { s: 'Jehovah God', t: 'Take seeds, My helper, and plant them in the three patches of soft soil in the meadow.' }
      ],
      plantsDone: [
        { t: 'Many different kinds of fruits, vegetables, and flowers began to grow.' },
        { s: 'Jehovah God', t: 'Now for the living creatures — animals that fly, swim, crawl, and creep. Small ones, such as rabbits, and large ones, such as elephants.' },
        { s: 'Jehovah God', t: 'Find four animals out in the world and lead them into the meadow, where I have prepared a home for them.' }
      ],
      animalsDone: [
        { t: 'Jehovah made all the animals, and they came to live on the earth.' },
        { s: 'Jehovah God', t: 'But one great work remains. Jehovah said to the first angel: “Let us make man.”' },
        { s: 'Jehovah God', t: 'Come to Me on the hill, My first angel, and we will finish this day together.' }
      ],

      /* Hints when you talk to Jehovah out of order */
      hints: {
        light: [{ s: 'Jehovah God', t: 'The Beacon of Light waits to the east of the meadow. Touch it, and the sun’s light will shine on the earth.' }],
        plants: [{ s: 'Jehovah God', t: 'Three patches of soft soil wait in the south of the meadow. Plant a seed in each one.' }],
        animals: [{ s: 'Jehovah God', t: 'Four animals are out there somewhere. Find them, and lead them into the meadow.' }]
      },

      /* Messages when acting too early / late */
      blocked: {
        beaconEarly: 'The beacon is quiet. Jehovah has not yet given the word.',
        beaconLit: 'The sun’s light shines brightly over the earth.',
        soilEarly: 'The soil is soft and ready — but Jehovah has not yet called for planting.',
        soilPlanted: 'A young tree is growing here. Many more will follow.',
        animalEarly: 'The animal watches you calmly. Not yet…',
        godIdle: 'Jehovah watches over His creation with pleasure.'
      }
    },

    /* ---------- Canon events witnessed this chapter ---------- */
    canonEvents: [
      'The sun’s light shone on the earth.',
      'Man was created — Adam, the first man.'
    ]
  },

  /* ============================================================
     CHAPTER 2 — God Made the First Man and Woman
     ============================================================ */
  {
    id: 2,
    title: 'God Made the First Man and Woman',
    tagline: 'Jehovah planted a garden in Eden.',
    playable: 'adam',                // you play as Adam — the first man

    quests: [
      {
        id: 'garden',
        title: 'The Garden of Eden',
        objective: 'Talk to Jehovah God in the garden.'
      },
      {
        id: 'naming',
        title: 'Adam Names the Animals',
        objective: 'Give names to the four animals — walk to each one and name it.',
        need: 4,
        unit: 'animals named'
      },
      {
        id: 'rule',
        title: 'The One Rule',
        objective: 'Talk to Jehovah God beside the tree of the knowledge.'
      },
      {
        id: 'eve',
        title: 'A Helper for Adam',
        objective: 'Talk to Jehovah God — He will make a helper for you.'
      },
      {
        id: 'family',
        title: 'The First Family',
        objective: 'Talk to Jehovah God with Eve at your side to receive His blessing.'
      }
    ],

    cutscenes: {
      intro: [
        { t: 'Chapter 2 — God Made the First Man and Woman' },
        { t: 'Jehovah planted a garden in a place called Eden. The garden was full of flowers, trees, and animals.' },
        { t: 'Then God made the first man, Adam, out of dust and blew into his nostrils — the man became a living person!' },
        { t: 'Today, you are that man — Adam. Jehovah has put you in charge of His beautiful garden.' }
      ],
      eve: [
        { s: 'Jehovah God', t: 'It is not good for you to stay alone, Adam. I am going to make a helper for you.' },
        { t: 'Jehovah made you fall into a deep sleep…' },
        { fx: 'sleepPlayer' },
        { t: '…and God used one of your ribs to create a wife for you.' },
        { fx: 'spawnEve' },
        { t: 'Her name was Eve — and Adam and Eve became the first family.' },
        { fx: 'wakePlayer' },
        { s: 'Adam', t: 'Look at what Jehovah made from my rib! At last! This is someone like me.' },
        { fx: 'canon', text: 'Canon Event: Eve was created from Adam’s rib — the first woman.' }
      ],
      finale: [
        { s: 'Jehovah God', t: 'Be fruitful, become many, and fill the earth. Work together to make the whole earth a paradise — a beautiful park, just like the garden of Eden.' },
        { t: 'Adam and Eve became the first family, and Jehovah was pleased with them.' },
        { fx: 'canon', text: 'Canon Event: Adam and Eve received the blessing to fill the earth.' },
        { t: 'But things did not work out that way… Why not? We will learn more in the next chapter.' }
      ]
    },

    dialogs: {
      gardenTalk: [
        { s: 'Jehovah God', t: 'Welcome to the garden, Adam. I planted this garden here in Eden — flowers, trees, and every kind of animal.' },
        { s: 'Jehovah God', t: 'I have put you in charge of it. Now give names to all the animals — walk up to each one and call it by its name.' }
      ],
      namingDone: [
        { t: 'You gave names to all the animals. It felt good to care for them.' },
        { s: 'Jehovah God', t: 'It is good, Adam. Now come — I have an important rule to give you.' }
      ],
      ruleTalk: [
        { s: 'Jehovah God', t: 'You can eat fruit from all the trees of the garden — except one special tree: the tree of the knowledge of good and bad.' },
        { s: 'Jehovah God', t: 'If you eat fruit from that tree, you will die.' }
      ],
      hints: {
        naming: [{ s: 'Jehovah God', t: 'Walk to each animal, look at it well, and give it its name.' }]
      }
    },

    canonEvents: [
      'The rule about the tree of the knowledge was given.',
      'Eve was created from Adam’s rib — the first woman.',
      'Adam and Eve received the blessing to fill the earth.'
    ]
  },

  /* ============================================================
     CHAPTER 3 — Adam and Eve Disobeyed God
     ============================================================ */
  {
    id: 3,
    title: 'Adam and Eve Disobeyed God',
    tagline: 'A snake spoke to Eve…',
    playable: 'eve',                // you play as Eve — alone in the garden

    quests: [
      {
        id: 'snake',
        title: 'A Voice in the Garden',
        objective: 'Take a walk to the tree of the knowledge in the east of the garden.'
      },
      {
        id: 'fruit',
        title: 'The Tempting Fruit',
        objective: 'Take some of the fruit from the tree of the knowledge.'
      },
      {
        id: 'adam',
        title: 'Some for Adam',
        objective: 'Find Adam and give him some of the fruit.'
      },
      {
        id: 'question',
        title: 'Jehovah Questions Them',
        objective: 'Talk to Jehovah God — He has found out what happened.'
      },
      {
        id: 'exile',
        title: 'Put Out of the Garden',
        objective: 'Talk to Jehovah God to hear what must happen now.'
      }
    ],

    cutscenes: {
      intro: [
        { t: 'Chapter 3 — Adam and Eve Disobeyed God' },
        { t: 'Adam and Eve lived happily in the garden of Eden. They had one rule: they could eat from all the trees — except one.' },
        { t: 'If they ate fruit from that tree, they would die.' },
        { t: 'Today Eve is by herself in the garden. You are Eve — and a snake is watching from the tree of the knowledge…' }
      ],
      fruit: [
        { t: 'The more you looked at the fruit, the more you wanted it.' },
        { t: 'You took some of the fruit from the tree of the knowledge of good and bad… and you ate it.' },
        { fx: 'sfxEat' },
        { fx: 'canon', text: 'Canon Event: Eve ate the fruit from the tree of the knowledge.' },
        { t: 'You still held some of the fruit. Adam was somewhere in the garden…' }
      ],
      finale: [
        { s: 'Jehovah God', t: 'You have disobeyed Me. Because of this, you must leave the garden.' },
        { fx: 'exile' },
        { t: 'Jehovah put them out of the garden — and to make sure they could never go back…' },
        { fx: 'gateGuard' },
        { t: '…He put angels and a sword of fire at the entrance.' },
        { fx: 'canon', text: 'Canon Event: Adam and Eve were put out of the garden.' },
        { t: 'It was not really the snake that spoke to Eve. Jehovah did not make snakes that can talk.' },
        { t: 'It was a bad angel who made the snake speak — he did it to trick Eve. That angel is called Satan the Devil.' },
        { fx: 'canon', text: 'Canon Event: Satan the Devil, a bad angel, was behind the lie.' },
        { t: 'In the future, Jehovah will destroy Satan, so that he cannot keep tricking people into doing bad things.' }
      ]
    },

    dialogs: {
      snakeTalk: [
        { s: 'Snake', t: 'Is it true that God won’t let you eat from all of the trees?' },
        { s: 'Eve', t: 'We can eat from all the trees except one. If we eat the fruit from that tree, we will die.' },
        { s: 'Snake', t: 'You will not die. In fact, if you eat from it, you will be like God.' },
        { t: 'Was that true? No, it was a lie. But Eve believed it.' }
      ],
      adamEat: [
        { t: 'You gave some of the fruit to Adam.' },
        { t: 'He knew that they would die if they disobeyed God. But Adam ate the fruit anyway.' },
        { fx: 'sfxEat' }
      ],
      questionTalk: [
        { s: 'Jehovah God', t: 'Adam and Eve — why have you disobeyed Me?' },
        { s: 'Eve', t: 'The serpent deceived me, so I ate.' },
        { s: 'Adam', t: 'Eve gave me the fruit, and I ate.' },
        { t: 'Eve blamed the snake, and Adam blamed Eve.' }
      ],
      ruleReminder: [
        { s: 'Jehovah God', t: 'Enjoy the garden, My children — but do not eat from the tree of the knowledge, for in the day you eat from it you will die.' }
      ]
    },

    canonEvents: [
      'Eve ate the fruit from the tree of the knowledge.',
      'Adam ate the fruit — both disobeyed Jehovah God.',
      'Adam and Eve were put out of the garden.',
      'Satan the Devil, a bad angel, was behind the lie.'
    ]
  },

  /* ============================================================
     CHAPTER 4 — From Anger to Murder
     ============================================================ */
  {
    id: 4,
    title: 'From Anger to Murder',
    tagline: 'Anger grew in Cain’s heart…',
    playable: 'cain',               // you play as Cain — farmer, son of Adam and Eve

    quests: [
      {
        id: 'offering',
        title: 'The Offerings',
        objective: 'Bring your offering to the altar.'
      },
      {
        id: 'warning',
        title: 'Jehovah’s Warning',
        objective: 'Talk to Jehovah God at the altar.'
      },
      {
        id: 'lure',
        title: 'Come to the Field',
        objective: 'Find Abel in the pasture and ask him to come with you.'
      },
      {
        id: 'field',
        title: 'Alone in the Field',
        objective: 'Lead Abel to the field in the south-east.'
      },
      {
        id: 'judgment',
        title: 'Jehovah Punishes Cain',
        objective: 'Talk to Jehovah God — He knows what you have done.'
      }
    ],

    cutscenes: {
      intro: [
        { t: 'Chapter 4 — From Anger to Murder' },
        { t: 'After Adam and Eve left the garden of Eden, they had many children. Their first son, Cain, became a farmer — and their second son, Abel, a shepherd.' },
        { t: 'You are Cain. Today you and Abel will make offerings to Jehovah. An offering is a special kind of gift.' },
        { t: 'The altar stands by the road in the middle of the land. Bring your offering there.' }
      ],
      field: [
        { t: 'You and Abel are alone in the field. No one else is watching.' },
        { fx: 'fadeBlack' },
        { t: 'Your anger grew and grew — and it controlled you. You attacked your brother Abel… and killed him.' },
        { fx: 'abelGone' },
        { t: 'What would Jehovah do about this?' },
        { fx: 'canon', text: 'Canon Event: Cain attacked his brother and killed him.' }
      ],
      finale: [
        { s: 'Jehovah God', t: 'Cain, you have done a wicked thing! You killed your brother Abel.' },
        { s: 'Jehovah God', t: 'Because of this, you must be sent far away from your family.' },
        { fx: 'banish' },
        { t: 'Jehovah punished Cain by sending him far away. You would never be allowed to come back.' },
        { fx: 'canon', text: 'Canon Event: Jehovah punished Cain by sending him far away.' },
        { t: 'Is there a lesson here for us? We might start to feel angry if things do not go the way we think they should.' },
        { t: 'If we feel anger growing inside of us — or if others warn us because they notice our anger — we should quickly adjust and control our emotions before they control us.' },
        { t: 'Because Abel loved Jehovah and did what was right, Jehovah will always remember him.' },
        { fx: 'canon', text: 'Canon Event: Jehovah will always remember Abel.' },
        { t: 'God will bring Abel back to life when He makes the earth a paradise.' }
      ]
    },

    dialogs: {
      offeringTalk: [
        { t: 'You are a farmer, so you brought some of the fruit of the ground as your offering.' },
        { t: 'Abel, a shepherd, brought the firstborn of his flock and their fat portions.' },
        { t: 'Jehovah was happy with Abel’s offering — but He was not happy with yours.' }
      ],
      warningTalk: [
        { s: 'Jehovah God', t: 'Cain, I can see anger in your heart. Be careful — if you do not control it, that anger could make you do something bad.' },
        { t: 'Jehovah warned Cain that his anger could make him do something bad. But you did not listen.' }
      ],
      lureTalk: [
        { s: 'Cain', t: 'Come over to the field with me.' },
        { t: 'And Abel went with you.' }
      ]
    },

    canonEvents: [
      'Jehovah was happy with Abel’s offering, but not with Cain’s.',
      'Cain attacked his brother and killed him.',
      'Jehovah punished Cain by sending him far away.',
      'Jehovah will always remember Abel.'
    ]
  },

  /* ============================================================
     CHAPTER 5 — Noah's Ark
     ============================================================ */
  {
    id: 5,
    title: 'Noah’s Ark',
    tagline: 'The earth grew violent — one family walked with God.',
    playable: 'noah',                // you play as Noah, the only man who loved Jehovah

    quests: [
      {
        id: 'command',
        title: 'Jehovah’s Command',
        objective: 'Talk to Jehovah God on the hill.'
      },
      {
        id: 'build',
        title: 'Build the Ark',
        objective: 'Work on the four piles of timber around the ark.',
        need: 4,
        unit: 'parts of the ark built'
      },
      {
        id: 'warn',
        title: 'Warn the People',
        objective: 'Warn three people in the village about the Flood.',
        need: 3,
        unit: 'people warned'
      },
      {
        id: 'animals',
        title: 'The Animals Arrive',
        objective: 'Lead every animal to the ark — two by two, plus seven sheep.',
        need: 13,
        unit: 'animals led to the ark'
      },
      {
        id: 'enter',
        title: 'Into the Ark',
        objective: 'Enter the ark — it is time.'
      }
    ],

    cutscenes: {
      intro: [
        { t: 'Chapter 5 — Noah’s Ark' },
        { t: 'In time, there came to be many people on the earth. Most of them were bad.' },
        { t: 'Even some of the angels in heaven became bad. They left their home in heaven and came down to the earth, so that they could take on human bodies and marry women.' },
        { t: 'The angels and the women had sons together. Those sons grew up to be very strong and became bullies. They hurt people.' },
        { t: 'Jehovah could not let those things continue to happen. So He decided to destroy the bad people in a flood.' },
        { fx: 'canon', text: 'Canon Event: Jehovah decided to destroy the bad people with a Flood.' },
        { t: 'But there was a man who was different. He loved Jehovah. His name was Noah.' },
        { t: 'You are Noah. You have a wife and three sons — Shem, Ham, and Japheth — and each of your sons has a wife.' },
        { t: 'Jehovah told Noah to build a big ark — a huge box that can float on water. Go to Jehovah now, on the hill.' }
      ],
      finale: [
        { t: 'Finally, it was time to go into the ark.' },
        { t: 'The animals came inside, two by two, and Noah’s family went in after them.' },
        { fx: 'enterArk' },
        { s: 'Jehovah God', t: 'Noah, you did everything exactly as I told you. I will shut the door of the ark Myself.' },
        { fx: 'canon', text: 'Canon Event: Noah and his family went into the ark.' },
        { t: 'Then rain began to fall from the sky — rain that fell for forty days and forty nights.' },
        { fx: 'rain' },
        { t: 'The waters of the Flood rose up from the earth… but the ark floated safely on top of them.' },
        { t: 'Noah loved Jehovah — and Jehovah kept Noah and his family safe, just as He promised.' }
      ]
    },

    dialogs: {
      commandTalk: [
        { s: 'Jehovah God', t: 'Noah, I have seen that the people are violent and bad — but you are different. You walk with Me.' },
        { s: 'Jehovah God', t: 'Build yourself an ark of good wood. Make it a huge box that can float on water, exactly as I will show you.' },
        { s: 'Jehovah God', t: 'Bring your family — your wife, Shem, Ham, and Japheth — and bring many animals inside, so that they may survive too.' },
        { t: 'Noah immediately started building the ark. It took Noah and his family about 50 years to build it.' }
      ],
      buildDone: [
        { t: 'After about 50 years, the ark stood finished — built exactly as Jehovah told Noah to build it.' },
        { s: 'Jehovah God', t: 'Well done, Noah. Now go to the village and warn the people about the Flood.' }
      ],
      warnDone: [
        { t: 'During all those years, Noah warned the people about the Flood. But no one listened to him.' },
        { s: 'Jehovah God', t: 'Their hearts are hard. Now bring the animals to the ark — two by two — for it is almost time.' }
      ],
      animalsDone: [
        { t: 'The animals came to the ark, two by two — and the sheep came as a whole flock — and went inside.' },
        { s: 'Jehovah God', t: 'It is time. Enter the ark, Noah, and take your family with you.' }
      ],

      hints: {
        build: [{ s: 'Jehovah God', t: 'Four piles of timber wait on the building field. Work on each one — this will take many years.' }],
        warn: [{ s: 'Jehovah God', t: 'The village lies to the east, beyond the ark. Warn three of the people there.' }],
        animals: [{ s: 'Jehovah God', t: 'The animals are out there — rabbits, elephants, birds, and seven sheep. Lead them all to the ark.' }],
        enter: [{ s: 'Jehovah God', t: 'The ark is ready, Noah. Go to the ark and go inside.' }]
      },

      blocked: {
        buildEarly: 'The timber is cut and ready. Jehovah has not yet given the word to build.',
        arkEarly: 'The ark is not finished yet — there is still work to do.',
        animalEarly: 'The animal watches you calmly. Not yet…'
      }
    },

    canonEvents: [
      'Jehovah decided to destroy the bad people with a Flood.',
      'Noah built the ark exactly as Jehovah told him.',
      'Noah warned the people, but no one listened.',
      'Noah and his family went into the ark.'
    ]
  },

  /* ================================================================
   *  CHAPTER 6 — Eight Survive Into a New World (the Flood)
   * ================================================================ */
  {
    id: '6',
    title: 'Eight Survive Into a New World',
    tagline: 'The Flood — the water covered the earth, and eight souls stepped out into a new world.',
    playable: 'noah',                 // you play as Noah again, stepping out of the ark

    quests: [
      {
        id: 'rain',
        title: 'Look Through the Window',
        objective: 'Look through the ark’s window at the world covered by the Flood.'
      },
      {
        id: 'settle',
        title: 'The Rain Stops',
        objective: 'Look through the ark’s window once more.'
      },
      {
        id: 'exit',
        title: 'Come Out of the Ark',
        objective: 'Go to the door of the ark — Jehovah says it is time to come out.'
      },
      {
        id: 'altar',
        title: 'Build an Altar',
        objective: 'Pile up stones and build an altar for Jehovah.'
      },
      {
        id: 'offering',
        title: 'Offer a Sheep',
        objective: 'Take a sheep to the altar and offer it to Jehovah.'
      }
    ],

    cutscenes: {
      intro: [
        { t: 'Chapter 6 — Eight Survive Into a New World' },
        { t: 'Jehovah closed the door of the ark, and it began to rain. It rained so much that the ark started to float.' },
        { t: 'Rain poured down for 40 days and 40 nights, and eventually the whole earth was covered with water.' },
        { fx: 'canon', text: 'Canon Event: The Flood covered the whole earth — only Noah and his family were safe.' },
        { t: 'Outside the ark, all the bad people died. But Noah, his wife, and his three sons with their wives — eight in all — were safe inside.' },
        { t: 'The rain is still pouring down. You are standing inside the ark, next to its little window.' }
      ],
      windowFlood: [
        { t: 'You climb up and look out of the ark’s small window.' },
        { t: 'Rain pours down without end. Water covers the whole earth — every hill and mountain. Nothing of the old world is left above the waves.' },
        { s: 'Noah', t: 'Nothing but water everywhere. But we are safe inside. I am so glad we obeyed Jehovah.' }
      ],
      settle: [
        { t: 'You look out of the window once more. At last the rain stops…' },
        { t: 'Slowly the water goes down. Finally, the ark settles on the mountains. But there is still a lot of water everywhere, so they cannot leave the ark right away.' },
        { fx: 'canon', text: 'Canon Event: The rain stopped and the ark settled on the mountains.' },
        { s: 'Jehovah God', t: 'I remember you, Noah. Wait a little longer — the water is still going down.' }
      ],
      exit: [
        { t: 'The door of the ark opens. Noah and his wife, his three sons and their wives — eight in all — come to the door, and the animals follow them.' },
        { fx: 'recede' },
        { s: 'Jehovah God', t: 'Come out of the ark, Noah — you and your family, and every animal with you.' },
        { t: 'They step out into what seems like a brand-new world.' },
        { fx: 'canon', text: 'Canon Event: The water dried up and eight people stepped out into a new world.' }
      ],
      finale: [
        { t: 'Jehovah was happy with their offering — and now He gave them His promise.' },
        { fx: 'rainbow' },
        { s: 'Jehovah God', t: 'I promise that I will never again destroy everything on the earth in a flood.' },
        { fx: 'canon', text: 'Canon Event: Jehovah made the first rainbow as a sign of His promise.' },
        { s: 'Jehovah God', t: 'Now have children, and fill the earth!' },
        { fx: 'canon', text: 'Canon Event: Jehovah told them to fill the earth again.' },
        { t: 'Have you ever seen a rainbow? Every rainbow is Jehovah’s promise.' }
      ]
    },

    dialogs: {
      altarDone: [
        { t: 'You pile up the stones into an altar for Jehovah.' },
        { s: 'Jehovah God', t: 'Bring Me a sheep, Noah, and offer it to Me in thanksgiving.' }
      ],
      sheepTake: [
        { t: 'You take one of the sheep from the flock and lead it toward the altar.' }
      ],
      altarLook: [{ t: 'An altar of stones, ready for a thankful offering to Jehovah.' }],
      sheepWait: [{ t: 'The sheep is waiting. Lead it to the altar.' }],
      doorEarly: [{ t: 'Jehovah has not yet said that it is time to come out. The water is still too high.' }],
      windowIdle: [{ t: 'The little window of the ark. You have already seen all there is to see outside.' }],

      hints: {
        settle: [{ t: 'The rain is still pouring down. Look out of the ark’s window once more.' }],
        exit: [{ s: 'Jehovah God', t: 'Come out of the ark, Noah — go to the door of the ark.' }],
        altar: [{ t: 'Pile up the stones to build an altar for Jehovah.' }],
        offering: [{ t: 'Take a sheep and lead it to the altar for Jehovah.' }]
      },

      blocked: {
        altarEarly: 'Not yet — first the water must dry up, and Jehovah must call them out of the ark.'
      }
    },

    canonEvents: [
      'The Flood covered the whole earth — only Noah and his family were safe.',
      'The rain stopped and the ark settled on the mountains.',
      'The water dried up and eight people stepped out into a new world.',
      'Noah’s offering made Jehovah happy.',
      'Jehovah made the first rainbow as a sign of His promise.',
      'Jehovah told them to fill the earth again.'
    ]
  },
  {
    id: '7',
    title: 'The Tower of Babel',
    tagline: 'One language, one city — and a tower that tried to reach heaven.',
    playable: 'builder',             // you play as a builder on the plain of Shinar

    quests: [
      {
        id: 'plan',
        title: 'A City and a Tower',
        objective: 'Talk to the foreman at the building site.'
      },
      {
        id: 'bricks',
        title: 'Bricks for the Tower',
        objective: 'Take bricks from the brick pile and carry them to the tower.',
        need: 3,
        unit: 'bricks carried'
      },
      {
        id: 'raise',
        title: 'Higher and Higher',
        objective: 'Work at the three scaffolds and raise the tower.',
        need: 3,
        unit: 'scaffolds worked'
      },
      {
        id: 'confusion',
        title: 'Nobody Understands',
        objective: 'Talk to Jehovah God on the hill about the confusion.'
      },
      {
        id: 'scatter',
        title: 'Leave Babel',
        objective: 'Leave the city through the gate and spread out over the earth.'
      }
    ],

    cutscenes: {
      intro: [
        { t: 'Chapter 7 — The Tower of Babel' },
        { t: 'After the Flood, Noah’s sons and their wives had many children. Their families grew, and they began to spread to different parts of the earth — just as Jehovah had told them to do.' },
        { t: 'But some of the families did not obey Jehovah. They stopped on a wide plain and said: “Let us stay here.”' },
        { t: 'You are one of the builders on the plain of Shinar. Something new is being planned…' }
      ],
      plan: [
        { s: 'Foreman', t: 'Friends! This plain is perfect. Let us build a city and stay here — and a tower so tall that its top will reach all the way to heaven!' },
        { s: 'Foreman', t: 'Then we will be famous, and we will never be scattered over the earth!' },
        { t: 'The builders cheer. They bake bricks instead of using stone, and use tar like mortar. The work begins.' },
        { fx: 'canon', text: 'Canon Event: The people decided to build a city and a tower that reached to heaven.' }
      ],
      confusion: [
        { t: 'Level by level the tower rises — its top is almost in the clouds.' },
        { t: 'Jehovah looks down from heaven at the city and the tower the people are building.' },
        { s: 'Jehovah God', t: 'Look! They are all one people, with one language. If they keep on like this, nothing will be impossible for them.' },
        { s: 'Jehovah God', t: 'Let Us go down and confuse their language, so they cannot understand one another.' },
        { fx: 'babel' },
        { t: 'Suddenly everyone speaks a different language! One builder calls for mortar — and his friend cannot understand a single word.' },
        { fx: 'canon', text: 'Canon Event: Jehovah confused the language of the builders.' },
        { t: 'The building work stops. Confusion everywhere — exactly what the word Babel means.' }
      ],
      naming: [
        { s: 'Jehovah God', t: 'The people became proud and stopped spreading over the earth. So I confused their language.' },
        { s: 'Jehovah God', t: 'From now on they will call this city Babel — because there I confused the language of all the earth.' },
        { fx: 'canon', text: 'Canon Event: The city was called Babel — which means Confusion.' },
        { t: 'Babel means “Confusion”. The builders cannot finish the city, and little by little they begin to move away.' }
      ],
      finale: [
        { t: 'The builders put down their tools. The families leave the city and go in every direction, all over the earth.' },
        { fx: 'scatter' },
        { fx: 'canon', text: 'Canon Event: People spread out and lived all over the earth.' },
        { t: 'The half-finished city became known as Babel — “Confusion”. Nobody ever finished its tower.' },
        { t: 'But they kept doing bad things in the new places where they lived.' },
        { t: 'Were there any who still loved Jehovah? We will find out in the next chapter.' }
      ]
    },

    dialogs: {
      bricksDone: [
        { t: 'Three more bricks go up onto the tower. It is strong and tall already…' },
        { s: 'Foreman', t: 'Beautiful! Now let us raise it higher — to the scaffolds!' }
      ],
      brickTake: [{ t: 'You pick up a heavy mud brick and carry it toward the tower.' }],
      towerLook: [{ t: 'A great tower of mud bricks, rising level by level above the city.' }],
      brickFirst: [{ t: 'You need a brick first — take one from the brick pile.' }],
      foremanIdle: [{ s: 'Foreman', t: 'Mix the mud, bake the bricks, lay them straight — the tower must reach heaven!' }],
      foremanConfused: [
        { s: 'Foreman', t: 'Mira! La torre — no, wait… como se dice? Babel! Babel!' },
        { t: 'Nobody understands the foreman any more — everyone speaks a different language.' }
      ],
      gateIdle: [{ t: 'The road out of the city. For now the builders all want to stay.' }],
      godIdle: [{ s: 'Jehovah God', t: 'I will confuse their language, so they can no longer understand one another.' }],

      hints: {
        bricks: [{ t: 'Take a brick from the brick pile and carry it to the tower.' }],
        raise: [{ t: 'Work at each of the three scaffolds to raise the tower higher.' }],
        confusion: [{ s: 'Jehovah God', t: 'Come up to the hill, and I will tell you what happened here.' }],
        scatter: [{ t: 'Go to the city gate and leave Babel — spread out over the earth.' }]
      }
    },

    canonEvents: [
      'The people decided to build a city and a tower that reached to heaven.',
      'Jehovah confused the language of the builders.',
      'The city was called Babel — which means Confusion.',
      'People spread out and lived all over the earth.'
    ]
  },
  {
    id: '8',
    title: 'Abraham and Sarah Obeyed God',
    tagline: 'Leave your home and go to the land I will show you.',
    playable: 'abraham',              // you play as Abraham

    quests: [
      {
        id: 'call',
        title: 'Jehovah Calls Abraham',
        objective: 'Listen to Jehovah God in the city of Ur.'
      },
      {
        id: 'pack',
        title: 'Pack for the Journey',
        objective: 'Tell Sarah, Terah and Lot to pack their things.',
        need: 3,
        unit: 'family ready'
      },
      {
        id: 'travel',
        title: 'The Long Road to Canaan',
        objective: 'Follow the road east to the land Jehovah will show you.'
      },
      {
        id: 'promise',
        title: 'The Promise of the Land',
        objective: 'Talk to Jehovah God by the great tree in Canaan.'
      },
      {
        id: 'children',
        title: 'Old and Childless',
        objective: 'Talk to Sarah about Jehovah’s promise.'
      }
    ],

    cutscenes: {
      intro: [
        { t: 'Chapter 8 — Abraham and Sarah Obeyed God' },
        { t: 'Not too far from Babel was a city called Ur, where people worshipped many gods other than Jehovah.' },
        { t: 'But there was a man in Ur who worshipped only Jehovah. His name was Abraham.' },
        { t: 'You are Abraham, and your wife Sarah lives with your father Terah and your nephew Lot. One day, Jehovah speaks…' }
      ],
      call: [
        { s: 'Jehovah God', t: 'Abraham — leave your home and your relatives, and go to the land that I will show you.' },
        { s: 'Jehovah God', t: 'You will become a large nation, and I will do good things for many people all over the earth because of you.' },
        { fx: 'canon', text: 'Canon Event: Jehovah told Abraham to leave his home and his relatives.' },
        { fx: 'canon', text: 'Canon Event: Jehovah promised to make Abraham a great nation and bless all people through him.' },
        { t: 'Abraham does not know where Jehovah is sending him — but he trusts in Jehovah.' }
      ],
      arrival: [
        { t: 'Abraham, Sarah, his father Terah and his nephew Lot pack their things and begin their long trip.' },
        { t: 'Abraham was 75 years old when he and his family finally arrived in the land that Jehovah wanted them to see.' },
        { t: 'It was called the land of Canaan.' },
        { fx: 'canon', text: 'Canon Event: Abraham was 75 years old when his family arrived in the land of Canaan.' }
      ],
      promise: [
        { s: 'Jehovah God', t: 'Abraham, lift up your eyes and look around you.' },
        { s: 'Jehovah God', t: 'All this land you see around you, I will give to your children.' },
        { fx: 'canon', text: 'Canon Event: Jehovah promised Abraham: All this land I will give to your children.' }
      ],
      finale: [
        { s: 'Sarah', t: 'It is a beautiful land, Abraham. But we are old… and we do not have any children.' },
        { t: 'So how would Jehovah make His promise come true?' },
        { fx: 'canon', text: 'Canon Event: Abraham and Sarah had no children yet, but they trusted in Jehovah’s promise.' },
        { t: 'Abraham and Sarah do not understand yet — but they keep trusting Jehovah.' },
        { t: 'What will Jehovah do next? We will find out in the next chapter.' }
      ]
    },

    dialogs: {
      packDone: [{ t: 'Sarah, Terah and Lot are all packed. The road east is waiting for you.' }],
      packedAgain: [{ t: 'Everything is packed and ready for the road.' }],
      sarahUr: [{ s: 'Sarah', t: 'I will pack our things, Abraham. Wherever Jehovah leads you, I will go.' }],
      terahUr: [{ s: 'Terah', t: 'Ur is my home and my gods are here… but I will come with you, my son.' }],
      lotUr: [{ s: 'Lot', t: 'I will follow you, Abraham! A long road sounds like an adventure.' }],
      godIdleUr: [{ s: 'Jehovah God', t: 'Leave your home, Abraham, and walk east. I will show you the land.' }],
      godIdleCanaan: [{ s: 'Jehovah God', t: 'Lift up your eyes — all this land I will give to your children.' }],

      hints: {
        pack: [{ t: 'Find Sarah, Terah and Lot in Ur and tell them to pack.' }],
        travel: [{ t: 'Follow the road east, across the river, to the land of Canaan.' }],
        promise: [{ s: 'Jehovah God', t: 'Come to me by the great tree, Abraham.' }],
        children: [{ s: 'Sarah', t: 'Sarah is standing near the great tree, looking over the land.' }]
      }
    },

    canonEvents: [
      'Jehovah told Abraham to leave his home and his relatives.',
      'Jehovah promised to make Abraham a great nation and bless all people through him.',
      'Abraham was 75 years old when his family arrived in the land of Canaan.',
      'Jehovah promised Abraham: All this land I will give to your children.',
      'Abraham and Sarah had no children yet, but they trusted in Jehovah’s promise.'
    ]
  },
  {
    id: '9',
    title: 'A Son At Last!',
    tagline: 'After all these years — laughter in Abraham’s tent.',
    playable: 'abraham',              // you play as Abraham once more

    quests: [
      {
        id: 'wish',
        title: 'Sarah’s Wish',
        objective: 'Talk to Sarah at the tent.'
      },
      {
        id: 'ishmael',
        title: 'Hagar Has a Son',
        objective: 'Talk to Hagar about her baby.'
      },
      {
        id: 'visitors',
        title: 'Three Visitors',
        objective: 'Meet the three visitors under the great tree.'
      },
      {
        id: 'isaac',
        title: 'A Son Named Laughter',
        objective: 'Go to the tent — the baby has been born!'
      },
      {
        id: 'sendaway',
        title: 'Listen to Sarah',
        objective: 'Talk to Sarah about Ishmael and Isaac.'
      }
    ],

    cutscenes: {
      intro: [
        { t: 'Chapter 9 — A Son At Last!' },
        { t: 'Abraham and Sarah had been married for many years. They had left their comfortable home in Ur and were living in a tent.' },
        { t: 'But Sarah did not complain, because she trusted in Jehovah.' },
        { t: 'You are Abraham, camping in the land of Canaan with your wife Sarah and your servant Hagar.' }
      ],
      wish: [
        { s: 'Sarah', t: 'Abraham, I wanted a child so much… If my servant Hagar has a child, it could be like my own.' },
        { s: 'Abraham', t: 'If that is what you wish, Sarah — speak to Hagar.' },
        { t: 'Sarah tells Hagar Abraham’s words…' }
      ],
      ishmael: [
        { t: 'In time, Hagar did have a son.' },
        { s: 'Abraham', t: 'His name will be Ishmael — “God hears.”' },
        { fx: 'canon', text: 'Canon Event: Hagar had a son, and Abraham named him Ishmael.' },
        { t: 'Many years pass in the camp under the stars of Canaan…' }
      ],
      visitors: [
        { t: 'When Abraham was 99 years old and Sarah was 89, three visitors came to the tent.' },
        { s: 'Abraham', t: 'Please, rest under this tree and share a meal with us!' },
        { t: 'Do you know who the visitors were? They were angels!' },
        { s: 'Angel', t: 'Next year at this time, you and your wife will have a son.' },
        { fx: 'canon', text: 'Canon Event: The angels promised Abraham and Sarah that they would have a son next year.' },
        { t: 'Sarah was listening from inside the tent. She laughed to herself…' },
        { s: 'Sarah', t: 'Can I really have a child even though I am so old?' },
        { fx: 'canon', text: 'Canon Event: Sarah laughed — she could not believe she would have a child in her old age.' }
      ],
      birth: [
        { t: 'The next year, Sarah gave birth to a son, just as Jehovah’s angel had promised.' },
        { s: 'Abraham', t: 'We will name him Isaac — which means “Laughter.”' },
        { fx: 'canon', text: 'Canon Event: Sarah had a son and Abraham named him Isaac — which means Laughter.' }
      ],
      finale: [
        { t: 'When Isaac was about five years old, Sarah saw Ishmael making fun of him.' },
        { s: 'Sarah', t: 'Abraham — send Hagar and Ishmael away. I want to protect my son.' },
        { s: 'Abraham', t: 'But Hagar is my servant, and Ishmael is my son… I do not want to do that.' },
        { t: 'Then Jehovah speaks to Abraham:' },
        { s: 'Jehovah God', t: 'Listen to Sarah. I will take care of Ishmael. But it is through Isaac that my promises will come true.' },
        { fx: 'canon', text: 'Canon Event: Jehovah said: Listen to Sarah — His promises would come true through Isaac.' },
        { t: 'Abraham trusts Jehovah’s words. What will happen to Hagar and Ishmael in the desert?' },
        { t: 'We will find out in the next chapter.' }
      ]
    },

    dialogs: {
      sarahIdle: [{ s: 'Sarah', t: 'I trust Jehovah, Abraham — even when waiting is hard.' }],
      hagarIdle: [{ s: 'Hagar', t: 'The baby is sleeping, master. Little Ishmael grows strong every day.' }],
      visitorIdle: [{ s: 'Visitor', t: 'Peace be with you, Abraham.' }],
      tentIdle: [{ t: 'The tent where Abraham and Sarah live.' }],
      idle: [{ t: 'Life in the camp goes on quietly.' }],

      hints: {
        wish: [{ t: 'Sarah is waiting by the tent to speak with you.' }],
        ishmael: [{ t: 'Hagar is standing a little way off from the tent.' }],
        visitors: [{ t: 'Three visitors are waiting under the great tree.' }],
        isaac: [{ t: 'Go to the tent — you can hear crying inside!' }],
        sendaway: [{ t: 'Sarah has something urgent to tell you.' }]
      }
    },

    canonEvents: [
      'Hagar had a son, and Abraham named him Ishmael.',
      'The angels promised Abraham and Sarah that they would have a son next year.',
      'Sarah laughed — she could not believe she would have a child in her old age.',
      'Sarah had a son and Abraham named him Isaac — which means Laughter.',
      'Jehovah said: Listen to Sarah — His promises would come true through Isaac.'
    ]
  },
  {
    id: '10',
    title: 'Remember the Wife of Lot',
    tagline: 'Choose wisely, run quickly, and never look back.',
    playable: 'lot',                  // you play as Lot

    quests: [
      {
        id: 'choice',
        title: 'Which Way Will You Go?',
        objective: 'Talk to Abraham at the camp.'
      },
      {
        id: 'choose',
        title: 'Lot Chooses the Land',
        objective: 'Choose the pleasant land with water and green grass.'
      },
      {
        id: 'warn',
        title: 'The Warning',
        objective: 'Talk to the two angels in the city of Sodom.'
      },
      {
        id: 'escape',
        title: 'Escape for Your Life!',
        objective: 'Run south on the road to the city of Zoar.'
      },
      {
        id: 'remember',
        title: 'Remember Lot’s Wife',
        objective: 'Talk to Lot’s wife at Zoar.'
      }
    ],

    cutscenes: {
      intro: [
        { t: 'Chapter 10 — Remember the Wife of Lot' },
        { t: 'Lot lived with Abraham, his uncle, in the land of Canaan.' },
        { t: 'Eventually, Abraham and Lot had so many animals that there was not enough land for all of them.' },
        { t: 'You are Lot, and your flocks are grazing beside Abraham’s at the camp…' }
      ],
      choice: [
        { s: 'Abraham', t: 'We can no longer live together in one place, Lot.' },
        { s: 'Abraham', t: 'Please choose which way you would like to go — and I will go the other way.' },
        { fx: 'canon', text: 'Canon Event: Abraham and Lot separated, and Abraham let Lot choose the land first.' },
        { t: 'That was unselfish of Abraham, wasn’t it?' }
      ],
      chosen: [
        { t: 'Lot looks east and sees a beautiful part of the land, near a city called Sodom.' },
        { t: 'There is plenty of water as well as green grass.' },
        { s: 'Lot', t: 'I choose this land!' },
        { fx: 'canon', text: 'Canon Event: Lot chose the pleasant land near Sodom, with water and green grass.' },
        { t: 'Lot moves his family there. But the people of Sodom and of nearby Gomorrah were very bad…' },
        { t: 'So bad that Jehovah decided to destroy those cities — but He sent two angels to save Lot.' }
      ],
      warn: [
        { s: 'Angel', t: 'Hurry! Get out of this city, Lot! Jehovah is going to destroy it.' },
        { t: 'Lot did not leave right away. He kept on delaying…' },
        { s: 'Angel', t: 'Run! Escape for your life, and do not look back! If you look back, you will die!' },
        { fx: 'canon', text: 'Canon Event: The angels warned Lot: Hurry, get out of the city — Jehovah will destroy it.' },
        { t: 'The angels take Lot’s wife and his two daughters by the hand and rush them out of the city.' }
      ],
      fire: [
        { t: 'When they arrive at the city called Zoar, Jehovah makes it rain fire and sulfur on Sodom and Gomorrah.' },
        { fx: 'fire' },
        { t: 'The two cities are completely destroyed — smoke rises from the plain.' },
        { fx: 'canon', text: 'Canon Event: Fire and sulfur rained from heaven and destroyed Sodom and Gomorrah.' },
        { s: 'Angel', t: 'Stay alive. Do not look back at the burning cities.' }
      ],
      finale: [
        { t: 'Lot’s wife disobeys Jehovah… she looks back at the burning cities.' },
        { s: 'Lot', t: 'No —!' },
        { t: 'She turns into a pillar of salt!' },
        { fx: 'canon', text: 'Canon Event: Lot’s wife looked back and became a pillar of salt.' },
        { t: 'Lot and his daughters are safe, because they had obeyed Jehovah.' },
        { t: 'They must have been very sad that Lot’s wife had disobeyed.' },
        { t: 'But they were glad that they had listened to Jehovah’s instructions.' }
      ]
    },

    dialogs: {
      abrahamIdle: [{ s: 'Abraham', t: 'The land is wide, Lot — but our flocks are not. Choose well.' }],
      wifeIdle: [{ s: 'Lot’s Wife', t: 'Sodom was a comfortable city… I almost wish we had stayed.' }],
      daughterIdle: [{ s: 'Daughter', t: 'The angels said not to look back, Lot. We must keep running!' }],
      angelIdle: [{ s: 'Angel', t: 'Jehovah has sent us to save you. Make haste!' }],
      landIdle: [{ t: 'Green grass, cool water — a good place for flocks.' }],

      hints: {
        choose: [{ t: 'Look east: there is water and green grass near the city of Sodom.' }],
        warn: [{ s: 'Angel', t: 'Come to us inside the city — we have an urgent message.' }],
        escape: [{ t: 'Run! Take the road south to Zoar and do not look back!' }],
        remember: [{ s: 'Daughter', t: 'Our mother is standing just outside Zoar, staring at the smoke.' }]
      }
    },

    canonEvents: [
      'Abraham and Lot separated, and Abraham let Lot choose the land first.',
      'Lot chose the pleasant land near Sodom, with water and green grass.',
      'The angels warned Lot: Hurry, get out of the city — Jehovah will destroy it.',
      'Fire and sulfur rained from heaven and destroyed Sodom and Gomorrah.',
      'Lot’s wife looked back and became a pillar of salt.'
    ]
  },
  {
    id: '11',
    title: 'A Test of Faith',
    tagline: 'Abraham did what Jehovah asked — even without understanding.',
    playable: 'abraham',              // you play as Abraham once more

    quests: [
      {
        id: 'command',
        title: 'The Hardest Command',
        objective: 'Listen to Jehovah God at the camp.'
      },
      {
        id: 'travel',
        title: 'Three Days to Moriah',
        objective: 'Follow the road east to the mountains of Moriah.'
      },
      {
        id: 'isaac',
        title: 'Jehovah Will Provide',
        objective: 'Talk to Isaac on the mountain path.'
      },
      {
        id: 'altar',
        title: 'The Altar on Moriah',
        objective: 'Build the altar from the stones.'
      },
      {
        id: 'ram',
        title: 'The Ram in the Bushes',
        objective: 'Take the ram that Jehovah has provided.'
      }
    ],

    cutscenes: {
      intro: [
        { t: 'Chapter 11 — A Test of Faith' },
        { t: 'Abraham taught his son Isaac to love Jehovah and to trust all of Jehovah’s promises.' },
        { t: 'But when Isaac was about 25 years old, Jehovah asked Abraham to do something very hard.' },
        { t: 'You are Abraham, camping with Isaac and two servants. One day, Jehovah speaks…' }
      ],
      command: [
        { s: 'Jehovah God', t: 'Please, Abraham — take your only son Isaac, and offer him as a sacrifice on a mountain in the land of Moriah.' },
        { t: 'Abraham has no idea why Jehovah has asked him to do that… but he still obeys Jehovah.' },
        { fx: 'canon', text: 'Canon Event: Jehovah told Abraham to offer his only son Isaac as a sacrifice on Mount Moriah.' }
      ],
      arrival: [
        { t: 'Early the next morning, Abraham took Isaac and two servants and went toward Moriah.' },
        { t: 'After three days, they can see the mountains in the distance.' },
        { fx: 'canon', text: 'Canon Event: Abraham obeyed Jehovah even though he did not understand why.' },
        { t: 'Abraham tells the servants to wait here while he and Isaac go off to offer the sacrifice.' }
      ],
      isaac: [
        { s: 'Isaac', t: 'Father — the firewood is heavy. But where is the animal that we will sacrifice?' },
        { s: 'Abraham', t: 'My son, Jehovah will provide it.' },
        { fx: 'canon', text: 'Canon Event: Isaac asked where the animal was; Abraham answered: Jehovah will provide it.' },
        { t: 'Abraham took a knife, and Isaac carried the firewood — just as Jesus would one day carry His cross.' }
      ],
      altar: [
        { t: 'At the top of the mountain they build an altar from the stones.' },
        { t: 'Abraham ties Isaac’s hands and feet and lays him on the altar. Abraham picks up the knife…' },
        { t: 'At that moment, Jehovah’s angel calls from the heavens:' },
        { s: 'Angel', t: 'Abraham! Do not harm the boy! Now I know that you have faith in God, because you were willing to sacrifice your son.' },
        { fx: 'canon', text: 'Canon Event: Jehovah’s angel stopped Abraham: Do not harm the boy — your faith is proven.' },
        { t: 'Then Abraham sees a ram, caught by its horns in the bushes…' },
        { fx: 'ram' }
      ],
      finale: [
        { t: 'Abraham quickly untied Isaac — and sacrifices the ram instead of his son.' },
        { fx: 'canon', text: 'Canon Event: Abraham sacrificed the ram instead of his son Isaac.' },
        { s: 'Jehovah God', t: 'From this day on, I call Abraham My friend — because he does whatever I want, even when he does not understand.' },
        { s: 'Jehovah God', t: 'I will bless you, and I will multiply your offspring — so that all good people may be blessed through Abraham’s family.' },
        { fx: 'canon', text: 'Canon Event: Jehovah called Abraham His friend and promised to bless all people through his family.' }
      ]
    },

    dialogs: {
      godIdle: [{ s: 'Jehovah God', t: 'Go to the land of Moriah, Abraham — and trust Me.' }],
      isaacIdle: [{ s: 'Isaac', t: 'I am ready, father. Jehovah will provide.' }],
      servantIdle: [{ s: 'Servant', t: 'We will wait here, master, as you asked.' }],
      stoneIdle: [{ t: 'Stones for the altar Jehovah asked for.' }],
      hints: {
        travel: [{ t: 'Follow the road east until you see the mountains of Moriah.' }],
        isaac: [{ s: 'Isaac', t: 'Isaac is waiting up on the mountain path with the firewood.' }],
        altar: [{ t: 'The stones are waiting at the top of the mountain.' }],
        ram: [{ t: 'Look — a ram is caught in the bushes over there!' }]
      }
    },

    canonEvents: [
      'Jehovah told Abraham to offer his only son Isaac as a sacrifice on Mount Moriah.',
      'Abraham obeyed Jehovah even though he did not understand why.',
      'Isaac asked where the animal was; Abraham answered: Jehovah will provide it.',
      'Jehovah’s angel stopped Abraham: Do not harm the boy — your faith is proven.',
      'Abraham sacrificed the ram instead of his son Isaac.',
      'Jehovah called Abraham His friend and promised to bless all people through his family.'
    ]
  },
  {
    id: '12',
    title: 'Jacob Got the Inheritance',
    tagline: 'A bowl of stew, a stolen blessing, and a run for his life.',
    playable: 'jacob',                // you play as Jacob

    quests: [
      {
        id: 'legacy',
        title: 'A Son’s Inheritance',
        objective: 'Talk to Isaac about the inheritance.'
      },
      {
        id: 'stew',
        title: 'A Bowl of Red Stew',
        objective: 'Talk to Esau, home from the hunt.'
      },
      {
        id: 'blessing',
        title: 'The Stolen Blessing',
        objective: 'Talk to Rebekah about Isaac’s blessing.'
      },
      {
        id: 'anger',
        title: 'Esau’s Rage',
        objective: 'Talk to Esau — he has just found out.'
      },
      {
        id: 'flee',
        title: 'Run for Your Life!',
        objective: 'Leave through the east gate and run to Laban.'
      }
    ],

    cutscenes: {
      intro: [
        { t: 'Chapter 12 — Jacob Got the Inheritance' },
        { t: 'Isaac was 40 years old when he married Rebekah. He loved her very much.' },
        { t: 'In time, they had two children — twin boys. The older was called Esau, and the younger, Jacob.' },
        { t: 'Esau loved being outdoors and was good at hunting. But Jacob liked to stay at home.' }
      ],
      legacy: [
        { s: 'Isaac', t: 'Jacob, my son — when a father dies, his oldest son receives the inheritance: most of the land and money.' },
        { s: 'Isaac', t: 'In our family it is greater still — the inheritance includes a part in the promises Jehovah made to Abraham.' },
        { fx: 'canon', text: 'Canon Event: The oldest son received the inheritance — including the promises Jehovah made to Abraham.' },
        { t: 'Esau did not care much about those promises. But Jacob knew that they were very important.' }
      ],
      stew: [
        { t: 'One day Esau comes home very tired from a long day of hunting. He smells good food Jacob is cooking…' },
        { s: 'Esau', t: 'I’m starving! Give me some of that red stew!' },
        { s: 'Jacob', t: 'I will — but first promise me that I can have your inheritance.' },
        { s: 'Esau', t: 'I don’t care about my inheritance! You can have it. I just want to eat.' },
        { fx: 'canon', text: 'Canon Event: Esau traded his inheritance for a bowl of red stew.' },
        { t: 'Do you think that was a wise thing for Esau to do? No, it wasn’t. He gave away something very precious — just for a bowl of stew.' }
      ],
      blessing: [
        { t: 'When Isaac was very old, it was time to give a blessing to his oldest son.' },
        { s: 'Rebekah', t: 'Jacob — bring me a goat from the flock, and I will prepare food for your father. Then you will go in and receive the blessing.' },
        { s: 'Rebekah', t: 'Hurry — do exactly as I tell you.' },
        { s: 'Isaac', t: 'The voice is Jacob’s… but the hands are Esau’s. The blessing is yours, my son Jacob!' },
        { fx: 'canon', text: 'Canon Event: Rebekah helped Jacob, the younger son, get his father’s blessing.' }
      ],
      anger: [
        { t: 'Esau comes in from the field and finds out what has happened.' },
        { s: 'Esau', t: 'My brother Jacob has cheated me twice! First the inheritance — now the blessing!' },
        { s: 'Esau', t: 'I will plan to kill my twin brother!' },
        { fx: 'canon', text: 'Canon Event: Esau was angry and planned to kill his twin brother.' },
        { t: 'The whole house is afraid for Jacob…' }
      ],
      finale: [
        { s: 'Isaac', t: 'Jacob — Esau plans evil against you. Go now to your mother’s brother Laban, in Haran.' },
        { s: 'Rebekah', t: 'Stay there until your brother’s anger cools down. Then we will send for you.' },
        { s: 'Jacob', t: 'I will obey you, my father and my mother.' },
        { t: 'Jacob listens to his parents’ advice and runs for his life.' },
        { fx: 'canon', text: 'Canon Event: Jacob listened to his parents and went to stay with Laban until Esau calmed down.' },
        { t: 'What will happen to Jacob on the long road to Haran? We will find out in the next chapter.' }
      ]
    },

    dialogs: {
      isaacIdle: [{ s: 'Isaac', t: 'The promises are precious, Jacob. Never trade them away.' }],
      rebekahIdle: [{ s: 'Rebekah', t: 'Esau is out in the fields again — and your father waits inside.' }],
      esauIdle: [{ s: 'Esau', t: 'What is that delicious smell? I could eat a whole stew pot!' }],
      esauAngry: [{ s: 'Esau', t: 'Grr… leave me be, Jacob. I have nothing to say to you.' }],
      advice: [
        { s: 'Isaac', t: 'Go — leave through the east gate and travel to your uncle Laban until Esau calms down.' }
      ],
      hints: {
        flee: [{ t: 'Leave through the east gate and run the road to Laban!' }]
      }
    },

    canonEvents: [
      'The oldest son received the inheritance — including the promises Jehovah made to Abraham.',
      'Esau traded his inheritance for a bowl of red stew.',
      'Rebekah helped Jacob, the younger son, get his father’s blessing.',
      'Esau was angry and planned to kill his twin brother.',
      'Jacob listened to his parents and went to stay with Laban until Esau calmed down.'
    ]
  },
  {
    id: '13',
    title: 'Jacob and Esau Make Peace',
    tagline: 'A wrestle in the night, and two brothers in tears.',
    playable: 'jacob',                // you play as Jacob once more

    quests: [
      {
        id: 'call',
        title: 'Return to Your Homeland',
        objective: 'Listen to Jehovah God at the camp.'
      },
      {
        id: 'warn',
        title: 'Esau Is Coming!',
        objective: 'Talk to the messenger on the road.'
      },
      {
        id: 'gift',
        title: 'A Gift for Esau',
        objective: 'Talk to the servant about the gift of animals.'
      },
      {
        id: 'wrestle',
        title: 'Wrestling Till Dawn',
        objective: 'Go to the angel waiting in the dark.'
      },
      {
        id: 'peace',
        title: 'Bowing Seven Times',
        objective: 'Greet your brother Esau and his men.'
      }
    ],

    cutscenes: {
      intro: [
        { t: 'Chapter 13 — Jacob and Esau Make Peace' },
        { t: 'Jehovah promised Jacob that He would protect him, just as He had protected Abraham and Isaac.' },
        { t: 'Jacob settled in a place called Haran, where he got married, had a big family, and became very rich.' },
        { t: 'You are Jacob — and today, Jehovah has something to tell you…' }
      ],
      call: [
        { s: 'Jehovah God', t: 'Jacob — go back to your homeland.' },
        { fx: 'canon', text: 'Canon Event: Jehovah told Jacob to go back to his homeland, and promised to protect him.' },
        { t: 'So Jacob and his family begin the long trip back, with all their flocks and herds.' }
      ],
      warn: [
        { s: 'Messenger', t: 'Jacob! Your brother Esau is coming — and there are 400 men with him!' },
        { t: 'Jacob is afraid that Esau wants to hurt him and his family.' },
        { s: 'Jacob', t: 'Jehovah… please save me from my brother.' },
        { fx: 'canon', text: 'Canon Event: Esau was coming with 400 men — Jacob prayed: Please save me from my brother.' }
      ],
      gift: [
        { t: 'The next day Jacob sends Esau a gift of many animals…' },
        { t: 'sheep, goats, cows, camels and donkeys — herd after herd, going ahead of Jacob.' },
        { fx: 'canon', text: 'Canon Event: Jacob sent Esau a gift of many animals.' },
        { t: 'That night, while Jacob is alone…' },
        { fx: 'night' }
      ],
      wrestle: [
        { t: 'Jacob sees an angel! And the angel starts wrestling with him.' },
        { t: 'They wrestle until the morning. Even though Jacob gets hurt, he will not give up.' },
        { s: 'Angel', t: 'Let me go — for the dawn has broken.' },
        { s: 'Jacob', t: 'No — not until you bless me!' },
        { t: 'The angel finally blesses Jacob. Now Jacob knows that Jehovah will not let Esau hurt him.' },
        { fx: 'canon', text: 'Canon Event: Jacob wrestled with an angel until morning and would not let go until he was blessed.' },
        { fx: 'dawn' }
      ],
      peace: [
        { t: 'That morning Jacob looks into the distance and sees Esau — and the 400 men.' },
        { t: 'Jacob goes ahead of his family and bows down before his brother seven times.' },
        { t: 'Esau runs to Jacob and throws his arms around him. The two brothers burst into tears and make peace.' },
        { fx: 'canon', text: 'Canon Event: Jacob bowed before Esau seven times, and the brothers made peace with tears of joy.' },
        { t: 'How do you think Jehovah felt about the way that Jacob handled this situation? He was pleased.' },
        { t: 'Later Esau went back to his home, and Jacob went to his.' },
        { t: 'Jacob had a total of 12 sons: Reuben, Simeon, Levi, Judah, Dan, Naphtali, Gad, Asher, Issachar, Zebulun, Joseph, and Benjamin.' },
        { t: 'And one of those sons — Joseph — was used by Jehovah to save His people. Do you know how? Let’s find out…' }
      ]
    },

    dialogs: {
      godIdle: [{ s: 'Jehovah God', t: 'I promised to protect you, Jacob — as I protected Abraham and Isaac.' }],
      messengerIdle: [{ s: 'Messenger', t: 'Rumours fly along the road — Esau’s banner is raised in the east!' }],
      servantIdle: [{ s: 'Servant', t: 'The herds are ready, master. Say the word and we will send them ahead.' }],
      familyIdle: [{ s: 'Family', t: 'We are with you, Jacob — wherever the road leads.' }],
      manIdle: [{ s: 'Man of Esau', t: 'Peace be with you. Our master ordered us to harm no one.' }],
      esauIdle: [{ s: 'Esau', t: 'My brother… I have waited so long to see you.' }],
      hints: {
        warn: [{ t: 'A messenger is hurrying toward you on the road.' }],
        gift: [{ s: 'Servant', t: 'The servant waits with the herds of animals.' }],
        wrestle: [{ t: 'You are alone in the dark — someone is waiting for you…' }],
        peace: [{ t: 'Esau and his men stand in the east. Go and greet your brother.' }]
      }
    },

    canonEvents: [
      'Jehovah told Jacob to go back to his homeland, and promised to protect him.',
      'Esau was coming with 400 men — Jacob prayed: Please save me from my brother.',
      'Jacob sent Esau a gift of many animals.',
      'Jacob wrestled with an angel until morning and would not let go until he was blessed.',
      'Jacob bowed before Esau seven times, and the brothers made peace with tears of joy.'
    ]
  },
  {
    id: '14',
    title: 'A Slave Who Obeyed God',
    tagline: 'Joseph said no — because he would sin against God.',
    playable: 'joseph',               // you play as Joseph

    quests: [
      {
        id: 'send',
        title: 'Jacob Sends Joseph',
        objective: 'Talk to your father Jacob at the camp.'
      },
      {
        id: 'pit',
        title: 'Here Comes the Dreamer',
        objective: 'Find your brothers at the pasture near Shechem.'
      },
      {
        id: 'egypt',
        title: 'The Road to Egypt',
        objective: 'Follow the caravan road east to the land of Egypt.'
      },
      {
        id: 'steward',
        title: 'Potiphar’s Household',
        objective: 'Talk to Potiphar, your new master.'
      },
      {
        id: 'refuse',
        title: 'I Would Sin Against God!',
        objective: 'Face Potiphar’s wife in the house.'
      }
    ],

    cutscenes: {
      intro: [
        { t: 'Chapter 14 — A Slave Who Obeyed God' },
        { t: 'Joseph was one of Jacob’s younger sons. His older brothers saw that Joseph was their father’s favorite son.' },
        { t: 'They were jealous of Joseph and hated him. When Joseph told them his unusual dreams — that they would one day bow down to him — they hated him even more!' },
        { fx: 'canon', text: 'Canon Event: Joseph’s brothers were jealous of him and hated him — even more when he told them his dreams.' },
        { t: 'You are Joseph, wearing the beautiful coat your father gave you…' }
      ],
      send: [
        { s: 'Jacob', t: 'Joseph, my son — your brothers are looking after the sheep near the city of Shechem.' },
        { s: 'Jacob', t: 'Go and see how they are doing — and bring me word back.' },
        { t: 'Joseph sets out along the road, his bright coat shining in the sun.' }
      ],
      pit: [
        { t: 'From far away the brothers see Joseph coming…' },
        { s: 'Brother', t: 'Here comes that dreamer! Let’s kill him!' },
        { t: 'They grab Joseph and throw him into a deep pit.' },
        { s: 'Judah', t: 'Don’t kill him! Let’s sell him as a slave instead.' },
        { t: 'So they sell Joseph for 20 pieces of silver to Midianite merchants who are going to Egypt.' },
        { fx: 'canon', text: 'Canon Event: The brothers threw Joseph into a pit, and sold him for 20 pieces of silver to Midianite merchants.' }
      ],
      egypt: [
        { t: 'Joseph is led away on the long road toward Egypt…' },
        { t: 'Meanwhile, back home, the brothers dip his coat in the blood of a goat and send it to their father:' },
        { s: 'Brothers', t: 'Isn’t this your son’s coat?' },
        { t: 'Jacob thinks a wild animal has killed Joseph. He is heartbroken — and no one can comfort him.' },
        { fx: 'canon', text: 'Canon Event: The brothers showed Jacob the bloodied coat — Jacob thought a wild animal had killed Joseph.' },
        { t: 'At last the caravan reaches Egypt. Joseph is sold as a slave to an important official named Potiphar.' }
      ],
      steward: [
        { s: 'Potiphar', t: 'Jehovah is with you, Joseph — I can see it in everything you do.' },
        { s: 'Potiphar', t: 'You are good at your work, and you can be trusted. From this day you are in charge of everything I own.' },
        { fx: 'canon', text: 'Canon Event: In Egypt Joseph became Potiphar’s trusted head of household — because Jehovah was with him.' },
        { t: 'But Potiphar’s wife has noticed Joseph — handsome and strong…' }
      ],
      refuse: [
        { s: 'Potiphar’s wife', t: 'Day after day she asks Joseph: Lie down with me…' },
        { s: 'Joseph', t: 'No! This is wrong. My master trusts me, and you are his wife. If I lie down with you, I will sin against God!' },
        { t: 'One day she tries to force him — she grabs him by his clothes… but Joseph runs away!' },
        { t: 'When Potiphar comes home, she says Joseph attacked her. She is not telling the truth.' },
        { t: 'Potiphar is very angry, and throws Joseph into prison.' },
        { fx: 'canon', text: 'Canon Event: Joseph refused Potiphar’s wife: I would sin against God! — and she had him thrown into prison.' },
        { t: 'But Jehovah did not forget about Joseph…' }
      ]
    },

    dialogs: {
      jacobIdle: [{ s: 'Jacob', t: 'Go, my son — and come back safely with news of your brothers.' }],
      brotherIdle: [{ s: 'Brother', t: 'Hmph — the dreamer himself. What do you want, Joseph?' }],
      judahIdle: [{ s: 'Judah', t: 'Sell him — that is worth more to us than his grave.' }],
      potipharIdle: [{ s: 'Potiphar', t: 'Everything is in order, Joseph — because you are a faithful man.' }],
      wifeIdle: [{ s: 'Potiphar’s wife', t: 'No one will ever know, Joseph…' }],
      godIdle: [{ s: 'Jehovah God', t: 'I am with you, Joseph — even here.' }],
      hints: {
        pit: [{ t: 'The road east leads to the pasture where your brothers keep the flocks.' }],
        egypt: [{ t: 'Follow the caravan road far to the east — all the way to Egypt!' }],
        steward: [{ s: 'Potiphar', t: 'Come and speak with me in my household.' }],
        refuse: [{ s: 'Potiphar’s wife', t: 'She is waiting inside the house…' }]
      }
    },

    canonEvents: [
      'Joseph’s brothers were jealous of him and hated him — even more when he told them his dreams.',
      'The brothers threw Joseph into a pit, and sold him for 20 pieces of silver to Midianite merchants.',
      'The brothers showed Jacob the bloodied coat — Jacob thought a wild animal had killed Joseph.',
      'In Egypt Joseph became Potiphar’s trusted head of household — because Jehovah was with him.',
      'Joseph refused Potiphar’s wife: I would sin against God! — and she had him thrown into prison.'
    ]
  },
  {
    id: '15',
    title: 'Jehovah Never Forgot Joseph',
    tagline: 'From the prison to the palace — and back to his brothers.',
    playable: 'joseph',               // you play as Joseph once more

    quests: [
      {
        id: 'pharaoh',
        title: 'Pharaoh’s Dream',
        objective: 'Explain Pharaoh’s dream.'
      },
      {
        id: 'store',
        title: 'Seven Years of Plenty',
        objective: 'Store grain in the storehouses (3 piles).',
        need: 3,
        unit: 'grain stored'
      },
      {
        id: 'bow',
        title: 'The Brothers Bow',
        objective: 'Meet the men from Canaan who came to buy food.'
      },
      {
        id: 'cup',
        title: 'The Silver Cup',
        objective: 'Confront your brothers about the cup.'
      },
      {
        id: 'reveal',
        title: 'I Am Your Brother Joseph',
        objective: 'Speak to your youngest brother Benjamin.'
      }
    ],

    cutscenes: {
      intro: [
        { t: 'Chapter 15 — Jehovah Never Forgot Joseph' },
        { t: 'While Joseph was in prison, Pharaoh, the king of Egypt, had dreams that no one could explain.' },
        { t: 'One of his servants told Pharaoh that Joseph could tell him what his dreams meant.' },
        { t: 'Pharaoh immediately sent for Joseph. You are Joseph — and you stand before the king…' }
      ],
      pharaoh: [
        { s: 'Pharaoh', t: 'Can you explain my dreams?' },
        { s: 'Joseph', t: 'Not I — God will give Pharaoh peace. Egypt will have plenty of food for seven years, followed by seven years of famine.' },
        { s: 'Joseph', t: 'Choose someone wise to store up food, so that your people will not starve.' },
        { s: 'Pharaoh', t: 'I choose you! You will be the second most powerful man in Egypt!' },
        { fx: 'canon', text: 'Canon Event: Jehovah helped Joseph explain Pharaoh’s dreams — seven years of plenty and seven years of famine — and Pharaoh made Joseph second ruler of Egypt.' }
      ],
      store: [
        { t: 'Over the next seven years, Joseph stores up food — wagon loads of grain into the storehouses.' },
        { t: 'Then there is famine over all the earth, just as Joseph said.' },
        { t: 'People come from everywhere to buy food from Joseph. Among them, men from Canaan…' },
        { fx: 'canon', text: 'Canon Event: Joseph stored up food for seven years; when the famine came, people from everywhere bought food from him.' }
      ],
      bow: [
        { t: 'Joseph’s brothers go to Joseph — but they do not know that it is Joseph.' },
        { t: 'They bow down to him, just as he had dreamed when he was young!' },
        { fx: 'canon', text: 'Canon Event: Joseph’s brothers bowed down to him — just as he had dreamed when he was young.' },
        { s: 'Joseph', t: 'You are spies! You want to find out where our country is weak.' },
        { s: 'Brother', t: 'No! We are 12 brothers from Canaan. One of our brothers is dead, and the youngest is with our father.' },
        { s: 'Joseph', t: 'Bring your youngest brother to me — then I will believe you.' },
        { t: 'When the family runs out of food again, the brothers return — this time they bring Benjamin, the youngest.' }
      ],
      cup: [
        { t: 'To test his brothers, Joseph hides his silver cup in Benjamin’s bag of grain.' },
        { t: 'When the servants find the cup, the brothers are shocked!' },
        { s: 'Brother', t: 'Punish us, my lord — but please, do not punish Benjamin!' },
        { t: 'They beg Joseph to take the punishment instead of Benjamin.' },
        { fx: 'canon', text: 'Canon Event: Joseph hid his silver cup in Benjamin’s bag — and his brothers begged to take his place.' },
        { t: 'Now Joseph knows that his brothers have changed…' }
      ],
      finale: [
        { t: 'Joseph could not hold back his feelings any longer. He bursts into tears:' },
        { s: 'Joseph', t: 'I am your brother Joseph! Is my father still alive?' },
        { t: 'His brothers are very surprised.' },
        { s: 'Joseph', t: 'Don’t feel bad because of what you did to me. God sent me here to save your lives. Now hurry — and bring my father here.' },
        { fx: 'canon', text: 'Canon Event: Joseph revealed himself: I am your brother — God sent me here to save your lives.' },
        { t: 'They go home to tell their father the good news and bring him to Egypt.' },
        { t: 'After so many years, Joseph and his father are finally together again.' }
      ]
    },

    dialogs: {
      pharaohIdle: [{ s: 'Pharaoh', t: 'The storehouses are full, Joseph. You have saved the nation.' }],
      brotherIdle: [{ s: 'Brother', t: 'We came only to buy food, my lord. We are honest men.' }],
      benjaminIdle: [{ s: 'Benjamin', t: 'My brothers said you are the ruler of all Egypt…' }],
      godIdle: [{ s: 'Jehovah God', t: 'I never forgot you, Joseph.' }],
      hints: {
        store: [{ t: 'Carry the grain piles into the storehouses — three of them!' }],
        bow: [{ s: 'Brother', t: 'The men from Canaan are waiting by the road.' }],
        cup: [{ s: 'Brother', t: 'Come — we must speak with you, my lord.' }],
        reveal: [{ s: 'Benjamin', t: 'Benjamin stands apart from your brothers.' }]
      }
    },

    canonEvents: [
      'Jehovah helped Joseph explain Pharaoh’s dreams: seven years of plenty and seven years of famine — and Pharaoh made Joseph second ruler of Egypt.',
      'Joseph stored up food for seven years; when the famine came, people from everywhere bought food from him.',
      'Joseph’s brothers bowed down to him — just as he had dreamed when he was young.',
      'Joseph hid his silver cup in Benjamin’s bag — and his brothers begged to take his place.',
      'Joseph revealed himself: I am your brother — God sent me here to save your lives.'
    ]
  }
];


/* CHAPTER is selected at runtime by setupChapter(idx) in js/game.js */

