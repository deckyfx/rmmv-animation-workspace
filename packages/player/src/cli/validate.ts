#!/usr/bin/env bun
/**
 * CLI Validation Tool for RMMV Animations.json
 *
 * Usage:
 *   bun src/sdk/cli/validate.ts [path/to/Animations.json]
 *   bun src/sdk/cli/validate.ts (uses default: assets/data/Animations.json)
 */

import { AnimationParser } from '../parsers/AnimationParser';

/**
 * Main CLI function
 */
async function main() {
  // Get file path from arguments or use default
  const filePath = process.argv[2] || 'assets/data/Animations.json';

  console.log(`🔍 Validating: ${filePath}\n`);

  try {
    // Read file
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      console.error(`❌ Error: File not found: ${filePath}`);
      process.exit(1);
    }

    const data = await file.json();

    // Validate using parser
    const result = AnimationParser.validate(data);

    // Display results
    if (result.valid) {
      console.log('✅ Validation passed!\n');

      // Display summary
      const animations = AnimationParser.getAllAnimations(data);
      console.log(`📊 Summary:`);
      console.log(`   Total animations: ${animations.length}`);

      // Show each animation
      console.log(`\n📋 Animations:`);
      for (const anim of animations) {
        const sheets = AnimationParser.getSpriteSheetNames(anim);
        const cellIds = AnimationParser.getUsedCellIds(anim);
        console.log(`   [${anim.id}] ${anim.name}`);
        console.log(`       Frames: ${anim.frames.length}`);
        console.log(`       Timings: ${anim.timings.length}`);
        console.log(`       Sheets: ${sheets.length > 0 ? sheets.join(', ') : 'none'}`);
        console.log(`       Used Cells: ${cellIds.size > 0 ? Array.from(cellIds).sort((a, b) => a - b).join(', ') : 'none'}`);
      }

      if (result.warnings.length > 0) {
        console.log(`\n⚠️  Warnings:`);
        for (const warning of result.warnings) {
          console.log(`   - ${warning}`);
        }
      }
    } else {
      console.log('❌ Validation failed!\n');
      console.log(`Errors found: ${result.errors.length}\n`);

      for (const error of result.errors) {
        console.log(`   ❌ ${error}`);
      }

      if (result.warnings.length > 0) {
        console.log(`\n⚠️  Warnings:`);
        for (const warning of result.warnings) {
          console.log(`   - ${warning}`);
        }
      }

      process.exit(1);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`❌ Error: Invalid JSON format`);
      console.error(`   ${error.message}`);
    } else if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
    } else {
      console.error(`❌ Unknown error occurred`);
    }
    process.exit(1);
  }
}

main();
