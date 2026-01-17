RPG Maker MV RTP Assets
========================

This directory should contain RPG Maker MV's Run Time Package (RTP) animation assets.
These assets are NOT included in this repository due to licensing restrictions.

Required Directory Structure:
-----------------------------

assets/
├── data/
│   └── Animations.json          # Animation definitions
├── img/
│   └── animations/
│       ├── Absorb.png
│       ├── Fire1.png
│       ├── Thunder1.png
│       └── ... (all animation sprite sheets)
└── se/
    ├── Absorb1.ogg
    ├── Fire1.ogg
    └── ... (all sound effects)


How to Obtain These Assets:
---------------------------

1. **Option 1: If you own RPG Maker MV**

   a. Locate your RPG Maker MV installation directory
   b. Find the following folders:
      - Windows: C:\Program Files (x86)\Steam\steamapps\common\RPG Maker MV\
      - Mac: ~/Library/Application Support/Steam/steamapps/common/RPG Maker MV/

   c. Copy these files to this project:
      - Copy: <RPG Maker MV>/data/Animations.json
        To:   ./assets/data/Animations.json

      - Copy: <RPG Maker MV>/img/animations/*.png
        To:   ./assets/img/animations/

      - Copy: <RPG Maker MV>/audio/se/*.ogg (or .m4a)
        To:   ./assets/se/


2. **Option 2: Download RPG Maker MV Trial/RTP**

   a. Visit the official RPG Maker website:
      https://www.rpgmakerweb.com/

   b. Download the RPG Maker MV trial or RTP package

   c. Extract and copy the assets as described in Option 1


3. **Alternative: Use Sample Data**

   You can create a minimal Animations.json for testing:

   {
     "null": null,
     "1": {
       "id": 1,
       "name": "Test Animation",
       "animation1Name": "",
       "animation1Hue": 0,
       "animation2Name": "",
       "animation2Hue": 0,
       "position": 1,
       "frames": [[[0, 0, 0, 100, 0, 0, 255, 0]]],
       "timings": []
     }
   }


License Information:
-------------------

The animation assets from RPG Maker MV are:
- Copyright © 2015 KADOKAWA CORPORATION / YOJI OJIMA
- Licensed under RPG Maker MV's terms of use
- You must own a valid RPG Maker MV license to use these assets

This software (RMMV Animation Studio) is MIT licensed and separate from
the RPG Maker MV assets. See LICENSE file for details.


After Setup:
-----------

Once you've copied the assets to the correct locations, you can:

1. Run the database seed script:
   bun run db:seed

2. Start the development server:
   bun run dev

3. Or run with Docker:
   docker-compose up -d


For more information, see the main README.md file.
